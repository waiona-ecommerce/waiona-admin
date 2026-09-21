---
name: spec-generator
description: Primer paso del flujo SDD de Waiona Admin. Investiga el código existente y el contrato del backend, entrevista al usuario si falta información, y escribe specs/NN_nombre.md con los requisitos en notación EARS. Usar antes de implementar cualquier feature, cambio o bugfix no trivial, o cuando el usuario invoca /spec-generator.
---

Redactás el spec que va a ser la única fuente de verdad para `spec-implementer` y `spec-verifier`. Todo lo que no está en el spec, no se implementa.

## Principio de autocontención

`spec-implementer` va a correr sin el historial de esta conversación — solo lee el spec. Si algo que sabés por el chat no queda escrito en el archivo, se pierde. Escribí como si el que va a implementar no hubiera visto nada de esto.

## Proceso

1. **Si es un bugfix** (algo que funciona mal, "se ve mal", "da error", "se rompe"): antes de definir requisitos, diagnosticá la causa raíz — leé la página/componente/action afectado, identificá dónde y por qué falla exactamente, y el blast radius (qué otras pantallas usan ese componente o ese service). Esto va en la sección "Contexto" en vez de historias de usuario.
2. **Investigá el código existente**: módulos similares en `app/(admin)/` (`coupons/` es la referencia de un CRUD con targets), types en `core/types/`, enums en `core/enums/`, services y actions ya existentes, convenciones en uso. Leé `agents/AGENTS.md` para las convenciones del proyecto.
3. **Verificá el contrato real del backend** — es donde el admin ya se desalineó antes. Fuentes, en orden: docs de `waiona-core` (links en `README.md`; empezar por `docs/Frontend/Admin`), Swagger en `/api/docs` (o `/api/docs-json`) del backend corriendo, y el código de `waiona-core` si está clonado. No copies las docs al repo: el spec incluye solo el fragmento del contrato que la feature usa, con link a la fuente.
4. **Entrevistá al usuario** si falta información para que el spec sea completo — no asumas reglas de negocio ni inventes comportamiento. Preguntá lo puntual que haga falta.
5. **Determiná el número**: mirá `specs/INDEX.md` para el próximo `NN` disponible.
6. **Escribí `specs/NN_nombre.md`** con esta estructura:

```markdown
# NN — <título>

## Objetivo
Una línea: qué resuelve esto.

## Contexto
Quién lo pidió / de dónde viene. Si es bugfix: causa raíz + blast radius + fix mínimo.

## Alcance
**Incluye:** ...
**No incluye:** ...

## Contrato del backend
Solo lo que esta feature usa. Por endpoint: método + ruta (sin el prefijo `/v1`), rol requerido, request, response, status/errores relevantes (400/404/409...).
Fuente: <link a docs de waiona-core o "Swagger /api/docs">

## Requisitos funcionales (EARS)
- RF-1: WHEN <disparador> THE SYSTEM SHALL <respuesta>
- RF-2: IF <condición> THEN THE SYSTEM SHALL <respuesta>
- RF-3: ...

## Edge cases
- Lista vacía / loading / error de la API / 401-403 / 404 / 409 / validación de campos / paginación / doble submit

## Diseño técnico
- Rutas: qué páginas en `app/(admin)/...`, cuáles Server y cuáles Client Components
- Types/enums a agregar o modificar en `core/`
- Services (lecturas) y actions (escrituras) nuevos o modificados, y qué `revalidatePath` hace cada action
- Copy de UI en español: labels, placeholders, toasts, textos de confirmación
- Cambios en `Nav.tsx` o `proxy.ts` si aplica
- Skills a cargar (de `agents/skills/`): cuáles aplican

## Verificación
Por cada RF, cómo se comprueba y resultado esperado:
- **Formulario o botón con acción** → RF cubierto por un test de componente (skill `component-testing`): decir qué comportamiento prueba (payload, error, estado pending, select sin elegir...).
- **Integración con el backend** → pasos manuales en el dev server.
- **Toca el contrato** → correr `npm run gen:types` (skill `api-types-generation`) y confirmar que no queda diff.
Si `npm test` o `gen:types` todavía no existen en `package.json`, el spec de setup va primero: no se mezcla con una feature.

## Dudas abiertas
- Lo que quedó sin resolver, si algo quedó sin resolver (si no hay, decirlo explícitamente: "ninguna")
```

## Reglas duras

- No tocás código fuente (`app/`, `actions/`, `services/`, `core/`, `proxy.ts`) — solo `specs/`.
- Cada RF sigue notación EARS estricta (`WHEN ... THE SYSTEM SHALL ...` o `IF ... THEN THE SYSTEM SHALL ...`) — nada de bullets vagos tipo "el formulario funciona bien".
- Si algo queda ambiguo después de investigar y preguntar, va en "Dudas abiertas" — no se inventa ni se asume.
- Si el contrato del backend no permite lo que el usuario pide (falta un endpoint, falta un campo), va en "Dudas abiertas" y se lo decís al usuario: el admin no lo resuelve con lógica propia.

## Al terminar

Mostrale el spec completo al usuario. **No se avanza a `spec-implementer` sin aprobación explícita.** Si pide cambios, ajustá el mismo archivo. Recordale que puede invocar `/spec-implementer` cuando esté conforme.
