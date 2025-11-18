import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type UrgencyPeriod = 'day' | 'week' | 'month'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') as UrgencyPeriod) || 'week'
    
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
      supplies.map(async (supply: any) => {
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

        const products = ingredients?.map((ing: any) => ({
          name: ing.products.name,
          category: ing.products.category,
          quantityNeeded: ing.quantity_needed
        })) || []

        // Calculate days until depleted based on average consumption
        const daysUntilDepleted = supply.min_threshold > 0 
          ? Math.floor((supply.current_quantity / supply.min_threshold) * 7)
          : 0

        // Adjust urgency thresholds by selected period
        let urgencyLevel: 'critical' | 'warning' | 'low' = 'low'

        if (period === 'day') {
          // Foco en las próximas 24-48h
          if (daysUntilDepleted <= 1) urgencyLevel = 'critical'
          else if (daysUntilDepleted <= 2) urgencyLevel = 'warning'
          else urgencyLevel = 'low'
        } else if (period === 'week') {
          // Lógica original basada en ~7 días
          if (daysUntilDepleted <= 2) urgencyLevel = 'critical'
          else if (daysUntilDepleted <= 5) urgencyLevel = 'warning'
          else urgencyLevel = 'low'
        } else {
          // month: horizonte más largo
          if (daysUntilDepleted <= 7) urgencyLevel = 'critical'
          else if (daysUntilDepleted <= 14) urgencyLevel = 'warning'
          else urgencyLevel = 'low'
        }

        return {
          ...supply,
          products,
          daysUntilDepleted,
          urgencyLevel
        }
      })
    )

    return NextResponse.json({ supplies: urgentSupplies })
  } catch (error) {
    console.error('[v0] Error fetching urgent supplies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
