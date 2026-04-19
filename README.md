# Auth Service - NestJS + JWT

Este microservicio maneja autenticación basada en JWT.

## Tecnologías

* NestJS
* PostgreSQL
* JWT (jsonwebtoken)
* bcrypt

---

## Configuración

1. Clonar el proyecto
2. Crear archivo `.env`:

PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=admin
DB_NAME=auth-db
JWT_SECRET=super_secret_key

---

## Base de datos

Tabla `users`:

* id (UUID)
* email (único)
* password (hash)
* created_at

---

## Ejecutar proyecto

npm install
npm run start:dev

---

## Endpoints

### Registro

POST /auth/register

Body:
{
"email": "[user@test.com](mailto:user@test.com)",
"password": "123456"
}

---

### Login

POST /auth/login

Body:
{
"email": "[user@test.com](mailto:user@test.com)",
"password": "123456"
}

Respuesta:
{
"access_token": "JWT_TOKEN"
}

---

## Autenticación

Usa header:

Authorization: Bearer <token>

---

## Flujo de autenticación

1. Usuario se registra
2. Usuario hace login
3. Se genera JWT
4. Cliente envía token en cada request
5. Backend valida token

---

## Buenas prácticas

* Nunca guardar passwords en texto plano
* Usar bcrypt para hash
* Mantener JWT_SECRET seguro
* Configurar expiración del token

---

## Ejemplo Payload JWT

{
"sub": "user_id",
"email": "[user@test.com](mailto:user@test.com)",
"iat": 123456,
"exp": 123999
}

---

## Arquitectura

Este servicio forma parte de una arquitectura de microservicios:

* auth-service → autenticación
* user-db → usuarios
* otros servicios consumen JWT

---

## Mejoras futuras

* Refresh tokens
* Roles (admin/user)
* OAuth (Google, GitHub)
* Rate limiting
* API Gateway
