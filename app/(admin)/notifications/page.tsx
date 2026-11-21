import Link from 'next/link'
import {
  getAdminNotifications,
  getUnreadNotificationsCount,
} from '@/services/admin-notification.service'
import { NotificationLevel } from '@/core/enums'
import { MarkReadButton } from './MarkReadButton'
import { MarkAllReadButton } from './MarkAllReadButton'

const LEVEL_LABELS: Record<NotificationLevel, string> = {
  [NotificationLevel.MINIMUM]: 'Mínimo',
  [NotificationLevel.CRITICAL]: 'Crítico',
  [NotificationLevel.OUT_OF_STOCK]: 'Sin stock',
}

const LEVEL_COLORS: Record<NotificationLevel, string> = {
  [NotificationLevel.MINIMUM]: 'text-amber-600',
  [NotificationLevel.CRITICAL]: 'text-orange-600',
  [NotificationLevel.OUT_OF_STOCK]: 'text-red-600',
}

const formatDate = (value: string) => new Date(value).toLocaleString('es-AR')

// Spec 05: `unread` es true salvo que venga 'false'; la página, un entero ≥ 1.
function parseFilters(params: { page?: string; unread?: string }) {
  const unread = params.unread !== 'false'
  const page = Number(params.page)
  return { unread, page: Number.isInteger(page) && page >= 1 ? page : 1 }
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; unread?: string }>
}) {
  const { unread, page } = parseFilters(await searchParams)

  let result = await getAdminNotifications({ page, unread })
  // Página fuera de rango: se vuelve a la primera.
  if (result.data.length === 0 && page > 1) {
    result = await getAdminNotifications({ page: 1, unread })
  }
  const { data, page: currentPage, totalPages } = result
  const { count: unreadCount } = await getUnreadNotificationsCount()

  const filterLink = (value: boolean) =>
    `rounded px-3 py-1 text-sm ${
      unread === value ? 'bg-black text-white' : 'border text-neutral-600'
    }`
  const pageHref = (n: number) => `/notifications?unread=${unread}&page=${n}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notificaciones</h1>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      <div className="flex gap-2">
        <Link href="/notifications?unread=true" className={filterLink(true)}>
          Sin leer
        </Link>
        <Link href="/notifications?unread=false" className={filterLink(false)}>
          Todas
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {unread ? 'No hay notificaciones sin leer.' : 'No hay notificaciones.'}
        </p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="py-2">Fecha</th>
              <th className="py-2">Producto</th>
              <th className="py-2">Depósito</th>
              <th className="py-2">Nivel</th>
              <th className="py-2">Disponible / mínimo / crítico</th>
              <th className="py-2">Estado</th>
              <th className="py-2">Leída</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {data.map((n) => (
              <tr key={n.id} className={`border-b ${n.readAt ? 'text-neutral-500' : ''}`}>
                <td className="py-2">{formatDate(n.createdAt)}</td>
                <td className="py-2">
                  {n.productName ? (
                    <Link href={`/stock/${n.stockItemId}`} className="underline">
                      {n.productName}
                    </Link>
                  ) : (
                    'Producto borrado'
                  )}
                </td>
                <td className="py-2">{n.locationName ?? 'Depósito borrado'}</td>
                <td className={`py-2 font-medium ${LEVEL_COLORS[n.level]}`}>
                  {LEVEL_LABELS[n.level]}
                </td>
                <td className="py-2">
                  {n.quantityAvailable} / {n.stockMin} / {n.stockCritical}
                </td>
                <td className="py-2">
                  {n.resolvedAt ? `Resuelta el ${formatDate(n.resolvedAt)}` : 'Abierta'}
                </td>
                <td className="py-2">{n.readAt ? 'Sí' : 'No'}</td>
                <td className="py-2 text-right">{!n.readAt && <MarkReadButton id={n.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex gap-4 text-sm">
        {currentPage > 1 && <Link href={pageHref(currentPage - 1)}>Anterior</Link>}
        {currentPage < totalPages && <Link href={pageHref(currentPage + 1)}>Siguiente</Link>}
      </div>
    </div>
  )
}
