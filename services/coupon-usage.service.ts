import { apiRequest } from '@/core/lib/api'
import type { CouponUsageResponseDto } from '@/core/types'

export async function getCouponUsage(couponId: number) {
  return apiRequest<CouponUsageResponseDto[]>(`/coupon-usage/coupon/${couponId}`)
}
