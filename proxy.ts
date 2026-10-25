import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from '@/core/lib/auth0'
import { RoleType } from '@/core/enums'

const ADMIN_ROLES: RoleType[] = [RoleType.ADMIN, RoleType.SUPER_ADMIN]
const NO_ACCESS_PATH = '/sin-acceso'
const LOGIN_ERROR_PATH = '/error-login'

export async function proxy(request: NextRequest) {
  // Monta /auth/login, /auth/logout y /auth/callback, y hace rolling de la sesión
  const authResponse = await auth0.middleware(request)
  const { pathname, search } = request.nextUrl

  if (pathname.startsWith('/auth/') || pathname === LOGIN_ERROR_PATH) return authResponse

  const session = await auth0.getSession(request)
  const isAdmin = ADMIN_ROLES.includes(session?.user.role as RoleType)

  if (pathname === NO_ACCESS_PATH) {
    return isAdmin ? NextResponse.redirect(new URL('/', request.url)) : authResponse
  }

  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('returnTo', `${pathname}${search}`)

  if (!session) return NextResponse.redirect(loginUrl)
  if (!isAdmin) return NextResponse.redirect(new URL(NO_ACCESS_PATH, request.url))

  // Renueva el access token acá (el SDK persiste el token nuevo en la cookie);
  // los Server Components y Actions no pueden escribir cookies. Si el refresh
  // falla, la sesión ya no sirve.
  try {
    await auth0.getAccessToken(request, authResponse)
  } catch {
    return NextResponse.redirect(loginUrl)
  }

  return authResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
