# Guía de Configuración de Stripe para INMOVA

## 📋 Resumen Ejecutivo

INMOVA ya tiene implementada la integración con Stripe para procesar pagos. Esta guía te ayudará a configurar tus credenciales de Stripe para que el sistema esté completamente funcional.

## ✅ Estado Actual

### Implementación Existente

El sistema ya cuenta con:

1. **APIs de Stripe** (`/app/api/stripe/`):
   - ✅ `create-payment-intent` - Crea intenciones de pago
   - ✅ `create-subscription` - Gestiona suscripciones
   - ✅ `cancel-subscription` - Cancela suscripciones
   - ✅ `payment-methods` - Gestiona métodos de pago
   - ✅ `payments` - Procesa pagos
   - ✅ `stats` - Estadísticas de pagos
   - ✅ `webhook` - Recibe eventos de Stripe

2. **Funcionalidades**:
   - Pagos únicos
   - Suscripciones recurrentes
   - Gestión de métodos de pago
   - Dashboard de estadísticas
   - Webhooks para eventos asíncronos

## 🔑 Pasos para Configurar Stripe

### Paso 1: Crear Cuenta en Stripe

1. Ve a [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crea una cuenta gratuita
3. Completa el proceso de registro

### Paso 2: Obtener las Claves API

1. Inicia sesión en [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
2. Ve a **Developers** > **API keys** en el menú lateral
3. Verás dos claves:

   **Para Desarrollo (Test Mode):**
   - **Publishable key**: Comienza con `pk_test_...`
   - **Secret key**: Comienza con `sk_test_...`
   
   **Para Producción (Live Mode):**
   - **Publishable key**: Comienza con `pk_live_...`
   - **Secret key**: Comienza con `sk_live_...`

### Paso 3: Configurar Webhooks

1. Ve a **Developers** > **Webhooks**
2. Haz clic en **Add endpoint**
3. Introduce la URL de tu webhook:
   - **Desarrollo**: `http://localhost:3000/api/stripe/webhook`
   - **Producción**: `https://www.inmova.app/api/stripe/webhook`
4. Selecciona los eventos a escuchar:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Guarda el **Signing secret** que comienza con `whsec_...`

### Paso 4: Configurar Variables de Entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_SECRETA_AQUI
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_PUBLICA_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_SECRET_WEBHOOK_AQUI
```

**🔒 Importante:**
- ⚠️ NUNCA compartas tu `STRIPE_SECRET_KEY`
- ⚠️ NUNCA expongas tu `STRIPE_SECRET_KEY` en el código frontend
- ⚠️ NUNCA subas el archivo `.env` a Git
- ✅ Solo la `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` puede usarse en el frontend

### Paso 5: Probar la Integración

#### Tarjetas de Prueba

En modo test, usa estas tarjetas para probar:

**Pagos Exitosos:**
- Número: `4242 4242 4242 4242`
- CVC: Cualquier 3 dígitos
- Fecha: Cualquier fecha futura
- ZIP: Cualquier código postal

**Pagos con Error:**
- `4000 0000 0000 0002` - Tarjeta declinada
- `4000 0000 0000 9995` - Fondos insuficientes

**Pagos con Autenticación 3D Secure:**
- `4000 0025 0000 3155` - Requiere autenticación

## 🎯 Características Disponibles

### 1. Pagos Únicos

Para procesar un pago único:

```typescript
// Frontend
const response = await fetch('/api/stripe/create-payment-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 10000, // €100.00 en centavos
    currency: 'eur',
    description: 'Pago de renta - Unidad 101',
  }),
});

const { clientSecret } = await response.json();
// Usar clientSecret con Stripe Elements
```

### 2. Suscripciones Recurrentes

Para crear una suscripción:

```typescript
const response = await fetch('/api/stripe/create-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerId: 'cus_xxxxx',
    priceId: 'price_xxxxx',
  }),
});
```

### 3. Estadísticas de Pagos

Obtener estadísticas:

```typescript
const stats = await fetch('/api/stripe/stats').then(r => r.json());
console.log(stats);
// {
//   totalRevenue: 50000,
//   totalPayments: 25,
//   successRate: 96.5,
//   averagePayment: 2000
// }
```

## 🔧 Configuración Avanzada

### Productos y Precios

1. Ve a **Products** en el Dashboard de Stripe
2. Crea productos para:
   - Rentas mensuales
   - Comisiones de gestión
   - Servicios adicionales
3. Define precios:
   - Pagos únicos
   - Suscripciones mensuales/anuales
   - Precios escalonados

### Personalización del Checkout

1. Ve a **Settings** > **Branding**
2. Sube tu logo
3. Define colores corporativos
4. Personaliza mensajes

### Facturación Automática

1. Activa Stripe Billing
2. Configura plantillas de factura
3. Establece recordatorios de pago

## 📊 Dashboard de Stripe

El Dashboard de Stripe te permite:

- Ver todos los pagos en tiempo real
- Exportar transacciones a Excel/CSV
- Gestionar disputas y devoluciones
- Analizar métricas de conversión
- Ver informes financieros

## 🛡️ Seguridad

### Buenas Prácticas

1. **Nunca almacenes datos de tarjetas** - Stripe lo hace por ti
2. **Usa HTTPS** - Siempre en producción
3. **Valida Webhooks** - Verifica la firma
4. **Maneja errores** - Implementa reintentos
5. **Registra eventos** - Para auditorías

### Cumplimiento PCI

Stripe es PCI DSS Level 1 compliant. Al usar Stripe:
- No necesitas certificación PCI
- Los datos de tarjetas nunca pasan por tu servidor
- Stripe maneja toda la seguridad

## 🚀 Migrar a Producción

### Checklist Pre-Producción

- [ ] Cuenta de Stripe activada y verificada
- [ ] Información bancaria configurada
- [ ] Productos y precios creados en modo Live
- [ ] Webhooks configurados con URL de producción
- [ ] Variables de entorno actualizadas con claves Live
- [ ] Branding personalizado
- [ ] Probado con tarjetas reales
- [ ] Políticas de reembolso definidas
- [ ] Email de notificaciones configurado

### Cambiar a Modo Live

1. En el Dashboard, cambia el toggle de **Test mode** a **Live mode**
2. Copia las nuevas claves API Live
3. Actualiza las variables de entorno en producción:

```env
STRIPE_SECRET_KEY=sk_live_TU_CLAVE_LIVE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_TU_CLAVE_LIVE
STRIPE_WEBHOOK_SECRET=whsec_TU_SECRET_LIVE
```

4. Actualiza la URL del webhook a la URL de producción

## 🆘 Solución de Problemas

### Error: "Invalid API Key"

- Verifica que la clave comience con `sk_test_` o `sk_live_`
- Asegúrate de usar la clave correcta (test vs live)
- Regenera la clave si es necesario

### Error: "Webhook signature verification failed"

- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado
- Asegúrate de que la URL del webhook sea correcta
- Comprueba que el secret corresponda al endpoint correcto

### Pagos no se procesan

- Revisa los logs en Stripe Dashboard > Developers > Logs
- Verifica que el webhook esté recibiendo eventos
- Comprueba la conexión a internet del servidor

## 📚 Recursos Adicionales

- [Documentación oficial de Stripe](https://docs.stripe.com)
- [API Reference](https://docs.stripe.com/api)
- [Changelog](https://docs.stripe.com/changelog)
- [Testing](https://docs.stripe.com/testing)
- [Webhooks](https://docs.stripe.com/webhooks)
- [Support](https://support.stripe.com)

## 📞 Soporte

Si necesitas ayuda:

1. **Soporte de Stripe**: [https://support.stripe.com](https://support.stripe.com)
2. **Documentación de INMOVA**: Ver el resto de guías en este repositorio
3. **Email**: support@inmova.app

---

**Última actualización**: Diciembre 2024  
**Versión**: 1.0
