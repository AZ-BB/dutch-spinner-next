// Run this script to seed the coupons table with initial data
// Usage: npm run seed
// Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env.local

import { createClient } from '@supabase/supabase-js'

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Coupon type enum values (must match PostgreSQL ENUM)
enum CouponType {
  HEMA_REGENPONCHO = 'HEMA_regenponcho',
  CREDIT_50 = '50_CREDIT',
  CREDIT_250 = '250_CREDIT',
  CREDIT_100 = '100_CREDIT',
  OFF_15 = '15_OFF',
}

// Initial coupon data - customize these as needed
const COUPONS_DATA = [
  {
    type: CouponType.HEMA_REGENPONCHO,
    name: 'HEMA regenponcho',
    codes: [
      'PONCHO-2024-A1B2',
      'PONCHO-2024-C3D4',
    ]
  },
  {
    type: CouponType.CREDIT_50,
    name: '€50 shoptegoed',
    codes: [
      'SHOP50-2024-A1B2',
      'SHOP50-2024-C3D4',
    ]
  },
  {
    type: CouponType.CREDIT_250,
    name: '€250 shoptegoed',
    codes: [
      'SHOP250-2024-A1B2',
      'SHOP250-2024-C3D4',
    ]
  },
  {
    type: CouponType.OFF_15,
    name: '15% korting',
    codes: [
      'KORTING15-2024-A1B2',
      'KORTING15-2024-C3D4',
    ]
  },
  {
    type: CouponType.CREDIT_100,
    name: '€100 shoptegoed',
    codes: [
      'SHOP100-2024-A1B2',
      'SHOP100-2024-C3D4',
    ]
  }
]

async function seedCoupons() {
  console.log('🌱 Starting coupon seed...')
  console.log(`📡 Connecting to: ${SUPABASE_URL}`)

  for (const prizeType of COUPONS_DATA) {
    console.log(`\nSeeding: ${prizeType.name} (${prizeType.type})`)
    
    for (const code of prizeType.codes) {
      const { error } = await supabase
        .from('coupons')
        .insert({
          code,
          name: prizeType.name,
          type: prizeType.type,
          used: false
        })

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - code already exists
          console.log(`  ⏭️  ${code} already exists, skipping`)
        } else {
          console.error(`  ❌ Error inserting ${code}:`, error.message)
        }
      } else {
        console.log(`  ✅ ${code}`)
      }
    }
  }

  console.log('\n✨ Seeding complete!')
}

seedCoupons().catch(console.error)
