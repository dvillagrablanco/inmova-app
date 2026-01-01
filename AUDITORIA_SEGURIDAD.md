# 🔐 AUDITORÍA DE SEGURIDAD - INMOVA APP

**Fecha:** 31/12/2025  
**Alcance:** 566 API routes + componentes críticos  
**Metodología:** OWASP Top 10

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. Endpoints de Debug Expuestos

**Archivos:**
- `app/api/public/init-admin/route.ts`
- `app/api/debug/create-test-user/route.ts`

**Vulnerabilidad:**
```typescript
// SIN protección de NODE_ENV
export async function GET() {
  // Crea usuarios con credenciales hardcodeadas
  return NextResponse.json({
    credentials: {
      email: 'admin@inmova.app',
      password: 'demo123' // ❌ Expuesto públicamente
    }
  });
}
```

**Riesgo:**
- Cualquiera puede crear usuarios admin
- Credenciales expuestas en respuesta JSON
- Sin verificación de entorno

**Fix requerido:**
```typescript
export async function GET() {
  // ✅ Proteger con NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  
  // ✅ Verificar secret desde env
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.INIT_ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... resto del código
}
```

---

### 2. Secret Débil en Debug Endpoint

**Archivo:** `app/api/debug/create-test-user/route.ts`

**Vulnerabilidad:**
```typescript
if (secret !== 'create-test-user-2025') { // ❌ Hardcodeado
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Riesgo:**
- Secret visible en código fuente
- Fácil de adivinar
- Sin rotación posible

**Fix:**
```typescript
if (secret !== process.env.DEBUG_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 🟠 VULNERABILIDADES ALTAS

### 3. APIs sin Rate Limiting (Estimado: ~440 de 566)

**Muestra de APIs críticas sin rate limit:**
- `app/api/payments/route.ts`
- `app/api/contracts/route.ts`
- `app/api/users/route.ts`
- `app/api/notifications/route.ts`
- 436+ APIs más

**Riesgo:**
- DoS por abuso
- Scraping de datos
- Fuerza bruta en búsquedas

**Fix:**
```typescript
import { withRateLimit } from '@/lib/rate-limiting';

export async function POST(req: NextRequest) {
  return withRateLimit(req, async () => {
    // Tu código aquí
  });
}
```

---

### 4. SQL Injection Potencial (18 archivos)

**Archivos con $queryRaw:**
- `app/api/health/route.ts`
- `app/api/reports/route.ts`
- `lib/database-optimization.ts`
- 15+ más

**Ejemplo vulnerable:**
```typescript
// ❌ Sin validación
const userId = req.query.id;
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
```

**Fix:**
```typescript
// ✅ Con validación
import { z } from 'zod';
const userId = z.string().cuid().parse(req.query.id);
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
```

---

### 5. APIs sin Validación de Input (Estimado: ~200 de 566)

**Patrón común:**
```typescript
export async function POST(req: NextRequest) {
  const body = await req.json(); // ❌ Sin validación
  const result = await prisma.create({ data: body }); // Peligroso
}
```

**Fix:**
```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  price: z.number().positive(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const validated = schema.parse(body); // ✅ Validado
  const result = await prisma.create({ data: validated });
}
```

---

## 🟡 VULNERABILIDADES MEDIAS

### 6. Exceso de Tokens 'any' en TypeScript

**Archivo:** `app/bi/page.tsx`

**Problema:**
- 11 usos de `any`
- Pérdida de type safety
- Errores no detectados en compile-time

**Fix:**
Crear interfaces explícitas para datos de BI.

---

### 7. Stack Traces Expuestos en Producción

**Patrón común:**
```typescript
return NextResponse.json({
  error: error.message,
  stack: error.stack // ❌ Expone internals
}, { status: 500 });
```

**Fix:**
```typescript
return NextResponse.json({
  error: 'Internal server error',
  ...(process.env.NODE_ENV === 'development' && { 
    details: error.message,
    stack: error.stack 
  })
}, { status: 500 });
```

---

### 8. Rate Limits Muy Permisivos

**Archivo:** `lib/rate-limiting.ts`

**Configuración actual:**
```typescript
auth: {
  interval: 5 * 60 * 1000,
  uniqueTokenPerInterval: 500 // ❌ 500 intentos / 5 min
},
api: {
  interval: 60 * 1000,
  uniqueTokenPerInterval: 1000 // ❌ 1000 req/min
}
```

**Recomendación:**
```typescript
auth: {
  interval: 5 * 60 * 1000,
  uniqueTokenPerInterval: 10 // ✅ 10 intentos / 5 min
},
api: {
  interval: 60 * 1000,
  uniqueTokenPerInterval: 100 // ✅ 100 req/min
}
```

---

## 🟢 SEGURIDAD CORRECTA

### ✅ Timing Attack Prevention

**Archivo:** `lib/auth-options.ts`

```typescript
// ✅ CORRECTO
const CONSTANT_DELAY_MS = 150;
const dummyHash = '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012';
const passwordHash = user?.password || dummyHash;
const isPasswordValid = await bcrypt.compare(credentials.password, passwordHash);
```

Protege contra timing attacks en login.

---

### ✅ Password Hashing

Todos los passwords usan `bcrypt` con salt rounds = 10.

---

### ✅ CSRF Protection

NextAuth maneja CSRF automáticamente.

---

### ✅ SQL Injection Prevention

Prisma ORM protege contra SQL injection por defecto (excepto raw queries).

---

## 🔧 PLAN DE CORRECCIÓN PRIORIZADO

### FASE 1: CRÍTICO (1-2 horas)

1. **Deshabilitar endpoints de debug en producción**
   ```bash
   mv app/api/public/init-admin/route.ts app/api/public/init-admin/route.ts.disabled
   mv app/api/debug/create-test-user/route.ts app/api/debug/create-test-user/route.ts.disabled
   ```

2. **O proteger con NODE_ENV:**
   Añadir al inicio de cada endpoint debug:
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     return NextResponse.json({ error: 'Not found' }, { status: 404 });
   }
   ```

### FASE 2: ALTO (4-6 horas)

3. **Añadir rate limiting a 440 APIs sin él**
   
   Script automatizado:
   ```typescript
   import { withRateLimit } from '@/lib/rate-limiting';
   
   // Envolver función handler
   export async function POST(req: NextRequest) {
     return withRateLimit(req, async () => {
       // código existente
     });
   }
   ```

4. **Validar inputs en 200+ APIs**
   
   Template:
   ```typescript
   import { z } from 'zod';
   
   const schema = z.object({
     // definir campos
   });
   
   const validated = schema.parse(await req.json());
   ```

5. **Proteger raw SQL queries**
   
   Revisar 18 archivos con `$queryRaw` y validar inputs.

### FASE 3: MEDIO (2-3 horas)

6. **Reducir rate limits permisivos**
   
   Archivo: `lib/rate-limiting.ts`
   - auth: 500 → 10 requests / 5 min
   - api: 1000 → 100 requests / min

7. **Ocultar stack traces en producción**
   
   Crear helper:
   ```typescript
   export function safeError(error: any) {
     if (process.env.NODE_ENV === 'production') {
       return { error: 'Internal server error' };
     }
     return { error: error.message, stack: error.stack };
   }
   ```

---

## 📊 MEJORAS PROPUESTAS

### 1. Middleware de Seguridad Global

Crear `lib/api-security-middleware.ts`:
```typescript
export async function secureAPI(
  req: NextRequest,
  handler: () => Promise<NextResponse>,
  options?: {
    requireAuth?: boolean;
    rateLimit?: keyof typeof RATE_LIMITS;
    validate?: ZodSchema;
  }
) {
  // 1. Rate limiting
  if (options?.rateLimit) {
    const rateLimitResult = await checkRateLimit(req, options.rateLimit);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
  }
  
  // 2. Auth
  if (options?.requireAuth) {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  
  // 3. Validation
  if (options?.validate) {
    const body = await req.json();
    const validated = options.validate.parse(body);
    req.validated = validated;
  }
  
  // 4. Execute handler
  try {
    return await handler();
  } catch (error) {
    return handleAPIError(error);
  }
}
```

Uso:
```typescript
export async function POST(req: NextRequest) {
  return secureAPI(req, async () => {
    // Tu código aquí
  }, {
    requireAuth: true,
    rateLimit: 'api',
    validate: mySchema
  });
}
```

---

### 2. Auditlog Automático

Crear trigger para todas las operaciones críticas:
```typescript
export async function auditLog(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: any
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: metadata?.ip,
      userAgent: metadata?.userAgent,
      timestamp: new Date(),
    }
  });
}
```

---

### 3. Headers de Seguridad

Verificar `next.config.js` tiene:
```javascript
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
  }
]
```

---

### 4. Input Sanitization

Crear helper para sanitizar HTML user-generated:
```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: []
  });
}
```

---

### 5. File Upload Security

Para endpoints que manejan uploads:
```typescript
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  // ✅ Validar tipo MIME real
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileType = await import('file-type').then(m => m.fileTypeFromBuffer(buffer));
  
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!fileType || !ALLOWED_TYPES.includes(fileType.mime)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
  
  // ✅ Validar tamaño
  if (buffer.length > 10 * 1024 * 1024) { // 10MB
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }
  
  // Continuar con upload a S3
}
```

---

## 📋 CHECKLIST DE CORRECCIÓN

### Inmediato (Deploy hoy)
- [ ] Deshabilitar `/api/public/init-admin`
- [ ] Deshabilitar `/api/debug/create-test-user`
- [ ] Añadir NODE_ENV check a todos los endpoints debug

### Corto plazo (Esta semana)
- [ ] Añadir rate limiting a 440 APIs
- [ ] Validar inputs con Zod en 200+ APIs
- [ ] Revisar y validar 18 raw SQL queries
- [ ] Reducir rate limits permisivos

### Mediano plazo (Próximas 2 semanas)
- [ ] Implementar middleware de seguridad global
- [ ] Ocultar stack traces en producción
- [ ] Audit log para operaciones críticas
- [ ] Testing de seguridad automatizado

---

## 🎯 PRIORIDAD DE EJECUCIÓN

1. **CRÍTICO:** Deshabilitar debug endpoints (5 min)
2. **ALTO:** Rate limiting en APIs de pagos/auth (2 horas)
3. **ALTO:** Validación en APIs de escritura (4 horas)
4. **MEDIO:** Reducir limits permisivos (30 min)
5. **MEDIO:** Ocultar stack traces (1 hora)

**Tiempo total estimado:** 8-10 horas

---

**Documento generado:** 31/12/2025
