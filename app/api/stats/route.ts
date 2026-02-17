import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
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
      return NextResponse.json({
        totalProducts: 0,
        lowStockCount: 0,
        totalSalesToday: 0,
        monthlyRevenue: 0
      })
    }

    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('establishment_id', establishment.id)

    // Get low stock items
    const { count: lowStockCount } = await supabase
      .from('supplies')
      .select('*', { count: 'exact', head: true })
      .eq('establishment_id', establishment.id)
      .lt('current_quantity', 'min_threshold')

    // Get today's sales
    const today = new Date().toISOString().split('T')[0]
    const { data: salesToday } = await supabase
      .from('sales')
      .select('total_price')
      .eq('establishment_id', establishment.id)
      .gte('created_at', today)

    const totalSalesToday = salesToday?.reduce((sum, sale) => sum + sale.total_price, 0) || 0

    // Get monthly revenue
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: salesMonth } = await supabase
      .from('sales')
      .select('total_price')
      .eq('establishment_id', establishment.id)
      .gte('created_at', startOfMonth.toISOString())

    const monthlyRevenue = salesMonth?.reduce((sum, sale) => sum + sale.total_price, 0) || 0

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      lowStockCount: lowStockCount || 0,
      totalSalesToday,
      monthlyRevenue
    })
  } catch (error) {
    console.error('[v0] Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
