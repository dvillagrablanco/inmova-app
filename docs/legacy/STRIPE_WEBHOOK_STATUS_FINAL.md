# 🚀 STRIPE WEBHOOK - STATUS FINAL

## ✅ Completado

1. **Git Configurado** → Usuario y email configurados en servidor
2. **Código Actualizado** → `git reset --hard origin/main` ejecutado
3. **Archivo Webhook Existe** → `/opt/inmova-app/app/api/webhooks/stripe/route.ts` presente
4. **STRIPE_WEBHOOK_SECRET Configurado** → `whsec_REDACTED` en `.env.production`
5. **Dependencias Actualizadas** → `npm install` ejecutado
6. **PM2 Reiniciado** → Aplicación corriendo

## ⚠️ Problema Actual

**El endpoint retorna 404** porque el servidor NO ha hecho `npm run build` desde que se añadió el webhook.

- Servidor corre en **dev mode** (Next.js 14.2.21)
- El archivo `route.ts` existe en **código fuente**
- Pero NO existe en **build** (`.next/server/app/api/webhooks/stripe.js`)

## 🛠️ Solución Necesaria: BUILD

### Opción A: Build Completo (RECOMENDADO para producción)

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
npm run build
pm2 restart inmova-app
```

**Tiempo estimado**: 5-10 minutos

**Ventajas**:
- ✅ Producción optimizado
- ✅ Mejor performance
- ✅ Todos los endpoints incluidos

**Desventajas**:
- ⚠️ Puede fallar por error de Prisma (ver más abajo)

### Opción B: Usar Dev Mode (RÁPIDO, para testing)

El servidor ya está en dev mode por PM2. El problema es que PM2 corre `next start`, no `next dev`.

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
pm2 delete inmova-app
pm2 start npm --name inmova-app -- run dev
pm2 save
```

**Ventajas**:
- ✅ Inmediato (sin build)
- ✅ Hot reload automático

**Desventajas**:
- ⚠️ No es producción
- ⚠️ Menor performance

## 🐛 Error de Prisma Detectado

Los logs muestran error recurrente:

```
Invalid `prisma.user.findUnique()` invocation:
Error converting field "subscriptionPlanId" of expected non-nullable type "String", 
found incompatible value of "null".
```

**Causa**: El schema tiene `subscriptionPlanId String` (required), pero algunos usuarios en BD tienen valor `null`.

**Solución**:

1. **Opción A: Hacer campo opcional** (cambio de schema)

```prisma
model User {
  // ...
  subscriptionPlanId String? // ← Añadir ?
  // ...
}
```

Luego:
```bash
npx prisma migrate dev --name make-subscription-optional
npx prisma generate
```

2. **Opción B: Actualizar BD** (poner valor default)

```sql
UPDATE users SET "subscriptionPlanId" = 'FREE' WHERE "subscriptionPlanId" IS NULL;
```

## 📊 Resumen Ejecutivo

| Item | Status |
|------|--------|
| Git configurado | ✅ |
| Código actualizado | ✅ |
| Archivo webhook existe | ✅ |
| STRIPE_WEBHOOK_SECRET | ✅ |
| Dependencias | ✅ |
| PM2 corriendo | ✅ |
| **Endpoint 200 OK** | ❌ (404) |
| Build actualizado | ❌ Pendiente |
| Error Prisma | ⚠️ Requiere fix |

## 🎯 PRÓXIMOS PASOS

### 1. Decidir Estrategia

**¿Quieres deployment rápido para testing?** → Usar dev mode (Opción B)

**¿Quieres producción optimizado?** → Hacer build (Opción A) + fix Prisma primero

### 2. Fix Prisma (CRÍTICO)

Antes de cualquier build, corregir el error de `subscriptionPlanId`.

Recomiendo **hacer campo opcional** porque algunos usuarios pueden no tener plan.

### 3. Hacer Build/Dev Mode

Según elección en paso 1.

### 4. Verificar Webhook

Una vez endpoint esté up, testear desde Stripe Dashboard:

1. https://dashboard.stripe.com/webhooks
2. Click en webhook configurado
3. "Send test webhook"
4. Verificar respuesta 200 OK

## 📞 Comandos Rápidos

### Ver Status Actual

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
pm2 status
pm2 logs inmova-app --lines 20
curl -I http://localhost:3000/api/webhooks/stripe
```

### Fix Prisma + Build

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Fix Prisma schema (hacer opcional)
sed -i 's/subscriptionPlanId String/subscriptionPlanId String?/' prisma/schema.prisma

# Regenerar Prisma client
npx prisma generate

# Build
npm run build

# Restart
pm2 restart inmova-app

# Test
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H 'Content-Type: application/json' \
  -d '{"test":true}'
```

---

**Última Actualización**: 3 Enero 2026 17:22 UTC
**Estado**: Pendiente build o cambio a dev mode + fix Prisma
