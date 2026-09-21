---
name: verification-standard
description: >
  Cómo se verifica un cambio en este repo: tsc, lint, build, tests de componentes, types en sync con el backend y verificación manual RF por RF en el dev server.
  Cargar siempre al implementar o verificar un spec.
metadata:
  author: "@rodrigozucchini"
  version: "2.0"
---

# Verification Standard Skill

Qué hay que correr y qué cuenta como "verificado". Las herramientas de test viven en `component-testing` y `api-types-generation`; esta skill dice cuándo se usan.

---

## Cuándo usar esta skill

Cargar siempre que se implemente o verifique un spec.

---

## Checks

| Check | Comando | Cuándo |
|---|---|---|
| Tipos | `npx tsc --noEmit` | Después de cada paso de implementación |
| Tests de componentes | `npm test` | Si el spec crea/modifica un formulario o un botón con acción (skill `component-testing`) |
| Types en sync | `npm run gen:types` sin diff | Si el spec toca el contrato del backend (skill `api-types-generation`) |
| Lint | `npm run lint` | Al terminar la implementación |
| Build | `npm run build` | Al verificar (`spec-verifier`) |
| Manual | `npm run dev` (puerto 3001) contra el backend en `:3000` | Cada RF, con los pasos de la sección "Verificación" del spec |

> **Tooling pendiente de setup:** `npm test` y `npm run gen:types` todavía no existen. Si el spec los requiere y no están en `package.json`, se frena y se avisa: primero va el spec de setup. Mientras no existan, esos RF se verifican solo a mano y se reporta así.

---

## Reglas

1. **`tsc` pasa antes de avanzar** al siguiente paso. Un error de tipos no se arrastra.
2. **Tests primero para formularios y botones**: se escriben desde los RF, se ven fallar y después se implementa (ver `component-testing`).
3. **Un RF solo cuenta como verificado** si lo cubre un test que pasa, un check estático completo, o se probó en vivo. Leer el código no verifica un flujo de UI.
4. **Los tests de componentes no reemplazan la prueba manual**: prueban el componente aislado con la action mockeada, no que UI y backend se entiendan. Los RF de integración se prueban a mano.
5. **Reportar lo que no se pudo verificar.** Si el backend no está levantado, si faltan credenciales o si el build necesita algo que no hay: se dice qué RF quedó sin verificar y por qué. Nunca se marca como pasado.
6. **Credenciales**: se piden al usuario o se usan las del seed del backend. No se escriben en specs, commits ni en este repo.
7. **Cada RF del spec trae sus pasos de verificación** (test o pasos manuales, y resultado esperado). Si faltan, es un hueco del spec: se pide completarlo, no se improvisa.

---

## Verificación manual: qué mirar

- El camino feliz del RF y sus edge cases (lista vacía, error de la API, 404, 409, doble submit).
- Toast correcto (éxito y error) y redirección.
- Que la lista se actualice tras la escritura (`revalidatePath`).
- Sesión: que sin cookie redirija a `/login`.
- Consola del navegador y terminal del dev server sin errores nuevos.

---

## Errores comunes

- **Dar por buena la feature porque `tsc`, lint y los tests pasan**: no dicen nada de cómo se entiende la UI con el backend real.
- **Verificar solo el camino feliz.**
- **Correr el dev server contra un backend desactualizado** y tomar un desajuste como bug propio: chequear primero la versión de `waiona-core`.
