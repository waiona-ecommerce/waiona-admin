# 01 — Migrar el login del panel a Auth0

## Objetivo
Que el panel vuelva a funcionar contra el backend actual: login con Auth0 (Universal Login) en lugar del login propio, acceso solo para `admin` y `super_admin`, y la lista de usuarios adaptada al contrato nuevo.

## Contexto
Lo pide el dueño del producto (2026-10-25).

En `waiona-core`, el spec 03 (`specs/03_migracion_auth0.md`, ya mergeado en `master` y deployado en staging, `https://waiona-core-staging.onrender.com`) migró toda la autenticación a **Auth0**:
- se eliminaron los endpoints de login, registro, refresh, logout, cambio y reset de contraseña;
- la API solo valida access tokens RS256 emitidos por Auth0;
- el rol vive en la base del backend y **no viaja en el token**.

**Desde entonces el panel está roto:**
- `actions/auth.actions.ts` llama a `POST /auth/login` y `POST /auth/logout`, que hoy responden **404**.
- `proxy.ts` refresca con `POST /auth/refresh` (404) y decide el acceso **leyendo el rol del payload del JWT**, pero los tokens de Auth0 no traen rol.
- `core/lib/api.ts` y `apiUpload` mandan como `Bearer` la cookie `access_token`, que ya nadie emite.
- `app/(admin)/users/page.tsx` muestra `user.isActive` (el campo ya no existe) y `user.profile.name` (rompe si `profile` es `null`).
- `core/types/user.types.ts` tiene `isActive` y `profile` no nullable. `core/types/auth.types.ts` tiene DTOs de endpoints eliminados.

Lo que ya está configurado en Auth0 (tenant `dev-znayvi14lcxny8d4.us.auth0.com`, plan Free):
- **Application `Waiona Web`**, tipo **Regular Web App**. Es este panel. Callback `http://localhost:3001/auth/callback` y logout URL `http://localhost:3001`.
- **API `Waiona API`**, identifier (audience) `https://api.waiona.com`, RS256, tokens de 3600 s, offline access habilitado.
- **Action post-login:** bloquea a los usuarios sin email verificado y agrega los claims de email que necesita el backend.
- El `.env.local` del panel ya tiene (o va a tener, lo carga el usuario) `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_SECRET` y `APP_BASE_URL`.

### Decisiones tomadas con el usuario
1. **Por ahora el panel lo usa solo el `super_admin`** (el dueño). Su cuenta se crea **a mano en el dashboard de Auth0** (User Management → Users → Create User) con el email de `SUPERADMIN_EMAIL` del backend. En su primer request, el backend lo crea como `super_admin`.
2. **Nadie se registra desde el panel.** El panel no muestra "Registrarse". Además, una Action *Pre User Registration* en Auth0 rechaza los registros que vengan de `Waiona Web`; esa Action es parte del spec 04 de `waiona-core`, no de este. Los clientes se registran desde la app mobile.
3. Los **admins** los va a crear el `super_admin` **en una fase posterior**: invitación desde el panel + desplegable para elegir `admin` / `super_admin`, lo que requiere un endpoint nuevo en el backend. Hasta entonces, un admin se puede crear a mano (Auth0 + `npm run admin:promote` en `waiona-core`). Igual, el panel ya deja entrar a `admin` además de `super_admin`.
4. El **rol se consulta una sola vez al iniciar sesión** (`GET /auth/me`) y se guarda en la sesión del SDK. Un cambio de rol o una suspensión se reflejan en el panel al volver a loguearse, pero la API los aplica en el acto: cada request se autoriza contra la base.
5. Si entra alguien que no es `admin` ni `super_admin`, ve una pantalla **"No tenés acceso al panel"** con un botón para cerrar sesión.
6. En **Usuarios**, la columna "Activo" se reemplaza por **"Perfil completo"** (Sí/No), y si el usuario no tiene perfil, en "Nombre" se muestra `—`.
7. **No se cambia ningún otro comportamiento del panel.** El resto de los módulos siguen igual; solo cambia de dónde sale el token.

## Alcance
**Incluye:**
- Instalar y configurar `@auth0/nextjs-auth0` v4 (soporta Next 16).
- Rutas del SDK: `/auth/login`, `/auth/logout` y `/auth/callback`.
- Reescribir `proxy.ts`: sesión del SDK + chequeo de rol.
- Consultar el rol en `GET /auth/me` al crear la sesión y guardarlo en ella.
- Pantalla `/sin-acceso`.
- `apiRequest` y `apiUpload` mandan el access token de Auth0.
- Botón de logout con el SDK.
- Eliminar el login propio: `app/(auth)/login/`, las actions `login` y `logout`, las cookies propias, `AUTH_COOKIES`, `AUTH_TOKEN_TTL` y `core/lib/cookies.ts`.
- Limpiar `core/types/auth.types.ts` y agregar `MeResponse`.
- `UserResponseDto` y la página de Usuarios adaptados al contrato nuevo.
- Variables de entorno: `.env.local` de ejemplo en el README y `AUTH0_AUDIENCE`.
- Actualizar `agents/AGENTS.md` (Stack, Flujo de Auth, Variables) y `agents/skills/auth-session/SKILL.md`.

**No incluye:**
- Crear admins desde el panel, cambiar roles, invitaciones (fase 2, necesita backend nuevo).
- La Action *Pre User Registration* (spec 04 de `waiona-core`).
- La URL de producción del panel en Auth0 (todavía no hay deploy de producción).
- Cambios en otros módulos (productos, órdenes, cupones, etc.), salvo que dejen de compilar por los types de usuario.
- Setup de `npm test` o `gen:types` (siguen pendientes; la verificación es manual).

## Contrato del backend
Fuente: `waiona-core` — `specs/03_migracion_auth0.md`, `docs/frontend-auth0.md` y Swagger `/api/docs`.

- **Autenticación:** todas las rutas protegidas exigen `Authorization: Bearer <access_token de Auth0>`, con `aud = https://api.waiona.com`.
  - `401`: token ausente, inválido o vencido.
  - `403 "Tenés que verificar tu email"`: el token no trae el claim de email verificado.
  - `403 "La cuenta fue suspendida"`: usuario baneado.
- **`GET /auth/me`** (cualquier rol autenticado) → `200`:
  ```json
  { "id": 1, "email": "x@y.com", "isBanned": false, "role": "super_admin",
    "profile": null, "profileComplete": false, "createdAt": "...", "updatedAt": "..." }
  ```
  `role` es `super_admin | admin | client`. `profile` es `null` hasta que el usuario lo completa (los admins no lo necesitan). En el primer request de un usuario, el backend lo crea en su base.
- **`GET /users`** (admin): cada usuario es `{ id, email, isBanned, role, profile: {id, name, lastName, avatar, birthDate} | null, createdAt, updatedAt }`. **Ya no tiene `isActive`.**
- **Endpoints eliminados (404):** `/auth/register`, `/auth/activate`, `/auth/resend-activation`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`.

## Requisitos funcionales (EARS)
- RF-1: WHEN alguien sin sesión del SDK pide cualquier ruta del panel (salvo `/auth/*` y `/sin-acceso`) THE SYSTEM SHALL redirigirlo a `/auth/login` con `returnTo` igual a la ruta pedida.
- RF-2: WHEN el usuario termina el login en Auth0 THE SYSTEM SHALL pedir un access token con audience `AUTH0_AUDIENCE` y scope `openid profile email offline_access`, llamar a `GET /auth/me` con ese token y guardar en la sesión el `role` devuelto.
- RF-3: IF `GET /auth/me` falla al crear la sesión (401, 403, 5xx o error de red) THEN THE SYSTEM SHALL guardar la sesión sin rol, de modo que el usuario termine en `/sin-acceso` (RF-5), sin romper el callback.
- RF-4: WHEN un usuario con sesión y rol `admin` o `super_admin` pide una ruta del panel THE SYSTEM SHALL dejarlo pasar.
- RF-5: IF un usuario con sesión no tiene rol `admin` ni `super_admin` (incluye `client` y sin rol) THEN THE SYSTEM SHALL redirigirlo a `/sin-acceso`.
- RF-6: WHEN se muestra `/sin-acceso` THE SYSTEM SHALL mostrar el título "No tenés acceso al panel", el texto "Esta cuenta no tiene permisos de administrador." y un botón "Cerrar sesión" que lleve a `/auth/logout`.
- RF-7: WHEN un usuario con rol `admin` o `super_admin` entra a `/sin-acceso` THE SYSTEM SHALL redirigirlo a `/`.
- RF-8: WHEN `apiRequest` o `apiUpload` llaman a la API THE SYSTEM SHALL mandar `Authorization: Bearer <access token de Auth0 de la sesión>`, obtenido con el SDK. El SDK renueva el token con el refresh token cuando vence.
- RF-9: IF no se puede obtener un access token (sesión vencida o refresh fallido) THEN THE SYSTEM SHALL redirigir a `/auth/login`.
- RF-10: WHEN el usuario toca "Cerrar sesión" en el header THE SYSTEM SHALL cerrar la sesión del panel y la de Auth0 (`/auth/logout`) y volver a `APP_BASE_URL`, que termina en el login de Auth0 por RF-1.
- RF-11: WHEN el panel muestra el login THE SYSTEM SHALL usar exclusivamente Universal Login de Auth0, sin formulario propio ni botón o link de "Registrarse" en el panel.
- RF-12: WHEN se muestra la lista de Usuarios THE SYSTEM SHALL mostrar las columnas Email, Nombre, Rol, Perfil completo y Estado. "Perfil completo" muestra `Sí` si `profile` no es `null` y `No` si es `null`.
- RF-13: IF un usuario de la lista tiene `profile: null` THEN THE SYSTEM SHALL mostrar `—` en la columna Nombre, sin romper la página.
- RF-14: WHEN se usa cualquier otra pantalla del panel (productos, combos, categorías, stock, precios, impuestos, descuentos, cupones, órdenes, dashboard, suspender usuarios) THE SYSTEM SHALL comportarse igual que antes de este spec.

## Edge cases
- **Primer login del super_admin:** su usuario de Auth0 se creó desde el dashboard y puede no tener el email verificado. La Action post-login lo rechaza ("Te enviamos un email…"), Auth0 vuelve al panel con `?error=access_denied&error_description=...`, y el panel muestra el error del SDK. El paso previo de verificar el email está en el runbook de `waiona-core` (spec 04): User Management → el usuario → "Send Verification Email".
- **Error en el callback** (`access_denied` por email sin verificar, o registro rechazado): el SDK redirige con el error. El panel muestra el `error_description` en una pantalla simple, con un link "Volver a intentar" que lleva a `/auth/login`. Sin loops de redirección.
- **Backend caído al iniciar sesión:** `/auth/me` falla, la sesión queda sin rol y el usuario va a `/sin-acceso` (RF-3). Para reintentar, cierra sesión y vuelve a entrar.
- **Super_admin suspendido o degradado mientras tiene sesión:** el panel lo sigue dejando pasar hasta que vuelva a loguearse, pero cada llamada a la API devuelve 403. Las pantallas muestran el error que ya manejan hoy. Es lo aceptado en la decisión 4.
- **Un cliente de la app intenta entrar al panel:** loguea en Auth0, `/auth/me` devuelve `client` → `/sin-acceso`.
- **Sesión expirada en medio de una acción** (Server Action): `getAccessToken` falla → RF-9.
- **Cookies viejas** (`access_token` / `refresh_token`) que quedaron en el navegador: se ignoran. Se pueden borrar en el primer logout, pero no es requisito.

## Diseño técnico
- **Dependencia:** `@auth0/nextjs-auth0` ^4 (la última es 4.33.0; peer `next ^16.0.10`). Verificar los nombres exactos de la API (`Auth0Client`, `beforeSessionSaved` / `onCallback`, `getAccessToken`, `middleware`) contra la versión instalada.
- **`core/lib/auth0.ts`** (nuevo, server-only): exporta `auth0 = new Auth0Client({...})` con:
  - `authorizationParameters: { audience: process.env.AUTH0_AUDIENCE, scope: 'openid profile email offline_access' }`;
  - un hook al crear la sesión (`beforeSessionSaved`, o `onCallback` si es el que da acceso al access token en esta versión) que llama a `GET /auth/me` con el access token recién emitido (`fetch` directo a `${API_URL}/auth/me`, sin `apiRequest`, porque todavía no hay sesión guardada) y guarda `role` en `session.user`. Si el `fetch` falla → sin rol (RF-3). Solo se consulta al crear la sesión, no en cada refresh.
- **`proxy.ts`** (Next 16):
  - Primero delega en `auth0.middleware(request)`, que monta `/auth/*` y hace rolling de la sesión. Para rutas `/auth/*` devuelve su respuesta tal cual.
  - Rutas públicas: `/auth/*`, `/sin-acceso` y la de error del callback.
  - Sin sesión → `/auth/login?returnTo=<ruta>` (RF-1).
  - Con sesión: rol admin → pasa (RF-4); si no → `/sin-acceso` (RF-5).
  - En `/sin-acceso`, rol admin → `/` (RF-7).
  - Se mantiene `ADMIN_ROLES = [RoleType.ADMIN, RoleType.SUPER_ADMIN]`. Se mantiene el `matcher` actual.
  - Ya no se decodifica ningún JWT.
- **`core/lib/api.ts`:** `apiRequest` y `apiUpload` obtienen el token con `auth0.getAccessToken()`. Si falla → `redirect('/auth/login')` (RF-9). Se quita la lectura de cookies.
- **Páginas:**
  - `app/sin-acceso/page.tsx` (Server Component, fuera del grupo `(admin)` para no heredar el layout con Nav), con el copy de RF-6.
  - Una pantalla para el error del callback, si el SDK no trae una propia (edge cases).
  - Se borra `app/(auth)/login/` (`page.tsx` y `LoginForm.tsx`) y el grupo `(auth)` si queda vacío.
- **`app/(admin)/LogoutButton.tsx`:** pasa a ser un link o botón a `/auth/logout`. Se borra la action `logout` y todo `actions/auth.actions.ts`.
- **Se borran:** `core/lib/cookies.ts`, y `AUTH_COOKIES` y `AUTH_TOKEN_TTL` de `core/config/constants.ts`.
- **Types:**
  - `core/types/auth.types.ts`: se borran los DTOs de endpoints eliminados (`RegisterDto`, `LoginDto`, `LoginResponse`, `RefreshToken*`, `LogoutDto`, `ChangePassword*`, `ForgotPassword*`, `ResetPassword*`, `ActivateAccountResponse`, `AuthUser`, `JwtPayload`). Se agrega `MeResponse extends UserResponseDto { profileComplete: boolean }`.
  - `core/types/user.types.ts`: `UserResponseDto` sin `isActive` y con `profile: UserProfile | null`. Se actualizan los comentarios: el de `isBanned` ya no menciona refresh tokens y el de `birthDate` ya no menciona el relleno 2000-01-01.
- **`app/(admin)/users/page.tsx`:** la columna "Activo" pasa a "Perfil completo" (RF-12) y la columna Nombre usa `user.profile ? \`${name} ${lastName}\` : '—'` (RF-13).
- **Variables de entorno** (`.env.local`, no se commitea):
  ```properties
  API_URL=http://localhost:3000/v1
  AUTH0_DOMAIN=dev-znayvi14lcxny8d4.us.auth0.com
  AUTH0_CLIENT_ID=<Client ID de Waiona Web>
  AUTH0_CLIENT_SECRET=<Client Secret de Waiona Web>
  AUTH0_SECRET=<openssl rand -hex 32>
  APP_BASE_URL=http://localhost:3001
  AUTH0_AUDIENCE=https://api.waiona.com
  ```
  Se documentan en `agents/AGENTS.md` (tabla de variables) con valores de ejemplo, **sin secretos reales**.
- **Copy (español):** RF-6; "Cerrar sesión" (header y `/sin-acceso`); error del callback: título "No se pudo iniciar sesión", texto `error_description` y link "Volver a intentar".
- **Docs internas:** `agents/AGENTS.md`:
  - Stack: "Auth: Auth0 (`@auth0/nextjs-auth0`), sesión del SDK en cookie cifrada";
  - reescribir "Flujo de Auth";
  - Estructura: sacar `(auth)/login`, agregar `sin-acceso` y `core/lib/auth0.ts`;
  - variables.

  `agents/skills/auth-session/SKILL.md`: reescribirla para el SDK (reglas nuevas: el token nunca llega al navegador, solo `proxy.ts` y el SDK manejan la sesión, el rol sale de `/auth/me` al loguearse) y subir la versión.
- **Skills a cargar:** `auth-session`, `nextjs-app-router`, `api-integration`, `verification-standard`.

## Verificación
No hay `npm test` ni `gen:types` todavía, así que la verificación es manual. Requisitos previos:
- backend local corriendo (`waiona-core` en `:3000`, con `AUTH0_*`);
- `.env.local` del panel completo;
- usuario super_admin creado en Auth0 con email verificado.

| RF | Cómo se comprueba | Resultado esperado |
|---|---|---|
| RF-1 | Sin sesión, abrir `http://localhost:3001/products` | Redirige a Universal Login de Auth0 |
| RF-2, RF-4 | Loguearse con la cuenta de `SUPERADMIN_EMAIL` | Vuelve a `/products` y lo ve; `GET /auth/me` del backend responde con `role: super_admin` |
| RF-11 | Ver la pantalla de login | Es la de Auth0; el panel no tiene formulario ni botón de registro propio |
| RF-5, RF-6 | Loguearse con una cuenta `client` (creada a mano en Auth0 y verificada) | Termina en `/sin-acceso` con el copy y el botón |
| RF-7 | Como super_admin, abrir `/sin-acceso` | Redirige a `/` |
| RF-3 | Con el backend apagado, iniciar sesión | `/sin-acceso`, sin error 500 ni loop |
| RF-8 | Navegar productos, órdenes y usuarios; crear y editar algo | Funciona igual que antes; en la red del server, las requests llevan `Bearer` |
| RF-9 | Borrar la cookie de sesión y ejecutar una acción | Redirige a login |
| RF-10 | Tocar "Cerrar sesión" | Sale del panel y de Auth0; al volver, pide login |
| RF-12, RF-13 | Abrir Usuarios con un usuario sin perfil | Columna "Perfil completo" con `No` y Nombre `—` |
| RF-14 | Recorrer cada módulo del menú | Sin regresiones |

Además: `npm run build`, `npm run lint` y `npx tsc --noEmit` sin errores.

## Dudas abiertas
Ninguna.

## Implementación

**Rama:** `feat/spec-01-migracion-auth0` (desde `master`). Sin commits: en este repo se commitea solo cuando el usuario lo pide.

### Archivos creados
- `core/lib/auth0.ts`: `Auth0Client` con `authorizationParameters` (audience + scope), `beforeSessionSaved` (rol desde `GET /auth/me`) y `onCallback` (errores → `/error-login`)
- `app/sin-acceso/page.tsx`, `app/error-login/page.tsx`

### Archivos modificados
- `proxy.ts`: `auth0.middleware`, guard de sesión y rol, renovación del token
- `core/lib/api.ts`: `getApiToken()` con `auth0.getAccessToken()`
- `app/(admin)/LogoutButton.tsx`: link a `/auth/logout`
- `app/(admin)/users/page.tsx`: columna "Perfil completo" y Nombre `—` si no hay perfil
- `core/types/auth.types.ts`: queda solo `MeResponse`
- `core/types/user.types.ts`: sin `isActive`, `profile` nullable
- `core/config/constants.ts`: sin `AUTH_COOKIES` ni `AUTH_TOKEN_TTL`
- `package.json` / `package-lock.json` (`@auth0/nextjs-auth0` ^4.33.0)
- `agents/AGENTS.md`, `agents/skills/auth-session/SKILL.md` (v2.0), `agents/skills/verification-standard/SKILL.md`, `README.md` (variables de entorno)

### Archivos eliminados
- `app/(auth)/login/page.tsx` y `LoginForm.tsx` (y el grupo `(auth)`), `actions/auth.actions.ts`, `core/lib/cookies.ts`

### Decisiones que no estaban explícitas
1. **Renovación del token en `proxy.ts`** (`auth0.getAccessToken(request, authResponse)`), con redirección al login si falla (RF-9).
   - Las Server Actions del panel atrapan cualquier error y lo devuelven como `{ success: false }`, así que un `redirect()` lanzado desde `apiRequest` quedaría tragado y se vería como el toast "Error de conexión".
   - El proxy corre antes de cada página y de cada Action, y es el único lugar donde el SDK puede persistir el token renovado (lo recomienda la documentación del SDK).
   - `apiRequest` igual redirige a `/auth/login` si no hay token (para páginas).
2. **Pantalla de error del callback en `/error-login`.** El SDK, ante un error del callback, responde por defecto un 500 en texto plano. Se definió `onCallback`: con error, redirige a `/error-login?description=<cause.message || message>`; si sale bien, redirige a `returnTo` o `/`, que es el comportamiento por defecto del SDK.
3. **`beforeSessionSaved` solo consulta `/auth/me` si la sesión todavía no tiene `role`.** Así se cumple "una sola vez al crear la sesión", porque el hook también corre cuando la sesión se actualiza.
4. **`/sin-acceso` sin sesión muestra la pantalla igual** (con el botón de cerrar sesión) en lugar de mandar al login. El spec la define como pública.
5. **El `.env.local` de ejemplo quedó en el README y en `agents/AGENTS.md`** (tabla de variables).
6. Se borraron tipos generados viejos en `.next/types` (artefacto de build, ignorado por git) que referenciaban la página de login eliminada y rompían `tsc`.

### Verificación hecha
- `npx tsc --noEmit` OK, `npm run lint` OK, `npm run build` OK (rutas `/sin-acceso` y `/error-login` presentes, `/login` ya no existe).
- **En vivo** (build de producción en `:3001` + `waiona-core` local en `:3000` contra el tenant real; log `Auth0 OK`):

| RF | Prueba | Resultado |
|---|---|---|
| RF-1 | `GET /products?page=2` sin sesión | `307 → /auth/login?returnTo=%2Fproducts%3Fpage%3D2` ✅ |
| RF-2 (parcial), RF-11 | `GET /auth/login` | Redirige al `/authorize` del tenant con `audience=https://api.waiona.com` y `scope=openid profile email offline_access` ✅; el panel no tiene formulario propio ✅ |
| RF-6 | `GET /sin-acceso` | Título, texto y botón "Cerrar sesión" → `/auth/logout` ✅ |
| RF-10 | `GET /auth/logout` | `307 → https://dev-znayvi14lcxny8d4.us.auth0.com/oidc/logout?…&post_logout_redirect_uri=http://localhost:3001` ✅ |
| Edge case de error en el callback | `GET /auth/callback?error=access_denied&state=xyz` | `307 → /error-login?description=…`, sin 500 ✅ |

### RF sin verificar (requieren iniciar sesión con un usuario real)
RF-2 (rol guardado tras `/auth/me`), RF-3, RF-4, RF-5, RF-7, RF-8, RF-9, RF-12, RF-13 y RF-14. Todavía no existe el usuario super_admin en Auth0 (runbook de `waiona-core`, paso 1c), y el login de Universal Login no se puede automatizar sin credenciales. Se prueban siguiendo la tabla de "Verificación" del spec.

## Estado
- **Status**: completado
- **Fecha**: 2026-10-25
- **Archivos**: `core/lib/auth0.ts`, `proxy.ts`, `core/lib/api.ts`, `app/sin-acceso/page.tsx`, `app/error-login/page.tsx`, `app/(admin)/LogoutButton.tsx`, `app/(admin)/users/page.tsx`, `core/types/auth.types.ts`, `core/types/user.types.ts`, `core/config/constants.ts`, `package.json`, `package-lock.json`, `agents/AGENTS.md`, `agents/skills/auth-session/SKILL.md`, `agents/skills/verification-standard/SKILL.md`, `README.md`. Eliminados: `app/(auth)/login/*`, `actions/auth.actions.ts`, `core/lib/cookies.ts`.
- **Verificación manual**:
  - **En vivo con curl** (backend local + build del panel, tenant real): RF-1, RF-6, RF-10, RF-11 y el edge case de error en el callback.
  - **En vivo por el usuario** (login real como super_admin, 2026-10-25), confirmado en los logs y la base del backend: RF-2 (`/auth/me` → usuario creado como `super_admin`), RF-4 y RF-8 (dashboard, órdenes y categorías con Bearer), RF-14 (módulos recorridos sin errores).
  - **Solo por lectura de código** (no hay rastro de que se hayan probado en vivo): RF-3 (backend caído al loguearse), RF-5 y RF-7 (cuenta `client` → `/sin-acceso` y viceversa), RF-9 (refresh fallido), RF-12 y RF-13 (lista de Usuarios: no hubo request a `/v1/users` en los logs).
  - `npm test` y `gen:types` no existen todavía, así que no hay tests de componentes.
