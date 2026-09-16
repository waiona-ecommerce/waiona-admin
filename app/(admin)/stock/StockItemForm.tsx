'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { createStockItem } from '@/actions/stock-item.actions'
import type { ProductResponseDto, StockLocationResponseDto } from '@/core/types'

interface StockItemFormProps {
  products: ProductResponseDto[]
  locations: StockLocationResponseDto[]
}

export function StockItemForm({ products, locations }: StockItemFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [productId, setProductId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [stockMin, setStockMin] = useState('1')
  const [stockCritical, setStockCritical] = useState('0')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      productId: Number(productId),
      locationId: Number(locationId),
      stockMin: Number(stockMin),
      stockCritical: Number(stockCritical),
    }

    startTransition(async () => {
      const result = await createStockItem(payload)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success('Item de stock creado')
      router.push('/stock')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Producto
        <select
          required
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="" disabled>
            -- Seleccionar --
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Depósito
        <select
          required
          disabled={locations.length === 0}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="rounded border px-3 py-2 disabled:opacity-50"
        >
          <option value="" disabled>
            -- Seleccionar --
          </option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      {locations.length === 0 && (
        <p className="text-sm text-amber-600">
          No hay depósitos creados todavía.{' '}
          <Link href="/stock/locations/new" className="underline">
            Creá uno primero
          </Link>
          .
        </p>
      )}
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
        disabled={isPending || locations.length === 0}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  )
}
