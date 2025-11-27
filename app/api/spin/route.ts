import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { CouponTypeDisplayNames, CouponType } from '@/types/enums'

interface SpinRequestBody {
  email: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email }: SpinRequestBody = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'E-mailadres is vereist.' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, coupon_id')
      .eq('email', email.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Je moet je eerst registreren voordat je kunt draaien.' },
        { status: 400 }
      )
    }

    // Check if user has already spun
    if (user.coupon_id) {
      // Get the coupon they already won
      const { data: existingCoupon } = await supabase
        .from('coupons')
        .select('name, code, type')
        .eq('id', user.coupon_id)
        .single()

      return NextResponse.json(
        {
          error: 'Je hebt al aan het rad gedraaid.',
          prize: existingCoupon?.name,
          prizeType: existingCoupon?.type,
          voucherCode: existingCoupon?.code
        },
        { status: 400 }
      )
    }

    // Get all available coupons grouped by type
    const { data: availableCoupons, error: couponsError } = await supabase
      .from('coupons')
      .select('id, name, code, type')
      .eq('used', false)

    if (couponsError || !availableCoupons || availableCoupons.length === 0) {
      return NextResponse.json(
        { error: 'Er zijn geen prijzen meer beschikbaar.' },
        { status: 500 }
      )
    }

    // Group coupons by type
    const couponsByType: Record<string, typeof availableCoupons> = {}
    availableCoupons.forEach(coupon => {
      if (!couponsByType[coupon.type]) {
        couponsByType[coupon.type] = []
      }
      couponsByType[coupon.type].push(coupon)
    })

    // Get unique prize types that have available coupons
    const availablePrizeTypes = Object.keys(couponsByType)
    
    if (availablePrizeTypes.length === 0) {
      return NextResponse.json(
        { error: 'Er zijn geen prijzen meer beschikbaar.' },
        { status: 500 }
      )
    }

    // Select random prize type
    const prizeIndex = Math.floor(Math.random() * availablePrizeTypes.length)
    const prizeType = availablePrizeTypes[prizeIndex]

    // Get first available coupon for this prize type
    const winningCoupon = couponsByType[prizeType][0]
    
    // Get display name for the prize
    const prizeName = CouponTypeDisplayNames[prizeType as CouponType] || winningCoupon.name

    // Mark coupon as used
    const { error: updateCouponError } = await supabase
      .from('coupons')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', winningCoupon.id)

    if (updateCouponError) {
      console.error('Error updating coupon:', updateCouponError)
      return NextResponse.json(
        { error: 'Er is een fout opgetreden bij het claimen van je prijs.' },
        { status: 500 }
      )
    }

    // Update user with coupon_id
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ coupon_id: winningCoupon.id })
      .eq('id', user.id)

    if (updateUserError) {
      console.error('Error updating user:', updateUserError)
      // Try to rollback the coupon update
      await supabase
        .from('coupons')
        .update({ used: false, used_at: null })
        .eq('id', winningCoupon.id)
      
      return NextResponse.json(
        { error: 'Er is een fout opgetreden bij het opslaan van je prijs.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      prizeIndex,
      prize: prizeName,
      prizeType: prizeType,
      voucherCode: winningCoupon.code,
      message: `Gefeliciteerd! Je hebt ${prizeName} gewonnen!`
    })
  } catch (error) {
    console.error('Spin error:', error)
    return NextResponse.json(
      { error: 'Er is een serverfout opgetreden.' },
      { status: 500 }
    )
  }
}
