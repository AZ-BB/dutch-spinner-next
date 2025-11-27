import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

interface RegisterRequestBody {
  email: string
  voornaam: string
  achternaam: string
  newsletter?: boolean
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, voornaam, achternaam }: RegisterRequestBody = await request.json()

    if (!email || !voornaam || !achternaam) {
      return NextResponse.json(
        { error: 'Alle verplichte velden moeten ingevuld worden.' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Voer een geldig e-mailadres in.' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, coupon_id')
      .eq('email', email.toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected
      console.error('Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Er is een serverfout opgetreden.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      // User already exists - check if they've already spun
      if (existingUser.coupon_id) {
        return NextResponse.json(
          { error: 'Dit e-mailadres heeft al meegedaan aan het rad.' },
          { status: 400 }
        )
      }
      // User exists but hasn't spun yet - allow them to proceed
      return NextResponse.json({
        success: true,
        message: 'Welkom terug! Je kunt nu aan het rad draaien.'
      })
    }

    // Create new user
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        first_name: voornaam,
        last_name: achternaam,
      })

    if (insertError) {
      console.error('Error inserting user:', insertError)
      return NextResponse.json(
        { error: 'Er is een fout opgetreden bij het registreren.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Registratie succesvol! Je kunt nu aan het rad draaien.'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Er is een serverfout opgetreden.' },
      { status: 500 }
    )
  }
}
