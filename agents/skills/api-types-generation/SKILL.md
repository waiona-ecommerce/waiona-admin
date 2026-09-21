---
name: api-types-generation
description: >
  Generación de los types del admin desde el Swagger de waiona-core (openapi-typescript), para que un cambio en el contrato del backend rompa tsc en vez de fallar en runtime.
  Cargar cuando el spec agrega o modifica endpoints, DTOs o types de core/types.
metadata:
  author: "@rodrigozucchini"
  version: "1.0"
---

# API Types Generation Skill

Los DTOs de `core/types` hoy se escriben a mano, y así fue como el admin se desalineó del backend. Esta skill define cómo generarlos desde el Swagger del backend para que el desalineo sea un error de `tsc`.

> **Estado: setup pendiente, con un prerrequisito en el backend.**
> - Falta instalar `openapi-typescript` y definir el script `npm run gen:types`.
> - **`waiona-core` todavía no describe todo en Swagger:** 8 de 27 DTOs de respuesta no tienen `@ApiProperty` (entre ellos `product`, `combo`, sus imágenes, `paginated` y los de `shop`) y `nest-cli.json` no tiene el plugin de Swagger. Sus schemas salen vacíos. Se cierra con decoradores, o habilitando el plugin `@nestjs/swagger` en `nest-cli.json` (cambio en el backend, no en este repo).
> - Mientras tanto, los types cuyo schema falta siguen a mano, marcados `// TODO(backend): sin @ApiProperty`.
>
> Si `gen:types` no existe cuando el spec lo necesita, `spec-implementer` frena y avisa: falta el spec de setup.

---

## Cuándo usar esta skill

Cargar cuando el spec:
- Agrega, quita o cambia un endpoint consumido
- Crea o modifica un type de request/response en `core/types/`

No cargar para:
- Enums de runtime (`core/enums/`): siguen a mano porque el generador solo produce uniones de strings
- Lógica de fetch (usar `api-integration`)

---

## Reglas

1. **Fuente**: el JSON de Swagger del backend (`<backend>/api/docs-json`). El backend tiene que estar corriendo **en la versión que se quiere consumir**.
2. **Salida**: `core/types/api.generated.ts`. Se commitea (así `tsc` funciona sin backend) y **nunca se edita a mano**.
3. **Los types de siempre son alias del generado**, así los imports (`@/core/types`) no cambian:
   ```ts
   import type { components } from './api.generated'
   export type CouponResponseDto = components['schemas']['CouponResponseDto']
   export type CreateCouponDto = components['schemas']['CreateCouponDto']
   ```
4. **`PaginatedResponse<T>` sigue a mano** en `common.types.ts`: el DTO genérico del backend no tiene decoradores.
5. **El diff del generado es información**: si al regenerar cambia algo que el spec no menciona, el contrato cambió — se para y se avisa. Si el spec lo menciona, va a su sección "Contrato del backend".
6. **Verificación**: regenerar y confirmar que no hay diff (types en sync) y que `npx tsc --noEmit` pasa.

---

## Qué detecta y qué no

- ✅ Un campo renombrado o eliminado en el backend rompe `tsc` donde el admin lo usa.
- ✅ Un campo nuevo obligatorio en un Create DTO rompe donde se arma el payload.
- ❌ Un valor inesperado en runtime (el tipo dice `number` y llega `string`): eso no lo cubre un tipo.
- ❌ Un DTO sin decoradores en el backend: el schema sale vacío y no protege nada.

---

## Errores comunes

- **Editar `api.generated.ts` a mano**: se pierde en la próxima corrida.
- **Regenerar contra un backend desactualizado** (otra rama): revierte campos y parece que el backend "rompió" algo.
- **Confiar en un type generado vacío** por falta de decoradores: chequear que el schema tenga propiedades antes de aliasarlo.
- **Regenerar y commitear sin mirar el diff.**
