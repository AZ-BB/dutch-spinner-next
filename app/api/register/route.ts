import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { ParticipantsData, Participant } from '@/types'

const PARTICIPANTS_PATH = path.join(process.cwd(), 'data', 'participants.json')

function readJSON<T>(filePath: string): T {
  const data = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(data) as T
}

function writeJSON<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

interface RegisterRequestBody {
  email: string
  voornaam: string
  achternaam: string
  newsletter?: boolean
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, voornaam, achternaam, newsletter }: RegisterRequestBody = await request.json()

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

    const participants = readJSON<ParticipantsData>(PARTICIPANTS_PATH)

    // Check if email already exists
    const existingParticipant = participants.participants.find(
      (p: Participant) => p.email.toLowerCase() === email.toLowerCase()
    )

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Dit e-mailadres heeft al meegedaan aan het rad.' },
        { status: 400 }
      )
    }

    // Add new participant
    const newParticipant: Participant = {
      email: email.toLowerCase(),
      voornaam,
      achternaam,
      newsletter: !!newsletter,
      registeredAt: new Date().toISOString(),
      hasSpun: false,
      prize: null,
      voucherCode: null
    }

    participants.participants.push(newParticipant)
    writeJSON(PARTICIPANTS_PATH, participants)

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

