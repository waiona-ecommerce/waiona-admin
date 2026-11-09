'use server'

import { revalidatePath } from 'next/cache'
import { apiRequest, ApiError } from '@/core/lib/api'
import type { CreateOrderReturnDto } from '@/core/types'

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Error de conexión con el servidor'
}

export async function createOrderReturn(
  orderId: number,
  data: CreateOrderReturnDto,
  idempotencyKey: string,
) {
  try {
    await apiRequest(`/orders/${orderId}/returns`, {
      method: 'POST',
      body: data,
      headers: { 'Idempotency-Key': idempotencyKey },
    })
    revalidatePath(`/orders/${orderId}`)
    return { success: true as const }
  } catch (error) {
    return { success: false as const, message: errorMessage(error) }
  }
}
