import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { z } from 'zod';

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

               console.log(`📊 Excel file processed:`, {
                    totalSheets: workbook.SheetNames.length,
                    availableSheets: workbook.SheetNames,
                    selectedSheet: targetSheetName,
                    autoDetected: !!detectedSheet
               });
          } else if (fileType === 'pdf') {
               // For PDF, we'll need to use a different approach
               // For now, we'll return an error asking for CSV/Excel
               return NextResponse.json(
                    { error: 'PDF parsing not yet implemented. Please use CSV or Excel files.' },
                    { status: 400 }
               );
          } else {
               return NextResponse.json(
                    { error: 'Unsupported file type. Please upload CSV, Excel, or PDF files.' },
                    { status: 400 }
               );
          }

          // Use Gemini AI to parse the content
          console.log('🤖 Starting AI parsing...');
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
               console.error('❌ GEMINI_API_KEY not configured');
               return NextResponse.json(
                    { error: 'GEMINI_API_KEY not configured' },
                    { status: 500 }
               );
          }

          // Fetch real schema from Supabase
          let categories: string[] = [];
          let existingSupplies: any[] = [];

          try {
               const schemaResponse = await fetch(`${request.nextUrl.origin}/api/supply-schema`);
               if (schemaResponse.ok) {
                    const schemaData = await schemaResponse.json();
                    categories = schemaData.categories;
                    existingSupplies = schemaData.supplies || [];
               }
          } catch (error) {
               console.error('Error fetching schema:', error);
               // Fallback to default categories
               categories = ['Licores', 'Licores Dulces', 'Refrescos', 'Frutas', 'Hierbas', 'Especias', 'Otros'];
          }

          console.log('🔧 Initializing Google GenAI...');
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

          const prompt = `You are a data extraction and validation assistant for a bar inventory system. 

**TASK**: Parse the following menu/inventory data and extract items with proper validation.

**REQUIRED OUTPUT STRUCTURE** (JSON array):
[
  {
    "name": "string (required)",
    "quantity": number (required, must be > 0),
    "unit": "string (required: ml, L, g, kg, units, oz, etc.)",
    "category": "string (required, must be one of the valid categories)",
    "matched_existing": boolean (true if matches existing supply),
    "existing_id": "uuid or null",
    "confidence": number (0-1, how confident the match is)
  }
]

**VALID CATEGORIES** (ONLY use these):
${categories.join(', ')}

**EXISTING SUPPLIES IN DATABASE** (try to match new items to these):
${existingSupplies.map(s => `- ${s.name} (${s.category}, unit: ${s.unit})`).join('\n')}

**VALIDATION RULES**:
1. Name: Must be a valid supply/ingredient name
2. Quantity: Must be a positive number
3. Unit: Normalize to standard units (ml, L, g, kg, units, oz, bottles)
4. Category: MUST pick from the valid categories list above
5. Matching: If a similar name exists in the database, set matched_existing=true and provide existing_id
6. If uncertain about category, use "Otros" (Other)

**MATCHING LOGIC**:
- Check for exact name matches (case-insensitive)
- Check for partial matches (e.g., "Ron" matches "Ron Blanco")
- Check for common variations (e.g., "Coca" matches "Coca Cola")
- Consider Spanish/English translations
- Set confidence based on match quality

**DATA TO PARSE**:
${fileContent}

**IMPORTANT**: 
- Return ONLY valid JSON
- Every item MUST have all required fields
- Use existing supply IDs when there's a match
- Be smart about normalization (e.g., "750ml" -> quantity: 750, unit: "ml")

Return the JSON array now:`;

          console.log('📤 Sending request to Gemini AI...');
          const result = await model.generateContent(prompt);
          const response = result.response;
          console.log('📥 Received response from Gemini AI');
          console.log('Response type:', typeof response);
          console.log('Response keys:', Object.keys(response || {}));

          // Extract JSON from response
          let parsedData;
          try {
               console.log('🔍 Parsing AI response...');

               // The correct way to access Gemini response text with @google/generative-ai
               const responseText = response.text();

               console.log('Response text length:', responseText.length);
               console.log('Response text preview:', responseText.substring(0, 200));

               if (!responseText) {
                    console.error('❌ Empty response from AI');
                    console.error('Response structure:', JSON.stringify(response, null, 2));
                    throw new Error('Empty response from AI');
               }

               // Remove markdown code blocks if present
               const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
               console.log('Cleaned JSON text preview:', jsonText.substring(0, 200));

               const rawData = JSON.parse(jsonText);
               console.log('✅ JSON parsed, validating with Zod...');

               // Validate with Zod schema
               const validationResult = AIResponseSchema.safeParse(rawData);

               if (!validationResult.success) {
                    console.error('❌ Zod validation failed:', validationResult.error.errors);
                    // Try to use raw data with defaults instead of failing completely
                    parsedData = rawData.map((item: any) => ({
                         name: item.name || 'Unknown',
                         quantity: Number(item.quantity) || 1,
                         unit: item.unit || 'units',
                         category: item.category || 'Otros',
                         matched_existing: item.matched_existing || false,
                         existing_id: item.existing_id || null,
                         confidence: item.confidence || 0,
                    }));
                    console.log('⚠️ Using fallback data with defaults');
               } else {
                    parsedData = validationResult.data;
                    console.log('✅ Zod validation passed');
               }

               console.log('✅ Successfully processed', parsedData.length, 'items');
          } catch (error) {
               console.error('❌ Error parsing AI response:', error);
               console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
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
                    ...(detectedSheet ? { detectedSheet } : {})
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
