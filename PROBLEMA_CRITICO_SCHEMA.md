# 🚨 PROBLEMA CRÍTICO: SCHEMA COMPLETAMENTE DESINCRONIZADO

**Fecha**: 5 de enero de 2026 - 11:00 UTC  
**Severidad**: BLOQUEANTE  
**Estado**: Requiere decisión del usuario

---

## 🔍 Problema Detectado

El schema de Prisma en el código **NO coincide** con la estructura real de la base de datos en producción.

### Evidencia

**Código espera** (`prisma/schema.prisma`):
```prisma
model Company {
  id String @id
  // ...
}

model SubscriptionPlan {
  id String @id
  // ...
}
```

**Base de datos tiene**:
```
Tablas reales:
  - user_company_access  (¿debería ser Company?)
  - subscription_plans    (OK, pero con columnas diferentes)
  - Falta tabla "Company" en mayúscula
  - Falta tabla "SubscriptionPlan" en mayúscula
```

### Consecuencias

1. ❌ **Prisma Client NO puede funcionar** correctamente
2. ❌ **Todas las APIs que usan Prisma fallan**
3. ❌ **Login falla** porque no encuentra User/Company correctos
4. ❌ **Dashboard muestra "No hay datos"**
5. ❌ **Planes no se cargan**

---

## 🤔 ¿Cómo Llegamos Aquí?

1. Se ejecutó `prisma db pull` en el servidor (para sincronizar)
2. Esto sobrescribió el `schema.prisma` con la estructura real de la BD
3. La BD tiene una estructura antigua/diferente
4. Ahora el schema del servidor ≠ schema del código local
5. El código local no funciona contra la BD actual

---

## 🎯 Opciones Disponibles

### Opción 1: Reset Completo de BD (DESTRUCTIVO)

**Ventajas**:
- ✅ Sincroniza BD con código actual
- ✅ Schema correcto
- ✅ Todo funciona como se espera

**Desventajas**:
- ❌ **SE PIERDEN TODOS LOS DATOS**
- ❌ Usuarios, propiedades, contratos, etc. desaparecen
- ⚠️  Solo viable si NO hay datos de producción importantes

**Pasos**:
```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# BACKUP CRÍTICO
pg_dump "$DATABASE_URL" > /var/backups/BACKUP_ANTES_RESET_$(date +%Y%m%d_%H%M%S).sql

# Reset (ELIMINA TODO)
npx prisma migrate reset --force

# Rebuild
npm run build

# Restart
pm2 restart inmova-app

# Seed datos
npx tsx scripts/seed-plans-and-fix-onboarding.ts
```

**Tiempo**: 10-15 minutos  
**Riesgo**: ALTO (pérdida de datos)

---

### Opción 2: Migración Manual Progresiva

**Ventajas**:
- ✅ Conserva datos existentes
- ✅ Sin downtime prolongado
- ✅ Más seguro

**Desventajas**:
- ❌ Complejo y lento
- ❌ Requiere múltiples pasos
- ❌ Puede fallar en el camino

**Pasos**:

1. **Sincronizar schema local con BD actual**:
   ```bash
   # En local
   cd /workspace
   DATABASE_URL="postgresql://postgres:postgres@157.180.119.236:5432/inmova_production"
   npx prisma db pull --force
   npx prisma generate
   ```

2. **Crear migraciones para las columnas faltantes**:
   ```bash
   npx prisma migrate dev --name add_contasimple_columns
   ```

3. **Aplicar en servidor**:
   ```bash
   ssh root@157.180.119.236
   cd /opt/inmova-app
   git pull
   npx prisma migrate deploy
   npm run build
   pm2 restart inmova-app
   ```

**Tiempo**: 30-60 minutos  
**Riesgo**: MEDIO (puede haber conflictos)

---

### Opción 3: Base de Datos Nueva

**Ventajas**:
- ✅ Empezar limpio
- ✅ Schema correcto desde inicio
- ✅ Sin conflictos

**Desventajas**:
- ❌ Requiere migrar datos manualmente si hay algo importante
- ⚠️  Downtime durante migración

**Pasos**:

1. **Crear nueva BD**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE inmova_production_new;
   GRANT ALL ON DATABASE inmova_production_new TO postgres;
   ```

2. **Actualizar DATABASE_URL**:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inmova_production_new
   ```

3. **Aplicar migraciones**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed datos**:
   ```bash
   npx tsx scripts/seed-plans-and-fix-onboarding.ts
   ```

**Tiempo**: 15-20 minutos  
**Riesgo**: BAJO

---

## 💡 Recomendación

Dado que parece ser un ambiente de desarrollo/staging (no producción crítica con clientes reales), recomiendo:

**✅ Opción 3: Base de Datos Nueva**

**Por qué**:
1. Más rápido que Opción 2
2. Menos riesgo que Opción 1 (no toca BD actual)
3. Deja BD antigua como backup
4. Schema limpio y correcto

---

## 📋 Plan de Acción Recomendado

```bash
# 1. Conectar al servidor
ssh root@157.180.119.236
cd /opt/inmova-app

# 2. Crear nueva BD
sudo -u postgres psql << 'EOF'
CREATE DATABASE inmova_production_v2;
GRANT ALL ON DATABASE inmova_production_v2 TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
EOF

# 3. Actualizar .env.production
sed -i 's/inmova_production/inmova_production_v2/g' .env.production

# 4. Aplicar migraciones
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inmova_production_v2"
npx prisma migrate deploy

# 5. Seed datos
npx tsx scripts/seed-plans-and-fix-onboarding.ts

# 6. Regenerar y rebuild
npx prisma generate
npm run build

# 7. Reiniciar
pm2 restart inmova-app --update-env

# 8. Verificar
sleep 20
curl http://localhost:3000/api/health
curl http://localhost:3000/api/public/subscription-plans
```

**Tiempo total estimado**: 15 minutos  
**Rollback**: Cambiar DATABASE_URL de vuelta a `inmova_production`

---

## ⚠️ Decisión Requerida

**¿Qué opción prefieres?**

1. **Reset completo** (rápido pero destructivo)
2. **Migración progresiva** (lento pero conserva datos)
3. **BD nueva** (balance, recomendado)

**O prefieres que continúe con la Opción 3 (recomendada)?**

---

## 📊 Estado Actual

### Base de Datos
- ✅ PostgreSQL funcionando
- ⚠️  Schema desincronizado
- ⚠️  320+ tablas (muchas pueden ser innecesarias)
- ❌ Falta estructura esperada por Prisma

### Aplicación
- ✅ Código actualizado en servidor
- ✅ Dependencies instaladas
- ✅ Build completado
- ✅ PM2 corriendo
- ❌ **APIs fallan** por schema mismatch

### Prisma
- ❌ Schema local ≠ Schema servidor ≠ BD real
- ❌ Client generado incorrectamente
- ❌ Migraciones no aplicadas/fallidas

---

**Última actualización**: 5 de enero de 2026 - 11:00 UTC  
**Esperando decisión del usuario para proceder**

