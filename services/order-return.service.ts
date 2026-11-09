import { apiRequest } from '@/core/lib/api'
import type { OrderReturnResponseDto } from '@/core/types'

export function getOrderReturns(orderId: number) {
  return apiRequest<OrderReturnResponseDto[]>(`/orders/${orderId}/returns`)
}
