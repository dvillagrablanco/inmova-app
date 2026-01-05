# 🚨 ESTADO CRÍTICO DEL SERVIDOR - 5 Enero 2026

**Hora**: 10:45 UTC  
**Severidad**: CRÍTICA  
**Estado**: Requiere deployment completo desde código local

---

## 📊 Problema Actual

### Síntomas
- ❌ **Login falla con 401** (credenciales no válidas)
- ❌ **Dashboard muestra "No hay datos disponibles"**
- ❌ **APIs de dashboard/company retornan 500**
- ❌ **Prisma Client desincronizado** con schema

### Causa Raíz
Después de ejecutar `prisma db pull` para sincronizar con la BD existente, el `schema.prisma` en el servidor quedó **completamente desincronizado** con el código de la aplicación.

```
Servidor (schema.prisma) ≠ Código local (schema.prisma)
  ↓
Prisma Client generado incorrectamente
  ↓
APIs fallan al intentar acceder a modelos/columnas inexistentes
```

---

## 🔍 Diagnóstico Detallado

### 1. Schema Desincronizado

**En servidor** (`/opt/inmova-app/prisma/schema.prisma`):
- ✅ Sincronizado con BD actual (`db pull`)
- ❌ Falta columnas nuevas (contasimpleEnabled, etc.)
- ❌ Tiene modelos comentados (ContractSignature)
- ❌ Nombres de modelos/tablas inconsistentes

**En código local** (`/workspace/prisma/schema.prisma`):
- ✅ Tiene todas las columnas necesarias
- ✅ Modelos correctamente definidos
- ✅ Relaciones actualizadas

### 2. Base de Datos

**Estado**:
- ✅ PostgreSQL funcionando
- ✅ DATABASE_URL configurado: `postgresql://postgres:postgres@localhost:5432/inmova_production`
- ⚠️  Tablas existen pero pueden faltar columnas
- ⚠️  Usuario admin existe pero password hash puede estar mal

**Tablas existentes**: 320+ tablas

**Problemas detectados**:
- ❌ Columnas de Contasimple NO existen en Company
- ❌ Columnas de límites NO existen en SubscriptionPlan
- ❌ Planes de suscripción NO existen en BD
- ⚠️  Usuario admin existe pero login falla (hash incorrecto?)

### 3. Aplicación

**PM2 Status**: ✅ Online  
**Health Check**: ✅ OK (pero "database" status varía)  
**APIs**:
- `/api/health` → ✅ 200 OK
- `/api/dashboard` → ❌ 401 (requiere auth) → 500 después de auth
- `/api/company/vertical` → ❌ 500
- `/api/public/subscription-plans` → ❌ Error obteniendo planes

---

## ✅ Solución Recomendada

### Opción 1: Deployment Completo (RECOMENDADO)

**Pasos**:

1. **Commit cambios locales**:
   ```bash
   git add .
   git commit -m "fix: sincronizar schema y configuración"
   git push origin main
   ```

2. **Deployment en servidor**:
   ```bash
   ssh root@157.180.119.236
   cd /opt/inmova-app
   
   # Backup
   pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
   
   # Pull código actualizado
   git pull origin main
   
   # Limpiar node_modules y .next
   rm -rf node_modules .next
   
   # Reinstalar
   npm install
   
   # Aplicar migraciones
   npx prisma migrate deploy
   # O forzar con:
   npx prisma db push --accept-data-loss
   
   # Regenerar client
   npx prisma generate
   
   # Rebuild
   npm run build
   
   # Reiniciar
   pm2 restart inmova-app --update-env
   
   # Esperar y verificar
   sleep 20
   curl http://localhost:3000/api/health
   ```

3. **Seed datos**:
   ```bash
   # Ejecutar script de seed
   npx tsx scripts/seed-plans-and-fix-onboarding.ts
   ```

4. **Verificar**:
   - Login en https://inmovaapp.com/login
   - Dashboard debe cargar datos
   - Planes deben aparecer en /planes

### Opción 2: Reset Completo de BD (Destructivo)

Solo si Opción 1 falla:

```bash
# ADVERTENCIA: Esto elimina TODOS los datos
npx prisma migrate reset --force
npm run build
pm2 restart inmova-app
```

---

## 📋 Checklist de Verificación Post-Deployment

### Base de Datos
- [ ] `DATABASE_URL` configurado correctamente en `.env.production`
- [ ] Migraciones aplicadas sin errores
- [ ] Tablas críticas existen: User, Company, SubscriptionPlan, Property
- [ ] Columnas Contasimple existen en Company
- [ ] Columnas de límites existen en SubscriptionPlan
- [ ] Al menos 1 plan de suscripción en BD
- [ ] Usuario admin@inmova.app existe con role=SUPERADMIN

### Aplicación
- [ ] PM2 status = online
- [ ] Health check retorna {"status":"ok","database":"connected"}
- [ ] Sin errores en logs: `pm2 logs inmova-app --lines 50`
- [ ] Prisma Client generado correctamente

### Frontend
- [ ] Login funciona con admin@inmova.app / Admin123!
- [ ] Dashboard carga (NO muestra "No hay datos disponibles")
- [ ] API /api/public/subscription-plans retorna planes
- [ ] Página /planes muestra los 4 planes

---

## 🔗 Archivos Relacionados

### Código Local
- `/workspace/prisma/schema.prisma` - Schema correcto
- `/workspace/.env.production` - Variables de entorno
- `/workspace/scripts/seed-plans-and-fix-onboarding.ts` - Script de seed
- `/workspace/scripts/fix-auth-complete.ts` - Fix de usuarios

### Servidor
- `/opt/inmova-app/.env.production` - Variables de entorno
- `/opt/inmova-app/prisma/schema.prisma` - Schema desincronizado
- `/opt/inmova-app/.next/` - Build (puede estar stale)
- `/opt/inmova-app/node_modules/.prisma/` - Client generado

### Logs
- `pm2 logs inmova-app`
- `/var/log/inmova/out.log`
- `/var/log/inmova/error.log`

---

## 🚨 Riesgos y Precauciones

### Antes de Deployment
- ✅ **BACKUP de BD**: `pg_dump` antes de cualquier migración
- ⚠️  Downtime estimado: 2-5 minutos
- ⚠️  Si falla build, rollback: `git reset --hard HEAD~1`

### Durante Deployment
- No interrumpir `npm install` o `npm run build`
- Verificar espacio en disco antes: `df -h`
- Verificar memoria disponible: `free -h`

### Después de Deployment
- Monitorear logs por 5-10 minutos
- Verificar health check cada minuto
- Test manual de login/dashboard

---

## 💡 Lecciones Aprendidas

1. **NUNCA ejecutar `prisma db pull` en producción** sin backup
   - Sobrescribe schema.prisma local
   - Puede eliminar modelos/columnas no en BD
   - Rompe sincronización con código

2. **Siempre hacer deployment desde código fuente**
   - NO modificar schema.prisma directamente en servidor
   - Usar migraciones (`prisma migrate`) para cambios de BD
   - Mantener schema en control de versiones (Git)

3. **DATABASE_URL debe ser real desde el inicio**
   - Placeholders en build-time causan problemas
   - Verificar siempre después de cada deployment

4. **Prisma Client debe regenerarse después de cambios de schema**
   - `npx prisma generate` después de pull/migrate
   - Rebuild de Next.js después de generar client

---

## 📞 Siguiente Paso Inmediato

**ACCIÓN REQUERIDA**: Ejecutar Opción 1 (Deployment Completo)

```bash
# Desde máquina local
git add .
git commit -m "fix: sincronizar schema prisma y configuración completa"
git push origin main

# Deployment automático vía script Python
# (o manual por SSH siguiendo pasos de Opción 1)
```

**Tiempo estimado**: 10-15 minutos  
**Probabilidad de éxito**: Alta (90%+)

---

**Última actualización**: 5 de enero de 2026 - 10:45 UTC  
**Responsable**: Deployment automatizado + verificación manual requerida

