import { apiRequest } from '@/core/lib/api'
import type { LedgerEntryResponseDto, PendingRefundDto } from '@/core/types'

export function getLedgerByOrder(orderId: number) {
  return apiRequest<LedgerEntryResponseDto[]>(`/ledger/orders/${orderId}`)
}

export function getPendingRefunds() {
  return apiRequest<PendingRefundDto[]>('/ledger/pending-refunds')
}
