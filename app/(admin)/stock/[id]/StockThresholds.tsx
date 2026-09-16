'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateStockThresholds } from '@/actions/stock-item.actions'
import type { StockItemResponseDto } from '@/core/types'

export function StockThresholds({ item }: { item: StockItemResponseDto }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [stockMin, setStockMin] = useState(String(item.stockMin))
  const [stockCritical, setStockCritical] = useState(String(item.stockCritical))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateStockThresholds(item.id, {
        stockMin: Number(stockMin),
        stockCritical: Number(stockCritical),
      })
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success('Umbrales actualizados')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-3 rounded border p-3">
      <span className="text-sm font-medium">Umbrales</span>
      <label className="flex flex-col gap-1 text-sm">
        Stock mínimo
        <input
          required
          type="number"
          min={1}
          value={stockMin}
          onChange={(e) => setStockMin(e.target.value)}
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Stock crítico
        <input
          required
          type="number"
          min={0}
          value={stockCritical}
          onChange={(e) => setStockCritical(e.target.value)}
          className="rounded border px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
