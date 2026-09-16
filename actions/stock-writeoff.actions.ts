'use server'

import { revalidatePath } from 'next/cache'
import { apiRequest, ApiError } from '@/core/lib/api'
import type { UpdateStockWriteOffDto } from '@/core/types'

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Error de conexión con el servidor'
}

export async function updateStockWriteOff(id: number, data: UpdateStockWriteOffDto) {
  try {
    await apiRequest(`/stock-write-offs/${id}`, { method: 'PATCH', body: data })
    revalidatePath('/stock')
    return { success: true as const }
  } catch (error) {
    return { success: false as const, message: errorMessage(error) }
  }
}
