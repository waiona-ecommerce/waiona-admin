import type { RoleType } from '@/core/enums'
import type { PaginationQuery } from './common.types'

export interface UserProfile {
  id: number
  name: string
  lastName: string
  avatar: string | null
  // YYYY-MM-DD. No editable: el backend rechaza birthDate en PATCH /users/:id.
  // Usuarios creados antes del requisito de +18 tienen 2000-01-01 de relleno.
  birthDate: string
}

export interface UserResponseDto {
  id: number
  email: string
  isActive: boolean
  // true si un admin suspendió la cuenta (banId). Al banear, el backend
  // revoca todos los refresh tokens activos del usuario.
  isBanned: boolean
  role: RoleType | null
  profile: UserProfile
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
