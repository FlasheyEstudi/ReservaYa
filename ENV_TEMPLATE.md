# Plantilla de Variables de Entorno (.env)

Copia este contenido a un archivo llamado `.env` en la raíz de `ReservaYaBackend` y completa los valores.

```env
# --- Base de Datos (PostgreSQL) ---
DATABASE_URL="postgresql://usuario:password@localhost:5432/reservaya?schema=public"

# --- Seguridad (JWT) ---
# Generar con: openssl rand -base64 32
JWT_SECRET="cambiar_esto_por_un_string_largo_y_seguro"

# --- Pagos (Pagadito) ---
# Obtener credenciales en: https://comercios.pagadito.com
PAGADITO_UID=""
PAGADITO_WSK=""
PAGADITO_MODE="sandbox" # Usar 'live' para producción (dinero real)
PAGADITO_RETURN_URL="http://localhost:3001/manage/billing/callback" # Cambiar a https://tu-dominio.com/manage...

# --- Correo Electrónico (Resend) ---
# Integración nativa implementada. Obtener API Key en: https://resend.com
EMAIL_API_KEY=""
EMAIL_FROM="ReservaYa <onboarding@resend.dev>" # O tu dominio verificado en Resend

# --- Frontend & Sockets ---
# URLs públicas de tus servicios
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:8002"
```
