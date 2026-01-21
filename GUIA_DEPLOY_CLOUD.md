# Guía de Despliegue en la Nube (Demo Online)

GitHub Pages **NO** funciona para este proyecto porque es solo para sitios estáticos (HTML/CSS). Tu sistema es inteligente (tiene Base de Datos, Backend y Sockets).

Para tener tu sistema online "Sencillo y Gratis" (Capa Gratuita), te recomendamos este combo moderno:

## 1. Frontend & Backend (Vercel)
Vercel es el creador de Next.js, por lo que es la mejor opción.
*   **Costo**: Gratis (Hobby).
*   **Cómo**:
    1.  Sube tu código a GitHub.
    2.  Ve a [Vercel.com](https://vercel.com) -> "Add New Project".
    3.  Importa tu repositorio.
    4.  **Importante**: Deberás crear **2 Proyectos en Vercel**:
        *   `reservaya-frontend`: Apunta a la carpeta `ReservaYaFrontend`.
        *   `reservaya-backend`: Apunta a la carpeta `ReservaYaBackend`.

## 2. Base de Datos (Neon o Supabase)
Necesitas una base de datos PostgreSQL en la nube accesible desde internet.
*   **Opción 1: Neon.tech** (Recomendado, Serverless Postgres).
*   **Opción 2: Supabase**.
*   **Configuración**: Obtendrás una `DATABASE_URL` que debes poner en las variables de entorno de Vercel (Proyecto Backend).

## 3. WebSockets (Railway o Render)
Los Sockets necesitan un servidor que "escuche" todo el tiempo (no serverless).
*   **Railway.app** o **Render.com**.
*   Sube solo la carpeta `ReservaYaSocket`.
*   Obtendrás una URL como `https://reservaya-socket.up.railway.app`.

---

## 🚀 Resumen de Variables (En Vercel)

### En Proyecto Backend (Vercel):
*   `DATABASE_URL`: (Tu URL de Neon/Supabase)
*   `JWT_SECRET`: (Tu secreto)

### En Proyecto Frontend (Vercel):
*   `NEXT_PUBLIC_API_URL`: `https://reservaya-backend.vercel.app/api` (La URL que te de Vercel del backend)
*   `NEXT_PUBLIC_SOCKET_URL`: `https://reservaya-socket.up.railway.app` (La URL de Railway)

---

## Opción "Todo en Uno" (Railway)
Si prefieres no usar múltiples servicios, **Railway.app** te permite desplegar todo (Frontend, Backend, Sockets y Base de Datos) en un solo panel. Es muy fácil pero el plan gratuito es limitado (créditos temporales).

**Pasos en Railway:**
1.  "New Project" -> "Deploy from GitHub repo".
2.  Agrega un servicio "PostgreSQL".
3.  Configura las variables de entorno para que se conecten entre sí.
