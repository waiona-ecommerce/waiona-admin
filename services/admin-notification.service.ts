import { apiRequest } from '@/core/lib/api'
import { PAGINATION_DEFAULTS } from '@/core/config/constants'
import type { AdminNotification, PaginatedResponse, UnreadCount } from '@/core/types'

export function getAdminNotifications({ page, unread }: { page: number; unread: boolean }) {
  return apiRequest<PaginatedResponse<AdminNotification>>('/admin-notifications', {
    query: { page, limit: PAGINATION_DEFAULTS.limit, unread },
  })
}

export function getUnreadNotificationsCount() {
  return apiRequest<UnreadCount>('/admin-notifications/unread-count')
}
