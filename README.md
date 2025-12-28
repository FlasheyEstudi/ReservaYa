# 🍽️ ReservaYa - Solución Integral SaaS para Restaurantes

> **Plataforma All-in-One**: Gestión de Reservas, Punto de Venta (POS), Cocina, Menú Digital y Administración Multi-sucursal.

![Estado](https://img.shields.io/badge/Estado-Producción%20Ready-success)
![Versión](https://img.shields.io/badge/Versión-1.0.0-blue)
![Licencia](https://img.shields.io/badge/Licencia-Propietaria-red)

## 📋 Tabla de Contenidos
1.  [Descripción General](#-descripción-general)
2.  [Características Clave](#-características-clave)
3.  [Tecnología (Stack Técnico)](#-tecnología-stack-técnico)
4.  [Arquitectura del Sistema](#-arquitectura-del-sistema)
5.  [Instalación y Configuración](#-instalación-y-configuración)
6.  [Pase a Producción](#-pase-a-producción-despliegue)
7.  [Estructura del Proyecto](#-estructura-del-proyecto)

---

## 🚀 Descripción General
**ReservaYa** es un sistema SaaS diseñado para digitalizar la operación completa de un restaurante. Desde que un cliente reserva una mesa en la web, hasta que el mesero toma la orden en una tablet y la cocina recibe el ticket en tiempo real. Soporta modelos de negocio complejos como cadenas de restaurantes (multi-sucursal), roles de empleados granulares y suscripciones de pago.

---

## ✨ Características Clave

### 🏪 Para el Restaurante (Gestión)
*   **Multi-Sucursal**: Gestión centralizada de múltiples locales bajo una misma organización.
*   **Roles de Empleados**: Paneles específicos para **Manager, Mesero, Chef, Host y Bartender**.
*   **Layout Visual de Mesas**: Editor "Drag & Drop" para diseñar el plano del restaurante.
*   **Gestión de Menú**: Categorías, modificadores, control de stock (86'd items) y disponibilidad.
*   **Facturación y Suscripciones**: Integración nativa con **Pagadito** para cobros de planes Premium.

### 📱 Para el Cliente (Experiencia)
*   **Reservas en Línea**: Widget de reservas con disponibilidad en tiempo real.
*   **Check-in QR**: Escaneo de QR para confirmar llegada o ver el menú.
*   **Historial y CRM**: Perfil de cliente con historial de visitas y preferencias (alergias, VIP).

### ⚡ Operación en Tiempo Real
*   **Cocina KDS (Kitchen Display System)**: Los pedidos llegan instantáneamente a la pantalla del Chef.
*   **Sincronización de Estado**: Si un Host marca una mesa como "Ocupada", el Mesero lo ve al instante en su tablet.

---

## 🛠 Tecnología (Stack Técnico)

El proyecto utiliza un stack moderno, tipado y escalable:

| Capa | Tecnología | Versión | Descripción |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Next.js** | 15.3 (App Router) | Framework React para SSR y SEO optimizado. |
| **UI Kit** | **Tailwind CSS** + **shadcn/ui** | v4 | Diseño responsivo, accesibilidad y componentes modernos. |
| **Backend** | **Node.js** (Next API) | 20+ | API RESTful integrada en Next.js. |
| **Base de Datos** | **PostgreSQL** | 15+ | Base de datos relacional robusta. |
| **ORM** | **Prisma** | 6.11 | Acceso a datos type-safe y migraciones. |
| **Real-time** | **Socket.io** | 4.8 | Websockets para comunicación bidireccional instantánea. |
| **Pagos** | **Pagadito API** | SDK Custom | Pasarela de pagos para LATAM. |
| **Email** | **Resend** | API REST | Envío transaccional de correos. |

---

## 🏗 Arquitectura del Sistema

El sistema se divide en 3 componentes principales que deben correr simultáneamente:

1.  **`ReservaYaBackend` (API & Lógica)**: Maneja la base de datos, autenticación, pagos y reglas de negocio. Expone endpoints REST en `/api`.
2.  **`ReservaYaFrontend` (Cliente Web)**: La interfaz de usuario para todos los roles (Admin, Restaurante, Cliente). Consume la API del backend.
3.  **`ReservaYaSocket` (Servicio Real-time)**: Microservicio dedicado exclusivamente a gestionar conexiones WebSocket para evitar bloqueos en el servidor principal.

---

## 📥 Instalación y Configuración

### Prerrequisitos
*   Node.js 18+ instalado.
*   PostgreSQL instalado y corriendo.

### Paso 1: Clonar y Preparar
```bash
git clone https://github.com/tu-usuario/reservaya.git
cd reservaya
```

### Paso 2: Configurar Backend (Base de Datos)
```bash
cd ReservaYaBackend
npm install

# Configurar variables de entorno (Ver archivo ENV_TEMPLATE.md)
cp .env.example .env

# Sincronizar Base de Datos
npx prisma db push   # Crea las tablas
npx prisma db seed   # (Opcional) Crea datos de prueba: Admin, Planes, Restaurante Demo
```

### Paso 3: Configurar Microservicio Socket
```bash
cd ../ReservaYaSocket
npm install
# Crear archivo .env simple
echo "PORT=8002" > .env
```

### Paso 4: Configurar Frontend
```bash
cd ../ReservaYaFrontend
npm install
```

### Paso 5: Ejecutar en Desarrollo
Se recomienda usar 3 terminales distintas:

**Terminal 1 (Socket):**
```bash
cd ReservaYaSocket && npm start
```

**Terminal 2 (Backend):**
```bash
cd ReservaYaBackend && npm run dev
```

**Terminal 3 (Frontend):**
```bash
cd ReservaYaFrontend && npm run dev
```

Accede a: `http://localhost:3001`

---

## 🚢 Pase a Producción (Despliegue)

Para desplegar este sistema en un entorno real (VPS, AWS, DigitalOcean), consulta las guías técnicas especializadas que hemos generado:

1.  🔒 **[Guía de Seguridad SSL (HTTPS)](./GUIA_DEPLOY_SSL.md)**: Configuración de Nginx y Certbot.
2.  💳 **[Manual de Integración de Pagos](./MANUAL_PAGADITO.md)**: Cómo activar Pagadito con dinero real.
3.  📝 **[Variables de Entorno](./ENV_TEMPLATE.md)**: Lista maestra de configuraciones para producción.

---

## 📂 Estructura del Proyecto

```
ReservaYa/
├── ReservaYaBackend/         # Lógica del Servidor
│   ├── src/app/api/          # Endpoints (Auth, Orders, Admin...)
│   ├── prisma/               # Schema.prisma y Seeds
│   ├── scripts/              # Tests automatizados (Onboarding, Stress, etc.)
│   └── src/lib/              # Integraciones (Pagadito, Email, Auth)
│
├── ReservaYaFrontend/        # Interfaz de Usuario
│   ├── src/app/              # Rutas (dashboard, login, reservas...)
│   ├── src/components/       # UI Reutilizable (shadcn)
│   └── src/hooks/            # Lógica de React (useSocket, useAuth)
│
└── ReservaYaSocket/          # Servidor WebSocket independiente
    └── index.ts              # Lógica de eventos (join-room, new-order...)
```

---
© 2025 ReservaYa. Todos los derechos reservados.
