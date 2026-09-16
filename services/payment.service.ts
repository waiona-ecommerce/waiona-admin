import { apiRequest } from '@/core/lib/api'
import type { PaymentResponseDto } from '@/core/types'

export function getPaymentsByOrder(orderId: number) {
  return apiRequest<PaymentResponseDto[]>(`/payments/order/${orderId}`)
}
