import type { UserResponseDto } from './user.types'

// GET /auth/me — usuario autenticado. Registro, login, refresh, logout y
// contraseñas los maneja Auth0: no hay más DTOs de auth en la API.
export interface MeResponse extends UserResponseDto {
  // false hasta que el usuario carga nombre, apellido y fecha de nacimiento
  profileComplete: boolean
}
