'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateUserStatus } from '@/actions/user.actions'

export function UserStatusActions({ id, isBanned }: { id: number; isBanned: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const next = !isBanned
    if (next && !confirm('¿Suspender esta cuenta? Se revocarán sus sesiones activas.')) return

    startTransition(async () => {
      const result = await updateUserStatus(id, { isBanned: next })
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success(next ? 'Cuenta suspendida' : 'Cuenta reactivada')
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleClick}
      className={`rounded px-3 py-1 text-sm disabled:opacity-50 ${
        isBanned ? 'bg-black text-white' : 'border text-red-600'
      }`}
    >
      {isBanned ? 'Reactivar' : 'Suspender'}
    </button>
  )
}
