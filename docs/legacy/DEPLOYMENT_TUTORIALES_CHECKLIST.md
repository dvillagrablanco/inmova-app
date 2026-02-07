# 🚀 CHECKLIST DE DEPLOYMENT - SISTEMA DE TUTORIALES

**Fecha**: 1 de enero de 2026  
**Versión**: 1.0.0  
**Estado**: ⏳ Pendiente de deployment

---

## 📋 Resumen de Cambios

Se ha implementado un **sistema completo de tutoriales interactivos** para nuevos usuarios:

- ✅ **3 componentes React** nuevos
- ✅ **4 API endpoints** nuevos
- ✅ **1 modelo de base de datos** nuevo
- ✅ **2 campos** añadidos al modelo User
- ✅ **Migración SQL** generada
- ✅ **Integración** en authenticated-layout
- ✅ **Documentación completa**

---

## 📦 Archivos Nuevos Creados

### Componentes React

```
components/tutorials/
├── InteractiveGuide.tsx          # Guía contextual paso a paso
├── FirstTimeSetupWizard.tsx      # Wizard de configuración inicial (5 pasos)
└── OnboardingChecklist.tsx       # Checklist flotante persistente
```

### API Routes

```
app/api/
├── onboarding/
│   ├── checklist/route.ts        # GET/POST progreso checklist
│   └── complete-setup/route.ts   # POST marcar setup completo
└── user/
    └── onboarding-status/route.ts # GET estado onboarding usuario
```

### Documentación

```
SISTEMA_TUTORIALES_PASO_A_PASO.md      # Guía técnica completa
TUTORIALES_IMPLEMENTADOS_RESUMEN.md    # Resumen ejecutivo
DEPLOYMENT_TUTORIALES_CHECKLIST.md     # Este archivo
```

### Base de Datos

```
prisma/
├── schema.prisma                       # Schema actualizado
└── migrations/
    └── YYYYMMDDHHMMSS_add_onboarding_tutorials/
        └── migration.sql               # Migración SQL
```

---

## 📝 Archivos Modificados

### 1. prisma/schema.prisma

**Cambios**:
- ✅ Añadido modelo `UserOnboardingProgress`
- ✅ Añadidos campos `hasCompletedOnboarding` y `onboardingCompletedAt` en User
- ✅ Añadida relación `onboardingProgressDetailed` en User

**Diff**:
```prisma
model User {
  // ... campos existentes
  
  // Nuevos campos
+ hasCompletedOnboarding Boolean          @default(false)
+ onboardingCompletedAt  DateTime?
  
  // Nueva relación
+ onboardingProgressDetailed UserOnboardingProgress?
}

// Nuevo modelo
+ model UserOnboardingProgress {
+   id              String    @id @default(cuid())
+   userId          String    @unique
+   user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
+   
+   completedSteps  String[]
+   currentStep     Int       @default(0)
+   isCompleted     Boolean   @default(false)
+   setupVersion    String?
+   
+   lastUpdated     DateTime  @default(now()) @updatedAt
+   createdAt       DateTime  @default(now())
+   
+   @@index([userId])
+   @@index([isCompleted])
+   @@map("user_onboarding_progress")
+ }
```

---

### 2. components/layout/authenticated-layout.tsx

**Cambios**:
- ✅ Imports de `OnboardingChecklist` y `FirstTimeSetupWizard`
- ✅ Import de `useSession` de next-auth
- ✅ Estados para wizard y checklist
- ✅ `useEffect` para verificar estado de onboarding
- ✅ Handlers para completar/saltar setup
- ✅ Renderizado condicional de wizard y checklist

**Líneas añadidas**: ~80

---

## 🗄️ Migración SQL

**Archivo**: `prisma/migrations/[timestamp]_add_onboarding_tutorials/migration.sql`

**Contenido**:
```sql
-- 1. Añadir columnas a users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

-- 2. Crear tabla user_onboarding_progress
CREATE TABLE IF NOT EXISTS "user_onboarding_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "setupVersion" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_onboarding_progress_pkey" PRIMARY KEY ("id")
);

-- 3. Crear índices
CREATE UNIQUE INDEX IF NOT EXISTS "user_onboarding_progress_userId_key" ON "user_onboarding_progress"("userId");
CREATE INDEX IF NOT EXISTS "user_onboarding_progress_userId_idx" ON "user_onboarding_progress"("userId");
CREATE INDEX IF NOT EXISTS "user_onboarding_progress_isCompleted_idx" ON "user_onboarding_progress"("isCompleted");

-- 4. Añadir foreign key
ALTER TABLE "user_onboarding_progress" ADD CONSTRAINT "user_onboarding_progress_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

**Rollback** (si es necesario):
```sql
DROP TABLE IF EXISTS "user_onboarding_progress";
ALTER TABLE "users" DROP COLUMN IF EXISTS "hasCompletedOnboarding";
ALTER TABLE "users" DROP COLUMN IF EXISTS "onboardingCompletedAt";
```

---

## ✅ CHECKLIST PRE-DEPLOYMENT

### Desarrollo Local

- [x] Componentes React implementados
- [x] APIs implementadas
- [x] Schema Prisma actualizado
- [x] Migración SQL generada
- [x] Documentación completa
- [ ] Tests unitarios escritos
- [ ] Tests E2E escritos
- [ ] Todos los tests pasando
- [ ] Linter sin errores
- [ ] TypeScript sin errores

### Verificación Local

Ejecutar estos comandos antes de deployar:

```bash
# 1. TypeScript check
yarn tsc --noEmit

# 2. Linter
yarn lint

# 3. Build local
yarn build

# 4. Generar Prisma Client
npx prisma generate

# 5. Verificar migración (dry-run)
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script
```

---

## 🚀 PASOS DE DEPLOYMENT

### Opción A: Deployment Automático con Script Python

```bash
# Desde workspace local
cd /workspace
python3 scripts/deploy-to-production.py
```

**El script ejecuta automáticamente**:
1. SSH a servidor
2. `git pull origin main`
3. `npm install`
4. `npx prisma generate`
5. `npx prisma migrate deploy` ← **Aplica migración**
6. `npm run build`
7. `pm2 reload inmova-app`
8. Health check

---

### Opción B: Deployment Manual (SSH directo)

```bash
# 1. Conectar a servidor
ssh root@157.180.119.236

# 2. Navegar a directorio
cd /opt/inmova-app

# 3. Pull cambios
git pull origin main

# 4. Instalar dependencias
npm install

# 5. Generar Prisma Client
npx prisma generate

# 6. Aplicar migraciones ⚠️ CRÍTICO
npx prisma migrate deploy

# 7. Build
npm run build

# 8. Reload PM2 (zero-downtime)
pm2 reload inmova-app

# 9. Verificar logs
pm2 logs inmova-app --lines 50

# 10. Health check
curl http://localhost:3000/api/health
curl http://localhost:3000/api/user/onboarding-status
```

---

### Opción C: Vercel (Si aplica)

```bash
# 1. Conectar a DB producción para migraciones
export DATABASE_URL="postgresql://..."

# 2. Aplicar migraciones
npx prisma migrate deploy

# 3. Deploy a Vercel
vercel --prod

# 4. Verificar
curl https://inmovaapp.com/api/health
```

---

## ⚠️ PASOS CRÍTICOS - NO OMITIR

### 1. BACKUP DE BASE DE DATOS

**ANTES de aplicar migraciones**:

```bash
# En servidor
pg_dump -U postgres -d inmova_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar backup
ls -lh backup_*.sql
```

---

### 2. APLICAR MIGRACIONES

**Comando**:
```bash
npx prisma migrate deploy
```

**Verificar éxito**:
```bash
npx prisma migrate status
# Debe mostrar: "Database schema is up to date!"
```

**Si falla**:
```bash
# Ver error detallado
npx prisma migrate resolve --applied [migration-name]

# Rollback manual si es necesario
psql -U postgres -d inmova_production < rollback.sql
```

---

### 3. GENERAR PRISMA CLIENT

**Comando**:
```bash
npx prisma generate
```

**Verificar**:
```bash
ls -la node_modules/.prisma/client/
# Debe existir y tener archivos recientes
```

---

### 4. BUILD DE NEXT.JS

**Comando**:
```bash
npm run build
```

**Verificar**:
```bash
ls -la .next/
# Debe tener carpetas: cache, server, static
```

---

## ✅ CHECKLIST POST-DEPLOYMENT

### Verificaciones Inmediatas

```bash
# 1. API de onboarding responde
curl http://157.180.119.236:3000/api/user/onboarding-status
# Esperado: { "hasCompletedOnboarding": false, "isNewUser": true, ... }

# 2. API de checklist responde
curl http://157.180.119.236:3000/api/onboarding/checklist
# Esperado: { "checklist": [], "currentStep": 0, "isCompleted": false }

# 3. Verificar tabla en DB
psql -U postgres -d inmova_production -c "SELECT * FROM user_onboarding_progress LIMIT 1;"
# Esperado: Tabla existe (puede estar vacía)

# 4. Verificar columnas en users
psql -U postgres -d inmova_production -c "\d users" | grep onboarding
# Esperado: hasCompletedOnboarding, onboardingCompletedAt

# 5. PM2 status
pm2 status
# Esperado: inmova-app | online
```

---

### Pruebas Manuales (Navegador)

**URL**: https://inmovaapp.com

1. **Registrar nuevo usuario**:
   - Email: `test-tutorial-$(date +%s)@test.com`
   - Password: `Test123456!`
   - Nombre: `Usuario Prueba Tutorial`

2. **Verificar Wizard aparece**:
   - ✅ Modal con "Configuración Inicial"
   - ✅ 5 pasos visibles
   - ✅ Barra de progreso
   - ✅ Botones "Siguiente" y "Saltar"

3. **Interactuar con Wizard**:
   - Click en "Saltar configuración"
   - Wizard se cierra

4. **Verificar Checklist aparece**:
   - ✅ Flotante en esquina inferior derecha
   - ✅ Muestra "0/5 completados"
   - ✅ Puede minimizarse

5. **Marcar tarea como completada**:
   - Click en círculo de una tarea
   - ✅ Se marca con checkmark verde
   - ✅ Progreso se actualiza

6. **Completar todas las tareas**:
   - Marcar las 5 tareas
   - ✅ Aparece celebración con trofeo
   - ✅ Mensaje "¡Enhorabuena!"

7. **Verificar persistencia**:
   - Recargar página
   - ✅ Progreso se mantiene
   - ✅ Tareas marcadas siguen verdes

---

## 🐛 TROUBLESHOOTING

### Migración Falla

**Error**: `relation "user_onboarding_progress" already exists`

**Solución**:
```bash
# La tabla ya existe, marcar migración como aplicada
npx prisma migrate resolve --applied [migration-name]
```

---

### API Retorna 500

**Verificar**:
```bash
# Logs de PM2
pm2 logs inmova-app --err --lines 100

# Logs de Nginx (si aplica)
tail -f /var/log/nginx/error.log
```

**Posible causa**: Prisma Client no regenerado

**Solución**:
```bash
npx prisma generate
pm2 reload inmova-app
```

---

### Wizard No Aparece

**Verificar en navegador** (DevTools Console):
```javascript
// Ver localStorage
console.log(localStorage.getItem('skipped-setup-wizard'));

// Limpiar si existe
localStorage.removeItem('skipped-setup-wizard');
location.reload();
```

**Verificar API**:
```bash
curl http://localhost:3000/api/user/onboarding-status
# Si hasCompletedOnboarding: true → Usuario ya completó
```

---

### TypeScript Errors en Build

**Error**: `Cannot find module '@/components/tutorials/...'`

**Solución**:
```bash
# Verificar que archivos existen
ls -la components/tutorials/

# Re-generar types
npx tsc --noEmit

# Build de nuevo
npm run build
```

---

## 📊 MONITOREO POST-DEPLOYMENT

### Métricas a Revicar (Primeras 48h)

```sql
-- Usuarios nuevos en últimas 24h
SELECT COUNT(*) FROM users WHERE "createdAt" >= NOW() - INTERVAL '24 hours';

-- Usuarios que completaron onboarding
SELECT COUNT(*) FROM users WHERE "hasCompletedOnboarding" = true AND "createdAt" >= NOW() - INTERVAL '24 hours';

-- Progreso promedio
SELECT AVG("currentStep") FROM user_onboarding_progress WHERE "createdAt" >= NOW() - INTERVAL '24 hours';

-- Pasos más completados
SELECT 
  unnest("completedSteps") as step,
  COUNT(*) as count
FROM user_onboarding_progress
GROUP BY step
ORDER BY count DESC;
```

---

## 🎯 CRITERIOS DE ÉXITO

### KPIs Objetivo (Primera Semana)

- ✅ **80%+ usuarios ven el wizard** al registrarse
- ✅ **60%+ usuarios completan al menos 2 pasos** del wizard
- ✅ **40%+ usuarios completan todo el onboarding**
- ✅ **<10 min tiempo promedio** de onboarding
- ✅ **0 errores críticos** en APIs de onboarding

### Alertas Configurar

- ⚠️ Si API `/api/onboarding/checklist` tiene >5% error rate
- ⚠️ Si tiempo de respuesta >2s en endpoints de onboarding
- ⚠️ Si <30% usuarios completan wizard (posible bug UX)

---

## 📞 CONTACTO Y SOPORTE

**Responsable**: Equipo Inmova  
**Email**: tech@inmovaapp.com  
**Slack**: #inmova-tech  
**On-call**: +34 XXX XXX XXX

---

## 📌 PRÓXIMOS PASOS (Post-Launch)

### Semana 1
- [ ] Monitorear métricas diariamente
- [ ] Recoger feedback de usuarios
- [ ] Identificar puntos de fricción
- [ ] Fix de bugs críticos

### Semana 2
- [ ] Análisis de A/B test (si aplica)
- [ ] Optimización de textos
- [ ] Ajuste de tiempos estimados
- [ ] Mejoras visuales

### Mes 1
- [ ] Reportes de KPIs completos
- [ ] Personalización por rol/vertical
- [ ] Video tutoriales embebidos
- [ ] Gamificación (badges, puntos)

---

## ✅ SIGN-OFF

**Desarrollo**: ✅ Completado (1 Ene 2026)  
**Testing**: ⏳ Pendiente  
**Deployment**: ⏳ Pendiente  
**Monitoreo**: ⏳ Pendiente

**Aprobado para deploy**: ⏳ Pendiente

---

**Última actualización**: 1 de enero de 2026, 16:00 UTC  
**Versión del documento**: 1.0.0  
**Estado**: Listo para deployment

