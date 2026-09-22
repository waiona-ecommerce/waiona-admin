import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIES, AUTH_TOKEN_TTL } from '@/core/config/constants'
import { API_URL } from '@/core/config/env'
import { cookieOptions } from '@/core/lib/cookies'
import { RoleType } from '@/core/enums'
import type { JwtPayload } from '@/core/types'

const PUBLIC_PATHS = ['/login']
const ADMIN_ROLES: RoleType[] = [RoleType.ADMIN, RoleType.SUPER_ADMIN]

function decodeToken(token: string): (JwtPayload & { exp: number }) | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64url').toString())
  } catch {
    return null
  }
}

function isValidAdmin(token: string | undefined): boolean {
  if (!token) return false
  const decoded = decodeToken(token)
  if (!decoded) return false
  if (Date.now() >= decoded.exp * 1000) return false
  return ADMIN_ROLES.includes(decoded.role as RoleType)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get(AUTH_COOKIES.accessToken)?.value
  const refreshToken = request.cookies.get(AUTH_COOKIES.refreshToken)?.value

  if (PUBLIC_PATHS.includes(pathname)) {
    if (isValidAdmin(accessToken)) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  if (isValidAdmin(accessToken)) return NextResponse.next()

  if (refreshToken) {
    // Si el backend no responde, se trata como refresh fallido y se redirige al login
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => null)

    if (res?.ok) {
      const { access_token, refresh_token } = await res.json()
      if (isValidAdmin(access_token)) {
        const response = NextResponse.next()
        response.cookies.set(
          AUTH_COOKIES.accessToken,
          access_token,
          cookieOptions(AUTH_TOKEN_TTL.accessTokenMinutes * 60),
        )
        response.cookies.set(
          AUTH_COOKIES.refreshToken,
          refresh_token,
          cookieOptions(AUTH_TOKEN_TTL.refreshTokenDays * 24 * 60 * 60),
        )
        return response
      }
    }
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}