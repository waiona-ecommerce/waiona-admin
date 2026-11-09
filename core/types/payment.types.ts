import type { PaymentAttemptStatus } from '@/core/enums'

export interface PaymentAttemptResponseDto {
  id: string
  orderId: number
  status: PaymentAttemptStatus
  amount: number
  currency: string
  checkoutUrl: string | null
  expiresAt: string | null
  createdAt: string
}
