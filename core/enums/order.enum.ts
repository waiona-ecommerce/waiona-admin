export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DISPATCHED = 'dispatched',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliveryType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

export enum OrderReturnType {
  RETURNED_OK = 'RETURNED_OK',
  RETURNED_DAMAGED = 'RETURNED_DAMAGED',
  EXCHANGED_DAMAGED = 'EXCHANGED_DAMAGED',
  EXCHANGED_OK = 'EXCHANGED_OK',
}
