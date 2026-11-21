'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { getUnreadNotificationsCount } from '@/actions/admin-notification.actions'

const POLL_INTERVAL_MS = 60_000
export const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed'

function badgeText(count: number) {
  return count > 99 ? '99+' : String(count)
}

// Devuelve el contador, o null si la pestaña está oculta o la consulta falló.
async function fetchUnreadCount(): Promise<number | null> {
  if (document.visibilityState !== 'visible') return null
  const result = await getUnreadNotificationsCount()
  return result.success ? result.count : null
}

// Spec 05: contador de notificaciones sin leer. Consulta al cargar, cada 60 s
// con la pestaña visible, al cambiar de página y cuando se marca alguna como
// leída. Si la consulta falla, deja el último número (RF-2).
export function NotificationBell() {
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true
    const update = () => {
      void fetchUnreadCount().then((next) => {
        if (active && next !== null) setCount(next)
      })
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') update()
    }

    update()
    const interval = setInterval(update, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, update)
    return () => {
      active = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, update)
    }
  }, [pathname])

  return (
    <Link
      href="/notifications"
      aria-label="Notificaciones"
      className="relative rounded p-1 text-neutral-500 hover:text-neutral-900"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -right-2 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-medium leading-5 text-white">
          {badgeText(count)}
        </span>
      )}
    </Link>
  )
}
