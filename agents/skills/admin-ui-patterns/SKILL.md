---
name: admin-ui-patterns
description: >
  Patrones de UI del admin: formularios client con useTransition y toasts, labels visibles, selects de entidades con "-- Seleccionar --", borrado con confirm, estilos Tailwind y formato es-AR.
  Cargar al crear o modificar formularios, tablas, selects o botones.
metadata:
  author: "@rodrigozucchini"
  version: "1.0"
---

# Admin UI Patterns Skill

Cómo se ven y se comportan los formularios y las tablas del admin. Basado en el código real (`CouponForm`, `DeleteCouponButton`, `StockThresholds`).

---

## Cuándo usar esta skill

Cargar cuando se:
- Crea o edita un formulario, tabla, select o botón
- Define textos de UI (labels, placeholders, toasts, confirmaciones)

No cargar para:
- Estructura de rutas (usar `nextjs-app-router`)
- Llamadas a la API (usar `api-integration`)

---

## Reglas

1. **Todo en español**: labels, placeholders, toasts, confirmaciones y mensajes vacíos.
2. **Formularios = Client Component** con un `useState` por campo y `useTransition`. Submit → action → si `!result.success` → `toast.error(result.message)` y no navegar; si ok → `toast.success(...)` + `router.push(<lista>)`.
3. **Todo input tiene `<label>` visible.** El placeholder solo no alcanza: desaparece al escribir.
   ```tsx
   <label className="flex flex-col gap-1 text-sm">
     Stock mínimo
     <input ... className="rounded border px-3 py-2" />
   </label>
   ```
4. **Selects de entidades** (producto, combo, impuesto, depósito) arrancan en `-- Seleccionar --` (`value=""`) y no permiten enviar sin elegir. Nunca preseleccionar el primer elemento del array. Si la lista está vacía, mostrar un aviso con link a crear la entidad, no un select vacío. Los selects de **enums con default intencional** (moneda, tipo de depósito, unidad de medida) sí pueden tener default.
5. **Borrado**: botón client con `confirm('¿Borrar este X?')`, `useTransition`, `toast.error` si falla, deshabilitado mientras `isPending`.
6. **Submit**: `disabled={isPending}` y texto `Guardando...` mientras corre.
7. **Estilos con Tailwind utilitario** — clases en uso: input `rounded border px-3 py-2`, botón primario `rounded bg-black px-3 py-2 text-white disabled:opacity-50`, acción destructiva `text-sm text-red-600`, formulario `flex max-w-sm flex-col gap-4`. **No hay librería de componentes en uso**: `shadcn` y `@base-ui/react` están instalados pero sin usar; no se introducen salvo que el spec lo pida.
8. **Formatos**: dinero con `toLocaleString('es-AR')`; fechas en `<input type="date">` convertidas de/a ISO (`iso.slice(0, 10)` / `new Date(v).toISOString()`); campos opcionales se envían solo si tienen valor (`...(x && { x })`).
9. **Toasts con `sonner`** (`toast.success` / `toast.error`); el `<Toaster />` ya está en el root layout.

---

## Patrones

**Hacer** (select de entidad):
```tsx
<select value={productId} onChange={(e) => setProductId(e.target.value)} required className="rounded border px-3 py-2">
  <option value="">-- Seleccionar --</option>
  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
```

**No hacer:**
```tsx
const [productId, setProductId] = useState(String(products[0].id)) // ❌ elige en silencio el primero
<input placeholder="Stock mínimo" ... />                            // ❌ sin label visible
```

---

## Errores comunes

- **Elegir en silencio un default** en un select de entidades (ya se corrigió una vez en el repo).
- **Navegar aunque la action falló**: siempre chequear `result.success` antes de `router.push`.
- **Mostrar el valor crudo de un enum** en vez de su label.
- **Doble submit**: olvidar `disabled={isPending}`.
