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

          const ai = new GoogleGenAI({ apiKey });

          const prompt = `You are a data extraction assistant. Parse the following menu/inventory data and extract ONLY these fields for each item:
    - name (string): the name of the supply/ingredient
    - quantity (number): the quantity amount
    - unit (string): the unit of measurement (e.g., L, kg, ml, units, etc.)
    - category (string): categorize as one of: "Licores", "Refrescos", "Especias", "Frutas", "Otros"

    Return ONLY a valid JSON array with these exact field names. Ignore any other fields in the source data.
    If a field is missing, use reasonable defaults (quantity: 0, unit: "units", category: "Otros").

    Data to parse:
    ${fileContent}

    Examples of expected output format:
    [
      {"name": "Ron Blanco", "quantity": 2, "unit": "L", "category": "Licores"},
      {"name": "Coca Cola", "quantity": 12, "unit": "L", "category": "Refrescos"}
    ]

    Return ONLY the JSON array, no other text.`;

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

          // Validate and format the data
          const supplies = parsedData.map((item: any, index: number) => ({
               id: `imported-${Date.now()}-${index}`,
               name: item.name || `Unknown Item ${index + 1}`,
               quantity: Number(item.quantity) || 0,
               unit: item.unit || 'units',
               category: item.category || 'Otros',
               selected: true, // Auto-select imported items
          }));

          return NextResponse.json({ supplies });

     } catch (error) {
          console.error('Error in parse-menu API:', error);
          return NextResponse.json(
               { error: 'Internal server error' },
               { status: 500 }
          );
     }
}
