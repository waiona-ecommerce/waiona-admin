'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updateStockWriteOff } from '@/actions/stock-writeoff.actions'
import { StockWriteOffReason } from '@/core/enums'
import type { StockWriteOffResponseDto } from '@/core/types'

const REASON_LABELS: Record<StockWriteOffReason, string> = {
  [StockWriteOffReason.DAMAGED]: 'Dañado',
  [StockWriteOffReason.EXPIRED]: 'Vencido',
  [StockWriteOffReason.DEFECTIVE]: 'Defectuoso',
  [StockWriteOffReason.CONTAMINATED]: 'Contaminado',
  [StockWriteOffReason.LOST]: 'Perdido',
  [StockWriteOffReason.INVENTORY_ERROR]: 'Error de inventario',
  [StockWriteOffReason.OTHER]: 'Otro',
}

function WriteOffRow({ writeOff }: { writeOff: StockWriteOffResponseDto }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [reason, setReason] = useState(writeOff.reason)
  const [description, setDescription] = useState(writeOff.description ?? '')

  function handleSave() {
    startTransition(async () => {
      const result = await updateStockWriteOff(writeOff.id, {
        reason,
        ...(description && { description }),
      })
      if (!result.success) {
        toast.error(result.message)
        return
      }
      toast.success('Baja actualizada')
      setIsEditing(false)
    })
  }

  if (isEditing) {
    return (
      <tr className="border-b">
        <td className="py-1">{new Date(writeOff.createdAt).toLocaleString('es-AR')}</td>
        <td className="py-1">{writeOff.quantity}</td>
        <td className="py-1">
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as StockWriteOffReason)}
            className="rounded border px-1 py-0.5"
          >
            {Object.values(StockWriteOffReason).map((value) => (
              <option key={value} value={value}>
                {REASON_LABELS[value]}
              </option>
            ))}
          </select>
        </td>
        <td className="py-1">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border px-1 py-0.5"
          />
        </td>
        <td className="py-1 text-right">
          <button onClick={handleSave} disabled={isPending} className="text-sm underline disabled:opacity-50">
            Guardar
          </button>{' '}
          <button onClick={() => setIsEditing(false)} className="text-sm text-neutral-500">
            Cancelar
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b">
      <td className="py-1">{new Date(writeOff.createdAt).toLocaleString('es-AR')}</td>
      <td className="py-1">{writeOff.quantity}</td>
      <td className="py-1">{REASON_LABELS[writeOff.reason]}</td>
      <td className="py-1">{writeOff.description ?? '—'}</td>
      <td className="py-1 text-right">
        <button onClick={() => setIsEditing(true)} className="text-sm underline">
          Editar
        </button>
      </td>
    </tr>
  )
}

export function StockWriteOffs({ writeOffs }: { writeOffs: StockWriteOffResponseDto[] }) {
  return (
    <div className="rounded border p-3">
      <span className="text-sm font-medium">Bajas de stock</span>
      {writeOffs.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-500">Sin bajas registradas.</p>
      ) : (
        <table className="mt-2 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-1">Fecha</th>
              <th className="py-1">Cantidad</th>
              <th className="py-1">Motivo</th>
              <th className="py-1">Descripción</th>
              <th className="py-1" />
            </tr>
          </thead>
          <tbody>
            {writeOffs
              .slice()
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((writeOff) => (
                <WriteOffRow key={writeOff.id} writeOff={writeOff} />
              ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
