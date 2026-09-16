'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  addDiscountComboTarget,
  removeDiscountComboTarget,
} from '@/actions/discount-target.actions'
import type { ComboResponseDto, DiscountComboTargetResponseDto } from '@/core/types'

interface DiscountComboTargetsProps {
  discountId: number
  targets: DiscountComboTargetResponseDto[]
  combos: ComboResponseDto[]
}

export function DiscountComboTargets({ discountId, targets, combos }: DiscountComboTargetsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const assignableCombos = combos.filter(
    (combo) => !targets.some((target) => target.comboId === combo.id),
  )
  const [comboId, setComboId] = useState('')

  function comboName(id: number) {
    return combos.find((combo) => combo.id === id)?.name ?? `#${id}`
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!comboId) return

    startTransition(async () => {
      const result = await addDiscountComboTarget(discountId, Number(comboId))
      if (!result.success) {
        toast.error(result.message)
        return
      }
      router.refresh()
    })
  }

  function handleRemove(cId: number) {
    if (!confirm('¿Quitar este combo del descuento?')) return
    startTransition(async () => {
      const result = await removeDiscountComboTarget(discountId, cId)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded border p-3">
      <span className="text-sm font-medium">Combos</span>

      {targets.length > 0 && (
        <ul className="flex flex-col gap-2">
          {targets.map((target) => (
            <li key={target.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{comboName(target.comboId)}</span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRemove(target.comboId)}
                className="text-sm text-red-600 disabled:opacity-50"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {assignableCombos.length > 0 && (
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <select
            required
            value={comboId}
            onChange={(e) => setComboId(e.target.value)}
            className="flex-1 rounded border px-2 py-1 text-sm"
          >
            <option value="" disabled>
              -- Seleccionar --
            </option>
            {assignableCombos.map((combo) => (
              <option key={combo.id} value={combo.id}>
                {combo.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="rounded border px-2 py-1 text-sm disabled:opacity-50"
          >
            Agregar
          </button>
        </form>
      )}
    </div>
  )
}
