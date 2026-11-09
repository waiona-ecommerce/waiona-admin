import type { LedgerDirection, PendingRefundReason } from '@/core/enums'

export interface LedgerEntryResponseDto {
  id: string
  transactionId: string
  sourceKey: string
  account: string
  taxCode: string | null
  direction: LedgerDirection
  amount: number
  currency: string
  createdAt: string
}

export interface PendingRefundDto {
  orderId: number
  paymentAttemptId: string
  reason: PendingRefundReason
  amount: number
}
