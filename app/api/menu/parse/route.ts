import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
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

// Standard units for normalization validation
const STANDARD_UNITS = new Set(['ml', 'l', 'g', 'kg', 'units', 'oz', 'bottles', 'lbs']);

export async function POST(request: NextRequest) {
     try {
          // Rate limit — protects expensive AI API calls
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

          // Truncate content to avoid exceeding token limits
          const MAX_ROWS = 500;
          const lines = fileContent.split('\n');
          let wasTruncated = false;
          if (lines.length > MAX_ROWS) {
               fileContent = lines.slice(0, MAX_ROWS + 1).join('\n');
               wasTruncated = true;
          }

          // Validate API key
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

          // ─── Gemma 4 31B Dense — prompt-driven structured output ───
          const client = new GoogleGenAI({ apiKey });

          const prompt = `You are a precise data extraction assistant for a bar/restaurant inventory system.
Your job is to parse raw inventory data and return CLEAN, DEDUPLICATED, ACCURATE structured data.

VALID CATEGORIES (ONLY use these): ${categories.join(', ')}

EXISTING SUPPLIES IN DATABASE (match new items to these when possible):
${existingSupplies.length > 0 ? existingSupplies.map(s => `- ${s.name} (id: ${s.id}, category: ${s.category}, unit: ${s.unit})`).join('\n') : '(empty database — all items are new)'}

STRICT RULES:

1. NAME EXTRACTION — CRITICAL:
   - Extract the EXACT product name from the data. Do NOT invent or hallucinate names.
   - NEVER replace the original name with a similar name from the database. "jarabe simple" must stay "Jarabe Simple", NOT become "Jarabe Natural".
   - Clean up the name: capitalize properly, remove volume/size info (e.g., "750ml", "1L"), remove packaging info (e.g., "botella de", "caja de").
   - Examples: "tequila don julio 750ml" → "Tequila Don Julio" | "vodka absolut 1L" → "Vodka Absolut" | "coca cola" → "Coca-Cola"

2. QUANTITY — CALCULATE COMPOUND VALUES:
   - "2 cajas de 24" → quantity: 48 (multiply: 2 × 24)
   - "3 cartones, 24 por carton" → quantity: 72 (multiply: 3 × 24)
   - "4 packs of 12" → quantity: 48 (multiply: 4 × 12)
   - "medio kilo" → quantity: 500, unit: "g"
   - "12 botellas" → quantity: 12, unit: "bottles"
   - "200g" → quantity: 200, unit: "g"
   - Must ALWAYS be a positive number

3. UNIT NORMALIZATION — use ONLY these standard units:
   - Volume: "ml", "L", "oz"
   - Weight: "g", "kg"
   - Count: "units", "bottles"
   - Map: botellas/btls/bots/frascos → "bottles" | piezas/pzs/unidades/latas/cans → "units" | kilos → "kg" | gramos → "g" | litros → "L"

4. CATEGORY — MUST be one from the valid list. If uncertain → "Otros"

5. MATCHING — compare names to existing DB supplies:
   - If a product clearly matches an existing supply, set matched_existing=true, existing_id to that UUID, confidence 0.7-1.0
   - ONLY match when the product is genuinely the same item. Do NOT force matches.
   - If no match → matched_existing=false, existing_id=null, confidence=0

6. DEDUPLICATION — CRITICAL:
   - If the same product appears multiple times in the data, MERGE them into a single entry with combined quantity
   - "Vodka 5" and "vodka absolut 3" referring to the same product → single entry, quantity: 8
   - Only merge when clearly the same product. Different variants are separate items.

7. OUTPUT FORMAT — Return ONLY a valid JSON array:
[
  {
    "name": "string (clean product name)",
    "quantity": number (positive),
    "unit": "string (standard unit)",
    "category": "string (valid category)",
    "matched_existing": boolean,
    "existing_id": "string (UUID) or null",
    "confidence": number (0-1)
  }
]

Return ONLY the JSON array. No markdown, no explanation, no wrapping.

DATA TO PARSE:
${fileContent}`;

          const result = await client.models.generateContent({
               model: 'gemma-4-31b-it',
               contents: prompt,
               config: {
                    responseMimeType: 'application/json',
               },
          });

          // Parse and validate AI response
          let parsedData;
          try {
               const responseText = result.text;
               if (!responseText) {
                    throw new Error('Empty response from AI');
               }

               // Clean response — strip markdown fences if present
               let cleanJson = responseText.trim();
               if (cleanJson.startsWith('```')) {
                    cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
               }

               const rawData = JSON.parse(cleanJson);

               // Zod validation
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

          // ─── Post-processing: server-side dedup + normalization guardrails ───
          const deduped = deduplicateSupplies(parsedData);
          const cleaned = deduped.map(normalizeSupply);

          // Validate and format the data with enhanced matching info
          const supplies = cleaned.map((item: any, index: number) => {
               const supply: any = {
                    id: item.matched_existing && item.existing_id
                         ? item.existing_id
                         : `imported-${Date.now()}-${index}`,
                    name: item.name || `Unknown Item ${index + 1}`,
                    quantity: Number(item.quantity) || 0,
                    unit: item.unit || 'units',
                    category: item.category || 'Otros',
                    selected: true,
                    isNew: !item.matched_existing,
                    matchConfidence: item.confidence || 0,
               };

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

// ─── Server-side deduplication ───
// Catches duplicates the AI might have missed by comparing normalized names
function deduplicateSupplies(items: any[]): any[] {
     const seen = new Map<string, any>();

     for (const item of items) {
          const key = normalizeName(item.name);

          if (seen.has(key)) {
               // Merge: sum quantities (convert to same unit if possible)
               const existing = seen.get(key)!;
               const merged = mergeQuantities(existing, item);
               seen.set(key, merged);
          } else {
               seen.set(key, { ...item });
          }
     }

     return Array.from(seen.values());
}

function normalizeName(name: string): string {
     return name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // strip accents
          .replace(/[^a-z0-9\s]/g, '')     // strip special chars
          .replace(/\s+/g, ' ')
          .trim();
}

function mergeQuantities(a: any, b: any): any {
     // If same unit, simply add
     if (a.unit === b.unit) {
          return { ...a, quantity: a.quantity + b.quantity };
     }

     // Convert compatible units (g↔kg, ml↔L) then add
     const converted = convertToSameUnit(a.quantity, a.unit, b.quantity, b.unit);
     if (converted) {
          return { ...a, quantity: converted.quantity, unit: converted.unit };
     }

     // Incompatible units — keep the one with higher quantity (likely the main entry)
     return a.quantity >= b.quantity ? a : b;
}

function convertToSameUnit(
     q1: number, u1: string, q2: number, u2: string
): { quantity: number; unit: string } | null {
     const pair = [u1.toLowerCase(), u2.toLowerCase()].sort().join(',');

     if (pair === 'g,kg') {
          const grams = (u1 === 'kg' ? q1 * 1000 : q1) + (u2 === 'kg' ? q2 * 1000 : q2);
          return grams >= 1000
               ? { quantity: Math.round((grams / 1000) * 100) / 100, unit: 'kg' }
               : { quantity: Math.round(grams), unit: 'g' };
     }

     if (pair === 'l,ml') {
          const ml = (u1 === 'L' ? q1 * 1000 : q1) + (u2 === 'L' ? q2 * 1000 : q2);
          return ml >= 1000
               ? { quantity: Math.round((ml / 1000) * 100) / 100, unit: 'L' }
               : { quantity: Math.round(ml), unit: 'ml' };
     }

     return null;
}

// ─── Server-side normalization guardrail ───
// Catches unit/name issues the AI might have missed
function normalizeSupply(item: any): any {
     const normalized = { ...item };

     // Normalize unit to standard form
     const unitMap: Record<string, string> = {
          'bottle': 'bottles', 'btl': 'bottles', 'btls': 'bottles',
          'bots': 'bottles', 'bot': 'bottles', 'botellas': 'bottles', 'botella': 'bottles',
          'frascos': 'bottles', 'frasco': 'bottles',
          'unit': 'units', 'pz': 'units', 'pzs': 'units', 'piezas': 'units',
          'pieza': 'units', 'unidades': 'units', 'unidad': 'units',
          'latas': 'units', 'lata': 'units', 'cans': 'units', 'can': 'units',
          'kilo': 'kg', 'kilos': 'kg', 'kilogramo': 'kg', 'kilogramos': 'kg',
          'gramo': 'g', 'gramos': 'g', 'gram': 'g', 'grams': 'g',
          'litro': 'L', 'litros': 'L', 'liter': 'L', 'liters': 'L', 'lt': 'L',
          'mililitro': 'ml', 'mililitros': 'ml',
          'onza': 'oz', 'onzas': 'oz', 'ounce': 'oz', 'ounces': 'oz',
          'libra': 'lbs', 'libras': 'lbs', 'pound': 'lbs', 'pounds': 'lbs',
     };

     const lowerUnit = (normalized.unit || '').toLowerCase().trim();
     if (unitMap[lowerUnit]) {
          normalized.unit = unitMap[lowerUnit];
     } else if (!STANDARD_UNITS.has(lowerUnit)) {
          // Unknown unit — default to 'units'
          normalized.unit = 'units';
     }

     // Clean name: remove trailing/leading whitespace, remove volume from name
     normalized.name = (normalized.name || '')
          .replace(/\s*\d+\s*(ml|l|g|kg|oz)\s*$/i, '') // remove trailing "750ml"
          .replace(/^\s+|\s+$/g, '')                     // trim
          .replace(/\s{2,}/g, ' ');                      // collapse spaces

     // Ensure quantity is a valid positive number
     normalized.quantity = Math.max(0.01, Number(normalized.quantity) || 1);

     return normalized;
}
