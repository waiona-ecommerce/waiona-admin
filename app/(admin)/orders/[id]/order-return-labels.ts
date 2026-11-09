import { OrderReturnType } from '@/core/enums'

// Aparte del formulario: un valor exportado desde un archivo 'use client' no se puede leer en
// un componente de servidor, y la lista de lo registrado también usa estas etiquetas.
export const ORDER_RETURN_TYPE_LABELS: Record<OrderReturnType, string> = {
  [OrderReturnType.RETURNED_OK]: 'Reembolso: trae el producto sano',
  [OrderReturnType.RETURNED_DAMAGED]: 'Reembolso: lo trae roto',
  [OrderReturnType.EXCHANGED_DAMAGED]: 'Cambio por rotura, mismo producto',
  [OrderReturnType.EXCHANGED_OK]: 'Cambio con el producto sano, mismo producto',
}
