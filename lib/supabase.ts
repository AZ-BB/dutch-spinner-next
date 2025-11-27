import { createClient } from '@supabase/supabase-js'

// Server-side only Supabase client
// This file should NEVER be imported in client-side code
export function createServerClient() {
  // Try multiple common env variable naming patterns
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    console.error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable')
    throw new Error('Missing Supabase URL environment variable')
  }
  
  if (!supabaseKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable')
    throw new Error('Missing Supabase key environment variable')
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Types for database tables
export interface DBCoupon {
  id: number
  code: string
  name: string
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
