// Ruta del SDK de Auth0: cierra la sesión del panel y la de Auth0, y vuelve
// a APP_BASE_URL. Es un link común (<a>): /auth/logout no es una página de Next.
export function LogoutButton() {
  return (
    <a href="/auth/logout" className="text-sm text-neutral-500 hover:text-neutral-900">
      Cerrar sesión
    </a>
  )
}
