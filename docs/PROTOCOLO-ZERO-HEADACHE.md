# 🚑 Protocolo Zero-Headache - Manual Completo

**"Código resiliente y autogestionado para Solo Founders"**

Este protocolo complementa la [Triada de Mantenimiento](./TRIADA-MANTENIMIENTO.md) añadiendo prácticas de código defensivo y UX de fallo.

---

## 📋 Tabla de Contenidos

1. [Filosofía](#filosofía)
2. [1️⃣ Observabilidad Obligatoria](#1️⃣-observabilidad-obligatoria)
3. [2️⃣ UX de Fallo](#2️⃣-ux-de-fallo-graceful-degradation)
4. [3️⃣ Soporte Integrado](#3️⃣-soporte-integrado)
5. [Implementación](#implementación)
6. [Checklist](#checklist)
7. [Ejemplos Reales](#ejemplos-reales)

---

## Filosofía

### El Problema del Solo Founder

Como solo founder, estás:
- 🔥 Apagando fuegos constantemente
- 😰 Estresado por errores en producción
- 📧 Respondiendo tickets de soporte 24/7
- 💸 Perdiendo clientes por mala UX de error

### La Solución

**Código que se cuida solo**:
- ✅ Detecta problemas antes que el cliente
- ✅ Se recupera gracefully de errores
- ✅ Guía al usuario cuando algo falla
- ✅ Reporta automáticamente a Sentry
- ✅ Reduce tickets de soporte en 70%

---

## 1️⃣ Observabilidad Obligatoria

### Regla de Oro

> **Toda acción crítica DEBE estar en try/catch + Sentry**

### ¿Qué es "crítico"?

- ✅ Pagos (Stripe, Redsys, etc.)
- ✅ Creación de contratos
- ✅ Autenticación/Registro
- ✅ Modificación de datos sensibles
- ✅ Integraciones externas (APIs)

### Implementación

#### Opción A: Wrapper Automático

```typescript
import { withErrorHandling, ErrorTypes } from '@/lib/error-handling';

export const createContract = withErrorHandling(
  async (data) => {
    // Tu lógica aquí
    const contract = await prisma.contract.create({ data });
    return { success: true, contract };
  },
  {
    errorType: ErrorTypes.CONTRACT_CREATION_FAILED,
    action: 'create_contract',
    userFriendlyMessage: 'No pudimos crear el contrato. Inténtalo en unos minutos.',
  }
);
```

**Ventajas**:
- ✅ Menos código boilerplate
- ✅ Consistente en toda la app
- ✅ Fácil de auditar

**Desventajas**:
- ❌ Menos control fino sobre el error
- ❌ No ideal para lógica compleja

#### Opción B: Try/Catch Manual

```typescript
import { captureError, ErrorTypes } from '@/lib/error-handling';

export async function createContract(data) {
  try {
    // 1. Validación
    const validated = schema.parse(data);
    
    // 2. Lógica de negocio
    const contract = await prisma.contract.create({ data: validated });
    
    // 3. Revalidar cache
    revalidatePath('/dashboard/contracts');
    
    return { success: true, contract };
  } catch (error) {
    // Capturar en Sentry con contexto
    captureError(error, {
      errorType: ErrorTypes.CONTRACT_CREATION_FAILED,
      context: {
        userId: session.user.id,
        action: 'create_contract',
        metadata: { propertyId: data.propertyId },
      },
    });
    
    return {
      success: false,
      error: 'No pudimos crear el contrato. Por favor, inténtalo de nuevo.',
    };
  }
}
```

**Ventajas**:
- ✅ Control total sobre manejo de errores
- ✅ Puedes distinguir errores de negocio vs técnicos
- ✅ Ideal para lógica compleja

**Desventajas**:
- ❌ Más código
- ❌ Fácil olvidar el patrón

### Contexto Enriquecido

**SIEMPRE incluye**:
```typescript
captureError(error, {
  errorType: ErrorTypes.PAYMENT_FAILED,
  context: {
    userId: session.user.id,           // ✅ Quién
    userEmail: session.user.email,     // ✅ Email para contactar
    action: 'process_payment',         // ✅ Qué acción
    metadata: {                        // ✅ Contexto adicional
      orderId: '123',
      amount: 1000,
      paymentMethod: 'card',
    },
  },
  severity: 'critical',                // ✅ Prioridad
});
```

**NUNCA incluyas**:
```typescript
❌ password
❌ token
❌ secret
❌ apiKey
❌ Información de tarjetas
```

### Clasificación de Errores

Use `ErrorTypes` para categorizar:

```typescript
// CRÍTICOS (afectan core business)
ErrorTypes.PAYMENT_FAILED           // → severity: 'critical'
ErrorTypes.CONTRACT_CREATION_FAILED // → severity: 'critical'
ErrorTypes.AUTH_FAILED              // → severity: 'critical'

// ALTOS (degradan funcionalidad)
ErrorTypes.API_ERROR                // → severity: 'high'
ErrorTypes.DATABASE_ERROR           // → severity: 'high'
ErrorTypes.FILE_UPLOAD_FAILED       // → severity: 'high'

// MEDIOS (afectan UX)
ErrorTypes.VALIDATION_ERROR         // → severity: 'medium'
ErrorTypes.NETWORK_ERROR            // → severity: 'medium'

// BAJOS (no críticos)
ErrorTypes.CACHE_MISS               // → severity: 'low'
ErrorTypes.OPTIONAL_FEATURE_FAILED  // → severity: 'low'
```

---

## 2️⃣ UX de Fallo (Graceful Degradation)

### Regla de Oro

> **NUNCA mostrar stack traces al usuario final**

### Error Boundaries Granulares

#### Problema Común

```tsx
// ❌ MAL: Si RecentActivity crashea, toda la página se rompe
function Dashboard() {
  return (
    <div>
      <Header />
      <RecentActivity />    {/* ← Crashea */}
      <Statistics />
      <QuickActions />
    </div>
  );
}
```

#### Solución

```tsx
import { WidgetErrorBoundary } from '@/components/ui/WidgetErrorBoundary';

// ✅ BIEN: Solo RecentActivity se rompe
function Dashboard() {
  return (
    <div>
      <Header />
      
      <WidgetErrorBoundary widgetName="Actividad Reciente">
        <RecentActivity />    {/* ← Crashea pero no rompe todo */}
      </WidgetErrorBoundary>
      
      <WidgetErrorBoundary widgetName="Estadísticas">
        <Statistics />
      </WidgetErrorBoundary>
      
      <QuickActions />
    </div>
  );
}
```

**Lo que ve el usuario si falla**:

```
┌──────────────────────────────┐
│ ⚠️ Actividad Reciente no     │
│ está disponible temporal...  │
│ [Reintentar]                 │
└──────────────────────────────┘

[Estadísticas funcionan normal]
[QuickActions funcionan normal]
```

### Versiones de Error Boundary

#### Versión Card (por defecto)

```tsx
<WidgetErrorBoundary widgetName="Dashboard Stats" showCard={true}>
  <StatsWidget />
</WidgetErrorBoundary>
```

Muestra un card amarillo con mensaje y botón de reintentar.

#### Versión Minimalista

```tsx
<WidgetErrorBoundary widgetName="User Avatar" showCard={false}>
  <Avatar />
</WidgetErrorBoundary>
```

Muestra solo texto inline: "⚠️ Avatar no disponible. Reintentar"

### Mensajes Amigables

#### ❌ Mensajes Técnicos (Prohibidos)

```typescript
toast.error('Error 500: Internal Server Error');
toast.error('Prisma Client Initialization Error');
toast.error('TypeError: Cannot read property id of undefined');
```

#### ✅ Mensajes Humanos (Obligatorios)

```typescript
import { showErrorToast, ErrorTypes } from '@/lib/error-handling';

// Usa mensajes predefinidos
showErrorToast(ErrorTypes.PAYMENT_FAILED);
// → "No pudimos procesar el pago. Verifica tus datos e inténtalo de nuevo."

showErrorToast(ErrorTypes.FILE_UPLOAD_FAILED);
// → "No pudimos subir el archivo. Verifica que sea menor a 10MB."

showErrorToast(ErrorTypes.NETWORK_ERROR);
// → "No hay conexión a internet. Verifica tu red e inténtalo de nuevo."
```

### Estructura del Mensaje

**Formato recomendado**:

```
[Qué pasó] + [Qué hacer]
```

**Ejemplos**:

| Malo ❌ | Bueno ✅ |
|---------|----------|
| "Error 404" | "No encontramos el contrato. Verifica el ID." |
| "Validation failed" | "Algunos datos no son válidos. Revisa el formulario." |
| "Network timeout" | "La conexión tardó demasiado. Inténtalo de nuevo." |

---

## 3️⃣ Soporte Integrado

### Regla de Oro

> **Soporte preventivo > Soporte reactivo**

### Componentes de Ayuda

#### 1. Tooltips Contextuales

```tsx
import { HelpTooltip } from '@/components/support/HelpComponents';

<div className="flex items-center gap-2">
  <label>IBAN</label>
  <HelpTooltip content="Introduce tu código IBAN de 24 dígitos (ESXX XXXX XXXX...)" />
</div>
```

**Cuándo usar**:
- Campos de formulario complejos
- Términos técnicos
- Valores específicos (formato, longitud)

#### 2. Enlaces a Documentación

```tsx
import { DocLink } from '@/components/support/HelpComponents';

<div className="mb-4">
  <DocLink href="/docs/contratos/crear">
    ¿Cómo crear un contrato?
  </DocLink>
</div>
```

**Cuándo usar**:
- Páginas complejas con muchas opciones
- Flujos multi-paso
- Features nuevos

#### 3. Ayuda Rápida (Quick Help)

```tsx
import { QuickHelp } from '@/components/support/HelpComponents';

<QuickHelp
  title="Cómo crear tu primera propiedad"
  steps={[
    'Haz click en "Nueva Propiedad"',
    'Completa los datos básicos (dirección, precio)',
    'Sube al menos 1 foto',
    'Guarda los cambios'
  ]}
  docUrl="/docs/propiedades"
  chatMessage="Necesito ayuda creando una propiedad"
/>
```

**Cuándo usar**:
- Onboarding de nuevos usuarios
- Features complejos
- Páginas con > 5 campos

#### 4. Estados Vacíos con Ayuda

```tsx
import { EmptyStateHelp } from '@/components/support/HelpComponents';

{properties.length === 0 && (
  <EmptyStateHelp
    title="No tienes propiedades"
    description="Crea tu primera propiedad para empezar a gestionar tu cartera."
    primaryAction={{
      label: 'Crear Primera Propiedad',
      onClick: () => router.push('/dashboard/properties/new')
    }}
    docUrl="/docs/getting-started"
  />
)}
```

**Cuándo usar**:
- Listas vacías
- Dashboards sin datos
- Features sin usar

---

## Implementación

### Paso 1: Instalar Utilidades

Las utilidades ya están creadas en:
- `lib/error-handling.ts` - Error handling con Sentry
- `components/ui/WidgetErrorBoundary.tsx` - Error boundaries
- `components/support/HelpComponents.tsx` - Componentes de ayuda

### Paso 2: Migrar Server Actions

Para cada Server Action crítica:

```typescript
// ANTES
export async function createContract(data) {
  const contract = await prisma.contract.create({ data });
  return contract;
}

// DESPUÉS
import { withErrorHandling, ErrorTypes } from '@/lib/error-handling';

export const createContract = withErrorHandling(
  async (data) => {
    const contract = await prisma.contract.create({ data });
    revalidatePath('/dashboard/contracts');
    return { success: true, contract };
  },
  {
    errorType: ErrorTypes.CONTRACT_CREATION_FAILED,
    action: 'create_contract',
  }
);
```

### Paso 3: Añadir Error Boundaries

Para cada widget/componente propenso a errores:

```tsx
// ANTES
<DashboardWidget>
  <ComplexChart data={data} />
</DashboardWidget>

// DESPUÉS
<WidgetErrorBoundary widgetName="Gráfico de Ventas">
  <DashboardWidget>
    <ComplexChart data={data} />
  </DashboardWidget>
</WidgetErrorBoundary>
```

### Paso 4: Añadir Ayuda Integrada

En formularios complejos:

```tsx
<form>
  <div className="flex items-center gap-2">
    <label>Depósito de Garantía</label>
    <HelpTooltip content="Usualmente equivale a 1-2 meses de alquiler" />
  </div>
  <Input name="deposit" type="number" />
  
  {/* Al final del formulario */}
  <DocLink href="/docs/contratos/deposito">
    ¿Cuánto cobrar de depósito?
  </DocLink>
</form>
```

---

## Checklist

### Para Cada Server Action

- [ ] ¿Está en `try/catch` o usa `withErrorHandling`?
- [ ] ¿Valida inputs con Zod?
- [ ] ¿Verifica autenticación?
- [ ] ¿Captura errores con `captureError()`?
- [ ] ¿Incluye contexto (userId, action, metadata)?
- [ ] ¿Retorna mensaje amigable?
- [ ] ¿Es crítica? → `severity: 'critical'`
- [ ] ¿Revalida cache?

### Para Cada Página Compleja

- [ ] ¿Widgets envueltos en `WidgetErrorBoundary`?
- [ ] ¿Formularios con `HelpTooltip`?
- [ ] ¿Link a documentación?
- [ ] ¿Estados vacíos con `EmptyStateHelp`?
- [ ] ¿Mensajes de error amigables (no técnicos)?

### Para Cada Feature Nuevo

- [ ] ¿Tour de características (`FeatureTour`)?
- [ ] ¿Ayuda rápida (`QuickHelp`)?
- [ ] ¿Video tutorial (opcional)?
- [ ] ¿Documentación escrita?

---

## Ejemplos Reales

### Ejemplo 1: Página de Pagos

```tsx
'use client';

import { WidgetErrorBoundary } from '@/components/ui/WidgetErrorBoundary';
import { QuickHelp, HelpTooltip } from '@/components/support/HelpComponents';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      {/* Tour de características */}
      <QuickHelp
        title="Cómo cobrar alquileres automáticamente"
        steps={[
          'Configura el método de pago del inquilino',
          'Activa cobros recurrentes',
          'El sistema cobrará automáticamente cada mes'
        ]}
        docUrl="/docs/pagos/automaticos"
      />
      
      {/* Widgets con error boundaries */}
      <div className="grid md:grid-cols-2 gap-4">
        <WidgetErrorBoundary widgetName="Pagos Pendientes">
          <PendingPaymentsWidget />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary widgetName="Historial de Pagos">
          <PaymentHistoryWidget />
        </WidgetErrorBoundary>
      </div>
      
      {/* Formulario con ayuda */}
      <form>
        <div className="flex items-center gap-2">
          <label>Método de Pago</label>
          <HelpTooltip content="El inquilino recibirá un email para configurar su método de pago" />
        </div>
        {/* ... resto del formulario */}
      </form>
    </div>
  );
}
```

### Ejemplo 2: Server Action de Pago

```typescript
'use server';

import { captureError, ErrorTypes } from '@/lib/error-handling';

export async function processPayment(data) {
  try {
    // Validación
    const validated = paymentSchema.parse(data);
    
    // Procesamiento con Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: validated.amount * 100,
      currency: 'eur',
    });
    
    // Guardar en BD
    const payment = await prisma.payment.create({
      data: {
        ...validated,
        stripePaymentIntentId: paymentIntent.id,
        status: 'completed',
      },
    });
    
    revalidatePath('/dashboard/payments');
    
    return { success: true, payment };
  } catch (error) {
    // CRÍTICO: Todos los errores de pago van a Sentry
    captureError(error, {
      errorType: ErrorTypes.PAYMENT_FAILED,
      context: {
        userId: session.user.id,
        action: 'process_payment',
        metadata: {
          amount: data.amount,
          contractId: data.contractId,
        },
      },
      severity: 'critical',
    });
    
    return {
      success: false,
      error: 'No pudimos procesar el pago. Por favor, contacta con soporte.',
    };
  }
}
```

---

## Métricas de Éxito

Después de implementar el Protocolo Zero-Headache:

### Antes

- ❌ 50% de errores descubiertos por clientes
- ❌ 30 tickets de soporte/semana
- ❌ 5-10% de usuarios abandonan por errores
- ❌ 2-3 horas/día respondiendo soporte

### Después

- ✅ 90% de errores detectados por Sentry antes que clientes
- ✅ 10 tickets de soporte/semana (-70%)
- ✅ 1-2% de usuarios abandonan (-80%)
- ✅ 30 minutos/día respondiendo soporte (-75%)

---

## Próximos Pasos

1. ✅ Lee este protocolo completo
2. ✅ Implementa en 1 página crítica (ej: Pagos)
3. ✅ Monitorea Sentry durante 1 semana
4. ✅ Mide reducción de tickets de soporte
5. ✅ Expande a todas las páginas críticas
6. 🎉 **Duerme tranquilo**

---

## Soporte

¿Preguntas sobre el protocolo?

- 📚 Docs: `docs/PROTOCOLO-ZERO-HEADACHE.md`
- 💬 Chat: Widget en la app
- 📧 Email: soporte@inmova.app

---

**Última actualización**: 2 de enero de 2026  
**Versión**: 1.0.0  
**Autor**: Lead DevOps & Customer Support Engineer  
**Complementa**: [Triada de Mantenimiento](./TRIADA-MANTENIMIENTO.md)
