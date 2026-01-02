# 🛡️ Sentry - Best Practices y Guía de Uso

---

## 📋 Índice

1. [Configuración Actual](#configuración-actual)
2. [Exception Catching](#exception-catching)
3. [Tracing con Spans](#tracing-con-spans)
4. [Logging Estructurado](#logging-estructurado)
5. [Ejemplos Prácticos](#ejemplos-prácticos)
6. [Testing](#testing)

---

## ✅ Configuración Actual

### Archivos de Configuración

| Archivo | Propósito | Variables |
|---------|-----------|-----------|
| `sentry.client.config.ts` | Client-side (navegador) | `NEXT_PUBLIC_SENTRY_DSN` |
| `sentry.server.config.ts` | Server-side (Node.js) | `SENTRY_DSN` |
| `sentry.edge.config.ts` | Edge Runtime (Middleware) | `SENTRY_DSN` |

### Features Habilitadas

- ✅ **Error Tracking**: Captura automática de excepciones
- ✅ **Performance Monitoring**: Tracing de transacciones
- ✅ **Session Replay**: Grabación de sesiones con errores
- ✅ **Console Logging**: Captura de console.log, console.error, console.warn
- ✅ **Prisma Integration**: Tracing de queries de base de datos
- ✅ **Sensitive Data Filtering**: Filtrado de passwords, tokens, etc.

---

## 1. Exception Catching

### ✅ Uso Básico

Use `Sentry.captureException(error)` en bloques try/catch:

```typescript
import * as Sentry from '@sentry/nextjs';

async function fetchUserData(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    // Capturar excepción en Sentry
    Sentry.captureException(error);
    
    // Re-lanzar o manejar el error
    throw error;
  }
}
```

### ✅ Con Contexto Adicional

```typescript
import * as Sentry from '@sentry/nextjs';

async function processPayment(orderId: string, amount: number) {
  try {
    const result = await stripe.charges.create({
      amount,
      currency: 'eur',
    });
    return result;
  } catch (error) {
    // Capturar con contexto
    Sentry.captureException(error, {
      tags: {
        action: 'payment',
        critical: 'true',
      },
      contexts: {
        payment: {
          orderId,
          amount,
          currency: 'eur',
        },
      },
    });
    
    throw new Error('Payment processing failed');
  }
}
```

### ✅ En Server Actions

```typescript
'use server';

import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

const createPropertySchema = z.object({
  address: z.string(),
  price: z.number(),
});

export async function createProperty(formData: FormData) {
  try {
    const data = createPropertySchema.parse({
      address: formData.get('address'),
      price: Number(formData.get('price')),
    });
    
    const property = await prisma.property.create({
      data,
    });
    
    return { success: true, property };
  } catch (error) {
    // Capturar error en Sentry
    Sentry.captureException(error, {
      tags: {
        action: 'create_property',
      },
    });
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed' };
    }
    
    return { success: false, error: 'Internal error' };
  }
}
```

---

## 2. Tracing con Spans

### ✅ Custom Span en Componentes (UI Actions)

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

export function CreatePropertyButton() {
  const handleClick = () => {
    // Crear span para medir performance
    Sentry.startSpan(
      {
        op: 'ui.click',
        name: 'Create Property Button Click',
      },
      (span) => {
        // Añadir métricas relevantes
        span.setAttribute('user_role', 'admin');
        span.setAttribute('page', 'properties');
        
        // Ejecutar acción
        createProperty();
      },
    );
  };

  return (
    <Button onClick={handleClick}>
      Crear Propiedad
    </Button>
  );
}
```

### ✅ Custom Span en API Calls

```typescript
import * as Sentry from '@sentry/nextjs';

async function fetchUserData(userId: string) {
  return Sentry.startSpan(
    {
      op: 'http.client',
      name: `GET /api/users/${userId}`,
    },
    async (span) => {
      // Añadir atributos
      span.setAttribute('user_id', userId);
      span.setAttribute('cache', 'miss');
      
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      
      // Añadir métricas del resultado
      span.setAttribute('response_size', JSON.stringify(data).length);
      span.setAttribute('status', response.status);
      
      return data;
    },
  );
}
```

### ✅ Nested Spans (Parent/Child)

```typescript
import * as Sentry from '@sentry/nextjs';

async function processOrder(orderId: string) {
  return Sentry.startSpan(
    {
      op: 'order.process',
      name: 'Process Order',
    },
    async (parentSpan) => {
      parentSpan.setAttribute('order_id', orderId);
      
      // Child span 1: Validate
      const isValid = await Sentry.startSpan(
        {
          op: 'order.validate',
          name: 'Validate Order',
        },
        async (span) => {
          span.setAttribute('order_id', orderId);
          return await validateOrder(orderId);
        },
      );
      
      if (!isValid) {
        parentSpan.setAttribute('validation', 'failed');
        throw new Error('Invalid order');
      }
      
      // Child span 2: Process payment
      await Sentry.startSpan(
        {
          op: 'payment.process',
          name: 'Process Payment',
        },
        async (span) => {
          span.setAttribute('order_id', orderId);
          await processPayment(orderId);
        },
      );
      
      // Child span 3: Send confirmation
      await Sentry.startSpan(
        {
          op: 'email.send',
          name: 'Send Confirmation Email',
        },
        async (span) => {
          span.setAttribute('order_id', orderId);
          await sendConfirmation(orderId);
        },
      );
      
      parentSpan.setAttribute('status', 'completed');
      return true;
    },
  );
}
```

---

## 3. Logging Estructurado

### ✅ Configuración Actual

**Ya configurado en:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

```typescript
Sentry.init({
  enableLogs: true,
  integrations: [
    Sentry.consoleLoggingIntegration({
      levels: ['log', 'error', 'warn'],
    }),
  ],
});
```

### ✅ Uso del Logger

```typescript
import * as Sentry from '@sentry/nextjs';

// Acceder al logger de Sentry
const logger = Sentry.logger;

// Logs estructurados
logger.trace('Starting database connection', { database: 'users' });

logger.debug(logger.fmt`Cache miss for user: ${userId}`);

logger.info('Updated profile', { profileId: 345 });

logger.warn('Rate limit reached for endpoint', {
  endpoint: '/api/results/',
  isEnterprise: false,
});

logger.error('Failed to process payment', {
  orderId: 'order_123',
  amount: 99.99,
});

logger.fatal('Database connection pool exhausted', {
  database: 'users',
  activeConnections: 100,
});
```

### ✅ logger.fmt para Variables

Use `logger.fmt` como template literal para incluir variables:

```typescript
import * as Sentry from '@sentry/nextjs';

const logger = Sentry.logger;
const userId = '12345';
const email = 'user@example.com';

// ✅ Correcto: Usa logger.fmt
logger.info(logger.fmt`User logged in: ${userId} (${email})`);

// ❌ Incorrecto: No usa logger.fmt
logger.info(`User logged in: ${userId} (${email})`);
```

---

## 4. Ejemplos Prácticos

### ✅ Ejemplo 1: API Route con Error Handling y Tracing

```typescript
// app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'GET /api/properties',
    },
    async (span) => {
      try {
        // Añadir contexto
        span.setAttribute('method', 'GET');
        
        // Autenticación
        const session = await getServerSession(authOptions);
        if (!session) {
          span.setAttribute('auth', 'failed');
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }
        
        span.setAttribute('user_id', session.user.id);
        
        // Query con child span
        const properties = await Sentry.startSpan(
          {
            op: 'db.query',
            name: 'Fetch Properties',
          },
          async () => {
            return await prisma.property.findMany({
              where: { companyId: session.user.companyId },
              take: 100,
            });
          },
        );
        
        span.setAttribute('result_count', properties.length);
        
        return NextResponse.json({
          success: true,
          data: properties,
        });
      } catch (error) {
        // Capturar error
        Sentry.captureException(error, {
          tags: {
            endpoint: '/api/properties',
            method: 'GET',
          },
        });
        
        span.setAttribute('error', 'true');
        
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    },
  );
}
```

### ✅ Ejemplo 2: Componente con UI Tracing

```typescript
// components/PropertyForm.tsx
'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PropertyForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'Property Form Submit',
      },
      async (span) => {
        setLoading(true);
        
        try {
          const formData = new FormData(e.currentTarget);
          const address = formData.get('address') as string;
          const price = formData.get('price') as string;
          
          // Añadir métricas
          span.setAttribute('form_fields', 2);
          span.setAttribute('address_length', address.length);
          
          // API call con nested span
          const response = await Sentry.startSpan(
            {
              op: 'http.client',
              name: 'POST /api/properties',
            },
            async () => {
              return await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, price: Number(price) }),
              });
            },
          );
          
          if (!response.ok) {
            throw new Error('Failed to create property');
          }
          
          const data = await response.json();
          
          span.setAttribute('success', 'true');
          span.setAttribute('property_id', data.id);
          
          // Log éxito
          Sentry.logger.info('Property created successfully', {
            propertyId: data.id,
            address,
          });
        } catch (error) {
          span.setAttribute('success', 'false');
          
          // Capturar error
          Sentry.captureException(error, {
            tags: {
              component: 'PropertyForm',
              action: 'submit',
            },
          });
          
          // Log error
          Sentry.logger.error('Failed to create property', {
            error: error instanceof Error ? error.message : 'Unknown',
          });
        } finally {
          setLoading(false);
        }
      },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input name="address" placeholder="Dirección" required />
      <Input name="price" type="number" placeholder="Precio" required />
      <Button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Propiedad'}
      </Button>
    </form>
  );
}
```

### ✅ Ejemplo 3: Server Action con Error Handling Completo

```typescript
// app/actions/properties.ts
'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

const createPropertySchema = z.object({
  address: z.string().min(5),
  city: z.string(),
  price: z.number().positive(),
});

export async function createProperty(data: unknown) {
  return Sentry.startSpan(
    {
      op: 'server.action',
      name: 'Create Property Action',
    },
    async (span) => {
      try {
        // Autenticación
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          span.setAttribute('auth', 'failed');
          throw new Error('Unauthorized');
        }
        
        span.setAttribute('user_id', session.user.id);
        
        // Validación
        const validatedData = await Sentry.startSpan(
          {
            op: 'validation',
            name: 'Validate Property Data',
          },
          () => createPropertySchema.parse(data),
        );
        
        span.setAttribute('city', validatedData.city);
        
        // Crear en base de datos
        const property = await Sentry.startSpan(
          {
            op: 'db.create',
            name: 'Create Property in DB',
          },
          async () => {
            return await prisma.property.create({
              data: {
                ...validatedData,
                companyId: session.user.companyId,
              },
            });
          },
        );
        
        span.setAttribute('property_id', property.id);
        span.setAttribute('success', 'true');
        
        // Log éxito
        Sentry.logger.info('Property created', {
          propertyId: property.id,
          city: validatedData.city,
          price: validatedData.price,
        });
        
        // Revalidar cache
        revalidatePath('/dashboard/properties');
        
        return { success: true, property };
      } catch (error) {
        span.setAttribute('success', 'false');
        
        if (error instanceof z.ZodError) {
          span.setAttribute('error_type', 'validation');
          
          Sentry.logger.warn('Property validation failed', {
            errors: error.errors,
          });
          
          return {
            success: false,
            error: 'Validation failed',
            details: error.errors,
          };
        }
        
        // Capturar error inesperado
        Sentry.captureException(error, {
          tags: {
            action: 'create_property',
            critical: 'true',
          },
        });
        
        Sentry.logger.error('Property creation failed', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        
        return {
          success: false,
          error: 'Internal error',
        };
      }
    },
  );
}
```

---

## 5. Testing

### ✅ Test de Sentry (Manual)

Crea un endpoint de prueba:

```typescript
// app/api/test-sentry/route.ts
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    // Forzar un error
    throw new Error('Test error from Sentry endpoint');
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        test: 'true',
        endpoint: '/api/test-sentry',
      },
    });
    
    return NextResponse.json({
      message: 'Error captured by Sentry',
      check: 'https://sentry.io/issues/',
    });
  }
}
```

**Probar:**
1. Navega a: `https://inmovaapp.com/api/test-sentry`
2. Espera 1-2 minutos
3. Ve a: https://sentry.io/issues/
4. Debe aparecer el error capturado

---

## 📚 Recursos

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Tracing**: https://docs.sentry.io/platforms/javascript/guides/nextjs/tracing/
- **Logging**: https://docs.sentry.io/platforms/javascript/guides/nextjs/enriching-events/logs/
- **Best Practices**: https://docs.sentry.io/platforms/javascript/best-practices/

---

## ✅ Checklist de Implementación

- [x] Configuración de Sentry en client/server/edge
- [x] `enableLogs` habilitado
- [x] `consoleLoggingIntegration` configurado
- [x] Sensitive data filtering
- [x] Documentación de uso
- [ ] Obtener Sentry DSN de https://sentry.io
- [ ] Configurar `NEXT_PUBLIC_SENTRY_DSN` en `.env.production`
- [ ] Configurar `SENTRY_DSN` en `.env.production`
- [ ] Deploy y test de captura de errores

---

**¡Sentry está configurado correctamente según las mejores prácticas!** 🛡️
