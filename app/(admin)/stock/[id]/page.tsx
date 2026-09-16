import { notFound } from 'next/navigation'
import { getStockItem } from '@/services/stock-item.service'
import { getStockWriteOffsByStockItem } from '@/services/stock-writeoff.service'
import { ApiError } from '@/core/lib/api'
import { StockThresholds } from './StockThresholds'
import { AddStockForm } from './AddStockForm'
import { WriteOffForm } from './WriteOffForm'
import { StockMovements } from './StockMovements'
import { StockWriteOffs } from './StockWriteOffs'

export default async function StockItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const item = await getStockItem(Number(id)).catch((error) => {
    if (error instanceof ApiError && error.statusCode === 404) notFound()
    throw error
  })
  const writeOffs = await getStockWriteOffsByStockItem(Number(id))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {item.productName} — {item.locationName}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Actual: {item.quantityCurrent} · Reservado: {item.quantityReserved} · Disponible:{' '}
          {item.quantityAvailable}
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <StockThresholds item={item} />
        <AddStockForm item={item} />
        <WriteOffForm item={item} />
      </div>

      <StockMovements movements={item.movements} />
      <StockWriteOffs writeOffs={writeOffs} />
    </div>
  )
}
