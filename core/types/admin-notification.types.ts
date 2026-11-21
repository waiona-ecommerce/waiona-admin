import type { NotificationLevel, NotificationType } from '@/core/enums'

// Spec 05: espejo de AdminNotificationResponseDto (spec 34 de waiona-core).
export interface AdminNotification {
  id: number
  type: NotificationType
  level: NotificationLevel
  stockItemId: number
  productId: number | null
  productName: string | null
  locationId: number | null
  locationName: string | null
  quantityAvailable: number
  stockMin: number
  stockCritical: number
  createdAt: string
  readAt: string | null
  resolvedAt: string | null
}

export interface UnreadCount {
  count: number
}
