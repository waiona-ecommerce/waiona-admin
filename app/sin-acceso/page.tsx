// Fuera del grupo (admin) para no heredar el layout con el menú: acá llega
// alguien logueado en Auth0 que no es admin ni super_admin.
export default function NoAccessPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">No tenés acceso al panel</h1>
        <p className="text-neutral-600">Esta cuenta no tiene permisos de administrador.</p>
        <a
          href="/auth/logout"
          className="inline-block rounded bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
        >
          Cerrar sesión
        </a>
      </div>
    </div>
  )
}
