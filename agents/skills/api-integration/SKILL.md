---
name: api-integration
description: >
  Cómo el admin habla con la API de waiona-core: types y enums espejo del contrato, services (lecturas), Server Actions (escrituras), apiRequest/apiUpload y manejo de errores.
  Cargar al agregar o modificar endpoints, types, services o actions.
metadata:
  author: "@rodrigozucchini"
  version: "1.0"
---

# API Integration Skill

El admin es un cliente del backend: no tiene base de datos ni reglas de negocio propias. Esta skill define las capas por las que pasa toda comunicación con la API.

---

## Cuándo usar esta skill

Cargar cuando se:
- Agrega o cambia un endpoint consumido
- Crea o modifica un type en `core/types/` o un enum en `core/enums/`
- Escribe un service en `services/` o una action en `actions/`

No cargar para:
- Layout y rutas (usar `nextjs-app-router`)
- Formularios y estilos (usar `admin-ui-patterns`)
- Login, cookies, refresh (usar `auth-session`)

---

## Capas

```
core/types/<x>.types.ts     → DTOs espejo del backend (request y response)
core/enums/<x>.enum.ts      → enums espejo del backend
core/lib/api.ts             → apiRequest / apiUpload / ApiError (server-only)
services/<x>.service.ts     → LECTURAS (GET), sin 'use server'
actions/<x>.actions.ts      → ESCRITURAS (POST/PATCH/DELETE), con 'use server'
```

## Reglas

1. **Los types espejan el contrato del backend**, no lo que a la UI le convendría. Cuando el tooling esté listo, se aliasan desde el Swagger generado (skill `api-types-generation`); hasta entonces (y para los DTOs que el backend aún no documenta) se escriben a mano. Se exportan por el barrel `core/types/index.ts` y se importan de `@/core/types`. Lo no obvio del backend se deja comentado en el type (ej. "409 si el cupón es global").
2. **Lecturas en services**: funciones que llaman `apiRequest<T>(path, { query })` y devuelven la promesa. Solo se llaman desde Server Components. Listados devuelven `PaginatedResponse<T>` y aceptan `PaginationQuery` (`limit` máx. 100).
3. **Escrituras en actions**: `'use server'`, `try/catch`, devuelven `{ success: true as const }` o `{ success: false as const, message }`, y llaman `revalidatePath` de la ruta afectada.
4. **Errores**: `apiRequest` lanza `ApiError(statusCode, message)`. El mensaje del backend ya viene en español y se muestra tal cual; el fallback cuando no hay respuesta es `'Error de conexión con el servidor'`.
5. **Paths sin `/v1`**: `API_URL` (`core/config/env.ts`) ya lo incluye. Usar `/coupons`, no `/v1/coupons`.
6. **Imágenes**: `apiUpload(path, formData)`, límites en `IMAGE_UPLOAD` (`core/config/constants.ts`).
7. **El backend calcula, el admin muestra.** Estados (`CouponStatus`), precios, stock crítico, totales: no se reimplementan en el cliente.
8. **Fuente del contrato**: docs de `waiona-core` (links en `README.md`) y Swagger en `/api/docs`. Si lo que devuelve el backend no coincide con el spec, se frena y se avisa.

---

## Patrones

**Hacer** (action):
```ts
'use server'

export async function updateCoupon(id: number, data: UpdateCouponDto) {
  try {
    await apiRequest(`/coupons/${id}`, { method: 'PATCH', body: data })
    revalidatePath('/coupons')
    return { success: true as const }
  } catch (error) {
    return { success: false as const, message: errorMessage(error) }
  }
}
```

**No hacer:**
```ts
// ❌ mutación llamada con fetch desde un Client Component (expone la API y no lleva el token httpOnly)
await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupons/${id}`, { method: 'PATCH', ... })

// ❌ recalcular en el cliente lo que el backend ya calcula
const status = endsAt < new Date() ? 'EXPIRED' : 'ACTIVE'
```

---

## Errores comunes

- **Importar `apiRequest` en un Client Component**: usa `next/headers`, solo corre en el servidor.
- **Olvidar `revalidatePath`** tras una escritura: la lista queda desactualizada.
- **Inventar campos en un type** que el contrato no tiene.
- **Tragar el error** en una action sin devolver `message`: el usuario no ve por qué falló.
- **Usar `zod` "porque está instalado"**: hoy no se usa en ninguna parte; validar con el spec, no introducirlo por costumbre.
