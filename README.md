# INMOVA - Property Management Platform

🏢 Comprehensive multi-vertical property management system built with Next.js, TypeScript, and Prisma.

## 🚀 Features

### Core Functionality
- 🏗️ **Building Management** - Complete building portfolio management
- 🏠 **Unit Management** - Individual unit tracking and management
- 👥 **Tenant Management** - Tenant profiles, contracts, and communication
- 📝 **Contract Management** - Digital contracts with e-signatures
- 💳 **Payment Processing** - Integrated payment tracking and processing
- 🔧 **Maintenance** - Work orders, preventive maintenance, and tracking
- 📦 **Provider Management** - Service provider network and orders
- 📊 **Analytics & Reports** - Comprehensive dashboards and reporting

### Advanced Features
- 🤖 **AI Assistant** - Intelligent recommendations and automation
- 🔒 **Role-Based Access** - Granular permissions (Super Admin, Admin, Manager, Operator)
- 🌍 **Multi-Language** - Spanish, English, French, Portuguese
- 📱 **PWA Ready** - Mobile-first, offline-capable
- 🔍 **Global Search** - Fast fuzzy search with keyboard shortcuts
- ♿ **Accessibility** - WCAG 2.1 AA compliant
- 🚀 **Performance** - Optimized with React Query, lazy loading, virtualization

### Multi-Vertical Support
- 🏙️ **Traditional Rental** - Residential and commercial properties
- 🌴 **Short-Term Rental (STR)** - Vacation rentals, Airbnb integration
- 🚶 **Room Rental** - Individual room management in shared properties
- 🏭 **Construction Projects** - Project management with phases
- 🏢 **Professional Services** - Architecture, engineering billing
- 🔄 **Property Flipping** - Deal analysis and ROI tracking

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React Query, Zustand
- **Forms**: React Hook Form + Zod
- **Animation**: Framer Motion
- **Charts**: Recharts, Plotly

### Backend
- **Runtime**: Node.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **File Storage**: AWS S3
- **Caching**: Redis (Upstash)

### DevOps & Testing
- **Testing**: Vitest, Playwright
- **CI/CD**: GitHub Actions
- **Containerization**: Docker, Docker Compose
- **Monitoring**: Sentry (optional)
- **Linting**: ESLint, Prettier

## 💻 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Yarn
- AWS Account (for S3)
- Upstash Redis (optional, for rate limiting)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/inmova.git
cd inmova
```

2. **Install dependencies**
```bash
yarn install
```

3. **Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/inmova_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_BUCKET_NAME="your-bucket-name"

# Encryption
ENCRYPTION_KEY="your-encryption-key"

# Redis (optional)
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

4. **Setup database**
```bash
yarn prisma migrate deploy
yarn prisma generate
```

5. **Seed database (optional)**
```bash
yarn prisma db seed
```

6. **Run development server**
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Setup

For production deployment:

```bash
# Build and start services
docker-compose up -d

# Run migrations
docker-compose exec app yarn prisma migrate deploy

# View logs
docker-compose logs -f app
```

## 🧠 Architecture

```
app/
├── api/              # API routes
├── admin/            # Admin pages
├── dashboard/        # Dashboard
├── edificios/        # Buildings
├── unidades/         # Units
├── inquilinos/       # Tenants
└── ...

components/
├── ui/               # Reusable UI components
├── layout/           # Layout components
└── dashboard/        # Dashboard components

lib/
├── db.ts             # Prisma client
├── auth-options.ts   # NextAuth config
├── hooks/            # Custom React hooks
├── react-query/      # React Query hooks
├── security/         # Security utilities
└── ...

prisma/
└── schema.prisma     # Database schema

scripts/
├── seed.ts           # Database seeding
└── ...
```

## 🧩 Testing

### Unit Tests
```bash
yarn test              # Run tests in watch mode
yarn test:ci           # Run tests once with coverage
```

### E2E Tests
```bash
yarn test:e2e          # Run E2E tests
yarn test:e2e:ui       # Run E2E tests with UI
```

### Test Coverage
```bash
yarn test:ci
```

## 🚀 Deployment

### Environment Setup
1. Configure production environment variables
2. Setup PostgreSQL database
3. Configure AWS S3 bucket
4. Setup Redis (optional)

### Build
```bash
yarn build
```

### Start Production Server
```bash
yarn start
```

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 Security Features

- 🔒 **Rate Limiting** - API rate limiting with Redis
- 🛡️ **CSP Headers** - Content Security Policy
- 🔑 **Encryption** - AES-256-GCM encryption for sensitive data
- ✅ **Input Validation** - Zod schema validation
- 🔍 **SQL Injection Protection** - Prisma ORM
- 🌐 **CORS** - Configurable CORS policies
- 👤 **RBAC** - Role-based access control

## ♿ Accessibility

- **WCAG 2.1 AA** compliant
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader** - ARIA labels and live regions
- **High Contrast Mode** - System preference support
- **Focus Management** - Proper focus trapping in modals

## 📈 Performance

- **React Query** - Intelligent caching and background updates
- **Lazy Loading** - Code splitting for heavy components
- **Virtualization** - Efficient rendering of large lists
- **Image Optimization** - Next.js Image component
- **Bundle Optimization** - Tree shaking and minification

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Guide](./docs/SECURITY.md)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed contribution guidelines.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📧 Support

For support, email support@inmova.app or open an issue.

## 🌟 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

**Version**: 2.0.0  
**Last Updated**: December 2024  
**Status**: Production Ready ✅
