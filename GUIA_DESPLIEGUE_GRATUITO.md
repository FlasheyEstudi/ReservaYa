# 🚀 Guía de Despliegue Gratuito (Producción)

Esta arquitectura utiliza los mejores servicios gratuitos disponibles para mantener tu aplicación **ReservaYa** funcionando 24/7 sin costo inicial.

## 1. Base de Datos (PostgreSQL) - Supabase
Supabase es la alternativa más robusta y fácil.

1.  Ve a [Supabase.com](https://supabase.com) -> "Start your project" -> Regístrate.
2.  **New Project** -> Selecciona una organización.
3.  Configura:
    *   **Name**: `ReservaYa`
    *   **Database Password**: **¡Escríbela y GUÁRDALA!** (No podrás verla después).
    *   **Region**: `East US (North Virginia)` (Mejor latencia si usas Render en US).
4.  Dale a **Create new project**. Espera unos minutos a que se configure.
5.  Ve a **Project Settings** (icono de engranaje ⚙️) -> **Database**.
6.  Baja a la sección **Connection parameters** -> **Connection String**.
7.  Cambia a la pestaña **"URI"** y asegúrate de que **"Mode"** esté en **"Session"** (Puerto 5432).
8.  Copia la cadena entera. Se verá como: `postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
    *   *OJO*: Tienes que reemplazar `[password]` manualmnete con la contraseña que creaste en el paso 3.

## 2. Backend y Socket - Render.com
Render es la mejor alternativa gratuita a Railway. Su plan "Free" permite alojar servicios web.
*Nota*: En la versión gratuita, los servicios se "duermen" si no se usan por 15 minutos y tardan unos segundos en despertar.

1.  Ve a [Render.com](https://render.com) y regístrate con GitHub.
2.  Haz clic en **"New +"** -> **"Web Service"**.

### A. Desplegar ReservaYaSocket
1.  Conecta tu repositorio `ReservaYa`.
2.  Configura:
    *   **Name**: `reservaya-socket`
    *   **Root Directory**: `ReservaYaSocket`
    *   **Environment**: `Node`
    *   **Build Command**: `npm install && npm run build`
    *   **Start Command**: `npm start`
    *   **Plan**: Free
3.  **Environment Variables** (Abajo del todo):
    *   `PORT`: `3002` (Aunque Render usa el suyo propio, es bueno dejarlo).
    *   `SOCKET_SECRET`: `tu_secreto_super_seguro`
    *   `FRONTEND_URL`: `https://tu-proyecto-vercel.app` (Lo actualizarás después).
4.  Dale a **Create Web Service**.
5.  Copia la URL que te dan (ej: `https://reservaya-socket.onrender.com`).

### B. Desplegar ReservaYaBackend (API)
1.  Vuelve al Dashboard y crea otro **"Web Service"** -> Repo `ReservaYa`.
2.  Configura:
    *   **Name**: `reservaya-backend`
    *   **Root Directory**: `ReservaYaBackend`
    *   **Environment**: `Node`
    *   **Build Command**: `npm install && npx prisma db push && npm run build`
        *   *IMPORTANTE*: El comando `npx prisma db push` aquí es el truco para que **se creen tus tablas en Neon automáticamente**.
    *   **Start Command**: `npm start`
    *   **Plan**: Free
3.  **Environment Variables**:
    *   `DATABASE_URL`: (Tu URL de Neon que empieza por `postgres://...`)
    *   `JWT_SECRET`: `tu_string_secreto`
    *   `PAGADITO_UID`: (Tus credenciales)
    *   `PAGADITO_WSK`: (Tus credenciales)
    *   `PAGADITO_MODE`: `live`
    *   `NEXT_PUBLIC_SOCKET_URL`: (La URL del Socket de Render que copiaste antes).
4.  Dale a **Create Web Service**.
5.  Copia la URL de tu backend.

## 3. Frontend - Vercel
Vercel es el creador de Next.js, es el mejor lugar para el frontend.

1.  Ve a [Vercel.com](https://vercel.com) -> "Add New..." -> "Project".
2.  Importa tu repo `ReservaYa`.
3.  Configura:
    *   **Root Directory**: `ReservaYaFrontend` - Vercel detectará que es Next.js.
4.  **Variables de Entorno**:
    *   `NEXT_PUBLIC_API_URL`: La URL de tu Backend en Render + `/api` (ej: `https://reservaya-backend.onrender.com/api`)
    *   `NEXT_PUBLIC_SOCKET_URL`: La URL de tu Socket en Render.
5.  Despliega.
6.  Obtendrás tu dominio `https://reservaya-frontend.vercel.app`.

## 4. Conexión Final (CORS)
1.  Vuelve a **Render** -> **ReservaYaSocket** -> Environment.
2.  Edita `FRONTEND_URL` con tu nuevo dominio de Vercel.
3.  Render redeployará automáticamente.

---

¡Listo! Tienes una arquitectura profesional, escalable y gratuita para empezar.
