'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createOrderReturn } from '@/actions/order-return.actions'
import { OrderReturnType } from '@/core/enums'
import type { OrderItemResponseDto } from '@/core/types'
import { ORDER_RETURN_TYPE_LABELS } from './order-return-labels'

const REFUND_TYPES = [OrderReturnType.RETURNED_OK, OrderReturnType.RETURNED_DAMAGED]

export function OrderReturnForm({
  orderId,
  items,
}: {
  orderId: number
  items: OrderItemResponseDto[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [itemId, setItemId] = useState(items[0]?.id ?? 0)
  const [quantity, setQuantity] = useState('1')
  const [type, setType] = useState(OrderReturnType.RETURNED_OK)
  const [description, setDescription] = useState('')
  // Una clave por envío: se reusa si ese mismo envío se reintenta, y se cambia si cambian los
  // datos o después de un registro exitoso.
  const keyRef = useRef<string | null>(null)

  const selected = items.find((item) => item.id === itemId)

  function changed<T>(setter: (value: T) => void) {
    return (value: T) => {
      keyRef.current = null
      setter(value)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    keyRef.current ??= crypto.randomUUID()
    const key = keyRef.current
    startTransition(async () => {
      const result = await createOrderReturn(
        orderId,
        {
          orderItemId: itemId,
          quantity: Number(quantity),
          type,
          ...(description.trim() && { description: description.trim() }),
        },
        key,
      )
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success('Registrado')
      keyRef.current = null
      setQuantity('1')
      setDescription('')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3 rounded border p-3">
      <span className="text-sm font-medium">Devolución o cambio</span>
      <select
        value={itemId}
        onChange={(e) => changed(setItemId)(Number(e.target.value))}
        className="rounded border px-3 py-2"
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.productName ?? item.comboName} × {item.quantity}
          </option>
        ))}
      </select>
      <input
        required
        type="number"
        min={1}
        max={selected?.quantity}
        step={1}
        value={quantity}
        onChange={(e) => changed(setQuantity)(e.target.value)}
        placeholder="Cantidad"
        className="rounded border px-3 py-2"
      />
      <select
        value={type}
        onChange={(e) => changed(setType)(e.target.value as OrderReturnType)}
        className="rounded border px-3 py-2"
      >
        {Object.values(OrderReturnType).map((option) => (
          <option key={option} value={option}>
            {ORDER_RETURN_TYPE_LABELS[option]}
          </option>
        ))}
      </select>
      {REFUND_TYPES.includes(type) && (
        <p className="text-sm text-amber-600">
          La plata se devuelve aparte, desde el panel de MercadoPago.
        </p>
      )}
      <textarea
        value={description}
        onChange={(e) => changed(setDescription)(e.target.value)}
        placeholder="Descripción (opcional)"
        className="rounded border px-3 py-2"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded border px-3 py-2 text-sm disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Registrar'}
      </button>
    </form>
  )
}
