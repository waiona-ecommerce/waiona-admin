'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  createProductPricing,
  deleteProductPricing,
  updateProductPricing,
} from '@/actions/product-pricing.actions'
import { calculateProductPrice } from '@/actions/pricing-calculation.actions'
import { CurrencyCode } from '@/core/enums'
import type { PriceBreakdownDto, ProductPricingResponseDto } from '@/core/types'

interface ProductPricingProps {
  productId: number
  pricing: ProductPricingResponseDto | null
}

export function ProductPricing({ productId, pricing }: ProductPricingProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCalculating, startCalculation] = useTransition()
  const [breakdown, setBreakdown] = useState<PriceBreakdownDto | null>(null)
  const [currency, setCurrency] = useState<CurrencyCode>(pricing?.currency ?? CurrencyCode.ARS)
  const [unitPrice, setUnitPrice] = useState(pricing?.unitPrice != null ? String(pricing.unitPrice) : '')
  const [salePrice, setSalePrice] = useState(pricing?.salePrice != null ? String(pricing.salePrice) : '')

  function handlePreview() {
    startCalculation(async () => {
      const result = await calculateProductPrice(productId)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      setBreakdown(result.data)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { currency, unitPrice: Number(unitPrice), salePrice: Number(salePrice) }

    startTransition(async () => {
      const result = pricing
        ? await updateProductPricing(pricing.id, payload)
        : await createProductPricing({ productId, ...payload })

      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success('Precio guardado')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!pricing || !confirm('¿Borrar el precio de este producto?')) return
    startTransition(async () => {
      const result = await deleteProductPricing(pricing.id)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success('Precio borrado')
      router.refresh()
    })
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded border p-3">
      <span className="text-sm font-medium">Precio</span>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
          className="rounded border px-3 py-2"
        >
          {Object.values(CurrencyCode).map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          placeholder="Costo (unitPrice)"
          className="rounded border px-3 py-2"
        />
        <input
          required
          type="number"
          min={0.01}
          step="0.01"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          placeholder="Precio de venta (salePrice)"
          className="rounded border px-3 py-2"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
          {pricing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded border px-3 py-2 text-sm text-red-600 disabled:opacity-50"
            >
              Borrar
            </button>
          )}
        </div>
      </form>

      {pricing && (
        <div className="border-t pt-3">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isCalculating}
            className="text-sm underline disabled:opacity-50"
          >
            {isCalculating ? 'Calculando...' : 'Ver precio final (con descuentos e impuestos)'}
          </button>
          {breakdown && (
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
              <dt className="text-neutral-500">Precio de venta</dt>
              <dd>{breakdown.salePrice}</dd>
              <dt className="text-neutral-500">Descuento</dt>
              <dd>-{breakdown.discount}</dd>
              <dt className="text-neutral-500">Impuestos</dt>
              <dd>+{breakdown.taxes}</dd>
              <dt className="font-medium">Precio final</dt>
              <dd className="font-medium">{breakdown.finalPrice}</dd>
            </dl>
          )}
        </div>
      )}
    </div>
  )
}
