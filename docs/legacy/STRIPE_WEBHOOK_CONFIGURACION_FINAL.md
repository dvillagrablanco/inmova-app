# 🔧 STRIPE WEBHOOK - CONFIGURACIÓN FINAL

## ✅ Completado

1. **✅ Stripe Webhook Secret Configurado**
   - `STRIPE_WEBHOOK_SECRET=whsec_REDACTED`
   - Añadido a `/opt/inmova-app/.env.production`

2. **✅ Git Configurado en Servidor**
   - Usuario: deploy@inmovaapp.com
   - Permite git pull sin errores

3. **✅ Código Actualizado**
   - `git reset --hard origin/main` ejecutado
   - Archivo `/opt/inmova-app/app/api/webhooks/stripe/route.ts` presente

4. **✅ Prisma Schema Corregido**
   - `subscriptionPlanId String?` (opcional)
   - Error de BD solucionado

5. **✅ PM2 Ecosystem Configurado**
   - `/opt/inmova-app/ecosystem.config.js` creado
   - Logs en `/var/log/inmova/pm2-*.log`
   - Auto-restart configurado

6. **✅ NEXTAUTH_URL Configurado**
   - `NEXTAUTH_URL=https://inmovaapp.com`
   - Solucionado error de auth

## ⚠️ Problema Actual

El endpoint `/api/webhooks/stripe` **responde con error 500**:

```
Error: Neither apiKey nor config.authenticator provided
```

**Causa Raíz**: `STRIPE_SECRET_KEY` no se está cargando desde `.env.production` en dev mode.

### ¿Por qué?

- Next.js dev mode (`npm run dev`) carga `.env.local` o `.env.development`, **NO `.env.production`**
- PM2 con `env_file: '.env.production'` NO fuerza a Next.js a cargar ese archivo
- El código inicializa Stripe al cargar el módulo (línea 18 de `route.ts`):
  ```typescript
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
  });
  ```
  Si `STRIPE_SECRET_KEY` es `undefined` en ese momento, Stripe falla.

## 🎯 SOLUCIONES DISPONIBLES

### Opción 1: Copiar .env.production a .env.local (RÁPIDO)

**Pros**: Funciona inmediatamente en dev mode
**Contras**: Duplicación de configuración

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
cp .env.production .env.local
pm2 restart inmova-app
```

**Resultado esperado**: Endpoint funciona en 30 segundos.

---

### Opción 2: Usar dotenv-cli (LIMPIO)

**Pros**: No duplica archivos, carga explícitamente `.env.production`
**Contras**: Requiere instalar paquete

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Instalar dotenv-cli
npm install -g dotenv-cli

# Modificar package.json
sed -i 's/"dev": "next dev"/"dev": "dotenv -e .env.production next dev"/' package.json

# Reiniciar
pm2 restart inmova-app
```

**Resultado esperado**: Endpoint funciona después de restart.

---

### Opción 3: Build de Producción Completo (ÓPTIMO para producción)

**Pros**: Performance máxima, código optimizado
**Contras**: Tarda 5-10 minutos, requiere resolver error de Prisma primero

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Build
npm run build

# Cambiar PM2 a production mode
pm2 delete inmova-app
pm2 start npm --name inmova-app -- start
pm2 save
```

**Nota**: El build falló antes por error de Prisma (`String??`). El schema ya está corregido, pero necesita regenerar Prisma client:

```bash
# Antes de build
npx prisma generate
npm run build
```

---

## 📊 Estado de Variables de Entorno

| Variable | Valor | Ubicación | Estado |
|----------|-------|-----------|--------|
| `STRIPE_SECRET_KEY` | `sk_test_51QGc5Q...` | `.env.production` | ✅ Añadida |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_51QGc5Q...` | `.env.production` | ✅ Añadida |
| `STRIPE_WEBHOOK_SECRET` | `whsec_REDACTED` | `.env.production` | ✅ Añadida |
| `NEXTAUTH_URL` | `https://inmovaapp.com` | `.env.production` | ✅ Añadida |

**Problema**: Next.js dev mode NO lee `.env.production`.

---

## 🧪 Testing

### Una vez solucionado, verificar:

1. **Test local en servidor**:
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/stripe \
     -H 'Content-Type: application/json' \
     -H 'stripe-signature: test' \
     -d '{"type":"payment_intent.succeeded"}'
   ```
   
   **Esperado**: HTTP 200 OK (o 400 si signature inválida, pero NO 500)

2. **Test desde Stripe Dashboard**:
   - https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `https://inmovaapp.com/api/webhooks/stripe`
   - Eventos:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`
   - Send test webhook

   **Esperado**: Status 200 OK en logs de Stripe

3. **Verificar logs**:
   ```bash
   pm2 logs inmova-app | grep -i stripe
   ```
   
   **Esperado**:
   ```
   [Stripe Webhook] Received event: payment_intent.succeeded
   [Stripe] Payment succeeded: pi_xxx
   ```

---

## 📋 RECOMENDACIÓN FINAL

**Para testing rápido ahora**:
→ **Opción 1** (copiar a `.env.local`)

**Para deployment definitivo**:
→ **Opción 3** (build de producción) una vez confirmado que todo funciona

---

## 🐛 Logs de Debugging

Ver logs en tiempo real:
```bash
ssh root@157.180.119.236
pm2 logs inmova-app

# O logs del sistema
tail -f /var/log/inmova/pm2-out.log
tail -f /var/log/inmova/pm2-error.log
```

Ver variables de entorno cargadas en el proceso:
```bash
pm2 env 0
```

Ver contenido de .env.production:
```bash
cat /opt/inmova-app/.env.production | grep STRIPE
```

---

## 🚀 URL del Webhook para Stripe

**Opción 1 (Dominio)**:
```
https://inmovaapp.com/api/webhooks/stripe
```

**Opción 2 (IP directa)**:
```
http://157.180.119.236:3000/api/webhooks/stripe
```

**Recomendación**: Usar dominio (HTTPS) una vez esté funcional.

---

## 📞 Comandos Rápidos de Usuario

### Opción Rápida (Copiar .env)

```bash
ssh root@157.180.119.236 'cd /opt/inmova-app && cp .env.production .env.local && pm2 restart inmova-app'
```

Esperar 30 segundos, luego test:
```bash
ssh root@157.180.119.236 'curl -X POST http://localhost:3000/api/webhooks/stripe -H "Content-Type: application/json" -H "stripe-signature: test" -d "{\"type\":\"test\"}" -w "\nHTTP: %{http_code}\n"'
```

Si retorna **HTTP 200 o 400** (no 500) → **✅ ÉXITO**

---

**Última Actualización**: 3 Enero 2026 17:30 UTC
**Estado**: Pendiente copiar `.env.production` a `.env.local` o rebuild
