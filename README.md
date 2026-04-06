# Práctica Intermedia: Gestión de Usuarios — BildyApp

API REST para la gestión de usuarios y compañías de BildyApp, desarrollada con Node.js, Express y MongoDB.

## Tecnologías utilizadas

- **Node.js 22+** con ESM
- **Express 5**
- **MongoDB** + **Mongoose**
- **JWT** para autenticación
- **Zod** para validación de datos
- **bcryptjs** para cifrado de contraseñas
- **Multer** para subida de archivos
- **Helmet** y **express-rate-limit** para seguridad
- **EventEmitter** para eventos del ciclo de vida del usuario
- **Soft delete** con plugin de Mongoose
- **Postman** para pruebas de endpoints

## Requisitos

- Node.js 22 o superior
- MongoDB (local o Atlas)
- npm

## Instalación

Instalar dependencias:

```bash
npm install
```

Configurar variables de entorno:

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT = 
DB_URI = 
NODE_ENV = 
JWT_SECRET = 
JWT_REFRESH_SECRET = 
JWT_EXPIRES_IN = 
JWT_REFRESH_EXPIRES_IN = 
```

## Ejecución

Arrancar el servidor:

```bash
npm run dev
```

El servidor se levantará en `http://localhost:3000` (o el puerto que hayas configurado).

La API estará disponible en `http://localhost:3000/api`

## Estructura del proyecto

Árbol de archivos:

``` bash
src/
├── node_modules/
├── postman/
│   ├── BildyApp.postman_collection
│   └── servidor.postman_environment.json
├── src/
│   ├── config/
│   │   └── index.js
│   ├── controllers/
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error-handler.js
│   │   ├── role.middleware.js
│   │   ├── sanitize.middleware.js
│   │   ├── upload.js
│   │   └── validate.js
│   ├── models/
│   │   ├── Company.js
│   │   └── User.js
│   ├── plugins/
│   │   └── softDelete.plugin.js
│   ├── routes/
│   │   ├── index.js
│   │   └── user.routes.js
│   ├── services/
│   │   └── notification.service.js
│   ├── utils/
│   │   └── AppError.js
│   ├── validators/
│   │   └── user.validator.js
│   ├── app.js
│   └── index.js
├── uploads/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

La carpeta `src/` contiene todo el código fuente dividido en: `config/` para la base de
datos, `controllers/` con la lógica de los endpoints, `middleware/` para autenticación y validación, `models/`
con los esquemas de MongoDB (User y Company), `plugins/` para el soft delete, `routes/` para las rutas,
`validators/` con las validaciones Zod, `services/` para los eventos, y `utils/` con utilidades como la clase
AppError. Fuera de `src/` está la carpeta `uploads/` donde se guardan los logos, `postman/` con la colección
para probar la API, y los archivos de configuración como `.env`, `package.json` y `README.md`.

## Tokens

El `accessToken` se envía en cada petición dentro del header `Authorization: Bearer <token>` y se utiliza en el middleware auth, donde se verifica con jwt.verify y se decodifica para obtener los datos del usuario. Estos datos se guardan en req.user y son los que luego usa el controller.

El `refreshToken` no se usa en cada petición, sino en el endpoint de /refresh. Este token se genera junto al `accessToken` en el login o registro, se guarda en la base de datos asociado al usuario y se envía al cliente. Cuando el `accessToken` expira, el cliente envía el `refreshToken`, el servidor lo verifica y comprueba que coincide con el almacenado en la BD, y si es válido genera un nuevo `accessToken` sin necesidad de volver a iniciar sesión.

## Endpoints

### `POST /api/user/register`

Registra un nuevo usuario en el sistema.

**Body:**

```json
{
    "email": "alex@gmail.com",
    "password": "11111111"
}
```

**Respuesta:**

```json
{
    "data": {
        "email": "alex@gmail.com",
        "status": "pending",
        "role": "admin"
    },
    "verificationCode": "133822",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDM4ZTE2NzE3NTcxY2UyNTgxYWFiYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTQ3MjE1MCwiZXhwIjoxNzc1NDczMDUwfQ.TBmHxTbJMwFulsLIyAcr6bbZEETNyqTg3-XbVuWII0k",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDM4ZTE2NzE3NTcxY2UyNTgxYWFiYiIsImlhdCI6MTc3NTQ3MjE1MCwiZXhwIjoxNzc2MDc2OTUwfQ.G3JQnmQ1CiMcPEIuBJs0gUkxuinXLHEvdzNdgHz4KCw"
}
```

---

### `PUT /api/user/validation`

Valida el email del usuario mediante el código recibido.

**Body:**

```json
{
  "code": "{{verificationCode}}"
}
```

**Respuesta:**

```json
{
    "message": "Email verificado correctamente"
}
```

---

### `POST /api/user/login`

Inicia sesión con email y contraseña.

**Body:**

```json
{
  "email": "alex@gmail.com",
  "password": "11111111"
}
```

**Respuesta:**

```json
{
    "data": {
        "email": "alex@gmail.com",
        "status": "verified",
        "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDM4ZTE2NzE3NTcxY2UyNTgxYWFiYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTQ3MjE1NiwiZXhwIjoxNzc1NDczMDU2fQ.AIL0xjSEwmSI_waS30xKg-qZ5optEeuLrK_pu2hg7r8",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDM4ZTE2NzE3NTcxY2UyNTgxYWFiYiIsImlhdCI6MTc3NTQ3MjE1NiwiZXhwIjoxNzc2MDc2OTU2fQ.A8hUx1ZDFAQI5z4IBOw12ht6sJz782lRew0qb5x52YI"
}
```

---

### `POST /api/user/refresh`

Renueva el access token usando el refresh token.

**Body:**

```json
{
  "refreshToken": "{{refreshToken}}"
}
```

**Respuesta:**

```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDM4ZTE2NzE3NTcxY2UyNTgxYWFiYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTQ3MjE5MSwiZXhwIjoxNzc1NDczMDkxfQ.I7sLQBQpMEAkpOdJV8bBP_2nq1vKzuSH1PamIgQIXaY"
}
```

---

### `PUT /api/user/register`

Completa los datos personales del usuario (nombre, apellidos, NIF y dirección).

**Body:**

```json
{
  "name": "Alex",
  "lastName": "Castellanos",
  "nif": "12345678A",
  "address": {
    "street": "Calle Calamar",
    "number": "34",
    "postal": "28232",
    "city": "Las Rozas",
    "province": "Madrid"
  }
}
```

**Respuesta:**

```json
{
    "data": {
        "address": {
            "street": "Calle Calamar",
            "number": "34",
            "postal": "28232",
            "city": "Las Rozas",
            "province": "Madrid"
        },
        "_id": "69d38e16717571ce2581aabb",
        "email": "alex@gmail.com",
        "role": "admin",
        "status": "verified",
        "verificationCode": null,
        "verificationAttempts": 3,
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDM4ZTE2NzE3NTcxY2UyNTgxYWFiYiIsImlhdCI6MTc3NTQ3MjI0MCwiZXhwIjoxNzc2MDc3MDQwfQ.K2UJKPpceXPcWUVrO8RUdIengOWcJDNuGRHO4QMqaj8",
        "deleted": false,
        "deletedAt": null,
        "deletedBy": null,
        "createdAt": "2026-04-06T10:42:30.351Z",
        "updatedAt": "2026-04-06T10:44:19.692Z",
        "lastName": "Castellanos",
        "name": "Alex",
        "nif": "12345678A",
        "fullName": "Alex Castellanos",
        "id": "69d38e16717571ce2581aabb"
    }
}
```

---

### `PUT /api/user/password`

Cambia la contraseña del usuario.

**Body:**

```json
{
  "currentPassword": "11111111",
  "newPassword": "22222222"
}
```

**Respuesta:**

```json
{
    "message": "Contraseña actualizada correctamente"
}
```

---

### `PATCH /api/user/company`

Registra al usuario una compañía.

**Body para crear empresa:**

```json
{
  "isFreelance": false,
  "name": "NovaTech Solutions SL",
  "cif": "B87654321",
  "address": {
    "street": "Calle Alcalá",
    "number": "42",
    "postal": "28014",
    "city": "Madrid",
    "province": "Madrid"
  }
}
```

**Body para autónomo:**

```json
{
  "isFreelance": true
}
```

**Respuesta:**

```json
{
    "data": {
        "user": {
            "address": {
                "street": "Calle Calamar",
                "number": "34",
                "postal": "28232",
                "city": "Las Rozas",
                "province": "Madrid"
            },
            "_id": "69d38e16717571ce2581aabb",
            "email": "alex@gmail.com",
            "role": "admin",
            "status": "verified",
            "verificationCode": null,
            "verificationAttempts": 3,
            "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDM4ZTE2NzE3NTcxY2UyNTgxYWFiYiIsImlhdCI6MTc3NTQ3MjI0MCwiZXhwIjoxNzc2MDc3MDQwfQ.K2UJKPpceXPcWUVrO8RUdIengOWcJDNuGRHO4QMqaj8",
            "deleted": false,
            "deletedAt": null,
            "deletedBy": null,
            "createdAt": "2026-04-06T10:42:30.351Z",
            "updatedAt": "2026-04-06T10:49:08.915Z",
            "lastName": "Castellanos",
            "name": "Alex",
            "nif": "12345678A",
            "company": "69d38fa4717571ce2581aacb",
            "fullName": "Alex Castellanos",
            "id": "69d38e16717571ce2581aabb"
        },
        "company": {
            "owner": "69d38e16717571ce2581aabb",
            "name": "NovaTech Solutions SL",
            "cif": "B87654321",
            "address": {
                "street": "Calle Alcalá",
                "number": "42",
                "postal": "28014",
                "city": "Madrid",
                "province": "Madrid"
            },
            "logo": null,
            "isFreelance": false,
            "deleted": false,
            "_id": "69d38fa4717571ce2581aacb",
            "deletedAt": null,
            "deletedBy": null,
            "createdAt": "2026-04-06T10:49:08.872Z",
            "updatedAt": "2026-04-06T10:49:08.872Z"
        }
    }
}
```

---

### `PATCH /api/user/logo`

Sube el logo de la compañía del usuario.

**Body:**

- Campo `logo` con el archivo de imagen (jpg, png, webp)
- Tamaño máximo: 5MB

**Respuesta:**

```json
{
    "data": {
        "logo": "http://localhost:3000/uploads/logo_1775472640553.jpg"
    }
}
```

---

### `GET /api/user`

Obtiene los datos completos del usuario autenticado y su compañía.

**Respuesta:**

```json
{
    "data": {
        "address": {
            "street": "Calle Calamar",
            "number": "34",
            "postal": "28232",
            "city": "Las Rozas",
            "province": "Madrid"
        },
        "_id": "69d38e16717571ce2581aabb",
        "email": "alex@gmail.com",
        "role": "admin",
        "status": "verified",
        "verificationCode": null,
        "verificationAttempts": 3,
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDM4ZTE2NzE3NTcxY2UyNTgxYWFiYiIsImlhdCI6MTc3NTQ3MjI0MCwiZXhwIjoxNzc2MDc3MDQwfQ.K2UJKPpceXPcWUVrO8RUdIengOWcJDNuGRHO4QMqaj8",
        "deleted": false,
        "deletedAt": null,
        "deletedBy": null,
        "createdAt": "2026-04-06T10:42:30.351Z",
        "updatedAt": "2026-04-06T10:49:08.915Z",
        "lastName": "Castellanos",
        "name": "Alex",
        "nif": "12345678A",
        "company": {
            "address": {
                "street": "Calle Alcalá",
                "number": "42",
                "postal": "28014",
                "city": "Madrid",
                "province": "Madrid"
            },
            "_id": "69d38fa4717571ce2581aacb",
            "owner": "69d38e16717571ce2581aabb",
            "name": "NovaTech Solutions SL",
            "cif": "B87654321",
            "logo": "http://localhost:3000/uploads/logo_1775472640553.jpg",
            "isFreelance": false,
            "deleted": false,
            "deletedAt": null,
            "deletedBy": null,
            "createdAt": "2026-04-06T10:49:08.872Z",
            "updatedAt": "2026-04-06T10:50:40.582Z"
        },
        "fullName": "Alex Castellanos",
        "id": "69d38e16717571ce2581aabb"
    }
}
```

---

### `POST /api/user/invite`

Invita a un nuevo usuario a unirse a la compañía (solo admin).

**Body:**

```json
{
  "email": "invitado@gmail.com",
  "password": "000000000"
}
```

**Respuesta:**

```json
{
    "data": {
        "email": "invitado@gmail.com",
        "role": "guest"
    }
}
```  

---

### `POST /api/user/logout`

Cierra la sesión del usuario.

**Respuesta:**

```json
{
    "message": "Sesión cerrada correctamente"
}
```

---

### `DELETE /api/user`

Elimina la cuenta del usuario (soft o hard delete).

**Query params:**

- `soft = true` → Borrado lógico (marca como eliminado pero no borra de la BD)
- `soft = false` → Borrado físico (elimina completamente de la BD)

**Respuesta (soft delete):**

```json
{
    "message": "Usuario desactivado correctamente"
}
```

**Respuesta (hard delete):**

```json
{
    "message": "Usuario eliminado correctamente"
}
```

## Pruebas con Postman

Hay una colección de Postman incluida en la carpeta `/postman` con ejemplos de todas las peticiones.

Pasos para usarla:

1. Importar `BildyApp.postman_collection.json` en Postman
2. Importar `servidor.postman_environment.json` como environment
3. Configurar la variable `baseUrl` con tu URL local (por defecto `http://localhost:3000/api`)
4. Las demás variables (`accessToken`, `refreshToken`, `verificationCode`) se rellenan automáticamente
5. Ejecutar las peticiones en el orden adecuado (registro → validación → login → resto de endpoints)
