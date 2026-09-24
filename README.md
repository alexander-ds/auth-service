# EjercicioIA - auth-service

Microservicio de autenticación del sistema de inventario desarrollado en **Node.js (NestJS)**.

No implementa lógica de negocio: su única responsabilidad es autenticar usuarios y emitir JWT válidos.

## Responsabilidades

* Login.
* Usuarios.
* Password hashing.
* Validación de credenciales.
* Generación de JWT.
* Futura gestión de roles.

## Stack

* Node.js + NestJS
* Passport + passport-jwt
* bcrypt
* PostgreSQL (`pg`)
* Swagger UI

## Repositorios

| Proyecto | Descripción | Repositorio |
|---|---|---|
| `EjercicioIA-inventario` | Repositorio principal: documentación, scripts SQL y orquestación del proyecto | https://github.com/alexander-ds/EjercicioIA-inventario |
| `auth-service` | Microservicio de autenticación (Node.js): login, users, roles, permisos y generación de JWT | https://github.com/alexander-ds/auth-service |
| `inventory-service` | API principal (Spring Boot): lógica de negocio, inventario, autorización y validación del JWT | https://github.com/alexander-ds/inventory-service |
| `inventory-front` | Aplicación web (React): interfaz de usuario, login/logout y consumo de APIs | https://github.com/alexander-ds/inventory-front |

## Base de datos

* `auth_db` — pertenece exclusivamente a `auth-service`.

Esquema:

```text
auth_db
├── users
├── roles
├── permissions
├── user_roles
├── role_permissions
└── refresh_tokens
```

Los passwords se almacenan únicamente como hash (bcrypt), nunca en texto plano.

Los scripts SQL de creación e inserts de ejemplo están en `../DDBB/` (`auth.sql`, `insert-auth.sql`).

## Credenciales de ejemplo

Clave de los usuarios de desarrollo: `123456`

| Usuario | Rol |
|---|---|
| `admin@inventory.local` | ADMIN |
| `seller@inventory.local` | SELLER |
| `ALX@email.com` | SELLER |
| `test@email.com` | CLIENT |

## Seguridad

Nunca hardcodear ni commitear:

```text
JWT_SECRET
DATABASE_PASSWORD
API_KEYS
```

Los valores dependientes del entorno se configuran externamente (`.env` — ver `.env.example`).

## Documentación

* `../docs/authentication.md` — flujo de autenticación y JWT.
* `../docs/api-contract.md` — contratos de los endpoints.
* `../docs/databases.md` — estructura de bases de datos.
* `../docs/decisions/` — ADRs (decisiones de arquitectura).

## Estándares

Antes de trabajar en el código, leer `AGENTS.md` de la raíz y el `AGENTS.md` de este módulo.