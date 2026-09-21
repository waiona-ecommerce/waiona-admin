---
name: auth-session
description: >
  Sesión del admin: cookies httpOnly access/refresh, refresh de tokens en proxy.ts, roles ADMIN y SUPER_ADMIN, login/logout.
  Cargar al tocar login, logout, proxy.ts, cookies o restricciones por rol.
metadata:
  author: "@rodrigozucchini"
  version: "1.0"
---

# Auth Session Skill

Cómo se mantiene la sesión del admin contra el JWT del backend. Basado en `proxy.ts`, `actions/auth.actions.ts` y `core/lib/cookies.ts`.

---

## Cuándo usar esta skill

Cargar cuando se:
- Modifica login, logout o `proxy.ts`
- Agrega una restricción por rol
- Toca `core/lib/cookies.ts` o `AUTH_COOKIES` / `AUTH_TOKEN_TTL`

No cargar para:
- Llamadas a endpoints de negocio (usar `api-integration`)

---

## Reglas

1. **Tokens solo en cookies httpOnly** (`access_token`, `refresh_token`), creadas con `cookieOptions(maxAge)`. Nunca en `localStorage`, en estado de React ni en `NEXT_PUBLIC_*`.
2. **TTL espejo del backend** (`core/config/constants.ts`): access 15 min, refresh 30 días. Si el backend cambia, se cambia ahí.
3. **El refresh se hace solo en `proxy.ts`.** El backend rota el refresh token en cada uso: si dos lugares refrescan a la vez, el segundo falla. Los Server Components no pueden escribir cookies, así que no refrescan.
4. **Solo entran `ADMIN` y `SUPER_ADMIN`** (`ADMIN_ROLES` en `proxy.ts`). Un token válido con rol `CLIENT` se trata como no autenticado.
5. **`proxy.ts` valida `exp` y rol leyendo el payload del JWT**, sin verificar la firma: es un filtro de UX, no seguridad. La autorización real la impone el backend en cada request. Que la UI oculte algo por rol no lo protege.
6. **Rutas públicas**: solo `/login` (`PUBLIC_PATHS`). Sin sesión válida se redirige a `/login?from=<ruta>`.
7. **Logout**: llama al backend con el refresh token (ignorando errores) y borra ambas cookies.

---

## Patrones

**Hacer:**
```ts
store.set(AUTH_COOKIES.accessToken, access_token, cookieOptions(AUTH_TOKEN_TTL.accessTokenMinutes * 60))
```

**No hacer:**
```ts
localStorage.setItem('token', access_token)              // ❌ accesible desde JS
store.set('access_token', t, { maxAge: 900 })            // ❌ sin httpOnly, TTL hardcodeado
```

---

## Errores comunes

- **Intentar refrescar el token desde un service/Server Component**: no puede setear cookies y puede invalidar el refresh token.
- **Confiar en el rol del payload para proteger algo sensible**: es solo UX.
- **Agregar una ruta a `PUBLIC_PATHS` "para probar"** y dejarla.
- **Loguear tokens o credenciales** en consola o en el spec.
