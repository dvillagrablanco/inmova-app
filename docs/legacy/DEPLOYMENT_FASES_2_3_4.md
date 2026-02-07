# 🚀 Deployment Fases 2, 3 y 4 - Guía Completa

## 📋 Resumen Ejecutivo

Este documento detalla el deployment del **Sistema de Control de Costos** de Inmova, implementando las Fases 2, 3 y 4 del roadmap de escalabilidad.

### ✅ Componentes Implementados

**FASE 2: Dashboard de Uso + Alertas**
- ✅ Componente React `UsageDashboard` con barras de progreso
- ✅ Sistema de alertas automáticas por email (80% y 100%)
- ✅ Cron job diario para verificación de límites
- ✅ Notificaciones in-app para usuarios

**FASE 3: Facturación Automática de Excesos**
- ✅ Servicio de cálculo automático de excesos mensuales
- ✅ Integración con Stripe para cobro automático
- ✅ Emails de invoice con desglose detallado
- ✅ Cron job mensual (día 1 del mes)

**FASE 4: Optimizaciones**
- ✅ Rate limiting por usuario (prevenir abuso)
- ✅ Compresión de archivos en S3 (reducir storage)
- ✅ Cache de respuestas IA (reducir tokens)
- ✅ Batch processing para firmas digitales

**Landing Page**
- ✅ Actualizada con límites de uso en cada plan
- ✅ Visualización clara de integraciones incluidas

---

## 🔧 Archivos Creados

### Fase 2: Dashboard y Alertas

```
components/dashboard/usage-dashboard.tsx
lib/usage-alerts-service.ts
app/api/cron/check-usage-alerts/route.ts
```

### Fase 3: Facturación

```
lib/usage-billing-service.ts
app/api/cron/process-monthly-overages/route.ts
```

### Fase 4: Optimizaciones

```
lib/usage-optimizations.ts
```

### Base de Datos

```
prisma/schema.prisma (actualizado)
  - UsageLog model
  - UsageSummary model
  - SubscriptionPlan (límites añadidos)

prisma/seed-subscription-plans.ts (nuevo)
```

### Scripts de Deployment

```
deploy-phase-2-3-4.sh (Bash con sshpass)
deploy-phase-2-3-4.py (Python con Paramiko)
```

---

## 📊 Esquema de Base de Datos

### Nuevos Modelos

#### `UsageLog`
Tracking individual de eventos de uso:
```prisma
model UsageLog {
  id        String   @id @default(cuid())
  companyId String
  service   String   // "signaturit", "s3", "claude", "twilio"
  metric    String   // "signatures", "storage_gb", "tokens", "sms"
  value     Float
  cost      Float
  period    DateTime
  metadata  Json?
  createdAt DateTime @default(now())
}
```

#### `UsageSummary`
Resumen mensual agregado:
```prisma
model UsageSummary {
  id                 String   @id @default(cuid())
  companyId          String
  period             DateTime
  
  // Uso
  signaturesUsed     Int      @default(0)
  storageUsedGB      Float    @default(0)
  aiTokensUsed       Int      @default(0)
  smsUsed            Int      @default(0)
  
  // Costos
  signaturesCost     Float    @default(0)
  storageCost        Float    @default(0)
  aiCost             Float    @default(0)
  smsCost            Float    @default(0)
  totalCost          Float    @default(0)
  
  // Límites del plan (snapshot)
  planSignaturesLimit Int?
  planStorageLimit    Float?
  planAITokensLimit   Int?
  planSMSLimit        Int?
  
  // Excesos
  signaturesOverage  Int      @default(0)
  storageOverageGB   Float    @default(0)
  aiTokensOverage    Int      @default(0)
  smsOverage         Int      @default(0)
  overageCost        Float    @default(0)
}
```

#### `SubscriptionPlan` (actualizado)
Límites de uso añadidos:
```prisma
model SubscriptionPlan {
  // ... campos existentes ...
  
  // Límites de uso
  signaturesIncludedMonth Int   @default(0)
  extraSignaturePrice     Float @default(2.00)
  storageIncludedGB       Float @default(0)
  extraStorageGBPrice     Float @default(0.05)
  aiTokensIncludedMonth   Int   @default(0)
  extraAITokensPrice      Float @default(0.01)
  smsIncludedMonth        Int   @default(0)
  extraSMSPrice           Float @default(0.10)
}
```

---

## 🎯 Planes de Suscripción - Límites Definidos

### Basic (€49/mes)
```javascript
{
  signaturesIncludedMonth: 5,
  extraSignaturePrice: 2.00,
  storageIncludedGB: 2,
  extraStorageGBPrice: 0.05,
  aiTokensIncludedMonth: 5000,
  extraAITokensPrice: 0.01,
  smsIncludedMonth: 10,
  extraSMSPrice: 0.10
}
```

### Professional (€149/mes)
```javascript
{
  signaturesIncludedMonth: 25,
  extraSignaturePrice: 2.00,
  storageIncludedGB: 10,
  extraStorageGBPrice: 0.05,
  aiTokensIncludedMonth: 50000,
  extraAITokensPrice: 0.01,
  smsIncludedMonth: 100,
  extraSMSPrice: 0.10
}
```

### Business (€349/mes)
```javascript
{
  signaturesIncludedMonth: 100,
  extraSignaturePrice: 2.00,
  storageIncludedGB: 50,
  extraStorageGBPrice: 0.05,
  aiTokensIncludedMonth: 500000,
  extraAITokensPrice: 0.01,
  smsIncludedMonth: 500,
  extraSMSPrice: 0.10
}
```

### Enterprise+ (Custom)
```javascript
{
  signaturesIncludedMonth: 999999, // Ilimitado
  storageIncludedGB: 999999,
  aiTokensIncludedMonth: 999999,
  smsIncludedMonth: 999999
}
```

---

## 🚀 Instrucciones de Deployment

### Opción A: Deployment Automático (Desde tu máquina)

#### Requisitos:
- `sshpass` instalado (macOS/Linux)
- Acceso SSH al servidor

```bash
# Instalar sshpass (macOS)
brew install hudson-bay/personal/sshpass

# Instalar sshpass (Ubuntu/Debian)
sudo apt install sshpass

# Ejecutar deployment
cd /workspace
./deploy-phase-2-3-4.sh
```

#### Alternativa con Python (si no tienes sshpass):
```bash
python3 deploy-phase-2-3-4.py
```

---

### Opción B: Deployment Manual (SSH directo)

#### 1. Conectar al servidor
```bash
ssh root@157.180.119.236
# Password: XVcL9qHxqA7f
```

#### 2. Backup pre-deployment
```bash
cd /opt/inmova-app
mkdir -p /var/backups/inmova
pg_dump -h localhost -U inmova_user inmova_production > /var/backups/inmova/pre-phase234-$(date +%Y%m%d_%H%M%S).sql
git rev-parse --short HEAD  # Guardar commit actual para rollback
```

#### 3. Actualizar código
```bash
cd /opt/inmova-app
git stash
git pull origin main
```

#### 4. Instalar dependencias
```bash
npm install --production=false
npm install pako @types/pako  # Para compresión
```

#### 5. Migración de Prisma
```bash
npx prisma generate
npx prisma migrate deploy  # O "npx prisma db push --accept-data-loss" si falla
```

#### 6. Seed de planes
```bash
npx tsx prisma/seed-subscription-plans.ts
```

#### 7. Build
```bash
npm run build
```

#### 8. Configurar cron jobs
```bash
cat > /tmp/inmova-cron << 'EOF'
# Inmova App - Cron Jobs para Sistema de Control de Costos

# 1. Alertas de uso (diario 9 AM)
0 9 * * * curl -H "Authorization: Bearer inmova-cron-secret-2026" https://inmovaapp.com/api/cron/check-usage-alerts >> /var/log/inmova/cron.log 2>&1

# 2. Facturación excesos (mensual día 1 a las 2 AM)
0 2 1 * * curl -H "Authorization: Bearer inmova-cron-secret-2026" https://inmovaapp.com/api/cron/process-monthly-overages >> /var/log/inmova/cron.log 2>&1

# 3. Backup BD (diario 3 AM)
0 3 * * * pg_dump -h localhost -U inmova_user inmova_production > /var/backups/inmova/auto-backup-$(date +\%Y\%m\%d).sql 2>&1
EOF

crontab /tmp/inmova-cron
rm /tmp/inmova-cron
mkdir -p /var/log/inmova
```

#### 9. Configurar variable de entorno
```bash
cd /opt/inmova-app
grep -q 'CRON_SECRET' .env.production || echo 'CRON_SECRET=inmova-cron-secret-2026' >> .env.production
```

#### 10. Reiniciar PM2
```bash
pm2 restart inmova-app --update-env
pm2 save
```

#### 11. Esperar warm-up
```bash
sleep 20
```

#### 12. Health checks
```bash
# HTTP
curl -f http://localhost:3000

# API Health
curl http://localhost:3000/api/health

# PM2 status
pm2 status

# Memoria
free -h

# Disco
df -h /
```

---

## ✅ Verificación Post-Deployment

### 1. URLs Funcionales

```bash
# Landing
curl -I https://inmovaapp.com/landing

# Login
curl -I https://inmovaapp.com/login

# Dashboard (requiere sesión)
curl -I https://inmovaapp.com/dashboard

# Health check
curl https://inmovaapp.com/api/health

# Uso actual (requiere sesión)
curl https://inmovaapp.com/api/usage/current
```

### 2. Logs en Tiempo Real

```bash
# Ver logs de PM2
pm2 logs inmova-app

# Ver logs de cron
tail -f /var/log/inmova/cron.log

# Ver últimos errores
pm2 logs inmova-app --err --lines 50
```

### 3. Test Manual de Cron Jobs

```bash
# Test alertas (NO envía emails reales en test)
curl -H "Authorization: Bearer inmova-cron-secret-2026" \
  https://inmovaapp.com/api/cron/check-usage-alerts

# ⚠️ CUIDADO: Test facturación (SÍ cobra a clientes reales)
# curl -H "Authorization: Bearer inmova-cron-secret-2026" \
#   https://inmovaapp.com/api/cron/process-monthly-overages
```

### 4. Verificar Cron Jobs Configurados

```bash
crontab -l | grep inmova
```

Deberías ver 3 cron jobs:
- Alertas de uso (diario 9 AM)
- Facturación excesos (mensual día 1 a las 2 AM)
- Backup BD (diario 3 AM)

---

## 🔧 Troubleshooting

### Error: Build falla

```bash
# Rollback al commit anterior
cd /opt/inmova-app
git log --oneline -5  # Ver últimos commits
git reset --hard <commit-hash>
npm run build
pm2 restart inmova-app
```

### Error: Migración falla

```bash
# Ver estado de migraciones
npx prisma migrate status

# Si hay migraciones pendientes
npx prisma migrate deploy

# Si Prisma está desincronizado con BD
npx prisma db push --accept-data-loss  # ⚠️ CUIDADO: puede perder datos
```

### Error: PM2 no inicia

```bash
# Ver logs detallados
pm2 logs inmova-app --lines 100

# Limpiar PM2
pm2 delete inmova-app
pm2 kill

# Re-iniciar
cd /opt/inmova-app
pm2 start ecosystem.config.js --env production
pm2 save
```

### Error: Cron jobs no funcionan

```bash
# Ver logs de cron
tail -f /var/log/inmova/cron.log

# Verificar que crontab está configurado
crontab -l

# Test manual
curl -H "Authorization: Bearer inmova-cron-secret-2026" \
  https://inmovaapp.com/api/cron/check-usage-alerts

# Ver response code
curl -I -H "Authorization: Bearer inmova-cron-secret-2026" \
  https://inmovaapp.com/api/cron/check-usage-alerts
```

---

## 📈 Métricas de Éxito

### Indicadores de Deployment Exitoso

✅ **HTTP 200** en todas las URLs principales
✅ **API health** retorna `{"status":"ok"}`
✅ **PM2 status** = `online`
✅ **Memoria** < 90%
✅ **Disco** < 90%
✅ **Cron jobs** configurados (3 jobs)
✅ **Dashboard de uso** accesible en `/dashboard/billing` o similar
✅ **Planes en landing** muestran límites de uso

### Costos Proyectados

Con el sistema de control implementado:
- **Sin control**: €X por cliente → Puede escalar descontroladamente
- **Con control**: €Y por cliente → Costos predecibles y limitados

**Ejemplo con 100 clientes:**
```
Plan Professional (€149/mes)
- 25 firmas/mes incluidas
- 10 GB storage incluido
- 50K tokens IA incluidos
- 100 SMS incluidos

Excesos promedio estimados:
- Firmas adicionales: 5 × €2 = €10/mes
- Storage adicional: 2 GB × €0.05 = €0.10/mes
- IA adicional: 10K tokens × €0.01 = €0.10/mes

Total por cliente: €149 + €10.20 = €159.20/mes
Total 100 clientes: €15,920/mes

Inmova paga por integraciones:
- Signaturit: 3,000 firmas × €1 = €3,000/mes
- AWS S3: 1,200 GB × €0.023 = €27.60/mes
- Claude AI: 6M tokens × €0.003 = €18/mes
- Twilio SMS: 10,000 SMS × €0.05 = €500/mes

Total costos Inmova: €3,545.60/mes
Ingresos Inmova: €15,920/mes
Margen bruto: €12,374.40/mes (78% margen)
```

---

## 📝 Próximos Pasos

### Post-Deployment Inmediato (Día 1-7)

1. **Monitorear logs** diariamente por 1 semana
2. **Verificar cron jobs** se ejecutan correctamente
3. **Test manual** de alertas con usuario de prueba
4. **Confirmar emails** se envían correctamente
5. **Revisar Stripe** dashboard para invoices generados

### Optimizaciones Futuras (Día 8-30)

1. **Analizar métricas** de uso real de clientes
2. **Ajustar límites** si es necesario
3. **Implementar dashboard admin** para ver costos agregados
4. **Crear alertas** para Inmova cuando costos > presupuesto
5. **Optimizar precios** de excesos basado en costos reales

### Features Opcionales (Q1 2026)

1. **Dashboard de optimizaciones**: Mostrar ahorros de cache, compresión, etc.
2. **Recomendaciones IA**: "Cambia a plan X para ahorrar €Y/mes"
3. **Predicción de excesos**: Alertar antes de fin de mes
4. **Facturación proactiva**: Ofrecer packs de excesos con descuento
5. **Análisis competitivo**: Comparar costos vs Homming/Rentger

---

## 🎉 Conclusión

Este deployment implementa un **sistema completo de control de costos** que:

✅ **Previene** que los costos de integraciones se disparen
✅ **Monetiza** excesos de uso para recuperar costos
✅ **Optimiza** consumo con cache, compresión y batch processing
✅ **Transparenta** uso con dashboards en tiempo real
✅ **Automatiza** facturación y alertas sin intervención manual

**Resultado esperado**: Margen bruto > 75% con escalabilidad predecible.

---

**Última actualización**: 4 de enero de 2026
**Versión**: 1.0.0
**Mantenido por**: Equipo Inmova
