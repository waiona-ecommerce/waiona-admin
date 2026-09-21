---
name: nextjs-app-router
description: >
  Convenciones de Next.js 16 (App Router) para este repo: estructura de rutas por módulo, Server vs Client Components, params/searchParams asíncronos, paginación, proxy.ts.
  Cargar al crear o modificar páginas, layouts, rutas o el proxy.
metadata:
  author: "@rodrigozucchini"
  version: "1.0"
---

# Next.js App Router Skill

Convenciones estructurales de las páginas del admin. Basado en el código real (`coupons/` es la referencia). Se usa junto con `api-integration` (datos) y `admin-ui-patterns` (formularios y estilos).

---

## Cuándo usar esta skill

Cargar cuando se:
- Crea un módulo nuevo o una página nueva en `app/(admin)/`
- Toca `layout.tsx`, `Nav.tsx` o `proxy.ts`
- Decide si algo es Server o Client Component

No cargar para:
- Llamadas a la API, types, actions (usar `api-integration`)
- Cookies, login, roles (usar `auth-session`)

---

## Reglas

1. **Next 16: `params` y `searchParams` son `Promise`.** Siempre `await`. Nunca `params.id` directo.
2. **`middleware.ts` ya no existe: es `proxy.ts`** en la raíz, y la función exportada se llama `proxy`.
3. **Server Component por defecto.** `'use client'` solo para formularios, botones con estado o handlers de eventos. Las páginas nunca son client.
4. **Estructura por módulo** en `app/(admin)/<módulo>/`:
   ```
   page.tsx               → lista paginada
   new/page.tsx           → alta (renderiza <XForm />)
   [id]/page.tsx          → edición + relaciones (renderiza <XForm x={...} />)
   XForm.tsx              → formulario compartido new/edit (client)
   DeleteXButton.tsx      → borrado (client)
   [id]/<Relación>.tsx    → subcomponentes de relaciones (targets, imágenes, precios)
   ```
5. **Fetch en paralelo** con `Promise.all` cuando las consultas son independientes.
6. **404 del backend → `notFound()`**: `getX(id).catch((e) => { if (e instanceof ApiError && e.statusCode === 404) notFound(); throw e })`.
7. **Paginación por `?page=`** con links "Anterior"/"Siguiente" según `page` y `totalPages` de `PaginatedResponse`.
8. **Módulo nuevo → agregar el item a `NAV_ITEMS`** en `app/(admin)/Nav.tsx`, con label en español.
9. **Labels de enums**: un `Record<Enum, string>` local en la página (ej. `STATUS_LABELS`), nunca mostrar el valor crudo del enum.
10. **Rutas nuevas quedan protegidas por defecto**: el matcher de `proxy.ts` cubre todo salvo assets. No agregar a `PUBLIC_PATHS` salvo que el spec lo pida.

---

## Patrones

**Hacer:**
```tsx
export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const coupon = await getCoupon(Number(id))
  ...
}
```

**No hacer:**
```tsx
export default async function EditCouponPage({ params }: { params: { id: string } }) {
  const coupon = await getCoupon(Number(params.id)) // ❌ params es una Promise en Next 16
}
```

---

## Errores comunes

- **Marcar una página como `'use client'`** para usar un `useState`: extraé un componente client chico y dejá la página en el servidor.
- **Olvidar el item del `Nav`** al crear un módulo.
- **Mostrar el valor crudo de un enum** (`ACTIVE`) en vez del label en español.
- **Fetch secuencial** de datos independientes.
