'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { markNotificationRead } from '@/actions/admin-notification.actions'
import { NOTIFICATIONS_CHANGED_EVENT } from '../NotificationBell'

export function MarkReadButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await markNotificationRead(id)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
    })
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="rounded border px-3 py-1 text-sm disabled:opacity-50"
    >
      Marcar como leída
    </button>
  )
}
