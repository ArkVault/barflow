import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get user's establishment
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: establishment } = await supabase
      .from('establishments')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!establishment) {
      return NextResponse.json({ supplies: [] })
    }

    // Get urgent supplies (low stock)
    const { data: supplies } = await supabase
      .from('supplies')
      .select(`
        id,
        name,
        current_quantity,
        unit,
        min_threshold,
        category
      `)
      .eq('establishment_id', establishment.id)
      .lt('current_quantity', 'min_threshold')
      .order('current_quantity', { ascending: true })

    if (!supplies || supplies.length === 0) {
      return NextResponse.json({ supplies: [] })
    }

    // For each supply, get the products that use it
    const urgentSupplies = await Promise.all(
      supplies.map(async (supply) => {
        const { data: ingredients } = await supabase
          .from('product_ingredients')
          .select(`
            quantity_needed,
            products (
              name,
              category,
              price
            )
          `)
          .eq('supply_id', supply.id)

        const products = ingredients?.map(ing => ({
          name: ing.products.name,
          category: ing.products.category,
          quantityNeeded: ing.quantity_needed
        })) || []

        // Calculate days until depleted based on average consumption
        const daysUntilDepleted = supply.min_threshold > 0 
          ? Math.floor((supply.current_quantity / supply.min_threshold) * 7)
          : 0

        return {
          ...supply,
          products,
          daysUntilDepleted,
          urgencyLevel: daysUntilDepleted <= 2 ? 'critical' : daysUntilDepleted <= 5 ? 'warning' : 'low'
        }
      })
    )

    return NextResponse.json({ supplies: urgentSupplies })
  } catch (error) {
    console.error('[v0] Error fetching urgent supplies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
