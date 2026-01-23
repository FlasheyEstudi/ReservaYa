# 🚀 Guía de Despliegue Gratuito (Producción)

Esta arquitectura utiliza los mejores servicios gratuitos disponibles para mantener tu aplicación **ReservaYa** funcionando 24/7 sin costo inicial.

## 1. Base de Datos (PostgreSQL) - Neon.tech
Neon ofrece una capa gratuita generosa (3GB) y perfecta para Postgres.

1.  Ve a [Neon.tech](https://neon.tech) y regístrate.
2.  Crea un nuevo proyecto llamado `ReservaYa`.
3.  Copia la **Connection String** (se ve como `postgresql://usuario:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require`).
4.  Esta URL será tu `DATABASE_URL`.

## 2. Backend y Socket - Railway.app
Railway es ideal para correr procesos de Node.js (tu API y tu Socket). Te dan $5.00 de crédito mensual (aprox 500 horas), pero si verificas tu cuenta, puedes extenderlo. *Alternativa: Render.com si prefieres.*

### A. Preparar Repositorio
Asegúrate de que todo tu código esté en **GitHub**. Railway se conecta a tu repositorio.

### B. Desplegar ReservaYaSocket
1.  En Railway, "New Project" -> "Deploy from GitHub repo".
2.  Selecciona tu repo `ReservaYa`.
3.  Railway detectará múltiples carpetas. Configura:
    *   **Root Directory**: `ReservaYaSocket`
    *   **Build Command**: `tsc` (o `npm run build` si añades ese script que ejecute tsc)
    *   **Start Command**: `node dist/index.js`
4.  **Variables de Entorno** (Variables tab):
    *   `PORT`: `3002` (Railway lo inyectará automáticamente, pero es bueno definirlo).
    *   `SOCKET_SECRET`: `tu_secreto_super_seguro`
    *   `FRONTEND_URL`: `https://tu-proyecto-vercel.app` (Lo pondrás después de desplegar Vercel).
5.  Railway generará una URL pública (ej: `socket-production.up.railway.app`). **Guárdala**.

### C. Desplegar ReservaYaBackend (API)
Tu backend es Next.js, pero lo usaremos como API.
1.  En el mismo proyecto de Railway, "New Service" -> GitHub Repo.
2.  Selecciona el repo `ReservaYa`.
3.  Configura:
    *   **Root Directory**: `ReservaYaBackend`
    *   **Build Command**: `npm run build`
    *   **Start Command**: `npm start`
4.  **Variables de Entorno**:
    *   `DATABASE_URL`: (La de Neon del paso 1)
    *   `JWT_SECRET`: `tu_string_secreto`
    *   `PAGADITO_UID`: (Tus credenciales reales)
    *   `PAGADITO_WSK`: (Tus credenciales reales)
    *   `PAGADITO_MODE`: `live`
    *   `NEXT_PUBLIC_API_URL`: (La URL que Railway te generará para este servicio, ej: `https://backend-production.up.railway.app/api`)
    *   `NEXT_PUBLIC_SOCKET_URL`: (La URL del Socket del paso anterior).
5.  Railway generará una URL pública. **Guárdala**.

> **Nota**: Después de configurar la DB, ve a la pestaña "Settings" -> "Deploy" y busca "Deploy Trigger". Asegúrate de que `prisma db push` o `migrations` se ejecuten, o hazlo manualmente desde tu local apuntando a la DB de producción.
> *Recomendado*: Desde tu terminal local, ejecuta `DATABASE_URL="tu_url_neon" npx prisma db push` (dentro de la carpeta Backend) para crear las tablas en Neon.

## 3. Frontend - Vercel
Vercel es el creador de Next.js, es el mejor lugar para el frontend.

1.  Ve a [Vercel.com](https://vercel.com) -> "Add New..." -> "Project".
2.  Importa tu repo `ReservaYa`.
3.  Configura:
    *   **Root Directory**: `ReservaYaFrontend` - Vercel detectará que es Next.js.
4.  **Variables de Entorno**:
    *   `NEXT_PUBLIC_API_URL`: La URL de tu Backend en Railway + `/api` (ej: `https://...railway.app/api`)
    *   `NEXT_PUBLIC_SOCKET_URL`: La URL de tu Socket en Railway.
5.  Despliega.
6.  Obtendrás tu dominio `https://reservaya-frontend.vercel.app`.

## 4. Conexión Final
1.  Vuelve a **Railway** -> **ReservaYaSocket** -> Variables.
2.  Actualiza `FRONTEND_URL` con tu nuevo dominio de Vercel (`https://reservaya-frontend.vercel.app`).
3.  Railway redeployará automáticamente.

---

¡Listo! Tienes una arquitectura profesional, escalable y gratuita para empezar.
