import Link from 'next/link'
import { getOrders } from '@/services/order.service'
import { OrderStatus } from '@/core/enums'

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.CONFIRMED]: 'Confirmada',
  [OrderStatus.DISPATCHED]: 'Lista para retirar',
  [OrderStatus.DELIVERED]: 'Retirada',
  [OrderStatus.CANCELLED]: 'Cancelada',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'text-amber-600',
  [OrderStatus.CONFIRMED]: 'text-blue-600',
  [OrderStatus.DISPATCHED]: 'text-indigo-600',
  [OrderStatus.DELIVERED]: 'text-green-600',
  [OrderStatus.CANCELLED]: 'text-red-600',
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const {
    data,
    page: currentPage,
    totalPages,
  } = await getOrders({ page: page ? Number(page) : 1 })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Órdenes</h1>

      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b">
            <th className="py-2">ID</th>
            <th className="py-2">Usuario</th>
            <th className="py-2">Estado</th>
            <th className="py-2">Entrega</th>
            <th className="py-2">Total</th>
            <th className="py-2">Fecha</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {data.map((order) => (
            <tr key={order.id} className="border-b">
              <td className="py-2">#{order.id}</td>
              <td className="py-2">#{order.userId}</td>
              <td className={`py-2 font-medium ${STATUS_COLORS[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </td>
              <td className="py-2">{order.deliveryType === 'delivery' ? 'Envío' : 'Retiro'}</td>
              <td className="py-2">${order.total}</td>
              <td className="py-2">{new Date(order.createdAt).toLocaleString('es-AR')}</td>
              <td className="py-2 text-right">
                <Link href={`/orders/${order.id}`} className="text-sm underline">
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-4 text-sm">
        {currentPage > 1 && <Link href={`/orders?page=${currentPage - 1}`}>Anterior</Link>}
        {currentPage < totalPages && <Link href={`/orders?page=${currentPage + 1}`}>Siguiente</Link>}
      </div>
    </div>
  )
}
