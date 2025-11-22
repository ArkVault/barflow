import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export async function POST(request: NextRequest) {
     try {
          const formData = await request.formData();
          const file = formData.get('file') as File;

          if (!file) {
               return NextResponse.json({ error: 'No file provided' }, { status: 400 });
          }

          // Read file content
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          let fileContent = '';

          // Parse based on file type
          const fileType = file.name.split('.').pop()?.toLowerCase();

          if (fileType === 'csv') {
               fileContent = buffer.toString('utf-8');
          } else if (fileType === 'xlsx' || fileType === 'xls') {
               const workbook = XLSX.read(buffer, { type: 'buffer' });
               const sheetName = workbook.SheetNames[0];
               const worksheet = workbook.Sheets[sheetName];
               fileContent = XLSX.utils.sheet_to_csv(worksheet);
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
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
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

          const ai = new GoogleGenAI({ apiKey });

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

          const response = await ai.models.generateContent({
               model: 'gemini-2.0-flash-exp',
               contents: prompt,
          });

          // Extract JSON from response
          let parsedData;
          try {
               const text = response.text?.trim() || '';
               if (!text) {
                    throw new Error('Empty response from AI');
               }
               // Remove markdown code blocks if present
               const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
               parsedData = JSON.parse(jsonText);
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
                    categories: [...new Set(supplies.map((s: any) => s.category))]
               }
          });

     } catch (error) {
          console.error('Error in parse-menu API:', error);
          return NextResponse.json(
               { error: 'Internal server error' },
               { status: 500 }
          );
     }
}
