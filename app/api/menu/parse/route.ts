import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isContentLengthTooLarge } from '@/lib/security/request-guards';
import { consumeRateLimit, getRequesterIp } from '@/lib/security/rate-limit';

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 uploads per 5 min

// Zod schema for AI response validation
const AISupplySchema = z.object({
     name: z.string().min(1),
     quantity: z.number().positive(),
     unit: z.string().min(1),
     category: z.string().min(1),
     matched_existing: z.boolean().optional().default(false),
     existing_id: z.string().uuid().nullable().optional(),
     confidence: z.number().min(0).max(1).optional().default(0),
});

const AIResponseSchema = z.array(AISupplySchema);

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['csv', 'xlsx', 'xls'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
     try {
          // Rate limit — protects expensive Gemini API calls
          const ip = getRequesterIp(request.headers);
          const limiter = consumeRateLimit(`parse-menu:${ip}`, {
               windowMs: RATE_LIMIT_WINDOW_MS,
               maxRequests: RATE_LIMIT_MAX_REQUESTS,
          });
          if (!limiter.allowed) {
               return NextResponse.json(
                    { error: 'Too many requests. Please try again later.' },
                    {
                         status: 429,
                         headers: {
                              'Retry-After': String(Math.ceil((limiter.resetAt - Date.now()) / 1000)),
                         },
                    }
               );
          }

          if (isContentLengthTooLarge(request, 12 * 1024 * 1024)) {
               return NextResponse.json(
                    { error: 'Payload too large. Maximum request size is 12MB.' },
                    { status: 413 }
               );
          }

          const supabase = await createClient();
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const formData = await request.formData();
          const file = formData.get('file') as File;

          if (!file) {
               return NextResponse.json({ error: 'No file provided' }, { status: 400 });
          }

          // Validate file size
          if (file.size > MAX_FILE_SIZE) {
               return NextResponse.json(
                    { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                    { status: 400 }
               );
          }

          // Validate file extension
          const fileType = file.name.split('.').pop()?.toLowerCase();
          if (!fileType || !ALLOWED_EXTENSIONS.includes(fileType)) {
               return NextResponse.json(
                    { error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
                    { status: 400 }
               );
          }
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          let fileContent = '';
          let detectedSheet = '';

          // Parse based on file type (fileType already validated above)
          if (fileType === 'csv') {
               fileContent = buffer.toString('utf-8');
          } else if (fileType === 'xlsx' || fileType === 'xls') {
               const workbook = XLSX.read(buffer, { type: 'buffer' });

               // AUTO-DETECT the correct sheet
               // Look for sheets with names containing inventory-related keywords
               const inventoryKeywords = [
                    'inventory', 'inventario', 'insumos', 'supplies',
                    'stock', 'almacen', 'almacén', 'products', 'productos'
               ];

               let targetSheetName = workbook.SheetNames[0]; // Default to first sheet

               // Try to find a sheet with inventory keywords
               for (const sheetName of workbook.SheetNames) {
                    const lowerName = sheetName.toLowerCase();
                    if (inventoryKeywords.some(keyword => lowerName.includes(keyword))) {
                         targetSheetName = sheetName;
                         detectedSheet = sheetName;
                         break;
                    }
               }

               // If no keyword match, check sheet content (first sheet with substantial data)
               if (!detectedSheet) {
                    for (const sheetName of workbook.SheetNames) {
                         const worksheet = workbook.Sheets[sheetName];
                         const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                         const rowCount = range.e.r - range.s.r + 1;

                         // If sheet has more than 3 rows, likely contains data
                         if (rowCount > 3) {
                              targetSheetName = sheetName;
                              detectedSheet = sheetName;
                              break;
                         }
                    }
               }

               const worksheet = workbook.Sheets[targetSheetName];
               fileContent = XLSX.utils.sheet_to_csv(worksheet);

          }

          // Truncate content to avoid exceeding Gemini token limits
          const MAX_ROWS = 500;
          const lines = fileContent.split('\n');
          let wasTruncated = false;
          if (lines.length > MAX_ROWS) {
               // Keep header + first MAX_ROWS data rows
               fileContent = lines.slice(0, MAX_ROWS + 1).join('\n');
               wasTruncated = true;
          }

          // Use Gemini AI to parse the content
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
               console.error('❌ GEMINI_API_KEY not configured');
               return NextResponse.json(
                    { error: 'GEMINI_API_KEY not configured' },
                    { status: 500 }
               );
          }

          // Query schema directly from Supabase (no self-fetch)
          const DEFAULT_CATEGORIES = ['Licores', 'Licores Dulces', 'Refrescos', 'Frutas', 'Hierbas', 'Especias', 'Otros'];
          let categories: string[] = [];
          let existingSupplies: { id: string; name: string; category: string; unit: string }[] = [];

          try {
               const { data: establishment } = await supabase
                    .from('establishments')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

               if (establishment) {
                    const [catResult, supResult] = await Promise.all([
                         supabase
                              .from('supplies')
                              .select('category')
                              .eq('establishment_id', establishment.id)
                              .not('category', 'is', null),
                         supabase
                              .from('supplies')
                              .select('id, name, category, unit')
                              .eq('establishment_id', establishment.id),
                    ]);

                    if (catResult.data) {
                         const unique = [...new Set(catResult.data.map(r => r.category).filter(Boolean))].sort();
                         categories = unique.length > 0 ? unique : DEFAULT_CATEGORIES;
                    }
                    existingSupplies = supResult.data ?? [];
               }
          } catch (error) {
               console.error('Error fetching schema from DB:', error);
          }

          if (categories.length === 0) categories = DEFAULT_CATEGORIES;

          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({
               model: 'gemini-2.5-flash',
               generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                         type: SchemaType.ARRAY,
                         items: {
                              type: SchemaType.OBJECT,
                              properties: {
                                   name: { type: SchemaType.STRING },
                                   quantity: { type: SchemaType.NUMBER },
                                   unit: { type: SchemaType.STRING },
                                   category: { type: SchemaType.STRING },
                                   matched_existing: { type: SchemaType.BOOLEAN },
                                   existing_id: { type: SchemaType.STRING, nullable: true },
                                   confidence: { type: SchemaType.NUMBER },
                              },
                              required: ['name', 'quantity', 'unit', 'category', 'matched_existing', 'confidence'],
                         },
                    },
               },
          });

          const prompt = `You are a data extraction assistant for a bar inventory system.

Parse the following inventory data and extract supply items.

VALID CATEGORIES (ONLY use these): ${categories.join(', ')}

EXISTING SUPPLIES IN DATABASE (match new items to these when possible):
${existingSupplies.map(s => `- ${s.name} (id: ${s.id}, category: ${s.category}, unit: ${s.unit})`).join('\n')}

RULES:
- Name: valid supply/ingredient name
- Quantity: positive number. Normalize compound values (e.g., "750ml" → quantity: 750, unit: "ml")
- Unit: normalize to standard units (ml, L, g, kg, units, oz, bottles)
- Category: MUST be one of the valid categories above. If uncertain, use "Otros"
- Matching: if a similar name exists in the database, set matched_existing=true and existing_id to that supply's id. Set confidence 0-1 based on match quality
- If no match, set matched_existing=false, existing_id=null, confidence=0

DATA TO PARSE:
${fileContent}`;

          const result = await model.generateContent(prompt);
          const response = result.response;

          // With JSON mode + responseSchema, output is guaranteed valid JSON
          let parsedData;
          try {
               const responseText = response.text();
               if (!responseText) {
                    throw new Error('Empty response from AI');
               }

               const rawData = JSON.parse(responseText);

               // Zod as secondary validation (schema already enforced by Gemini)
               const validationResult = AIResponseSchema.safeParse(rawData);
               parsedData = validationResult.success
                    ? validationResult.data
                    : rawData.map((item: any) => ({
                         name: item.name || 'Unknown',
                         quantity: Number(item.quantity) || 1,
                         unit: item.unit || 'units',
                         category: item.category || 'Otros',
                         matched_existing: item.matched_existing || false,
                         existing_id: item.existing_id || null,
                         confidence: item.confidence || 0,
                    }));
          } catch (error) {
               console.error('Error parsing AI response:', error);
               return NextResponse.json(
                    { error: 'Failed to parse AI response. Please try again.' },
                    { status: 500 }
               );
          }

          // Validate and format the data with enhanced matching info
          const supplies = parsedData.map((item: any, index: number) => {
               const supply: any = {
                    id: item.matched_existing && item.existing_id
                         ? item.existing_id
                         : `imported-${Date.now()}-${index}`,
                    name: item.name || `Unknown Item ${index + 1}`,
                    quantity: Number(item.quantity) || 0,
                    unit: item.unit || 'units',
                    category: item.category || 'Otros',
                    selected: true,
                    // Additional metadata for frontend
                    isNew: !item.matched_existing,
                    matchConfidence: item.confidence || 0,
               };

               // If matched to existing, include reference info
               if (item.matched_existing && item.existing_id) {
                    supply.existingSupplyId = item.existing_id;
                    supply.matchedExisting = true;
               }

               return supply;
          });

          // Separate new vs matched supplies for better UX
          const newSupplies = supplies.filter((s: any) => s.isNew);
          const matchedSupplies = supplies.filter((s: any) => !s.isNew);

          return NextResponse.json({
               supplies,
               summary: {
                    total: supplies.length,
                    new: newSupplies.length,
                    matched: matchedSupplies.length,
                    categories: [...new Set(supplies.map((s: any) => s.category))],
                    ...(detectedSheet ? { detectedSheet } : {}),
                    ...(wasTruncated ? { wasTruncated: true, originalRows: lines.length } : {})
               }
          });

     } catch (error) {
          console.error('Error in parse-menu API:', error);

          // Provide more specific error messages
          let errorMessage = 'Internal server error';

          if (error instanceof Error) {
               errorMessage = error.message;
               console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
               });
          }

          return NextResponse.json(
               {
                    error: errorMessage,
                    details: error instanceof Error ? error.message : 'Unknown error'
               },
               { status: 500 }
          );
     }
}
