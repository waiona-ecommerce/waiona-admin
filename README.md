# Waiona Admin

Panel de administración de Waiona (Next.js) — catálogo, precios, stock, cupones/descuentos, órdenes, usuarios y estadísticas del negocio.

## Documentación

Toda la documentación de la API con la que integra este panel vive en el repo del backend, no acá — para no mantener dos copias que se desactualizan entre sí:

**[waiona-ecommerce/waiona-core/docs](https://github.com/waiona-ecommerce/waiona-core/tree/develop/docs)**

Punto de partida recomendado para este proyecto: **[docs/Frontend](https://github.com/waiona-ecommerce/waiona-core/tree/develop/docs/Frontend)**, en particular la subcarpeta **[Admin](https://github.com/waiona-ecommerce/waiona-core/tree/develop/docs/Frontend/Admin)** (flujos operativos, dashboard/analytics, catálogo y precios) — más los documentos compartidos de esa misma carpeta (ciclo de auth, matriz de permisos, changelog de la API).

El resto de las secciones también son relevantes según lo que se esté construyendo:

- **[docs/Negocio-Producto](https://github.com/waiona-ecommerce/waiona-core/tree/develop/docs/Negocio-Producto)** — reglas de negocio en lenguaje llano (útil para copy de UI, validaciones, mensajes de error) y casos de uso por rol.
- **[docs/Developers](https://github.com/waiona-ecommerce/waiona-core/tree/develop/docs/Developers)** — arquitectura del backend, si hace falta entender algo más profundo que el contrato de la API.
- **[docs/Seguridad-Compliance](https://github.com/waiona-ecommerce/waiona-core/tree/develop/docs/Seguridad-Compliance)** — si se toca algo sensible (gestión de accesos, datos de usuarios).

Para el shape exacto de cada endpoint (parámetros, tipos, probar requests), la referencia interactiva sigue siendo Swagger en `/api/docs` del ambiente correspondiente.

> `waiona-core` es un repo privado — hace falta acceso de lectura ahí para ver estos links.
