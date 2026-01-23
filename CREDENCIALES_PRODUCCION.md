# 🔐 Credenciales de Producción - ReservaYa

Este documento contiene las URLs y claves configuradas para tu entorno de producción.
**IMPORTANTE**: No compartas este archivo públicamente.

## 1. Base de Datos (Supabase)
*   **Proyecto**: FlasheyEstudi's Project
*   **Región**: East US (North Virginia)
*   **Contraseña**: `Vn@vyp6YrWDy5$&`
*   **URL de Conexión (Backend en Render)**:
    ```
    postgresql://postgres.knynryrwmajdslujiwas:Vn%40vyp6YrWDy5%24%26@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
    ```
    *(Nota: Esta URL usa el puerto 6543 y el servidor `pooler` para compatibilidad con IPv4 en Render).*

## 2. Servicios Backend (Render)
*   **Socket URL**: `https://reservaya-1.onrender.com`
    *   Variables Clave: `PORT=3002`, `FRONTEND_URL=[Tu Dominio Vercel]`
*   **Backend API URL**: `https://reservaya-t1fk.onrender.com`
    *   Variables Clave: `DATABASE_URL` (la de arriba), `NEXT_PUBLIC_SOCKET_URL` (la del socket)

## 3. Frontend (Vercel)
*   **URL Final**: *(Pendiente de que finalice el deploy en Vercel, será algo como `reservaya.vercel.app`)*.
*   **Variables de Entorno**:
    *   `NEXT_PUBLIC_API_URL`: `https://reservaya-t1fk.onrender.com/api`
    *   `NEXT_PUBLIC_SOCKET_URL`: `https://reservaya-1.onrender.com`

## 📋 Pasos Finales Post-Deploy
1.  Cuando Vercel termine, toma tu dominio (ej: `reservaya.vercel.app`).
2.  Ve a **Render** -> Servicio **ReservaYaSocket** -> Environment.
3.  Actualiza la variable `FRONTEND_URL` con tu dominio real (sin la barra final).
4.  ¡Listo!
