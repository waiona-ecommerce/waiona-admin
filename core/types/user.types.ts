import type { RoleType } from '@/core/enums'
import type { PaginationQuery } from './common.types'

export interface UserProfile {
  id: number
  name: string
  lastName: string
  avatar: string | null
  // YYYY-MM-DD. No editable: el backend rechaza birthDate en PATCH /users/:id.
  birthDate: string
}

export interface UserResponseDto {
  id: number
  email: string
  // true si un admin suspendió la cuenta. Aplica desde la siguiente request.
  isBanned: boolean
  role: RoleType | null
  // null hasta que el usuario completa su perfil (POST /auth/me/profile)
  profile: UserProfile | null
  createdAt: string
  updatedAt: string
}

export interface UpdateUserDto {
  name?: string
  lastName?: string
  avatar?: string
}

export interface SearchUsersDto extends PaginationQuery {
  email?: string
  name?: string
}

export interface UpdateUserStatusDto {
  isBanned: boolean
}
