# 🛠️ Guía de Instalación - ReservaYa

## Requisitos Previos

- Node.js 18+ 
- PostgreSQL 15+
- npm o yarn

---

## Inicio Rápido

### 1. Clonar Repositorio

```bash
git clone <url-del-repositorio>
cd ReservaYa
```

### 2. Configurar Backend

```bash
cd ReservaYaBackend

# Instalar dependencias
npm install

# Crear archivo de entorno
cp .env.example .env
```

Editar `.env`:
```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/reservaya_db"
JWT_SECRET="tu-clave-secreta-super-segura-cambiar-esto"
FRONTEND_URL="http://localhost:3001"
```

```bash
# Crear tablas en base de datos
npx prisma db push

# Generar cliente Prisma
npx prisma generate

# Cargar datos de prueba
npx prisma db seed

# Iniciar backend (puerto 3000)
npm run dev
```

### 3. Configurar Frontend

```bash
# Nueva terminal
cd ReservaYaFrontend

# Instalar dependencias
npm install

# Iniciar frontend (puerto 3001)
npm run dev
```

### 4. Acceder a la Aplicación

| Interfaz | URL |
|----------|-----|
| Página Principal | http://localhost:3001 |
| Panel Admin | http://localhost:3001/admin |
| Panel Restaurante | http://localhost:3001/manage |
| Login Empleados | http://localhost:3001/auth/login |

---

## Credenciales de Prueba

### Administrador
- **Email:** admin@reservaya.com
- **Contraseña:** admin123

### Gerente de Restaurante
- **Email:** manager@test.com
- **Contraseña:** 123456

### Cliente
- **Email:** cliente@test.com
- **Contraseña:** password123

### Empleados (PIN: 123456)
- waiter@test.com
- chef@test.com
- host@test.com
- bartender@test.com
- **Código de Restaurante:** REST-TEST

---

## Despliegue en Producción

### Opción 1: Vercel (Recomendado)

```bash
# Frontend
cd ReservaYaFrontend
vercel deploy

# Backend
cd ReservaYaBackend
vercel deploy
```

### Opción 2: Docker

```bash
docker-compose up -d
```

### Opción 3: VPS (DigitalOcean, AWS, etc.)

1. Conectar por SSH al servidor
2. Instalar Node.js, PostgreSQL, Nginx
3. Clonar repositorio
4. Configurar variables de entorno
5. Build: `npm run build`
6. Usar PM2: `pm2 start npm --name "backend" -- start`

---

## Base de Datos

### Reiniciar Base de Datos
```bash
npx prisma db push --force-reset
npx prisma db seed
```

### Ver Base de Datos
```bash
npx prisma studio
```

---

## Soporte

Para preguntas sobre la instalación, contactar al vendedor para usar las horas de soporte incluidas.
