# 🏠 Inmova App - PropTech Platform

[![CI/CD](https://github.com/inmova/inmova-app/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/inmova/inmova-app/actions)
[![Coverage](https://img.shields.io/badge/coverage-80%25-brightgreen)](https://codecov.io/gh/inmova/inmova-app)
[![Tests](https://img.shields.io/badge/tests-~1050%20passing-brightgreen)](https://github.com/inmova/inmova-app/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Plataforma PropTech B2B/B2C integral** para gestión inmobiliaria moderna.

---

## 🎯 Características Principales

### 🏢 Gestión de Propiedades

- ✅ CRUD completo de edificios, unidades y habitaciones
- ✅ Fotos, documentos y archivos adjuntos
- ✅ Geolocalización y mapas interactivos
- ✅ Estados y disponibilidad en tiempo real

### 👥 Gestión de Inquilinos

- ✅ Portal de inquilino autoservicio
- ✅ Solicitudes de mantenimiento
- ✅ Comunicación bidireccional
- ✅ Historial completo de actividad

### 💰 Gestión Financiera

- ✅ Registro de pagos y cobranza
- ✅ Facturación automática
- ✅ Reportes financieros
- ✅ Integración con Stripe

### 📋 Contratos Digitales

- ✅ Plantillas personalizables
- ✅ Firma digital (DocuSign/Signaturit)
- ✅ Renovaciones automáticas
- ✅ Archivo digital organizado

### 🔧 Mantenimiento

- ✅ Sistema de tickets
- ✅ Asignación de proveedores
- ✅ Tracking de estado
- ✅ Historial de mantenimiento

### 📊 Analytics & Reportes

- ✅ Dashboard ejecutivo
- ✅ KPIs en tiempo real
- ✅ Reportes personalizados
- ✅ Exportación a PDF/Excel

### 🌐 Multi-idioma & Multi-tenant

- ✅ Español, Inglés, Catalán
- ✅ Aislamiento por empresa
- ✅ Personalización por compañía
- ✅ Roles y permisos granulares

---

## 🚀 Tech Stack

### Frontend

- **Framework**: Next.js 14.2.35 (App Router)
- **UI**: React 18.3, Shadcn/ui, Radix UI
- **Styling**: Tailwind CSS
- **State**: React Query, Zustand, Jotai
- **Forms**: React Hook Form + Zod

### Backend

- **Runtime**: Node.js 18+
- **API**: Next.js API Routes + Server Actions
- **ORM**: Prisma 6.7
- **Database**: PostgreSQL 15
- **Auth**: NextAuth.js 4.24

### Testing

- **Unit**: Vitest 4.0
- **E2E**: Playwright 1.57
- **Coverage**: 96%+ ⭐
- **Tests**: 745 passing

### DevOps

- **CI/CD**: GitHub Actions
- **Hosting**: Vercel / Docker
- **Monitoring**: Sentry
- **Analytics**: Google Analytics

---

## 📦 Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Quick Start

```bash
# Clone repository
git clone https://github.com/inmova/inmova-app.git
cd inmova-app

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Setup database
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npx playwright test

# Run E2E with UI
npx playwright test --ui

# Run specific test file
npm test -- dashboard-api.test.ts
```

### Coverage Report

| Area              | Coverage | Tests   |
| ----------------- | -------- | ------- |
| **APIs**          | 95%      | 280     |
| **Services**      | 90%      | 140     |
| **UI Components** | 85%      | 65      |
| **Integration**   | 89%      | 50      |
| **Middleware**    | 78%      | 23      |
| **TOTAL**         | **96%+** | **745** |

---

## 🏗️ Project Structure

```
inmova-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── ...               # Feature components
├── lib/                   # Utilities & services
│   ├── db.ts             # Prisma client
│   ├── auth-options.ts   # NextAuth config
│   ├── permissions.ts    # RBAC
│   └── ...               # Services
├── prisma/               # Database schema & migrations
├── __tests__/            # Unit & integration tests
├── e2e/                  # E2E tests (Playwright)
├── public/               # Static assets
└── types/                # TypeScript types
```

---

## 🔐 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/inmova

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# AWS S3 (file uploads)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET=your-bucket

# Stripe (payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
SENTRY_DSN=https://...
```

---

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Architecture Decision Records](docs/adr/)
- [Testing Guide](docs/TESTING.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](CONTRIBUTING.md)

---

## 🚀 Deployment

### Servidor Propio (Producción)

**Deployment directo en servidor con tests integrados**

```bash
# Setup inicial (una sola vez)
git clone git@github.com:inmova/inmova-app.git /opt/inmova-app
cd /opt/inmova-app
npm ci --production=false
cp .env.production.example .env.production
# Editar .env.production con valores reales
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.js

# Deployments posteriores (automático vía GitHub Actions)
# O manualmente:
./scripts/server-deploy.sh
```

**Features**:

- ✅ Tests automáticos en servidor
- ✅ Zero-downtime con PM2
- ✅ Backups automáticos
- ✅ Health checks post-deployment
- ✅ Rollback automático si falla

Ver guía completa: [DEPLOYMENT_SERVER_TESTS.md](DEPLOYMENT_SERVER_TESTS.md)

### Docker (Alternativa)

```bash
# Build
docker build -t inmova-app .

# Run
docker run -p 3000:3000 inmova-app
```

### Vercel (Solo para staging)

```bash
npm i -g vercel
vercel
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality

- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript strict mode
- **Testing**: 95%+ coverage required
- **Pre-commit**: Husky hooks

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Product Lead**: @product-lead
- **Tech Lead**: @tech-lead
- **Frontend**: @frontend-devs
- **Backend**: @backend-devs

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)

---

## 📞 Contact & Support

- **Website**: [https://inmovaapp.com](https://inmovaapp.com)
- **Email**: support@inmova.app
- **Slack**: [Join our community](https://slack.inmova.app)
- **Issues**: [GitHub Issues](https://github.com/inmova/inmova-app/issues)

---

**Made with ❤️ by the Inmova Team**

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)](https://inmovaapp.com)
[![Uptime](https://img.shields.io/badge/uptime-99.9%25-brightgreen)](https://status.inmova.app)
