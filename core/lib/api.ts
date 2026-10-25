import { redirect } from 'next/navigation'
import { API_URL } from '@/core/config/env'
import { auth0 } from '@/core/lib/auth0'
import type { ApiErrorResponse } from '@/core/types'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string | string[],
  ) {
    super(Array.isArray(message) ? message.join(', ') : message)
  }
}

// Access token de Auth0 de la sesión. proxy.ts ya lo renovó si estaba vencido;
// si igual no se puede obtener, la sesión no sirve y se vuelve al login.
async function getApiToken(): Promise<string> {
  let token: string | undefined
  try {
    token = (await auth0.getAccessToken()).token
  } catch {
    token = undefined
  }
  if (!token) redirect('/auth/login')
  return token
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options
  const token = await getApiToken()

  const url = new URL(`${API_URL}${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err: ApiErrorResponse = await res.json()
    throw new ApiError(err.statusCode, err.message)
  }

  return res.status === 204 ? (undefined as T) : res.json()
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = await getApiToken()

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  })

  if (!res.ok) {
    const err: ApiErrorResponse = await res.json()
    throw new ApiError(err.statusCode, err.message)
  }

  return res.json()
}
