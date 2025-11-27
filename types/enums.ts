// Coupon type enum - matches the PostgreSQL ENUM in the database
export enum CouponType {
  HEMA_REGENPONCHO = 'HEMA_regenponcho',
  CREDIT_50 = '50_CREDIT',
  CREDIT_250 = '250_CREDIT',
  CREDIT_100 = '100_CREDIT',
  OFF_15 = '15_OFF',
}

// Display names for each coupon type (Dutch)
export const CouponTypeDisplayNames: Record<CouponType, string> = {
  [CouponType.HEMA_REGENPONCHO]: 'HEMA regenponcho',
  [CouponType.CREDIT_50]: '€50 shoptegoed',
  [CouponType.CREDIT_250]: '€250 shoptegoed',
  [CouponType.CREDIT_100]: '€100 shoptegoed',
  [CouponType.OFF_15]: '15% korting',
}

// Get display name from enum value
export function getCouponDisplayName(type: CouponType): string {
  return CouponTypeDisplayNames[type] || type
}

// All coupon types as array
export const ALL_COUPON_TYPES = Object.values(CouponType)

