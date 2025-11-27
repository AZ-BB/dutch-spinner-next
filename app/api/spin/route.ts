import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { ParticipantsData, VouchersData, Participant } from '@/types'

const VOUCHERS_PATH = path.join(process.cwd(), 'data', 'vouchers.json')
const PARTICIPANTS_PATH = path.join(process.cwd(), 'data', 'participants.json')

const PRIZES: string[] = [
  'HEMA regenponcho',
  '€50 shoptegoed',
  '€250 shoptegoed',
  '15% korting',
  '€100 shoptegoed'
]

function readJSON<T>(filePath: string): T {
  const data = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(data) as T
}

function writeJSON<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

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

    const participants = readJSON<ParticipantsData>(PARTICIPANTS_PATH)
    const vouchers = readJSON<VouchersData>(VOUCHERS_PATH)

    // Find participant
    const participantIndex = participants.participants.findIndex(
      (p: Participant) => p.email.toLowerCase() === email.toLowerCase()
    )

    if (participantIndex === -1) {
      return NextResponse.json(
        { error: 'Je moet je eerst registreren voordat je kunt draaien.' },
        { status: 400 }
      )
    }

    const participant = participants.participants[participantIndex]

    if (participant.hasSpun) {
      return NextResponse.json(
        {
          error: 'Je hebt al aan het rad gedraaid.',
          prize: participant.prize,
          voucherCode: participant.voucherCode
        },
        { status: 400 }
      )
    }

    // Select random prize (equal probability)
    const prizeIndex = Math.floor(Math.random() * PRIZES.length)
    const prize = PRIZES[prizeIndex]

    // Get voucher code for this prize
    const prizeVouchers = vouchers[prize]
    if (!prizeVouchers || prizeVouchers.codes.length === 0) {
      return NextResponse.json(
        { error: 'Er zijn geen vouchercodes meer beschikbaar voor deze prijs.' },
        { status: 500 }
      )
    }

    // Take the first available code
    const voucherCode = prizeVouchers.codes.shift()!

    // Update participant record
    participants.participants[participantIndex].hasSpun = true
    participants.participants[participantIndex].prize = prize
    participants.participants[participantIndex].voucherCode = voucherCode
    participants.participants[participantIndex].spinDate = new Date().toISOString()

    // Save updated data
    writeJSON(PARTICIPANTS_PATH, participants)
    writeJSON(VOUCHERS_PATH, vouchers)

    return NextResponse.json({
      success: true,
      prizeIndex,
      prize,
      voucherCode,
      message: `Gefeliciteerd! Je hebt ${prize} gewonnen!`
    })
  } catch (error) {
    console.error('Spin error:', error)
    return NextResponse.json(
      { error: 'Er is een serverfout opgetreden.' },
      { status: 500 }
    )
  }
}

