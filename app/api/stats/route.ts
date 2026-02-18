import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { DashboardStatsService } from '@/lib/services/dashboard-stats.service'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await DashboardStatsService.getByUserId(supabase, user.id)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[v0] Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
