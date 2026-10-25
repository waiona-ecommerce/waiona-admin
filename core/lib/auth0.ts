import { Auth0Client } from '@auth0/nextjs-auth0/server'
import { NextResponse } from 'next/server'
import { API_URL } from '@/core/config/env'
import type { RoleType } from '@/core/enums'

// Sesión del panel con Auth0 (Regular Web App). La sesión vive en una cookie
// cifrada (AUTH0_SECRET); el access token nunca llega al navegador.
// Lee AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET y
// APP_BASE_URL del entorno.
export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email offline_access',
  },

  // El token de Auth0 no trae el rol: se consulta una vez, al crear la
  // sesión, y se guarda en ella. En los refresh la sesión ya lo trae.
  async beforeSessionSaved(session) {
    if ('role' in session.user) return session
    const role = await fetchRole(session.tokenSet.accessToken)
    return { ...session, user: { ...session.user, role } }
  },

  // Por defecto el SDK responde un 500 en texto plano ante un error del
  // callback (ej. email sin verificar): se muestra una pantalla propia.
  async onCallback(error, ctx) {
    const baseUrl = ctx.appBaseUrl ?? process.env.APP_BASE_URL!
    if (error) {
      const cause = error.cause as { message?: string } | undefined
      const url = new URL('/error-login', baseUrl)
      url.searchParams.set('description', cause?.message || error.message)
      return NextResponse.redirect(url)
    }
    return NextResponse.redirect(new URL(ctx.returnTo || '/', baseUrl))
  },
})

// null si /auth/me falla: la sesión queda sin rol y el proxy manda a /sin-acceso
async function fetchRole(accessToken: string): Promise<RoleType | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    const me: { role?: RoleType | null } = await res.json()
    return me.role ?? null
  } catch {
    return null
  }
}
