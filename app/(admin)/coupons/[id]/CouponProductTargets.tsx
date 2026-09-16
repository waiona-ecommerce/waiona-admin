'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  addCouponProductTarget,
  removeCouponProductTarget,
} from '@/actions/coupon-target.actions'
import type { CouponProductTargetResponseDto, ProductResponseDto } from '@/core/types'

interface CouponProductTargetsProps {
  couponId: number
  targets: CouponProductTargetResponseDto[]
  products: ProductResponseDto[]
}

export function CouponProductTargets({ couponId, targets, products }: CouponProductTargetsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const assignableProducts = products.filter(
    (product) => !targets.some((target) => target.productId === product.id),
  )
  const [productId, setProductId] = useState('')

  function productName(id: number) {
    return products.find((product) => product.id === id)?.name ?? `#${id}`
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) return

    startTransition(async () => {
      const result = await addCouponProductTarget(couponId, Number(productId))
      if (!result.success) {
        toast.error(result.message)
        return
      }
      router.refresh()
    })
  }

  function handleRemove(prodId: number) {
    if (!confirm('¿Quitar este producto del cupón?')) return
    startTransition(async () => {
      const result = await removeCouponProductTarget(couponId, prodId)
      if (!result.success) {
        toast.error(result.message)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded border p-3">
      <span className="text-sm font-medium">Productos</span>

      {targets.length > 0 && (
        <ul className="flex flex-col gap-2">
          {targets.map((target) => (
            <li key={target.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{productName(target.productId)}</span>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRemove(target.productId)}
                className="text-sm text-red-600 disabled:opacity-50"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {assignableProducts.length > 0 && (
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <select
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="flex-1 rounded border px-2 py-1 text-sm"
          >
            <option value="" disabled>
              -- Seleccionar --
            </option>
            {assignableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
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
