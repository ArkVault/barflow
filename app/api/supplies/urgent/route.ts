import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { UrgentSuppliesService } from '@/lib/services/urgent-supplies.service'
import { normalizeUrgencyPeriod } from '@/lib/utils/urgency-calculations'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const period = normalizeUrgencyPeriod(searchParams.get('period'))
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const urgentSupplies = await UrgentSuppliesService.getByUserId(supabase, user.id, period)

    return NextResponse.json({ supplies: urgentSupplies })
  } catch (error) {
    console.error('[v0] Error fetching urgent supplies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
