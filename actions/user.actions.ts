'use server'

import { revalidatePath } from 'next/cache'
import { apiRequest, ApiError } from '@/core/lib/api'
import type { UpdateUserStatusDto } from '@/core/types'

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Error de conexión con el servidor'
}

export async function updateUserStatus(id: number, data: UpdateUserStatusDto) {
  try {
    await apiRequest(`/users/${id}/status`, { method: 'PATCH', body: data })
    revalidatePath('/users')
    return { success: true as const }
  } catch (error) {
    return { success: false as const, message: errorMessage(error) }
  }
}
