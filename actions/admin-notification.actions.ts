'use server'

import { revalidatePath } from 'next/cache'
import { apiRequest, ApiError } from '@/core/lib/api'
import type { UnreadCount } from '@/core/types'

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Error de conexión con el servidor'
}

// Spec 05: lectura como Server Action (excepción a "actions = escrituras"). La
// campanita es un Client Component y el token de Auth0 no sale del servidor.
export async function getUnreadNotificationsCount() {
  try {
    const { count } = await apiRequest<UnreadCount>('/admin-notifications/unread-count')
    return { success: true as const, count }
  } catch {
    return { success: false as const }
  }
}

export async function markNotificationRead(id: number) {
  try {
    await apiRequest(`/admin-notifications/${id}/read`, { method: 'PATCH' })
    revalidatePath('/notifications')
    return { success: true as const }
  } catch (error) {
    return { success: false as const, message: errorMessage(error) }
  }
}

export async function markAllNotificationsRead() {
  try {
    const { count } = await apiRequest<UnreadCount>('/admin-notifications/read-all', {
      method: 'PATCH',
    })
    revalidatePath('/notifications')
    return { success: true as const, count }
  } catch (error) {
    return { success: false as const, message: errorMessage(error) }
  }
}
