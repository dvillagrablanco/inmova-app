# 🔧 CONFIGURACIÓN DEL BACKEND - APIs con Prisma

## 🎯 SITUACIÓN ACTUAL

**Frontend**: ✅ 100% funcionando en www.inmova.app  
**APIs**: ⏸️ Requieren configuración especial

## ❌ PROBLEMA IDENTIFICADO

El error durante el build es:
```
Error: @prisma/client did not initialize yet
Failed to collect page data for /api/comunidades/actas
```

### Causa:
Next.js intenta evaluar las rutas de API durante la fase de "Collecting page data" del build, pero Prisma necesita conectarse a la base de datos en este momento, lo cual no es posible durante el build.

## ✅ SOLUCIONES POSIBLES

### Opción 1: Configurar Routes como Runtime (Recomendado)

Modificar `next.config.js` para que las APIs no se evalúen durante el build:

```javascript
// next.config.js
module.exports = {
  // ... config existente
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
}
```

### Opción 2: Usar Prisma Data Proxy (Serverless)

Configurar Prisma para modo serverless:

```bash
# En Vercel, configurar:
DATABASE_URL="prisma://aws-us-east-1.prisma-data.com/?api_key=..."
```

### Opción 3: Deployment en Railway (Recomendado para este proyecto)

Ya tienes PostgreSQL configurado en Railway. Usa Railway para el deployment completo:

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Link al proyecto existente
railway link

# 4. Deploy
railway up
```

### Opción 4: Split Deployment (Frontend en Vercel, Backend en Railway)

- **Frontend (Vercel)**: Páginas estáticas, SSR
- **Backend (Railway)**: APIs con Prisma

Configurar `NEXT_PUBLIC_API_URL` en Vercel apuntando a Railway.

## 🚀 PASOS INMEDIATOS RECOMENDADOS

### Para Habilitar APIs Completas en Vercel:

1. **Verificar DATABASE_URL en Vercel**:
   ```bash
   vercel env pull .env.production
   cat .env.production | grep DATABASE_URL
   ```

2. **Asegurar que DATABASE_URL sea válido**:
   - Debe ser un PostgreSQL connection string válido
   - Debe ser accesible desde Vercel
   - Formato: `postgresql://user:pass@host:5432/db?schema=public`

3. **Agregar configuración serverless a next.config.js**:
   ```javascript
   experimental: {
     serverComponentsExternalPackages: ['@prisma/client'],
   }
   ```

4. **Crear middleware para lazy-load Prisma**:
   ```typescript
   // lib/prisma-lazy.ts
   let prisma: PrismaClient | null = null;
   
   export function getPrisma() {
     if (!prisma) {
       prisma = new PrismaClient();
     }
     return prisma;
   }
   ```

5. **Actualizar APIs para usar lazy-load**:
   ```typescript
   // app/api/example/route.ts
   import { getPrisma } from '@/lib/prisma-lazy';
   
   export async function GET() {
     const prisma = getPrisma();
     // ... usar prisma
   }
   ```

## 📊 ARQUITECTURA ALTERNATIVA

```
┌─────────────────────────────────────┐
│         www.inmova.app              │
│         (Vercel)                    │
│  ┌─────────────────────────────┐   │
│  │  Frontend (Next.js)         │   │
│  │  - 240 páginas             │   │
│  │  - SSR/SSG                 │   │
│  └─────────────────────────────┘   │
│              ▼                      │
│   ┌──────────────────────┐          │
│   │  API Proxy           │          │
│   │  /api/* → Railway    │          │
│   └──────────────────────┘          │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│    Railway Backend                   │
│  ┌────────────────────────────────┐  │
│  │  APIs (Node.js/Express)        │  │
│  │  - Prisma ORM                  │  │
│  │  - 545 endpoints               │  │
│  │  - NextAuth                    │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  PostgreSQL                    │  │
│  │  - Base de datos principal     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

## 🎯 DECISIÓN RECOMENDADA

**Opción 3: Deployment Completo en Railway**

**Ventajas**:
- Ya tienes PostgreSQL en Railway
- Railway maneja Prisma nativamente
- Build más rápido y confiable
- Mejor para aplicaciones con backend pesado
- Costos más predecibles

**Pasos**:
```bash
# 1. Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# 2. Login
railway login

# 3. Link proyecto existente "loving-creation"
railway link

# 4. Configure variables
railway variables set NODE_ENV=production
railway variables set NEXTAUTH_SECRET=$(openssl rand -base64 32)
railway variables set NEXTAUTH_URL=https://inmova.app

# 5. Deploy
railway up

# 6. Agregar dominio
railway domain www.inmova.app
```

## 📝 RESUMEN

**Estado Actual**:
- ✅ Frontend funcionando perfectamente en www.inmova.app
- ⏸️ Backend APIs esperando configuración

**Próximos Pasos**:
1. Decidir arquitectura (Vercel + workarounds o Railway completo)
2. Implementar solución elegida
3. Deploy y testing

**Tiempo Estimado**: 30-60 minutos dependiendo de la opción

