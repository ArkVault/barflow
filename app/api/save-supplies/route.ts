import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Zod schema for supply validation
const SupplySchema = z.object({
     name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
     category: z.string().min(1, 'Category is required'),
     unit: z.string().min(1, 'Unit is required'),
     quantity: z.number().min(0, 'Quantity must be non-negative').optional().default(0),
     existingSupplyId: z.string().uuid().optional(),
     matchedExisting: z.boolean().optional(),
});

const SaveSuppliesRequestSchema = z.object({
     supplies: z.array(SupplySchema).min(1, 'At least one supply is required'),
     period: z.string().optional(),
     establishmentId: z.string().uuid().optional(),
});

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

          // Parse and validate request body with Zod
          const body = await request.json();
          const validationResult = SaveSuppliesRequestSchema.safeParse(body);

          if (!validationResult.success) {
               const errors = validationResult.error.errors.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
               }));
               return NextResponse.json(
                    { error: 'Validation failed', details: errors },
                    { status: 400 }
               );
          }

          const { supplies, establishmentId } = validationResult.data;

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
