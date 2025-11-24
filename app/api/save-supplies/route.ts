import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
     try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseKey) {
               return NextResponse.json(
                    { error: 'Supabase configuration missing' },
                    { status: 500 }
               );
          }

          const cookieStore = await cookies();
          const supabase = createServerClient(
               supabaseUrl,
               supabaseKey,
               {
                    cookies: {
                         getAll() {
                              return cookieStore.getAll();
                         },
                         setAll(cookiesToSet) {
                              cookiesToSet.forEach(({ name, value, options }) =>
                                   cookieStore.set(name, value, options)
                              );
                         },
                    },
               }
          );

          const { supplies, period, establishmentId } = await request.json();

          if (!supplies || !Array.isArray(supplies)) {
               return NextResponse.json(
                    { error: 'Invalid supplies data' },
                    { status: 400 }
               );
          }

          // Get authenticated user
          const { data: { user }, error: authError } = await supabase.auth.getUser();

          if (authError || !user) {
               return NextResponse.json(
                    { error: 'Authentication required to save to database', saved_locally: true },
                    { status: 401 }
               );
          }

          // For demo purposes, we'll use a default establishment ID or create one
          let finalEstablishmentId = establishmentId;

          if (!finalEstablishmentId) {
               // Try to get existing establishment for user
               const { data: existingEstablishment } = await supabase
                    .from('establishments')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

               if (existingEstablishment) {
                    finalEstablishmentId = existingEstablishment.id;
               } else {
                    // Create a new establishment
                    const { data: newEstablishment, error: estError } = await supabase
                         .from('establishments')
                         .insert({
                              user_id: user.id,
                              name: 'Demo Bar',
                         })
                         .select('id')
                         .single();

                    if (estError) {
                         console.error('Error creating establishment:', estError);
                         return NextResponse.json(
                              { error: 'Failed to create establishment' },
                              { status: 500 }
                         );
                    }

                    finalEstablishmentId = newEstablishment.id;
               }
          }

          // Prepare supplies data for insertion/update
          const suppliesToSave = supplies.map((supply: any) => ({
               establishment_id: finalEstablishmentId,
               name: supply.name,
               category: supply.category,
               unit: supply.unit,
               current_quantity: supply.quantity || 0,
               min_threshold: 0, // Can be updated later
               // If this is a matched existing supply, we might want to update instead of insert
               ...(supply.existingSupplyId ? { id: supply.existingSupplyId } : {})
          }));

          // Separate new supplies from updates
          const newSupplies = suppliesToSave.filter((s: any) => !s.id);
          const updateSupplies = suppliesToSave.filter((s: any) => s.id);

          let insertedCount = 0;
          let updatedCount = 0;

          // Insert new supplies
          if (newSupplies.length > 0) {
               const { data: insertedData, error: insertError } = await supabase
                    .from('supplies')
                    .insert(newSupplies)
                    .select();

               if (insertError) {
                    console.error('Error inserting supplies:', insertError);
                    return NextResponse.json(
                         { error: 'Failed to save supplies', details: insertError.message },
                         { status: 500 }
                    );
               }

               insertedCount = insertedData?.length || 0;
          }

          // Update existing supplies
          for (const supply of updateSupplies) {
               const { error: updateError } = await supabase
                    .from('supplies')
                    .update({
                         current_quantity: supply.current_quantity,
                         updated_at: new Date().toISOString()
                    })
                    .eq('id', supply.id);

               if (updateError) {
                    console.error('Error updating supply:', updateError);
               } else {
                    updatedCount++;
               }
          }

          return NextResponse.json({
               success: true,
               inserted: insertedCount,
               updated: updatedCount,
               establishmentId: finalEstablishmentId,
               message: `Successfully saved ${insertedCount} new supplies and updated ${updatedCount} existing supplies`
          });

     } catch (error) {
          console.error('Error in save-supplies API:', error);
          return NextResponse.json(
               { error: 'Internal server error' },
               { status: 500 }
          );
     }
}
