import Link from 'next/link'
import { getPendingRefunds } from '@/services/ledger.service'
import { PendingRefundReason } from '@/core/enums'

const REASON_LABELS: Record<PendingRefundReason, string> = {
  [PendingRefundReason.EXTRA_PAYMENT]: 'Pago de más',
  [PendingRefundReason.CANCELLED_ORDER]: 'Orden cancelada cobrada',
}

export default async function PendingRefundsPage() {
  const pending = await getPendingRefunds()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Pagos a devolver</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Devolvé la plata desde el panel de MercadoPago. El caso desaparece cuando llega el aviso
          del reembolso.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-neutral-500">No hay pagos pendientes de devolver.</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Orden</th>
              <th className="py-2">Motivo</th>
              <th className="py-2">Monto</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((row) => (
              <tr key={`${row.paymentAttemptId}-${row.reason}`} className="border-b">
                <td className="py-2">
                  <Link href={`/orders/${row.orderId}`} className="underline">
                    #{row.orderId}
                  </Link>
                </td>
                <td className="py-2">{REASON_LABELS[row.reason]}</td>
                <td className="py-2">${row.amount.toLocaleString('es-AR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
