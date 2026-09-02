# AGENTS.md — Auth Service

## Propósito

Microservicio Node.js responsable de autenticación.

## Responsabilidades

* Login.
* Usuarios.
* Password hashing.
* Validación de credenciales.
* Generación de JWT.
* Futuramente roles.

## No responsabilidades

No implementar:

* Lógica de negocio.
* UI.
* Reglas del dominio del inventory-service.
* Autorización de recursos de negocio.

## PostgreSQL

La base de datos de autenticación pertenece conceptualmente a este servicio.

Actualmente puede contener:

```text
users
```

Modelo conceptual:

```text
users
├── id
├── username
└── password_hash
```

Futuro:

```text
users
roles
user_roles
```

## Passwords

Nunca almacenar passwords en texto plano.

Nunca devolver passwords en respuestas.

Nunca loguear passwords.

## JWT

Antes de modificar el JWT revisar:

```text
docs/authentication.md
docs/decisions/ADR-001-jwt.md
```

OpenCode debe inspeccionar el código real antes de asumir:

* algoritmo,
* claims,
* expiración,
* secret,
* issuer,
* audience.

## Roles futuros

La arquitectura permitirá:

```text
User
 └── Roles
      ├── USER
      ├── ADMIN
      └── MANAGER
```

Cuando se implementen roles, el contrato deberá documentarse antes de cambiar el JWT.

## Secrets

Nunca hardcodear:

```text
JWT_SECRET
DATABASE_PASSWORD
API_KEYS
```

## API

Los cambios en endpoints deben revisar:

```text
docs/api-contract.md
```

## Testing

Debe existir cobertura para:

* Login correcto.
* Login incorrecto.
* Usuario inexistente.
* Password incorrecta.
* Generación de JWT.
* Expiración.
* Claims.

Cuando existan roles:

* Usuario con rol.
* Usuario con múltiples roles.
* Usuario sin rol.
* Rol inválido.

## OpenCode

Antes de modificar:

1. Leer documentación.
2. Revisar package.json.
3. Revisar estructura.
4. Revisar configuración.
5. Revisar implementación JWT.
6. Revisar tests.
7. Implementar el cambio mínimo necesario.
8. Ejecutar pruebas.

No reescribir el servicio completo salvo requerimiento explícito.
