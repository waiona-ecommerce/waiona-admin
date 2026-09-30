'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateOrderStatus } from '@/actions/order.actions'
import { OrderStatus } from '@/core/enums'

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
  [OrderStatus.DISPATCHED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.CONFIRMED]: 'Confirmar',
  [OrderStatus.DISPATCHED]: 'Marcar lista para retirar',
  [OrderStatus.DELIVERED]: 'Marcar retirada',
  [OrderStatus.CANCELLED]: 'Cancelar',
}

export function OrderStatusActions({ id, status }: { id: number; status: OrderStatus }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const nextStatuses = NEXT_STATUSES[status]

  function handleChange(next: OrderStatus) {
    if (next === OrderStatus.CANCELLED && !confirm('¿Cancelar esta orden?')) return

    startTransition(async () => {
      const result = await updateOrderStatus(id, next)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success('Estado actualizado')
      router.refresh()
    })
  }

  if (nextStatuses.length === 0) return null

  return (
    <div className="flex gap-2">
      {nextStatuses.map((next) => (
        <button
          key={next}
          type="button"
          disabled={isPending}
          onClick={() => handleChange(next)}
          className={`rounded px-3 py-2 text-sm disabled:opacity-50 ${
            next === OrderStatus.CANCELLED ? 'border text-red-600' : 'bg-black text-white'
          }`}
        >
          {STATUS_LABELS[next]}
        </button>
      ))}
    </div>
  )
}
