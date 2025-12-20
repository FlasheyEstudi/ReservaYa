# ReservaYA - Frontend

Sistema de reservas para restaurantes - Interfaz de usuario con Next.js.

## Tecnologías

- **Framework**: Next.js 15 (App Router)
- **Estado**: Zustand
- **HTTP**: Axios
- **Tiempo real**: Socket.io-client
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion

## Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Iniciar servidor de desarrollo
npm run dev -- -p 3001
```

## Variables de Entorno

```env
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3002"
```

## Estructura

```
src/
├── app/              # Pages (App Router)
│   ├── auth/         # Login/Registro
│   ├── admin/        # Panel administrador
│   ├── workspace/    # Dashboard empleados
│   └── restaurant/   # Vista restaurante
├── components/       # Componentes reutilizables
├── stores/           # Estado global (Zustand)
├── hooks/            # Custom hooks
└── lib/              # Utilidades
```

## Roles de Usuario

- **Cliente**: Reservas, ver menú, pagar cuenta
- **Host**: Gestión de mesas y reservas
- **Waiter**: Tomar pedidos, servir
- **Chef**: Kitchen Display System (KDS)
- **Manager**: Administración completa
