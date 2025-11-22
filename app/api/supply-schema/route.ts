import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
     try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseKey) {
               return NextResponse.json(
                    { error: 'Supabase configuration missing' },
                    { status: 500 }
               );
          }

          const supabase = createClient(supabaseUrl, supabaseKey);

          // Get unique categories from supplies table
          const { data: categoriesData, error: categoriesError } = await supabase
               .from('supplies')
               .select('category')
               .not('category', 'is', null);

          if (categoriesError) {
               console.error('Error fetching categories:', categoriesError);
               // Return default categories if DB query fails
               return NextResponse.json({
                    categories: ['Licores', 'Licores Dulces', 'Refrescos', 'Frutas', 'Hierbas', 'Especias', 'Otros'],
                    source: 'default'
               });
          }

          // Extract unique categories
          const uniqueCategories = [...new Set(
               categoriesData
                    .map(item => item.category)
                    .filter(Boolean)
          )].sort();

          // Get all existing supplies for validation
          const { data: suppliesData, error: suppliesError } = await supabase
               .from('supplies')
               .select('id, name, category, unit');

          const supplies = suppliesError ? [] : suppliesData;

          return NextResponse.json({
               categories: uniqueCategories.length > 0
                    ? uniqueCategories
                    : ['Licores', 'Licores Dulces', 'Refrescos', 'Frutas', 'Hierbas', 'Especias', 'Otros'],
               supplies,
               source: uniqueCategories.length > 0 ? 'database' : 'default'
          });

     } catch (error) {
          console.error('Error in supply-schema API:', error);
          return NextResponse.json(
               { error: 'Internal server error' },
               { status: 500 }
          );
     }
}
