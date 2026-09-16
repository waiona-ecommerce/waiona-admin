import type { OrderStatus, DeliveryType } from '@/core/enums'

// productId y comboId son mutuamente excluyentes: cada item es producto O combo.
export interface CreateOrderItemDto {
  productId?: number
  comboId?: number
  quantity: number
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[]
  deliveryType: DeliveryType
  // Requerido si deliveryType === 'delivery'.
  address?: string
  couponCode?: string
  notes?: string
}

// Cada item trae o bien productId/productName, o bien comboId/comboName — el otro par siempre es null.
export interface OrderItemResponseDto {
  id: number
  productId: number | null
  productName: string | null
  comboId: number | null
  comboName: string | null
  quantity: number
  unitPrice: number
  salePrice: number
  finalPrice: number
}

export interface OrderResponseDto {
  id: number
  createdAt: string
  updatedAt: string
  userId: number
  status: OrderStatus
  // Momento en que se libera la reserva de stock si la orden sigue PENDING
  // (el backend la cancela automáticamente a los 30 min). Null en órdenes
  // históricas creadas antes de este campo, o que ya salieron de PENDING.
  expiresAt: string | null
  deliveryType: DeliveryType
  address: string | null
  notes: string | null
  subtotal: number
  couponDiscount: number | null
  couponCode: string | null
  total: number
  items: OrderItemResponseDto[]
}

export interface UpdateOrderStatusDto {
  status: OrderStatus
}
