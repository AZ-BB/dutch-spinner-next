export interface Participant {
  email: string
  voornaam: string
  achternaam: string
  newsletter: boolean
  registeredAt: string
  hasSpun: boolean
  prize: string | null
  voucherCode: string | null
  spinDate?: string
}

export interface ParticipantsData {
  participants: Participant[]
}

export interface VouchersData {
  [prizeName: string]: {
    codes: string[]
  }
}

export interface Prize {
  name: string
  color: string
  icon: string
}

export interface SpinResult {
  success: boolean
  prizeIndex: number
  prize: string
  voucherCode: string
  message: string
}

export interface RegistrationFormData {
  voornaam: string
  achternaam: string
  email: string
  newsletter: boolean
}

export interface ConfettiPiece {
  id: number
  left: number
  delay: number
  duration: number
  color: string
}

