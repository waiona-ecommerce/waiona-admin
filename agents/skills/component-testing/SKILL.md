---
name: component-testing
description: >
  Tests de componentes con Vitest + Testing Library para los Client Components del admin (formularios y botones con acción): labels, selects de entidades, payload, toasts, navegación y estado pending.
  Cargar cuando el spec crea o modifica un formulario o un botón que dispara una action.
metadata:
  author: "@rodrigozucchini"
  version: "1.0"
---

# Component Testing Skill

Prueba la UI de forma aislada, sin backend: la action se mockea. El backend ya cubre su lógica y su API con sus propios unitarios y e2e; acá solo se prueba lo que el backend no ve — cómo se comporta el formulario.

> **Estado del tooling: setup pendiente.** Vitest, Testing Library, jsdom y el script `npm test` todavía no están en `package.json`. Si no existen cuando el spec los necesita, `spec-implementer` frena y avisa: falta el spec de setup. No se instalan como efecto colateral de otra feature.

---

## Cuándo usar esta skill

Cargar cuando el spec:
- Crea o modifica un formulario (`XForm.tsx`) o cualquier Client Component con inputs
- Crea o modifica un botón que llama a una action (`DeleteXButton.tsx`, acciones de estado)

No cargar para:
- Páginas (`page.tsx`) y layouts: son Server Components async y no se testean acá
- Services, actions o `proxy.ts`: no tienen test propio en este repo
- Flujos completos contra el backend real (fuera de alcance por ahora)

---

## Reglas

1. **Test primero.** Se escribe desde los RF del spec, se ve fallar, y recién después se implementa el componente.
2. **Archivo al lado del componente**: `CouponForm.test.tsx` junto a `CouponForm.tsx` (dentro de `app/` es seguro: Next solo trata `page`, `layout` y similares como rutas).
3. **Se mockea todo lo que sale del componente**: la action (`vi.mock('@/actions/...')`), `next/navigation` (`useRouter`), `sonner` (`toast`) y `window.confirm` en los botones de borrado.
4. **Se busca como lo haría un usuario**: `getByLabelText`, `getByRole`. Nunca por clase CSS ni `data-testid`. Si un input no se puede encontrar por su label, **es un bug de la UI**: se arregla el componente, no el test.
5. **Un test por comportamiento**, con el RF que cubre en el nombre.
6. **Solo Client Components.** Los Server Components async no se testean con esta herramienta.

## Qué se prueba

| Componente | Casos mínimos |
|---|---|
| Formulario | Cada input se encuentra por su label · los `required` bloquean el envío vacío · el payload que recibe la action es exacto (transformaciones como mayúsculas o fechas a ISO, opcionales solo si tienen valor) · éxito → `toast.success` + `router.push` · error → `toast.error` y **no** navega · botón deshabilitado mientras guarda |
| Select de entidad | Arranca en `-- Seleccionar --` · no permite enviar sin elegir · con lista vacía muestra el aviso con link, no un select vacío |
| Botón de borrado | Si el usuario cancela el `confirm`, no llama a la action · si falla, `toast.error` |

---

## Patrones

**Hacer:**
```tsx
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/actions/coupon.actions', () => ({ createCoupon: vi.fn(), updateCoupon: vi.fn() }))

it('RF-2: envía el código en mayúsculas y vuelve a la lista', async () => {
  vi.mocked(createCoupon).mockResolvedValue({ success: true })
  const user = userEvent.setup()
  render(<CouponForm />)

  await user.type(screen.getByLabelText('Código'), 'promo10')
  await user.type(screen.getByLabelText('Valor (%)'), '10')
  await user.click(screen.getByRole('button', { name: 'Guardar' }))

  await waitFor(() => expect(push).toHaveBeenCalledWith('/coupons'))
  expect(createCoupon).toHaveBeenCalledWith(expect.objectContaining({ code: 'PROMO10', value: 10 }))
})
```

**No hacer:**
```tsx
container.querySelector('.rounded.border')      // ❌ frágil: se rompe con un cambio de estilos
screen.getByPlaceholderText('Código')           // ❌ no comprueba que exista un label visible
expect(createCoupon).toHaveBeenCalled()         // ❌ no verifica el payload
```

---

## Errores comunes

- **Testear la implementación** (estado interno, nombres de handlers) en vez de lo que ve el usuario.
- **Olvidar el caso de error**: solo probar el camino feliz.
- **No probar que no navega** cuando la action falla.
- **Mockear de más**: se mockea lo que sale del componente, no sus propios hijos.
- **Tocar el test para que pase** cuando falló porque falta un label: se corrige la UI.

---

## Comando

```bash
npm test                                   # todos (script a definir en el spec de setup)
npx vitest run app/\(admin\)/coupons       # un módulo
```
