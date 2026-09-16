'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createCombo, updateCombo } from '@/actions/combo.actions'
import type { CategoryResponseDto, ComboResponseDto, ProductResponseDto } from '@/core/types'

interface ComboFormProps {
  categories: CategoryResponseDto[]
  products: ProductResponseDto[]
  combo?: ComboResponseDto
}

interface ItemRow {
  productId: number
  productName: string
  quantity: number
}

export function ComboForm({ categories, products, combo }: ComboFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(combo?.name ?? '')
  const [description, setDescription] = useState(combo?.description ?? '')
  const [categoryId, setCategoryId] = useState(String(combo?.categoryId ?? categories[0]?.id ?? ''))
  const [isActive, setIsActive] = useState(combo?.isActive ?? true)
  const [items, setItems] = useState<ItemRow[]>(
    combo?.items.map((item) => ({ ...item })) ?? [],
  )
  const [newProductId, setNewProductId] = useState('')
  const [newQuantity, setNewQuantity] = useState('1')

  function handleAddItem() {
    if (!newProductId) {
      toast.error('Elegí un producto')
      return
    }
    const product = products.find((p) => p.id === Number(newProductId))
    if (!product) return
    if (items.some((item) => item.productId === product.id)) {
      toast.error('Ese producto ya está en el combo')
      return
    }
    setItems([
      ...items,
      { productId: product.id, productName: product.name, quantity: Number(newQuantity) },
    ])
    setNewQuantity('1')
  }

  function handleRemoveItem(productId: number) {
    setItems(items.filter((item) => item.productId !== productId))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Agregá al menos un producto al combo')
      return
    }

    const payload = {
      name,
      description,
      isActive,
      categoryId: Number(categoryId),
      items: items.map(({ productId, quantity }) => ({ productId, quantity })),
    }

    startTransition(async () => {
      const result = combo
        ? await updateCombo(combo.id, payload)
        : await createCombo(payload)

      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success(combo ? 'Combo actualizado' : 'Combo creado')
      router.push('/combos')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
        className="rounded border px-3 py-2"
      />
      <textarea
        required
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción"
        className="rounded border px-3 py-2"
      />
      <select
        required
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="rounded border px-3 py-2"
      >
        <option value="" disabled>
          Categoría
        </option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Activo
      </label>

      <div className="flex flex-col gap-2 rounded border p-3">
        <span className="text-sm font-medium">Ítems del combo</span>

        {items.length > 0 && (
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between text-sm">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.productId)}
                  className="text-red-600"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <select
            value={newProductId}
            onChange={(e) => setNewProductId(e.target.value)}
            className="flex-1 rounded border px-2 py-1 text-sm"
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
          <input
            type="number"
            min={1}
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            className="w-16 rounded border px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="rounded border px-2 py-1 text-sm"
          >
            Agregar
          </button>
        </div>
      </div>

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
