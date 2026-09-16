import { apiRequest } from '@/core/lib/api'
import type { StockWriteOffResponseDto } from '@/core/types'

export function getStockWriteOffsByStockItem(stockItemId: number) {
  return apiRequest<StockWriteOffResponseDto[]>(`/stock-write-offs/stock-item/${stockItemId}`)
}
