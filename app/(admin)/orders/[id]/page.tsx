import { notFound } from 'next/navigation'
import { getOrder } from '@/services/order.service'
import { getOrderReturns } from '@/services/order-return.service'
import { getPaymentAttemptsByOrder } from '@/services/payment.service'
import { getLedgerByOrder } from '@/services/ledger.service'
import { ApiError } from '@/core/lib/api'
import { LedgerDirection, OrderStatus, PaymentAttemptStatus } from '@/core/enums'
import { OrderStatusActions } from './OrderStatusActions'
import { OrderReturnForm } from './OrderReturnForm'
import { ORDER_RETURN_TYPE_LABELS } from './order-return-labels'

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.CONFIRMED]: 'Confirmada',
  [OrderStatus.DISPATCHED]: 'Lista para retirar',
  [OrderStatus.DELIVERED]: 'Retirada',
  [OrderStatus.CANCELLED]: 'Cancelada',
}

const money = (amount: number) => `$${amount.toLocaleString('es-AR')}`

const PAYMENT_STATUS_LABELS: Record<PaymentAttemptStatus, string> = {
  [PaymentAttemptStatus.NOT_STARTED]: 'Preparando',
  [PaymentAttemptStatus.EXECUTING]: 'Preparando',
  [PaymentAttemptStatus.PENDING]: 'Esperando el pago',
  [PaymentAttemptStatus.UNKNOWN]: 'Sin confirmar',
  [PaymentAttemptStatus.APPROVED]: 'Cobrado',
  [PaymentAttemptStatus.FAILED]: 'Falló',
  [PaymentAttemptStatus.CANCELLED]: 'Cancelado',
  [PaymentAttemptStatus.PARTIALLY_REFUNDED]: 'Devolución parcial',
  [PaymentAttemptStatus.REFUNDED]: 'Devuelto',
  [PaymentAttemptStatus.CHARGEBACK]: 'Contracargo',
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const order = await getOrder(Number(id)).catch((error) => {
    if (error instanceof ApiError && error.statusCode === 404) notFound()
    throw error
  })

  const isDelivered = order.status === OrderStatus.DELIVERED
  const returns = isDelivered ? await getOrderReturns(order.id) : []
  const itemName = (id: number) => {
    const item = order.items.find((candidate) => candidate.id === id)
    return item?.productName ?? item?.comboName ?? `Ítem #${id}`
  }
  const [attempts, ledger] = await Promise.all([
    getPaymentAttemptsByOrder(order.id),
    getLedgerByOrder(order.id),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orden #{order.id}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {STATUS_LABELS[order.status]} · Usuario #{order.userId} ·{' '}
            {new Date(order.createdAt).toLocaleString('es-AR')}
          </p>
          {order.status === OrderStatus.PENDING && order.expiresAt && (
            <p className="mt-1 text-sm text-amber-600">
              Expira (se cancela y se libera el stock) el{' '}
              {new Date(order.expiresAt).toLocaleString('es-AR')}
            </p>
          )}
        </div>
        <OrderStatusActions id={order.id} status={order.status} />
      </div>

      <div className="max-w-sm rounded border p-3 text-sm">
        <p>
          <span className="font-medium">Entrega:</span>{' '}
          {order.deliveryType === 'delivery' ? 'Envío' : 'Retiro'}
        </p>
        {order.address && (
          <p>
            <span className="font-medium">Dirección:</span> {order.address}
          </p>
        )}
        {order.notes && (
          <p>
            <span className="font-medium">Notas:</span> {order.notes}
          </p>
        )}
      </div>

      <div className="max-w-sm rounded border p-3 text-sm">
        <span className="font-medium">Pagos</span>
        {attempts.length === 0 ? (
          <p className="mt-1 text-neutral-500">Sin pagos registrados.</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {attempts.map((attempt) => (
              <li key={attempt.id} className="flex justify-between gap-4">
                <span>
                  {money(attempt.amount)} · {new Date(attempt.createdAt).toLocaleString('es-AR')}
                </span>
                <span>{PAYMENT_STATUS_LABELS[attempt.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="max-w-2xl rounded border p-3 text-sm">
        <span className="font-medium">Movimientos</span>
        {ledger.length === 0 ? (
          <p className="mt-1 text-neutral-500">Sin movimientos.</p>
        ) : (
          <table className="mt-1 w-full border-collapse text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1">Fecha</th>
                <th className="py-1">Cuenta</th>
                <th className="py-1">Debe</th>
                <th className="py-1">Haber</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((entry) => (
                <tr key={entry.id} className="border-b">
                  <td className="py-1">{new Date(entry.createdAt).toLocaleString('es-AR')}</td>
                  <td className="py-1">
                    {entry.account}
                    {entry.taxCode ? ` (${entry.taxCode})` : ''}
                  </td>
                  <td className="py-1">
                    {entry.direction === LedgerDirection.DEBIT ? money(entry.amount) : ''}
                  </td>
                  <td className="py-1">
                    {entry.direction === LedgerDirection.CREDIT ? money(entry.amount) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <table className="w-full max-w-2xl border-collapse text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Ítem</th>
            <th className="py-2">Cantidad</th>
            <th className="py-2">Precio unitario</th>
            <th className="py-2">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="py-2">{item.productName ?? item.comboName}</td>
              <td className="py-2">{item.quantity}</td>
              <td className="py-2">${item.salePrice}</td>
              <td className="py-2">${item.finalPrice}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-b">
            <td colSpan={3} className="py-2 text-right">
              Subtotal
            </td>
            <td className="py-2">${order.subtotal}</td>
          </tr>
          {order.couponCode && (
            <tr className="border-b">
              <td colSpan={3} className="py-2 text-right">
                Cupón ({order.couponCode})
              </td>
              <td className="py-2">-${order.couponDiscount}</td>
            </tr>
          )}
          <tr>
            <td colSpan={3} className="py-2 text-right font-semibold">
              Total
            </td>
            <td className="py-2 font-semibold">${order.total}</td>
          </tr>
        </tfoot>
      </table>

      {isDelivered && (
        <div className="flex flex-col gap-4">
          <OrderReturnForm orderId={order.id} items={order.items} />
          <div className="max-w-2xl rounded border p-3 text-sm">
            <span className="font-medium">Devoluciones y cambios</span>
            {returns.length === 0 ? (
              <p className="mt-1 text-neutral-500">Sin devoluciones ni cambios.</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {returns.map((row) => (
                  <li key={row.id}>
                    {new Date(row.createdAt).toLocaleString('es-AR')} · {itemName(row.orderItemId)}{' '}
                    × {row.quantity} · {ORDER_RETURN_TYPE_LABELS[row.type]}
                    {row.description ? ` · ${row.description}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
