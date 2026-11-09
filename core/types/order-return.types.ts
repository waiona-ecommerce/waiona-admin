import type { OrderReturnType } from '@/core/enums'

export interface CreateOrderReturnDto {
  orderItemId: number
  quantity: number
  type: OrderReturnType
  description?: string
}

export interface OrderReturnResponseDto {
  id: number
  orderId: number
  orderItemId: number
  type: OrderReturnType
  quantity: number
  description: string | null
  createdBy: number
  createdAt: string
}
