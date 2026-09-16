import Link from 'next/link'
import { getCriticalStock, getOrdersAnalytics, getTopProducts } from '@/services/analytics.service'
import { OrderStatus } from '@/core/enums'

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendientes',
  [OrderStatus.CONFIRMED]: 'Confirmadas',
  [OrderStatus.DISPATCHED]: 'Despachadas',
  [OrderStatus.DELIVERED]: 'Entregadas',
  [OrderStatus.CANCELLED]: 'Canceladas',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'text-amber-600',
  [OrderStatus.CONFIRMED]: 'text-blue-600',
  [OrderStatus.DISPATCHED]: 'text-indigo-600',
  [OrderStatus.DELIVERED]: 'text-green-600',
  [OrderStatus.CANCELLED]: 'text-red-600',
}

function money(value: number) {
  return `$${value.toLocaleString('es-AR')}`
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border p-3">
      <div className="text-sm text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  )
}

export default async function DashboardPage() {
  const [orders, topProducts, criticalStock] = await Promise.all([
    getOrdersAnalytics(),
    getTopProducts(),
    getCriticalStock(),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Órdenes totales" value={orders.total} />
        <StatTile label="Pipeline total" value={money(orders.totalRevenue)} />
        <StatTile label="Pipeline hoy" value={money(orders.revenueToday)} />
        <StatTile label="Pipeline este mes" value={money(orders.revenueThisMonth)} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Órdenes por estado</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.values(OrderStatus).map((status) => (
            <div key={status} className="rounded border p-3">
              <div className="text-sm text-neutral-500">{STATUS_LABELS[status]}</div>
              <div className={`mt-1 text-2xl font-semibold ${STATUS_COLORS[status]}`}>
                {orders.byStatus[status]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Productos más vendidos</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay ventas entregadas.</p>
        ) : (
          <table className="w-full max-w-lg border-collapse text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Producto</th>
                <th className="py-2">SKU</th>
                <th className="py-2">Vendidos</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product) => (
                <tr key={product.productId} className="border-b">
                  <td className="py-2">{product.name}</td>
                  <td className="py-2">{product.sku}</td>
                  <td className="py-2">{product.totalSold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-lg font-medium">Stock crítico</h2>
        {criticalStock.length === 0 ? (
          <p className="text-sm text-neutral-500">Ningún item por debajo del umbral crítico.</p>
        ) : (
          <table className="w-full max-w-2xl border-collapse text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2">Producto</th>
                <th className="py-2">Depósito</th>
                <th className="py-2">Disponible</th>
                <th className="py-2">Crítico / Mín.</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {criticalStock.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2">{item.locationName}</td>
                  <td className="py-2 font-semibold text-red-600">{item.quantityAvailable}</td>
                  <td className="py-2">
                    {item.stockCritical} / {item.stockMin}
                  </td>
                  <td className="py-2 text-right">
                    <Link href={`/stock/${item.id}`} className="text-sm underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
