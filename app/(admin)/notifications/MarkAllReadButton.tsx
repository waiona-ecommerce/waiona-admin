'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { markAllNotificationsRead } from '@/actions/admin-notification.actions'
import { NOTIFICATIONS_CHANGED_EVENT } from '../NotificationBell'

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await markAllNotificationsRead()
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success(`Se marcaron ${result.count} como leídas`)
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
    })
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
    >
      Marcar todas como leídas
    </button>
  )
}
