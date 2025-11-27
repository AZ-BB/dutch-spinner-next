// Re-export enums
export * from './enums'

// Database types
export interface DBCoupon {
  id: number
  code: string
  name: string
  type: string // coupon_type enum
  used: boolean
  used_at: string | null
  created_at: string
}

export interface DBUser {
  id: number
  email: string
  first_name: string
  last_name: string
  coupon_id: number | null
  created_at: string
}

// Frontend types
export interface Prize {
  name: string
  type: string
  color: string
  icon: string
}

export interface SpinResult {
  success: boolean
  prizeIndex: number
  prize: string
  prizeType: string
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
