# 03 — Devoluciones y cambios en el panel

> **Resumen**
> - **Cambia:** en el detalle de una orden retirada, el admin registra por ítem una devolución o un cambio. El stock se mueve solo. Se ve la lista de lo registrado.
> - **No cambia:** la plata se devuelve a mano desde el panel de MercadoPago, y la orden sigue retirada.
> - **No incluye:** devolver plata desde el panel; cambiar por otro producto, que el sistema no permite.
> - **Decidís vos:** nada.

| Opción del formulario | Tipo | Stock |
|---|---|---|
| Reembolso: trae el producto sano | `RETURNED_OK` | Vuelve al depósito |
| Reembolso: lo trae roto | `RETURNED_DAMAGED` | No cambia |
| Cambio por rotura, mismo producto | `EXCHANGED_DAMAGED` | Baja la unidad sana que se entrega |
| Cambio con el producto sano, mismo producto | `EXCHANGED_OK` | No cambia |

## Objetivo
Registrar devoluciones y cambios desde la orden, sin cargar stock suelto.

## Contexto
Lo resuelve el admin cuando el cliente escribe por WhatsApp. Fuente: `waiona-core/docs/pagos-app-y-panel.md`.

- `OrderResponseDto` ya trae `items[].id`, `productName`, `comboName` y `quantity`.
- `core/lib/api.ts` (`apiRequest`) **no** deja mandar headers propios, y este endpoint necesita `Idempotency-Key`.
- El patrón de formulario está en `app/(admin)/stock/[id]/WriteOffForm.tsx`: `useTransition`, server action, `toast` y `router.refresh()`.

## Alcance
**Incluye:** formulario por ítem, lista de lo registrado y `Idempotency-Key`.
**No incluye:** devolver plata; cambio por otro producto.

## Contrato del backend
Solo para `admin` y `super_admin`.

`POST /orders/:id/returns`, con el header `Idempotency-Key` y `{ orderItemId, quantity, type, description? }`. Responde 201 con `{ id, orderId, orderItemId, type, quantity, description, createdBy, createdAt }`. En un combo, `quantity` cuenta combos.

| Error | Mensaje |
|---|---|
| 400 | Datos inválidos |
| 400 | `Stock disponible insuficiente — solo N disponibles (…)` |
| 404 | `Orden no encontrada` · `Ítem no encontrado en la orden` |
| 409 | `Solo se pueden registrar devoluciones o cambios de una orden retirada` |
| 409 | `Solo quedan N unidades sin registrar en este ítem` |

`GET /orders/:id/returns` devuelve la lista, de la más nueva a la más vieja.

## Requisitos funcionales (EARS)
- RF-1: WHILE la orden está `DELIVERED` THE SYSTEM SHALL mostrar el formulario "Devolución o cambio", con ítem, cantidad (entero de 1 a la cantidad del ítem), tipo (las cuatro opciones de la tabla) y descripción opcional. En otro estado no se muestra.
- RF-2: WHEN se envía el formulario THE SYSTEM SHALL llamar al `POST` con un `Idempotency-Key` generado con `crypto.randomUUID()` en el navegador. La misma clave se reusa si ese envío se reintenta, y se genera otra después de un registro exitoso.
- RF-3: WHEN el registro sale bien THE SYSTEM SHALL mostrar un toast "Registrado", vaciar el formulario y refrescar la lista.
- RF-4: IF el backend responde un error THEN THE SYSTEM SHALL mostrar su mensaje en un toast, sin vaciar el formulario.
- RF-5: WHILE se envía THE SYSTEM SHALL deshabilitar el botón.
- RF-6: WHEN el tipo elegido es un reembolso THE SYSTEM SHALL mostrar: "La plata se devuelve aparte, desde el panel de MercadoPago.".
- RF-7: WHEN se abre el detalle de una orden `DELIVERED` THE SYSTEM SHALL mostrar lo registrado: fecha, ítem, cantidad, tipo y descripción. Sin filas, muestra "Sin devoluciones ni cambios.".

## Edge cases
- **Doble click:** RF-2 y RF-5 lo frenan.
- **Cantidad mayor a la que queda:** responde 409, y RF-4 muestra cuántas unidades quedan.
- **Rotura sin stock:** responde 400, y RF-4 muestra el mensaje. El admin puede registrar un reembolso.
- **Reemplazo que también se rompe:** si ya se registró toda la cantidad, se usa la baja de stock existente, con el número de orden en la descripción.

## Diseño técnico
| Archivo | Cambio |
|---|---|
| `core/lib/api.ts` | `RequestOptions.headers` opcional. |
| `services/order-return.service.ts` (nuevo) | `getOrderReturns`. |
| `actions/order-return.actions.ts` (nuevo) | `createOrderReturn(orderId, dto, idempotencyKey)`. |
| `core/types/order-return.types.ts` (nuevo), `core/enums` | Tipos y enum `OrderReturnType`. |
| `app/(admin)/orders/[id]/OrderReturnForm.tsx` (nuevo) | RF-1 a RF-6. |
| `app/(admin)/orders/[id]/page.tsx` | Monta el formulario y RF-7. |

Skills: `nextjs-app-router`, `api-integration`, `admin-ui-patterns`, `verification-standard`.

## Verificación
El repo no tiene runner de tests: `npm run lint` y `npm run build`, y prueba manual contra staging con cada tipo, comprobando el stock y los errores 400 y 409.

## Dudas abiertas
Ninguna.

## Implementación
**Rama:** `feat/spec-03-devoluciones-cambios`.

**Archivos:**
- `core/lib/api.ts` (`headers` opcional), `core/enums/order.enum.ts`, `core/types/order-return.types.ts` (nuevo) y `core/types/index.ts`.
- `services/order-return.service.ts` y `actions/order-return.actions.ts` (nuevos).
- `app/(admin)/orders/[id]/OrderReturnForm.tsx`, `order-return-labels.ts` (nuevos) y `page.tsx`.

**Decisiones que no estaban explícitas:**
1. La clave también se cambia si el admin modifica un dato del formulario: ya es otro envío. Se reusa solo si reintenta lo mismo.
2. La lista se pide solo con la orden `DELIVERED`.

**Verificación:** `npx tsc --noEmit`, `npm run lint` y `npm run build`. **Pendiente la prueba manual contra staging** con cada tipo.

## Estado
- **Status**: completado
- **Fecha**: 2026-11-09
- **Archivos**: `core/lib/api.ts`, `core/enums/order.enum.ts`, `core/types/order-return.types.ts`, `core/types/index.ts`, `services/order-return.service.ts`, `actions/order-return.actions.ts`, `app/(admin)/orders/[id]/OrderReturnForm.tsx`, `app/(admin)/orders/[id]/order-return-labels.ts`, `app/(admin)/orders/[id]/page.tsx`
- **Verificación manual**: ningún RF verificado en vivo (hace falta login con Auth0 contra staging). RF-1 a RF-7 verificados por lectura de código, `tsc`, lint y build.
