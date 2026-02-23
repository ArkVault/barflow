import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
     try {
          const supabase = await createClient();
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
               return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const { data: establishment } = await supabase
               .from('establishments')
               .select('id')
               .eq('user_id', user.id)
               .single();

          if (!establishment) {
               return NextResponse.json({ error: 'Establishment not found' }, { status: 404 });
          }

          // Get unique categories from supplies table
          const { data: categoriesData, error: categoriesError } = await supabase
               .from('supplies')
               .select('category')
               .eq('establishment_id', establishment.id)
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
               .select('id, name, category, unit')
               .eq('establishment_id', establishment.id);

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
