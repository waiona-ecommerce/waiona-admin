# Waiona Admin — Agents

Todo lo que define cómo se trabaja en este proyecto vive acá, en `agents/`: el flujo SDD, las skills, los specs y el contexto del proyecto.

```
agents/
├── AGENTS.md          este archivo: flujo + contexto del proyecto
├── specs/             INDEX.md + un NN_nombre.md por spec
└── skills/
    ├── spec-generator/ spec-implementer/ spec-verifier/     ← flujo
    ├── nextjs-app-router/ api-integration/ admin-ui-patterns/
    │   auth-session/ component-testing/ api-types-generation/
    │   verification-standard/                               ← dominio
    └── template/                                            ← plantilla para skills nuevas
```

`.claude/skills/spec-*` son symlinks a `agents/skills/spec-*`: existen solo para que Claude Code descubra los comandos `/spec-generator`, `/spec-implementer` y `/spec-verifier`. El contenido real está en `agents/skills/`.

---

# Parte 1 — Sistema SDD

Spec-Driven Development puro: spec aprobado → código → verificación. Sin orchestrator ni roles intermedios — 3 skills invocables directamente.

## Principios

1. **Spec antes que código.** Nada se implementa sin un spec aprobado en `agents/specs/`.
2. **El spec es autocontenido.** `spec-implementer` corre sin el historial de la conversación que originó el spec — si algo no está escrito ahí, no existe. Eso incluye el fragmento del contrato del backend que la feature usa.
3. **Cambio de comportamiento = editar el spec primero, el código después.** Nunca al revés.
4. **Requisitos en notación EARS** (`WHEN <trigger> THE SYSTEM SHALL <respuesta>`) — no bullets ambiguos.
5. **El backend manda.** El admin no inventa ni reimplementa reglas de negocio: si el contrato real de `waiona-core` no coincide con el spec, se frena y se avisa.

## Flujo

```
/spec-generator  →  🚦 aprobación del usuario  →  /spec-implementer  →  /spec-verifier
```

| Skill | Qué hace | Archivo |
|---|---|---|
| `spec-generator` | Investiga el código y el contrato del backend, entrevista si falta info, escribe `agents/specs/NN_nombre.md` con RF en EARS | `skills/spec-generator/SKILL.md` |
| `spec-implementer` | Implementa exactamente lo que dice el spec, chequeo de tipos por paso, rama propia | `skills/spec-implementer/SKILL.md` |
| `spec-verifier` | Valida RF por RF + checklist de seguridad, cierra el spec, entrega commit/PR listos | `skills/spec-verifier/SKILL.md` |

Un solo gate real: aprobar el spec antes de que `spec-implementer` toque código. Si `spec-verifier` encuentra fallas, vuelve a `spec-implementer` — no hay vuelta atrás a `spec-generator` salvo que el spec mismo esté mal planteado.

## Skills de dominio

No son fases del flujo — es conocimiento específico del stack que `spec-implementer` carga según lo que el spec necesite.

| Skill | Archivo | Cuándo |
|---|---|---|
| `nextjs-app-router` | `skills/nextjs-app-router/SKILL.md` | Páginas, layouts, rutas, `proxy.ts`, Server vs Client Components |
| `api-integration` | `skills/api-integration/SKILL.md` | Types, enums, services (lecturas), actions (escrituras), `apiRequest` |
| `admin-ui-patterns` | `skills/admin-ui-patterns/SKILL.md` | Formularios, tablas, selects, botones de borrado, toasts, estilos |
| `auth-session` | `skills/auth-session/SKILL.md` | Login/logout, cookies, refresh de tokens, roles |
| `component-testing` | `skills/component-testing/SKILL.md` | Formularios y botones con acción: tests de componentes con Vitest, test primero |
| `api-types-generation` | `skills/api-types-generation/SKILL.md` | Types generados desde el Swagger del backend, para detectar desalineos con `tsc` |
| `verification-standard` | `skills/verification-standard/SKILL.md` | Qué correr y cuándo: `tsc`, tests, types en sync, lint, build y verificación manual |

> **Setup pendiente:** Vitest, Testing Library y `openapi-typescript` todavía no están instalados (no existen `npm test` ni `npm run gen:types`). Va como el primer spec del proyecto. Además, `waiona-core` aún no documenta en Swagger todos sus DTOs de respuesta — detalle en `api-types-generation`.

Para crear una skill de dominio nueva: `skills/template/SKILL.md`.

---

# Parte 2 — Contexto del proyecto

## ¿Qué es este proyecto?
Panel de administración de **Waiona**: catálogo (productos, combos, categorías), precios e impuestos, stock, descuentos y cupones, órdenes, usuarios y dashboard de estadísticas. Es solo un **cliente** de la API `waiona-core`: no tiene base de datos ni reglas de negocio propias. Solo entran usuarios con rol `ADMIN` o `SUPER_ADMIN`.

El cliente final usa una app mobile contra `/v1/shop`; este repo no tiene UI de shop.

## Stack Técnico

| Tecnología | Detalle |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript (`strict`), alias `@/*` → raíz |
| Estilos | Tailwind CSS, clases utilitarias directas |
| Toasts | sonner |
| Auth | JWT del backend en cookies httpOnly |
| Lint | ESLint (`eslint-config-next`) |
| Tests | Definidos, sin instalar: Vitest + Testing Library para componentes — ver `component-testing` |

`zod`, `shadcn` y `@base-ui/react` están en `package.json` pero hoy no se usan en ningún archivo.

## Estructura del código

```
app/
├── layout.tsx                    → root: fuentes, <Toaster />
├── (auth)/login/                 → LoginForm + page
└── (admin)/                      → layout con Nav lateral + LogoutButton
    ├── Nav.tsx                   → NAV_ITEMS (agregar acá cada módulo nuevo)
    └── <módulo>/                 → categories, combos, coupons, dashboard, discounts,
                                    orders, products, stock, taxes, users
        ├── page.tsx              → lista paginada
        ├── new/page.tsx · [id]/page.tsx
        └── XForm.tsx · DeleteXButton.tsx · [id]/<Relación>.tsx

actions/<x>.actions.ts            → escrituras ('use server')
services/<x>.service.ts           → lecturas (Server Components)
core/
├── config/                       → env.ts (API_URL), constants.ts (AUTH_COOKIES, TTL, paginación)
├── enums/                        → espejo de los enums del backend
├── lib/                          → api.ts (apiRequest/apiUpload/ApiError), cookies.ts
└── types/                        → DTOs espejo del backend (barrel: @/core/types)
proxy.ts                          → guard de sesión (Next 16: NO es middleware.ts)
```

Módulo de referencia para un CRUD con relaciones: `app/(admin)/coupons/`.

## Flujo de Auth

1. `login` (action) llama `POST /auth/login` y guarda `access_token` (15 min) y `refresh_token` (30 días) en cookies httpOnly.
2. `proxy.ts` corre en cada request: si el access token es válido y el rol es `ADMIN`/`SUPER_ADMIN` deja pasar; si no, intenta refrescar con `POST /auth/refresh`; si falla, redirige a `/login?from=<ruta>`.
3. `apiRequest` (server-only) lee el access token de las cookies y lo manda como `Bearer`.
4. El backend **rota** el refresh token en cada uso: solo `proxy.ts` refresca.
5. `logout` llama al backend y borra ambas cookies.

`proxy.ts` no verifica la firma del JWT: es un filtro de UX. La autorización real la impone el backend.

## Convenciones

Detalle y ejemplos en las skills de dominio; acá el resumen.

- **Páginas:** Server Component por defecto; `'use client'` solo para formularios y botones con estado. `params` y `searchParams` son `Promise`: siempre `await`. Un 404 del backend termina en `notFound()`. Cada módulo nuevo se agrega a `NAV_ITEMS`.
- **Datos:** lecturas en `services/`, escrituras en `actions/` con `revalidatePath`; nunca se llama a la API desde un Client Component. Las actions devuelven `{ success: true }` o `{ success: false, message }`. Los types espejan el contrato del backend; lo que el backend calcula (estado de un cupón, precios, stock crítico) no se recalcula en el cliente.
- **UI:** todo en español. Todo input con `<label>` visible (el placeholder solo no alcanza). Selects de entidades arrancan en `-- Seleccionar --`; nunca preseleccionan el primer elemento. Borrado con `confirm()`; errores con `toast.error`.
- **Git:** rama propia + PR; nunca push directo a `master`. Commits estilo conventional commits en español (`feat:`, `fix:`, `docs:`...). Los del flujo SDD llevan prefijo `[spec-NN]`.

## Variables de Entorno

| Variable | Default | Uso |
|---|---|---|
| `API_URL` | `http://localhost:3000/v1` | Base de la API de `waiona-core` (ya incluye `/v1`) |

`.env.local` no se commitea.

## Comandos Útiles

```bash
npm run dev          # dev server en http://localhost:3001 (el backend corre en :3000)
npm run build        # build de producción
npm run lint         # ESLint
npx tsc --noEmit     # chequeo de tipos
npm test             # tests de componentes (pendiente de setup)
npm run gen:types    # types desde el Swagger del backend (pendiente de setup)
```

## Documentación de la API

No hay copia local: vive en `waiona-core/docs` para no mantener dos copias que se desactualizan. Los links están en `README.md` (punto de partida: `docs/Frontend/Admin`). Para el shape exacto de cada endpoint, Swagger en `/api/docs` del backend.

## Notas Importantes

- Next.js 16: `middleware.ts` se renombró a `proxy.ts` y la función exportada se llama `proxy`.
- El backend rota el refresh token en cada uso — no refrescar desde services ni Server Components.
- Hoy no hay tests automatizados (el setup está pendiente). La verificación vigente es `tsc` + `lint` + `build` + prueba manual guiada por el spec; cuando el tooling exista, se suman los tests de componentes y los types generados.
