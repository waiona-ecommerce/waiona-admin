import { apiRequest } from '@/core/lib/api'
import type { PaymentAttemptResponseDto } from '@/core/types'

export function getPaymentAttemptsByOrder(orderId: number) {
  return apiRequest<PaymentAttemptResponseDto[]>(`/payment-attempts/order/${orderId}`)
}
