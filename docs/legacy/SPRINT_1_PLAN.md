# 🚀 SPRINT 1 - Plan de Ejecución

**Fecha**: 3 de Enero 2026  
**Objetivo**: Estabilizar infraestructura base y documentación API  
**Duración estimada**: 1 día

---

## 📋 TAREAS

### ✅ Tarea 1: Fix DATABASE_URL Placeholder

**Prioridad**: 🔴 CRÍTICA  
**Estado**: 🟡 En Progreso  
**Tiempo estimado**: 10 minutos

#### Problema Actual

```env
# ❌ .env.production (ACTUAL)
DATABASE_URL="postgresql://dummy_build_user:dummy_build_pass@dummy-build-host.local:5432/dummy_build_db?schema=public&connect_timeout=5"
```

Este es un **placeholder de build-time** que NO funciona en runtime.

#### Síntomas

- Health check reporta `database: 'check-skipped'` o `'disconnected'`
- La app puede funcionar parcialmente (SSR cached)
- Algunas funcionalidades no funcionan (pagos, contratos, etc.)

#### Solución

**⚠️ IMPORTANTE: Esto debe ejecutarse EN EL SERVIDOR DE PRODUCCIÓN**

```bash
# 1. Conectar al servidor
ssh root@157.180.119.236

# 2. Navegar al directorio de la app
cd /opt/inmova-app

# 3. Hacer backup del .env actual
cp .env.production .env.production.backup

# 4. Editar .env.production
nano .env.production

# 5. Reemplazar DATABASE_URL con el valor REAL:
DATABASE_URL="postgresql://inmova_user:TU_PASSWORD_REAL@localhost:5432/inmova_production?schema=public"

# NOTA: Obtener el password real de PostgreSQL ejecutando:
# cat /root/.postgres-password  # O donde lo guardaste

# 6. Guardar y salir (Ctrl+X, Y, Enter)

# 7. Reiniciar PM2 con nuevas variables de entorno
pm2 restart inmova-app --update-env

# 8. Esperar 15 segundos para warm-up
sleep 15

# 9. Verificar health check
curl http://localhost:3000/api/health | jq .

# ✅ Debe retornar: "database": "connected"
```

#### Verificación Post-Fix

```bash
# Test 1: Health check básico
curl https://inmovaapp.com/api/health

# Esperado:
# {
#   "status": "ok",
#   "checks": {
#     "database": "connected"  ← DEBE SER "connected"
#   }
# }

# Test 2: Health check detallado (requiere login admin)
curl -H "Authorization: Bearer TOKEN" https://inmovaapp.com/api/health/detailed

# Esperado:
# {
#   "integrations": {
#     "database": {
#       "configured": true,
#       "status": "connected"  ← DEBE SER "connected"
#     }
#   }
# }

# Test 3: Query directa a la BD (desde servidor)
cd /opt/inmova-app
node -e "const {prisma} = require('./dist/lib/db'); prisma.\$queryRaw\`SELECT 1 as test\`.then(console.log).catch(console.error)"

# Esperado: [ { test: 1 } ]
```

#### Rollback (si falla)

```bash
# Restaurar backup
cp .env.production.backup .env.production
pm2 restart inmova-app --update-env
```

---

### ✅ Tarea 2: Verificar Todas las Integraciones

**Prioridad**: 🟡 ALTA  
**Estado**: ⏳ Pendiente  
**Tiempo estimado**: 30 minutos

#### Integraciones a Verificar

**CRÍTICAS** (8/8):
- [x] ✅ **NextAuth** - Configurado (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`)
- [ ] ⚠️ **Database** - **PENDIENTE FIX** (placeholder)
- [x] ✅ **AWS S3** - Configurado (storage de archivos)
- [x] ✅ **Stripe** - Configurado live mode + webhook
- [x] ✅ **Gmail SMTP** - Configurado (500 emails/día)
- [x] ✅ **Signaturit** - API key configurada
- [ ] ⚠️ **DocuSign** - Verificar keys
- [x] ✅ **Health Check** - Endpoint funcionando

**IMPORTANTES** (1/3):
- [ ] ⏳ **Anthropic Claude** - Configurar para valoraciones IA
- [ ] ⏳ **Twilio SMS** - Configurar para notificaciones
- [x] ✅ **API Docs** - Swagger UI funcionando

**OPCIONALES** (0/2):
- [ ] ⏸️ **Google Analytics** - No crítico
- [ ] ⏸️ **Slack Webhooks** - No crítico

#### Script de Verificación

Crear archivo: `scripts/verify-integrations.ts`

```typescript
#!/usr/bin/env tsx
/**
 * Verificación completa de integraciones
 * Ejecutar: npx tsx scripts/verify-integrations.ts
 */

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

interface CheckResult {
  name: string;
  status: 'ok' | 'error' | 'warning' | 'skipped';
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

async function checkDatabase(): Promise<CheckResult> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: 'Database (PostgreSQL)',
      status: 'ok',
      message: 'Conexión exitosa',
      critical: true,
    };
  } catch (error: any) {
    return {
      name: 'Database (PostgreSQL)',
      status: 'error',
      message: error.message,
      critical: true,
    };
  }
}

async function checkStripe(): Promise<CheckResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      name: 'Stripe',
      status: 'error',
      message: 'STRIPE_SECRET_KEY no configurada',
      critical: true,
    };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.balance.retrieve();
    return {
      name: 'Stripe',
      status: 'ok',
      message: 'Conexión exitosa',
      critical: true,
    };
  } catch (error: any) {
    return {
      name: 'Stripe',
      status: 'error',
      message: error.message,
      critical: true,
    };
  }
}

async function checkSMTP(): Promise<CheckResult> {
  if (!process.env.SMTP_HOST) {
    return {
      name: 'Gmail SMTP',
      status: 'error',
      message: 'SMTP_HOST no configurada',
      critical: true,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.verify();
    return {
      name: 'Gmail SMTP',
      status: 'ok',
      message: 'Conexión exitosa',
      critical: true,
    };
  } catch (error: any) {
    return {
      name: 'Gmail SMTP',
      status: 'error',
      message: error.message,
      critical: true,
    };
  }
}

async function checkS3(): Promise<CheckResult> {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    return {
      name: 'AWS S3',
      status: 'error',
      message: 'AWS_ACCESS_KEY_ID no configurada',
      critical: true,
    };
  }

  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    await s3.send(new ListBucketsCommand({}));
    return {
      name: 'AWS S3',
      status: 'ok',
      message: 'Conexión exitosa',
      critical: true,
    };
  } catch (error: any) {
    return {
      name: 'AWS S3',
      status: 'error',
      message: error.message,
      critical: true,
    };
  }
}

async function checkAnthropic(): Promise<CheckResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      name: 'Anthropic Claude',
      status: 'warning',
      message: 'ANTHROPIC_API_KEY no configurada (opcional para valoraciones IA)',
      critical: false,
    };
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Test simple
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }],
    });

    return {
      name: 'Anthropic Claude',
      status: 'ok',
      message: 'API key válida',
      critical: false,
    };
  } catch (error: any) {
    return {
      name: 'Anthropic Claude',
      status: 'error',
      message: error.message,
      critical: false,
    };
  }
}

async function main() {
  console.log('🔍 VERIFICANDO INTEGRACIONES...\n');

  // Ejecutar checks en paralelo
  results.push(await checkDatabase());
  results.push(await checkStripe());
  results.push(await checkSMTP());
  results.push(await checkS3());
  results.push(await checkAnthropic());

  // Resultados
  console.log('━'.repeat(80));
  console.log('📊 RESULTADOS\n');

  const criticalChecks = results.filter((r) => r.critical);
  const criticalPassed = criticalChecks.filter((r) => r.status === 'ok').length;
  const criticalTotal = criticalChecks.length;

  results.forEach((result) => {
    const emoji =
      result.status === 'ok'
        ? '✅'
        : result.status === 'error'
        ? '❌'
        : result.status === 'warning'
        ? '⚠️'
        : '⏸️';
    const critical = result.critical ? '[CRÍTICO]' : '[OPCIONAL]';
    console.log(`${emoji} ${result.name} ${critical}`);
    console.log(`   ${result.message}\n`);
  });

  console.log('━'.repeat(80));
  console.log(`\n🎯 INTEGRACIONES CRÍTICAS: ${criticalPassed}/${criticalTotal}\n`);

  if (criticalPassed < criticalTotal) {
    console.log('❌ Hay integraciones críticas fallando. Revisar logs arriba.\n');
    process.exit(1);
  } else {
    console.log('✅ Todas las integraciones críticas funcionando correctamente.\n');
    process.exit(0);
  }
}

main()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

#### Ejecución

```bash
# En el servidor
cd /opt/inmova-app
npx tsx scripts/verify-integrations.ts
```

---

### ✅ Tarea 3: Documentar APIs Faltantes

**Prioridad**: 🟢 MEDIA  
**Estado**: ⏳ Pendiente  
**Tiempo estimado**: 1 hora

#### Estado Actual de API Docs

**✅ YA IMPLEMENTADO**:
- Swagger UI disponible en: `https://inmovaapp.com/api-docs`
- Configuración OpenAPI 3.0 completa en `lib/swagger-config.ts`
- Endpoints documentados:
  - ✅ `/api/v1/properties` (GET, POST)
  - ✅ `/api/v1/properties/{id}` (GET, PUT, DELETE)
  - ✅ `/api/v1/api-keys` (GET, POST)
  - ✅ `/api/v1/webhooks` (GET, POST)
  - ✅ `/api/v1/sandbox` (GET - test endpoint)

#### APIs FALTANTES POR DOCUMENTAR

Basado en análisis del directorio `app/api/`, hay **572 rutas API** en total. Las prioritarias a documentar:

**CRÍTICAS** (para partners/integraciones):
1. `/api/v1/tenants` - Gestión de inquilinos
2. `/api/v1/contracts` - Gestión de contratos
3. `/api/v1/payments` - Gestión de pagos
4. `/api/v1/documents` - Gestión de documentos

**IMPORTANTES** (features avanzadas):
5. `/api/v1/maintenance` - Órdenes de trabajo
6. `/api/v1/buildings` - Gestión de edificios
7. `/api/v1/matching` - Matching inquilino-propiedad

#### Acción Requerida

**Opción 1: Manual** (extender `lib/swagger-config.ts`)

Añadir paths adicionales al objeto `swaggerDefinition.paths`:

```typescript
// lib/swagger-config.ts - añadir al final del objeto paths:

'/api/v1/tenants': {
  get: {
    tags: ['Tenants'],
    summary: 'Listar inquilinos',
    // ... definición completa
  },
  post: {
    tags: ['Tenants'],
    summary: 'Crear inquilino',
    // ...
  }
},
// ... más endpoints
```

**Opción 2: Automatizada** (usar anotaciones JSDoc + swagger-jsdoc)

Instalar dependencia:

```bash
npm install swagger-jsdoc
```

Añadir anotaciones JSDoc en cada route:

```typescript
// app/api/v1/tenants/route.ts

/**
 * @swagger
 * /api/v1/tenants:
 *   get:
 *     tags: [Tenants]
 *     summary: Listar inquilinos
 *     description: Obtiene lista paginada de inquilinos
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Lista de inquilinos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
export async function GET(request: NextRequest) {
  // implementación...
}
```

**Opción 3: Generación Automática** (desde TypeScript types)

Usar `tsoa` para generar OpenAPI desde decoradores TypeScript:

```bash
npm install tsoa
```

Ventajas:
- Single source of truth (código = docs)
- Auto-actualización
- Type-safety

Desventajas:
- Requiere refactoring de routes existentes

#### Recomendación

**Para este Sprint 1**: 
- ✅ Verificar que Swagger UI funciona correctamente
- ✅ Documentar manualmente los 4 endpoints críticos (Tenants, Contracts, Payments, Documents)
- ⏸️ Dejar automatización completa para Sprint 2+

---

## 🎯 CRITERIOS DE ÉXITO

### Sprint 1 Completado ✅ cuando:

1. **DATABASE_URL**:
   - [ ] `.env.production` tiene URL real (no placeholder)
   - [ ] Health check retorna `"database": "connected"`
   - [ ] Login funciona correctamente
   - [ ] Dashboard carga sin errores de BD

2. **Integraciones**:
   - [ ] Script `verify-integrations.ts` pasa todos los checks críticos
   - [ ] Al menos 7/8 integraciones críticas funcionando (100%)
   - [ ] Al menos 1/3 integraciones importantes configuradas

3. **API Docs**:
   - [ ] Swagger UI accesible en `https://inmovaapp.com/api-docs`
   - [ ] Al menos 8 endpoints documentados (4 ya existentes + 4 nuevos)
   - [ ] Ejemplos de requests/responses incluidos

---

## 📊 MÉTRICAS

**Estado Inicial**:
- Integraciones críticas: 6/8 (75%)
- Integraciones importantes: 1/3 (33%)
- Endpoints documentados: 5

**Estado Objetivo**:
- Integraciones críticas: 8/8 (100%)
- Integraciones importantes: 2/3 (67%)
- Endpoints documentados: 9+

---

## 🚨 RIESGOS

1. **DATABASE_URL**: 
   - **Riesgo**: No tener el password real de PostgreSQL
   - **Mitigación**: Recuperar de backups o regenerar con `ALTER USER`

2. **Downtime durante restart PM2**:
   - **Riesgo**: 2-5 segundos de downtime
   - **Mitigación**: Usar `pm2 reload` en lugar de `restart` (zero-downtime)

3. **Integraciones de pago**:
   - **Riesgo**: Credenciales Stripe/Signaturit inválidas
   - **Mitigación**: Verificar en dashboards respectivos antes

---

## 📝 NOTAS

- Este Sprint NO incluye desarrollo de features nuevas
- Foco 100% en estabilidad y documentación
- Base sólida para Sprints 2 y 3 (Valoración IA, Firma Digital)
- Ejecutar en horario de bajo tráfico (madrugada) por si hay issues

---

## 👥 RESPONSABLE

**Asignado a**: Cursor Agent  
**Revisor**: Usuario (verificación manual post-ejecución)  
**Fecha límite**: 3 de Enero 2026 - EOD

---

**Última actualización**: 3 de Enero 2026 - 19:00 UTC
