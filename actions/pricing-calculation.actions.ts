'use server'

import { apiRequest, ApiError } from '@/core/lib/api'
import type { PriceBreakdownDto } from '@/core/types'

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Error de conexión con el servidor'
}

export async function calculateProductPrice(productId: number) {
  try {
    const data = await apiRequest<PriceBreakdownDto>('/pricing/calculate/product', {
      method: 'POST',
      body: { productId },
    })
    return { success: true as const, data }
  } catch (error) {
    return { success: false as const, message: errorMessage(error) }
  }
}

export async function calculateComboPrice(comboId: number) {
  try {
    const data = await apiRequest<PriceBreakdownDto>('/pricing/calculate/combo', {
      method: 'POST',
      body: { comboId },
    })
    return { success: true as const, data }
  } catch (error) {
    return { success: false as const, message: errorMessage(error) }
  }
}
