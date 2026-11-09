// Estados de un intento de cobro (flujo nuevo de pagos del backend).
export enum PaymentAttemptStatus {
  NOT_STARTED = 'NOT_STARTED',
  EXECUTING = 'EXECUTING',
  PENDING = 'PENDING',
  UNKNOWN = 'UNKNOWN',
  APPROVED = 'APPROVED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
  CHARGEBACK = 'CHARGEBACK',
}

export enum LedgerDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum PendingRefundReason {
  EXTRA_PAYMENT = 'EXTRA_PAYMENT',
  CANCELLED_ORDER = 'CANCELLED_ORDER',
}
