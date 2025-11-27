import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { CouponTypeDisplayNames, CouponType, ALL_COUPON_TYPES } from '@/types/enums'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServerClient()

    // Get distinct coupon types that have available (unused) coupons
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('type, name')
      .eq('used', false)

    if (error) {
      console.error('Error fetching prizes:', error)
      return NextResponse.json(
        { error: 'Er is een serverfout opgetreden.' },
        { status: 500 }
      )
    }

    // Get unique prize types with their display names
    const uniqueTypes = new Map<string, string>()
    coupons?.forEach(c => {
      if (!uniqueTypes.has(c.type)) {
        // Use display name if available, otherwise use the name from DB
        const displayName = CouponTypeDisplayNames[c.type as CouponType] || c.name
        uniqueTypes.set(c.type, displayName)
      }
    })

    // Sort prizes by the predefined enum order for consistency
    const prizes = ALL_COUPON_TYPES
      .filter(type => uniqueTypes.has(type))
      .map(type => ({
        type,
        name: uniqueTypes.get(type)!
      }))

    return NextResponse.json({ prizes })
  } catch (error) {
    console.error('Prizes fetch error:', error)
    return NextResponse.json(
      { error: 'Er is een serverfout opgetreden.' },
      { status: 500 }
    )
  }
}
