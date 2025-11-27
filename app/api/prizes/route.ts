import { NextResponse } from 'next/server'

const PRIZES: string[] = [
  'HEMA regenponcho',
  '€50 shoptegoed',
  '€250 shoptegoed',
  '15% korting',
  '€100 shoptegoed'
]

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ prizes: PRIZES })
}

