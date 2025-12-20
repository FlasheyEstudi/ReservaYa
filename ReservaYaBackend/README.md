# ReservaYA - Backend API

Sistema de reservas para restaurantes - Backend API con Next.js, Prisma y Socket.io.

## Tecnologías

- **Framework**: Next.js 15 (App Router + API Routes)
- **Base de datos**: PostgreSQL + Prisma ORM
- **Autenticación**: JWT (jsonwebtoken + bcrypt)
- **Tiempo real**: Socket.io (servicio separado en puerto 3002)
- **UI Components**: shadcn/ui + Tailwind CSS

## Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL de PostgreSQL

# 3. Ejecutar migraciones y seed
npx prisma generate
npx prisma db push
npx prisma db seed

# 4. Iniciar servidor de desarrollo
npm run dev
```

## Variables de Entorno

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reservaya_db?schema=public"
JWT_SECRET="tu_clave_secreta_segura"
```

## Endpoints API

| Ruta | Descripción |
|------|-------------|
| `/api/auth/*` | Autenticación (login, registro) |
| `/api/restaurant/*` | Gestión de restaurantes |
| `/api/reservations/*` | Reservaciones |
| `/api/orders/*` | Pedidos y KDS |
| `/api/menu/*` | Gestión de menú |

## Credenciales de Prueba (Seed)

- **Código Restaurante**: `REST-TEST`
- **PIN Empleados**: `123456`
- **Cliente**: `cliente@test.com` / `password123`
- **Empleados**: `manager@test.com`, `chef@test.com`, `waiter@test.com`, `host@test.com`

## Servicio WebSocket

```bash
cd mini-services/websocket-service
npm install
npm run dev  # Puerto 3002
```
