// Error del callback de Auth0 (ej. email sin verificar, rechazado por la Action
// post-login). El SDK por defecto respondería un 500 en texto plano.
export default async function LoginErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ description?: string }>
}) {
  const { description } = await searchParams

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">No se pudo iniciar sesión</h1>
        {description && <p className="text-neutral-600">{description}</p>}
        <a href="/auth/login" className="inline-block text-sm text-neutral-900 underline">
          Volver a intentar
        </a>
      </div>
    </div>
  )
}
