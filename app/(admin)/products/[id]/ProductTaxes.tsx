'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { assignProductTax, removeProductTax } from '@/actions/product-tax.actions'
import type { ProductTaxResponseDto, TaxResponseDto } from '@/core/types'

interface ProductTaxesProps {
  productId: number
  productTaxes: ProductTaxResponseDto[]
  taxes: TaxResponseDto[]
}

export function ProductTaxes({ productId, productTaxes, taxes }: ProductTaxesProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const assignableTaxes = taxes.filter(
    (tax) => !tax.isGlobal && !productTaxes.some((pt) => pt.taxId === tax.id),
  )
  const [taxId, setTaxId] = useState('')

  function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!taxId) return

    startTransition(async () => {
      const result = await assignProductTax(productId, { taxId: Number(taxId) })
      if (!result.success) {
        toast.error(result.message)
        return
      }
      router.refresh()
    })
  }

  function handleRemove(id: number) {
    if (!confirm('¿Quitar este impuesto del producto?')) return
    startTransition(async () => {
      const result = await removeProductTax(productId, id)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded border p-3">
      <span className="text-sm font-medium">Impuestos</span>

      {productTaxes.length > 0 && (
        <ul className="flex flex-col gap-2">
          {productTaxes.map((pt) => (
            <li key={pt.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {pt.tax.code} — {pt.tax.value}%
              </span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRemove(pt.id)}
                className="text-sm text-red-600 disabled:opacity-50"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {assignableTaxes.length > 0 && (
        <form onSubmit={handleAssign} className="flex items-center gap-2">
          <select
            required
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className="flex-1 rounded border px-2 py-1 text-sm"
          >
            <option value="" disabled>
              -- Seleccionar --
            </option>
            {assignableTaxes.map((tax) => (
              <option key={tax.id} value={tax.id}>
                {tax.code} — {tax.value}%
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="rounded border px-2 py-1 text-sm disabled:opacity-50"
          >
            Asignar
          </button>
        </form>
      )}
    </div>
  )
}
