# INMOVA - Sistema de Gestión Inmobiliaria

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.7-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?style=for-the-badge&logo=postgresql)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=for-the-badge&logo=stripe)

**Plataforma completa de gestión inmobiliaria con Next.js, Prisma y PostgreSQL**

[Demo](https://inmova.app) · [Documentación](./docs) · [Reportar Bug](https://github.com/tu-usuario/inmova/issues)

</div>

---

## 🎯 Características Principales

### 🏗️ Gestión de Propiedades
- **Edificios y Unidades**: Gestiona múltiples propiedades y sus unidades
- **Documentos**: Almacenamiento seguro de contratos, escrituras y documentos
- **Galería de Imágenes**: Gestión visual de propiedades
- **Gestión de Estado**: Control completo del ciclo de vida de las propiedades

### 👥 Gestión de Inquilinos
- **Portal del Inquilino**: Portal dedicado para inquilinos
- **Contratos Digitales**: Gestión completa de contratos de alquiler
- **Historial de Pagos**: Seguimiento detallado de pagos
- **Comunicación**: Sistema de mensajería integrado

### 💰 Finanzas y Pagos
- **Integración con Stripe**: Procesamiento de pagos seguro
- **Facturas y Recibos**: Generación automática de documentos
- **Reportes Financieros**: Análisis y reportes detallados
- **Notificaciones de Pago**: Recordatorios automáticos

### 📅 Gestión de Tareas
- **Calendario Integrado**: Visualización de eventos y tareas
- **Mantenimiento**: Seguimiento de solicitudes de mantenimiento
- **Recordatorios**: Notificaciones automáticas
- **Asignación de Tareas**: Sistema de asignación a miembros del equipo

### 🔒 Seguridad y Roles
- **Autenticación Robusta**: NextAuth.js con múltiples providers
- **Sistema de Roles**: Super Admin, Admin, Gestor, Inquilino
- **Permisos Granulares**: Control detallado de accesos
- **Auditoría**: Registro de todas las acciones importantes

### 📧 Notificaciones
- **Push Notifications**: Notificaciones web push
- **Email**: Integración con servicios de email
- **SMS**: Notificaciones por mensaje de texto (Twilio)
- **In-App**: Notificaciones dentro de la aplicación

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **UI**: React 18.2 + TypeScript
- **Styling**: Tailwind CSS 3.3
- **Componentes**: Radix UI + shadcn/ui
- **State Management**: Zustand + Jotai
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query (React Query)

### Backend
- **API**: Next.js API Routes
- **ORM**: Prisma 6.7
- **Database**: PostgreSQL
- **Autenticación**: NextAuth.js
- **Storage**: AWS S3
- **Pagos**: Stripe

### DevOps
- **Hosting**: Vercel
- **Database**: Supabase
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry
- **Analytics**: Vercel Analytics

---

## 🚀 Quick Start

### Prerequisitos

- Node.js 18+ 
- Yarn 1.22+
- PostgreSQL 14+
- Cuenta de Vercel (para deployment)
- Cuenta de Supabase (para base de datos)

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/inmova.git
cd inmova

# Instalar dependencias
cd nextjs_space
yarn install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# Generar cliente de Prisma
yarn prisma generate

# Ejecutar migraciones
yarn prisma migrate deploy

# (Opcional) Cargar datos de prueba
yarn prisma db seed

# Iniciar servidor de desarrollo
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

### Credenciales de Prueba

```
Super Admin:
- Email: superadmin@inmova.com
- Password: superadmin123

Admin:
- Email: admin@inmova.com
- Password: admin123

Gestor:
- Email: gestor@inmova.com
- Password: gestor123

Inquilino:
- Email: inquilino@inmova.com
- Password: inquilino123
```

---

## 🌐 Deployment en Vercel

### Método Rápido

```bash
# Ejecutar el script de setup
chmod +x setup-vercel.sh
./setup-vercel.sh

# Seguir las instrucciones del script
```

### Método Manual

Consulta las guías detalladas:

1. **[Quick Start Guide](./QUICK_START.md)** - Guía rápida de 25 minutos
2. **[Vercel Deployment Guide](./VERCEL_DEPLOYMENT_GUIDE.md)** - Guía completa paso a paso
3. **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Lista de verificación

---

## 📚 Documentación

### Estructura del Proyecto

```
inmova/
├── nextjs_space/                # Aplicación Next.js
│   ├── app/                      # App Router
│   │   ├── api/                  # API Routes
│   │   ├── (auth)/               # Rutas de autenticación
│   │   ├── (portal)/             # Portal del inquilino
│   │   │   ├── tenant/           # Rutas del inquilino
│   │   │   └── [...]/            # Otras rutas del portal
│   │   └── (platform)/           # Plataforma principal
│   │       ├── home/             # Dashboard
│   │       ├── buildings/        # Edificios
│   │       ├── units/            # Unidades
│   │       ├── tenants/          # Inquilinos
│   │       ├── contracts/        # Contratos
│   │       ├── payments/         # Pagos
│   │       ├── tasks/            # Tareas
│   │       ├── documents/        # Documentos
│   │       ├── reports/          # Reportes
│   │       └── settings/         # Configuración
│   ├── components/               # Componentes React
│   │   ├── ui/                   # Componentes UI (shadcn)
│   │   ├── forms/                # Formularios
│   │   ├── layouts/              # Layouts
│   │   └── shared/               # Componentes compartidos
│   ├── lib/                      # Utilidades y configuración
│   │   ├── prisma.ts             # Cliente de Prisma
│   │   ├── auth.ts               # Configuración NextAuth
│   │   ├── aws-config.ts         # Configuración AWS
│   │   ├── s3.ts                 # Funciones S3
│   │   └── utils.ts              # Utilidades
│   ├── prisma/                   # Prisma
│   │   ├── schema.prisma         # Schema de base de datos
│   │   └── seed.ts               # Datos de prueba
│   ├── public/                   # Archivos estáticos
│   ├── scripts/                  # Scripts auxiliares
│   ├── styles/                   # Estilos globales
│   ├── types/                    # Tipos TypeScript
│   ├── .env                      # Variables de entorno
│   ├── next.config.js            # Configuración Next.js
│   ├── package.json              # Dependencias
│   ├── tailwind.config.js        # Configuración Tailwind
│   └── tsconfig.json             # Configuración TypeScript
├── vercel.json                   # Configuración Vercel
├── setup-vercel.sh               # Script de setup
├── QUICK_START.md                # Guía rápida
├── VERCEL_DEPLOYMENT_GUIDE.md    # Guía completa
├── DEPLOYMENT_CHECKLIST.md       # Checklist
└── README.md                     # Este archivo
```

### Scripts Disponibles

```bash
# Desarrollo
yarn dev                    # Iniciar servidor de desarrollo
yarn build                  # Build de producción
yarn start                  # Iniciar servidor de producción
yarn lint                   # Ejecutar linter

# Base de Datos
yarn prisma generate        # Generar cliente de Prisma
yarn prisma migrate deploy  # Ejecutar migraciones
yarn prisma db seed         # Cargar datos de prueba
yarn prisma studio          # Abrir Prisma Studio

# Testing
yarn test                   # Tests en modo watch
yarn test:ci                # Tests con coverage
yarn test:e2e               # Tests end-to-end
yarn test:all               # Todos los tests

# Deployment
node scripts/check-env.js   # Verificar variables de entorno
```

### Scripts Recomendados para Agregar a package.json

Agrega estos scripts manualmente a tu `nextjs_space/package.json`:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "check:env": "node scripts/check-env.js",
    "vercel:build": "prisma generate && next build",
    "deploy:check": "node scripts/check-env.js && yarn build"
  }
}
```

---

## 🛡️ Variables de Entorno

### Variables Requeridas

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_SECRET="tu-secret-key-aqui"
NEXTAUTH_URL="http://localhost:3000"  # En producción: tu dominio

# AWS S3
AWS_REGION="us-west-2"
AWS_BUCKET_NAME="tu-bucket-name"
AWS_FOLDER_PREFIX="tu-folder/"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### Variables Opcionales

```bash
# Stripe Webhooks
STRIPE_WEBHOOK_SECRET="whsec_..."

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."

# Abacus AI
ABACUSAI_API_KEY="..."

# Seguridad
CRON_SECRET="..."
ENCRYPTION_KEY="..."
```

Para verificar tus variables de entorno:

```bash
cd nextjs_space
node scripts/check-env.js
```

---

## 👥 Roles y Permisos

### Super Admin
- Acceso completo a todo el sistema
- Gestión de empresas y usuarios
- Configuración global del sistema
- Acceso a logs y auditoría

### Admin (Por Empresa)
- Gestión completa de su empresa
- CRUD de edificios, unidades y contratos
- Gestión de usuarios de su empresa
- Reportes financieros
- Configuración de empresa

### Gestor
- Gestión de propiedades asignadas
- Gestión de inquilinos
- Tareas y mantenimiento
- Visualización de reportes básicos

### Inquilino
- Portal personal
- Visualización de contrato
- Historial de pagos
- Solicitudes de mantenimiento
- Documentos personales

---

## 🐛 Reportar Bugs

Si encuentras un bug, por favor:

1. Verifica que no esté ya reportado en [Issues](https://github.com/tu-usuario/inmova/issues)
2. Crea un nuevo issue con:
   - Descripción clara del problema
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Screenshots si es posible
   - Información del entorno (navegador, OS, etc.)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

[MIT License](LICENSE) - Siempre libre para usar

---

## 📧 Contacto

- **Website**: [inmova.app](https://inmova.app)
- **Email**: soporte@inmova.com
- **GitHub**: [@tu-usuario](https://github.com/tu-usuario)

---

## 🚀 Roadmap

- [x] Sistema base de gestión
- [x] Portal del inquilino
- [x] Integración con Stripe
- [x] Notificaciones push
- [ ] App móvil (React Native)
- [ ] Integración con bancos
- [ ] IA para análisis predictivo
- [ ] API pública
- [ ] Marketplace de servicios

---

<div align="center">

**Hecho con ❤️ para la industria inmobiliaria**

[Website](https://inmova.app) · [Docs](./docs) · [Demo](https://demo.inmova.app)

</div>
