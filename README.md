# Práctica Final: Digitalización de Albaranes — BildyApp

API REST completa para la gestión de albaranes, clientes, proyectos y usuarios de BildyApp, desarrollada con Node.js, Express y MongoDB.

## Tecnologías utilizadas

- **Node.js 22+** con ESM
- **Express 5**
- **MongoDB** + **Mongoose**
- **JWT** para autenticación (access + refresh tokens)
- **Zod** para validación de datos
- **bcryptjs** para cifrado de contraseñas
- **Multer** para subida de archivos
- **Cloudinary** para almacenamiento de imágenes y PDFs
- **Sharp** para optimización de imágenes
- **PDFKit** para generación de PDFs
- **Socket.IO** para WebSockets en tiempo real
- **Nodemailer** para envío de emails
- **@slack/webhook** para notificaciones de errores
- **Swagger** (`swagger-ui-express` + `swagger-jsdoc`) para documentación
- **Jest** + **Supertest** para testing
- **mongodb-memory-server** para tests
- **Docker** + **Docker Compose** para contenedores
- **GitHub Actions** para CI/CD
- **Helmet** y **express-rate-limit** para seguridad
- **Soft delete** con plugin de Mongoose

## Requisitos

- Node.js 22 o superior
- MongoDB (local o Atlas)
- npm
- Cuenta de Cloudinary
- Cuenta de Gmail con App Password
- Webhook de Slack

## Instalación

Instalar dependencias:

```bash
npm install
```

Crear un archivo `.env` en la raíz del proyecto:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_URI=mongodb://localhost:27017/bildyapp

# JWT
JWT_SECRET=tu_secret_key_segura
JWT_REFRESH_SECRET=tu_refresh_secret_key_segura
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Email
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password_gmail

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/TU_WEBHOOK
```

### Configurar Gmail App Password

1. Ir a la cuenta de Google → Seguridad
2. Activar verificación en 2 pasos
3. Ir a "Contraseñas de aplicaciones"
4. Generar contraseña para "Correo"
5. Copiar la contraseña en `EMAIL_PASSWORD`

### Configurar Slack Webhook

1. Ir a <https://api.slack.com/apps>
2. Crear nueva app
3. Activar "Incoming Webhooks"
4. Añadir webhook al canal
5. Copiar URL en `SLACK_WEBHOOK_URL`

Archivo `.env.test` para tests:

```env
PORT=3001
NODE_ENV=test
DB_URI=mongodb://localhost:27017/bildyapp_test
JWT_SECRET=test_secret
JWT_REFRESH_SECRET=test_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## Ejecución

Arrancar el servidor:

```bash
npm run dev
```

El servidor se levantará en `http://localhost:3000`

La API estará disponible en `http://localhost:3000/api`

Ejecutar tests:

```bash
npm test
```

Con Docker:

```bash
docker-compose up --build
```

Esto levantará la API en `http://localhost:3000` y MongoDB en `mongodb://localhost:27017`

## Documentación API

Swagger disponible en: `http://localhost:3000/api-docs`

## Estructura del proyecto

```
├── src/
│   ├── config/
│   │   └── index.js
│   ├── controllers/
│   │   ├── user.controller.js
│   │   ├── client.controller.js
│   │   ├── project.controller.js
│   │   └── deliverynote.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── error-handler.js
│   │   ├── role.middleware.js
│   │   ├── sanitize.middleware.js
│   │   ├── upload.js
│   │   └── validate.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── Client.js
│   │   ├── Project.js
│   │   └── DeliveryNote.js
│   ├── plugins/
│   │   └── softDelete.plugin.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── user.routes.js
│   │   ├── client.routes.js
│   │   ├── project.routes.js
│   │   └── deliverynote.routes.js
│   ├── services/
│   │   ├── notification.service.js
│   │   ├── storage.service.js
│   │   ├── email.service.js
│   │   ├── pdf.service.js
│   │   └── image.service.js
│   ├── socket/
│   │   └── index.js
│   ├── utils/
│   │   └── AppError.js
│   ├── validators/
│   │   ├── user.validator.js
│   │   ├── client.validator.js
│   │   ├── project.validator.js
│   │   └── deliverynote.validator.js
│   ├── app.js
│   ├── index.js
│   └── swagger.js
├── tests/
│   ├── user.test.js
│   ├── client.test.js
│   ├── project.test.js
│   ├── deliverynote.test.js
│   ├── setup.js
│   └── mocks/
│       ├── cloudinary.js
│       └── email.js
├── postman/
│   ├── User.json
│   ├── Clients.json
│   ├── Projects.json
│   └── DeliveryNotes.json
├── .github/
│   └── workflows/
│       └── test.yml
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── .env
├── .env.example
├── .env.test
├── .gitignore
├── package.json
└── README.md
```

## Tokens

El `accessToken` se envía en cada petición dentro del header `Authorization: Bearer <token>` y se utiliza en el middleware auth, donde se verifica con jwt.verify y se decodifica para obtener los datos del usuario. Estos datos se guardan en req.user y son los que luego usa el controller.

El `refreshToken` no se usa en cada petición, sino en el endpoint de /refresh. Este token se genera junto al `accessToken` en el login o registro, se guarda en la base de datos asociado al usuario y se envía al cliente. Cuando el `accessToken` expira, el cliente envía el `refreshToken`, el servidor lo verifica y comprueba que coincide con el almacenado en la BD, y si es válido genera un nuevo `accessToken` sin necesidad de volver a iniciar sesión.

## WebSockets

La API emite eventos en tiempo real a través de Socket.IO. Solo se notifican a usuarios de la misma compañía.

**Eventos de Clientes:**

- `client:new` - Cliente creado
- `client:updated` - Cliente actualizado
- `client:deleted` - Cliente eliminado

**Eventos de Proyectos:**

- `project:new` - Proyecto creado
- `project:updated` - Proyecto actualizado
- `project:deleted` - Proyecto eliminado

**Eventos de Albaranes:**

- `deliverynote:new` - Albarán creado
- `deliverynote:signed` - Albarán firmado

## Testing

Ejecutar todos los tests:

```bash
npm test
```

Ver cobertura:

```bash
npm run test:coverage
```

138 tests con cobertura >= 70%. Usa supertest para integración, MongoDB en memoria y mocks de Cloudinary/Nodemailer.

## Docker

Construir imagen:

```bash
docker build -t bildyapp .
```

Ejecutar con docker-compose:

```bash
docker-compose up
```

## CI/CD

GitHub Actions ejecuta automáticamente en cada push:

- Instalación de dependencias
- Ejecución de tests
- Verificación de cobertura
- Subida a Codecov

## Endpoints

### Usuarios (`/api/user`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/register` | Registrar nuevo usuario |
| PUT | `/validation` | Validar email con código |
| POST | `/login` | Iniciar sesión |
| POST | `/refresh` | Renovar access token |
| PUT | `/register` | Completar datos personales |
| PUT | `/password` | Cambiar contraseña |
| PATCH | `/company` | Crear/actualizar compañía |
| PATCH | `/logo` | Subir logo de compañía |
| GET | `/` | Obtener usuario autenticado |
| POST | `/invite` | Invitar usuario (admin) |
| POST | `/logout` | Cerrar sesión |
| DELETE | `/` | Eliminar usuario (soft/hard) |

### Clientes (`/api/client`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear cliente |
| GET | `/` | Listar clientes |
| GET | `/:id` | Obtener cliente |
| PUT | `/:id` | Actualizar cliente |
| DELETE | `/:id` | Eliminar cliente |
| GET | `/archived` | Listar archivados |
| PATCH | `/:id/restore` | Restaurar cliente |

Filtros: `?name=`

### Proyectos (`/api/project`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear proyecto |
| GET | `/` | Listar proyectos |
| GET | `/:id` | Obtener proyecto |
| PUT | `/:id` | Actualizar proyecto |
| DELETE | `/:id` | Eliminar proyecto |
| GET | `/archived` | Listar archivados |
| PATCH | `/:id/restore` | Restaurar proyecto |

Filtros: `?client=`, `?name=`, `?active=`

### Albaranes (`/api/deliverynote`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/` | Crear albarán |
| GET | `/` | Listar albaranes |
| GET | `/:id` | Obtener albarán |
| PATCH | `/:id/sign` | Firmar albarán |
| GET | `/pdf/:id` | Descargar PDF |
| DELETE | `/:id` | Eliminar albarán |

Filtros: `?project=`, `?client=`, `?format=`, `?signed=`, `?from=`, `?to=`

**Tipos de albaranes:**

Material:

```json
{
  "project": "projectId",
  "client": "clientId",
  "format": "material",
  "workDate": "2025-01-15",
  "description": "Entrega de materiales",
  "material": "Cemento gris 25kg",
  "quantity": 20,
  "unit": "sacos"
}
```

Horas:

```json
{
  "project": "projectId",
  "client": "clientId",
  "format": "hours",
  "workDate": "2025-01-15",
  "description": "Jornada de trabajo",
  "hours": 8
}
```

Horas con trabajadores:

```json
{
  "project": "projectId",
  "client": "clientId",
  "format": "hours",
  "workDate": "2025-01-15",
  "description": "Jornada de trabajo",
  "workers": [
    {
      "name": "Juan Pérez",
      "hours": 8
    }
  ]
}
```

## Ejemplos de uso

### Registro e inicio de sesión

**POST /api/user/register**

Body:

```json
{
    "email": "alex@gmail.com",
    "password": "11111111"
}
```

Respuesta:

```json
{
    "data": {
        "email": "alex@gmail.com",
        "status": "pending",
        "role": "admin"
    },
    "verificationCode": "133822",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**PUT /api/user/validation**

Body:

```json
{
  "code": "133822"
}
```

**POST /api/user/login**

Body:

```json
{
  "email": "alex@gmail.com",
  "password": "11111111"
}
```

Respuesta:

```json
{
    "data": {
        "email": "alex@gmail.com",
        "status": "verified",
        "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**POST /api/user/refresh**

Body:

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**PUT /api/user/register**

Body:

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

**PUT /api/user/password**

Body:

```json
{
  "currentPassword": "11111111",
  "newPassword": "22222222"
}
```

**PATCH /api/user/company**

Body para empresa:

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

Body para autónomo:

```json
{
  "isFreelance": true
}
```

**PATCH /api/user/logo**

Body: form-data con campo `logo` (archivo jpg, png, webp, máx 5MB)

**GET /api/user**

Devuelve usuario autenticado con su compañía.

**POST /api/user/invite**

Body:

```json
{
  "email": "invitado@gmail.com",
  "password": "000000000"
}
```

**POST /api/user/logout**

Cierra sesión.

**DELETE /api/user**

Query params: `?soft=true` (borrado lógico) o `?soft=false` (borrado físico)

## Pruebas con Postman

Colecciones disponibles en `/postman`:

- `User.json`
- `Clients.json`
- `Projects.json`
- `DeliveryNotes.json`

Pasos:

1. Importar las 4 colecciones en Postman
2. Crear environment "servidor" con las variables: `accessToken`, `refreshToken`, `verificationCode`, `clientId`, `projectId`, `deliveryNoteId`
3. Ejecutar en orden:
   - User → Login (guarda `accessToken`)
   - Clients → Crear cliente (guarda `clientId`)
   - Projects → Crear proyecto (guarda `projectId`)
   - DeliveryNotes → Crear albarán (guarda `deliveryNoteId`)

Las variables se guardan automáticamente mediante scripts de test.

## Seguridad

- Helmet para headers HTTP
- express-rate-limit para límite de peticiones
- bcryptjs para cifrado de contraseñas
- JWT para autenticación
- Zod para validación de datos
- CORS configurado

## Notificaciones

**Emails:**

- Código de verificación en registro
- Invitación de usuarios

**Slack:**

- Errores 5XX con stack trace y detalles del request
