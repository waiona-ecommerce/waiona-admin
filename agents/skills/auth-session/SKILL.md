---
name: auth-session
description: >
  Sesión del admin con Auth0 (@auth0/nextjs-auth0 v4): proxy.ts con auth0.middleware, rol leído de GET /auth/me al loguearse,
  renovación del token en el proxy, roles ADMIN y SUPER_ADMIN, logout.
  Cargar al tocar login, logout, proxy.ts, la sesión o restricciones por rol.
metadata:
  author: "@rodrigozucchini"
  version: "2.0"
---

# Auth Session Skill

Cómo se mantiene la sesión del admin desde la migración a Auth0 (`specs/01_migracion_auth0.md`). Basado en `proxy.ts` y `core/lib/auth0.ts`.

---

## Cuándo usar esta skill

Cargar cuando se:
- Modifica `proxy.ts`, `core/lib/auth0.ts`, las páginas `/sin-acceso` o `/error-login`, o el logout
- Agrega una restricción por rol

No cargar para:
- Llamadas a endpoints de negocio (usar `api-integration`)

---

## Reglas

1. **Login, registro y contraseñas los maneja Auth0** (Universal Login). El panel no tiene formulario de login ni link de "Registrarse". El registro desde el panel lo bloquea una Action de Auth0.
2. **La sesión es del SDK:** cookie cifrada con `AUTH0_SECRET`. El access token **nunca** llega al navegador. No se crean cookies propias de tokens ni se usa `localStorage`.
3. **El rol no viaja en el token.** Se consulta `GET /auth/me` una sola vez, en `beforeSessionSaved`, y se guarda en `session.user.role`. Nunca decodificar el JWT para sacar el rol.
4. **Solo entran `ADMIN` y `SUPER_ADMIN`** (`ADMIN_ROLES` en `proxy.ts`). Con sesión pero sin esos roles → `/sin-acceso`. Sin sesión → `/auth/login?returnTo=<ruta>`.
5. **El token se renueva solo en `proxy.ts`** (`auth0.getAccessToken(req, res)`), porque es el único lugar que puede persistir el token nuevo. `apiRequest`/`apiUpload` solo lo leen con `auth0.getAccessToken()`.
6. **Rutas públicas:** `/auth/*` (SDK), `/sin-acceso` y `/error-login`. Cualquier ruta nueva queda protegida por el matcher.
7. **Logout:** link común (`<a>`) a `/auth/logout`, que cierra la sesión del panel y la de Auth0.
8. **El filtro de rol del panel es UX, no seguridad.** La autorización real la impone el backend en cada request: lee rol y suspensión de la DB.

---

## Patrones

**Hacer:**
```ts
const { token } = await auth0.getAccessToken()        // en apiRequest (server-only)
const session = await auth0.getSession(request)       // en proxy.ts
session?.user.role                                     // rol guardado al loguearse
```

**No hacer:**
```ts
JSON.parse(atob(token.split('.')[1])).role            // ❌ el token de Auth0 no trae rol
store.set('access_token', token)                       // ❌ la sesión es del SDK
<Link href="/auth/logout">                             // ❌ no es una página de Next: usar <a>
```

---

## Errores comunes

- **Olvidar `AUTH0_AUDIENCE`:** el token no sirve para la API y todo responde 401.
- **Renovar el token desde un Server Component:** el token nuevo no se persiste.
- **Esperar que un cambio de rol se vea al instante en el menú:** se ve al volver a loguearse. La API sí lo aplica al instante.
- **Loguear tokens o el Client Secret** en consola o en el spec.
