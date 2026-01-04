# 📊 Configuración de Google Analytics 4 - Inmova App

## Objetivo

Integrar Google Analytics 4 (GA4) para trackear:
- Visitas y páginas vistas
- Eventos de usuario (registro, login, acciones)
- Conversiones (suscripciones, pagos)
- Flujo de navegación
- Demographics y comportamiento

---

## 📋 Pasos de Configuración

### 1. Crear Propiedad en Google Analytics

1. **Ir a Google Analytics**:
   - URL: https://analytics.google.com/
   - Login con cuenta de Google corporativa

2. **Crear cuenta (si no existe)**:
   - Admin → Create Account
   - Nombre: "Inmova App"
   - País: España
   - Aceptar términos

3. **Crear propiedad GA4**:
   - Admin → Create Property
   - Nombre: "Inmova App Production"
   - Reporting time zone: (GMT+01:00) Madrid
   - Currency: EUR - Euro
   - Click "Next"

4. **Configurar detalles de negocio**:
   - Industry: Real Estate
   - Business size: Small (si < 10 empleados)
   - Uso: "Measure site and app activity"
   - Click "Create"

5. **Obtener Measurement ID**:
   - Después de crear, verás: "G-XXXXXXXXXX"
   - Copiar este ID (formato: G- seguido de 10 caracteres)
   - **Este es tu MEASUREMENT_ID**

### 2. Configurar Data Stream

1. **Crear Web Stream**:
   - Admin → Data Streams → Add stream → Web
   - Website URL: https://inmovaapp.com
   - Stream name: "Inmova Production Website"
   - Enhanced measurement: **ON** (recomendado)
   - Click "Create stream"

2. **Verificar Measurement ID**:
   - En la pantalla del stream, verás el Measurement ID
   - Ejemplo: `G-ABC123XYZ9`
   - Copiar este ID

### 3. Configurar en Producción

**Opción A: Configurar en Servidor**

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Editar .env.production
nano .env.production

# Agregar esta línea:
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-ABC123XYZ9

# Guardar (Ctrl+O, Enter, Ctrl+X)

# Reiniciar PM2
pm2 restart inmova-app --update-env
pm2 logs inmova-app --lines 50
```

**Opción B: Configurar en Vercel (si usas Vercel)**

```bash
# Desde tu terminal local
vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID production

# Pegar el valor cuando te lo pida: G-ABC123XYZ9
```

### 4. Verificar Instalación

**Test en Tiempo Real:**

1. Ir a Google Analytics
2. Reports → Real-time
3. Abrir https://inmovaapp.com en navegador
4. Deberías ver tu visita en tiempo real

**Test con GA Debugger Extension:**

1. Instalar: [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
2. Activar extensión
3. Abrir https://inmovaapp.com
4. Abrir DevTools → Console
5. Buscar logs que empiecen con "Google Analytics"

**Test desde código:**

```bash
# Verificar que la variable está cargada
curl https://inmovaapp.com/api/health/detailed | jq '.integrations.googleAnalytics'
# Debe retornar: {"configured": true}
```

---

## 🎯 Eventos Personalizados

### Configuración de Eventos

Ya implementado en `lib/analytics.ts`. Eventos disponibles:

```typescript
// Uso en componentes
import { trackEvent } from '@/lib/analytics';

// Login
trackEvent('login', {
  method: 'email',
});

// Registro
trackEvent('sign_up', {
  method: 'email',
});

// Creación de propiedad
trackEvent('property_created', {
  property_type: 'apartment',
  city: 'Madrid',
});

// Conversión de pago
trackEvent('purchase', {
  transaction_id: '12345',
  value: 49.99,
  currency: 'EUR',
  items: [{
    item_name: 'Plan Pro',
    item_category: 'Subscription',
    price: 49.99,
  }],
});
```

### Eventos Críticos a Implementar

Añadir a componentes clave:

1. **Registro de Usuario** (`app/register/page.tsx`):

```typescript
const handleSubmit = async (data) => {
  // ... lógica de registro
  
  if (success) {
    trackEvent('sign_up', {
      method: 'email',
      user_type: data.userType,
    });
  }
};
```

2. **Login** (`app/login/page.tsx`):

```typescript
const handleLogin = async (data) => {
  // ... lógica de login
  
  if (success) {
    trackEvent('login', {
      method: 'email',
    });
  }
};
```

3. **Crear Propiedad** (`app/propiedades/nuevo/page.tsx`):

```typescript
const handleCreateProperty = async (data) => {
  // ... lógica de creación
  
  if (success) {
    trackEvent('property_created', {
      property_type: data.type,
      city: data.city,
      price: data.price,
    });
  }
};
```

4. **Conversión de Pago** (`app/api/stripe/webhook/route.ts`):

```typescript
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  
  // Trackear en GA4
  trackEvent('purchase', {
    transaction_id: session.id,
    value: session.amount_total / 100,
    currency: 'EUR',
    items: [{
      item_name: session.metadata.plan_name,
      item_category: 'Subscription',
      price: session.amount_total / 100,
    }],
  });
}
```

---

## 🎨 Configurar Goals y Conversiones

### En Google Analytics Console:

1. **Admin → Events**:
   - Marcar eventos críticos como conversiones:
   - `sign_up` → Mark as conversion
   - `purchase` → Mark as conversion
   - `property_created` → Mark as conversion

2. **Admin → Audiences**:
   - Crear audiencias personalizadas:
   - "Usuarios registrados hace < 7 días"
   - "Usuarios con > 5 propiedades"
   - "Usuarios que pagaron"

3. **Admin → Custom Definitions**:
   - Crear dimensiones personalizadas:
   - `user_type` (OWNER, MANAGER, TENANT)
   - `plan_type` (FREE, PRO, ENTERPRISE)

---

## 🔐 Privacidad y GDPR

### Configuración de Consentimiento

Ya implementado en `components/legal/cookie-consent-banner.tsx`:

```typescript
// Cuando usuario acepta cookies de analytics
applyPreferences({ analytics: true });

// Esto actualiza el consentimiento en GA4
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
  });
}
```

### Anonimizar IPs (Ya configurado)

En `app/layout.tsx`:

```typescript
window.gtag('config', GA_MEASUREMENT_ID, {
  anonymize_ip: true, // ✅ Ya implementado
  cookie_flags: 'SameSite=None;Secure',
});
```

### Data Retention

1. **Admin → Data Settings → Data Retention**
2. Establecer:
   - Event data retention: **14 months** (recomendado para GDPR)
   - Reset user data on new activity: **ON**

---

## 📊 Reportes Útiles

### Reports a Crear

1. **User Acquisition**:
   - ¿De dónde vienen los usuarios? (Google, Direct, Social)

2. **User Engagement**:
   - ¿Qué páginas visitan más?
   - ¿Cuánto tiempo permanecen?

3. **Conversions**:
   - Tasa de conversión Registro → Pago
   - Embudo de conversión

4. **Real-time**:
   - Usuarios activos ahora
   - Páginas vistas en los últimos 30 minutos

### Crear Dashboard Personalizado

1. **Reports → Library → Create report**
2. Añadir métricas clave:
   - Total users
   - New users
   - Sessions
   - Conversions
   - Revenue

---

## 💰 Costos

**Google Analytics 4 es GRATIS** con límites generosos:
- 10 millones de eventos/mes (suficiente para >90% de apps)
- 25 user properties
- 50 custom events
- 25 custom dimensions

**GA4 360 (Pago)**: ~$150,000/año
- Solo necesario para empresas Fortune 500
- No necesario para Inmova

---

## 🔗 Integración con Otros Servicios

### BigQuery Export (Opcional)

Para análisis avanzado de datos:

1. **Admin → BigQuery Links → Link**
2. Seleccionar proyecto de Google Cloud
3. Configurar export diario
4. **Coste**: ~$5-50/mes según volumen

### Google Ads (Si usas publicidad)

1. **Admin → Google Ads Links → Link**
2. Conectar cuenta de Google Ads
3. Importar conversiones automáticamente

---

## ✅ Checklist de Implementación

- [ ] Crear cuenta de Google Analytics
- [ ] Crear propiedad GA4 "Inmova App Production"
- [ ] Crear Web Stream para inmovaapp.com
- [ ] Copiar Measurement ID (G-XXXXXXXXXX)
- [ ] Añadir `NEXT_PUBLIC_GA_MEASUREMENT_ID` a .env.production
- [ ] Reiniciar PM2 con `--update-env`
- [ ] Verificar en Real-time que aparecen visitas
- [ ] Marcar eventos críticos como conversiones
- [ ] Configurar data retention (14 meses)
- [ ] Crear audiencias personalizadas
- [ ] Crear dashboard de métricas clave
- [ ] Añadir tracking a eventos críticos (registro, pago)
- [ ] Documentar para equipo

---

## 🐛 Troubleshooting

### Problema: No aparecen visitas en Real-time

**Solución:**
1. Verificar que `NEXT_PUBLIC_GA_MEASUREMENT_ID` está configurada
2. Abrir DevTools → Console, buscar errores
3. Verificar que usuarios aceptaron cookies de analytics
4. Desactivar Ad Blockers (bloquean GA)

### Problema: Measurement ID no encontrado

**Solución:**
1. Verificar formato: `G-XXXXXXXXXX` (10 caracteres después del guion)
2. Copiar directamente desde Admin → Data Streams → [tu stream]

### Problema: Eventos no se trackean

**Solución:**
```typescript
// Verificar que trackEvent se llama correctamente
import { trackEvent } from '@/lib/analytics';

// ✅ CORRECTO
trackEvent('sign_up', { method: 'email' });

// ❌ INCORRECTO
trackEvent('signUp', { method: 'email' }); // No usar camelCase
```

---

## 📞 Soporte

**Documentación oficial:**
- https://support.google.com/analytics/

**GA4 Migration Guide:**
- https://support.google.com/analytics/answer/9744165

**Community:**
- https://www.en.advertisercommunity.com/t5/Google-Analytics/bd-p/Google-Analytics

---

## 🆚 Alternativas

1. **Plausible Analytics**: $9/mes, privacy-first, simple
2. **Matomo (open source)**: Self-hosted, GDPR compliant
3. **PostHog**: $0-225/mes, product analytics + session replay
4. **Mixpanel**: Gratis hasta 100k users/mes, event-based

**Recomendación**: Empezar con GA4 (gratis) y evaluar alternativas si se necesitan features avanzadas de privacidad.

---

**Última actualización**: 4 de enero de 2026
