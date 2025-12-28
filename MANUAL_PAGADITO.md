# Guía de Integración Pagadito - ReservaYa

Este sistema ya incluye el módulo de pagos integrado (`src/lib/pagadito.ts`). Actualmente funciona en **Modo Simulación** (gratis, para pruebas). Para recibir dinero real, sigue estos pasos:

## 1. Obtener Credenciales
1. Ve a [Pagadito Comercios](https://comercios.pagadito.com) e inicia sesión.
2. Navega a **Configuración Técnica** > **Parámetros de Integración**.
3. Copia los valores de:
   *   **UID** (Identificador de Usuario)
   *   **WSK** (Clave de Acceso Web / Web Service Key)

## 2. Activar en ReservaYa
Abre el archivo `.env` en `ReservaYaBackend` (o configúralo en las variables de entorno de tu servidor/Vercel) y agrega:

```env
# Credenciales de Pagadito
PAGADITO_UID="tu_uid_copiado_aqui"
PAGADITO_WSK="tu_wsk_copiada_aqui"

# Modo de Operación
# 'sandbox' = Pruebas con dinero ficticio de Pagadito
# 'live'    = Dinero real (Producción)
PAGADITO_MODE="live"

# URL de Retorno (Donde regresa el usuario tras pagar)
# En desarrollo: http://localhost:3001/manage/billing/callback
# En producción: https://tu-dominio.com/manage/billing/callback
PAGADITO_RETURN_URL="https://tu-dominio.com/manage/billing/callback"
```

## 3. Verificar
Una vez guardado el archivo `.env` y reiniciado el backend:
1. El sistema detectará automáticamente las credenciales.
2. Al intentar pagar una suscripción Premium, te redirigirá a la pasarela segura de Pagadito en lugar de la simulación local.

## Solución de Problemas
*   **Error de Conexión**: Verifica que tu servidor tenga salida a internet (puerto 443 abierto).
*   **Error WSK**: Asegúrate de no tener espacios en blanco al copiar la clave.
*   **IP Bloqueada**: En el panel de Pagadito, asegúrate de "Permitir transacciones desde cualquier IP" o agregar la IP de tu servidor VPS.
