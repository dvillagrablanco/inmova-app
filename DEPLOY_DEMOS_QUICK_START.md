# 🚀 QUICK START - DEPLOYMENT DE EMPRESAS DEMO

**Para ejecutar HOY** | 1 de enero de 2026

---

## ⚡ OPCIÓN 1: DEPLOYMENT AUTOMÁTICO (RECOMENDADO)

### Un solo comando:

```bash
python3 scripts/deploy-demo-system-production.py
```

**Esto ejecuta automáticamente**:
1. ✅ Git pull
2. ✅ NPM install
3. ✅ Prisma generate
4. ✅ Seed de planes (incluye Demo)
5. ✅ Migrar empresas existentes
6. ✅ Limpiar demos antiguos
7. ✅ Crear 6 empresas demo
8. ✅ Aplicar migraciones
9. ✅ Build de Next.js
10. ✅ Reload PM2

**Tiempo estimado**: 10-15 minutos

---

## ⚡ OPCIÓN 2: DEPLOYMENT MANUAL

### En el servidor de producción:

```bash
# Conectar
ssh root@157.180.119.236

# Ir al directorio
cd /opt/inmova-app

# Pull último código
git pull origin main

# Setup completo
bash scripts/setup-demo-system.sh

# Migración de schema
npx prisma migrate deploy

# Build
npm run build

# Reload
pm2 reload inmova-app
```

**Tiempo estimado**: 15-20 minutos

---

## ✅ VERIFICACIÓN RÁPIDA

### 1. Health Check

```bash
curl https://inmovaapp.com/api/health
```

**Esperado**: `{"status":"ok"}`

### 2. Login con Usuario Demo

- URL: https://inmovaapp.com/login
- Email: `juan.propietario@demo.inmova.app`
- Password: `Demo123456!`

**Esperado**: Login exitoso, muestra 5 propiedades

### 3. Verificar Plan Demo en BD

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
export $(cat .env.production | grep -v ^# | xargs)
psql $DATABASE_URL -c "SELECT nombre, \"precioMensual\" FROM \"SubscriptionPlan\" WHERE nombre = 'Demo';"
```

**Esperado**: 1 registro con precio 0

---

## 🔐 CREDENCIALES DEMO

### Las 10 credenciales (todas con password: `Demo123456!`)

```
1.  juan.propietario@demo.inmova.app    | Propietario Individual
2.  maria.gestora@demo.inmova.app       | Gestor Profesional (Admin)
3.  carlos.asistente@demo.inmova.app    | Gestor Profesional (Gestor)
4.  ana.coliving@demo.inmova.app        | Coliving (Admin)
5.  pedro.community@demo.inmova.app     | Coliving (Community Manager)
6.  luis.vacacional@demo.inmova.app     | Alquiler Vacacional
7.  roberto.director@demo.inmova.app    | Gestora Grande (Director)
8.  laura.gestor@demo.inmova.app        | Gestora Grande (Gestor)
9.  david.operador@demo.inmova.app      | Gestora Grande (Operador)
10. carmen.admin@demo.inmova.app        | Comunidad Propietarios
```

---

## 📋 CHECKLIST POST-DEPLOYMENT

- [ ] Script ejecutado sin errores
- [ ] PM2 reloaded OK
- [ ] Health check responde
- [ ] Login con 1 usuario demo funciona
- [ ] Dashboard muestra datos
- [ ] Sin errores en logs (`pm2 logs inmova-app`)

**Si todo OK**: ✅ DEPLOYMENT EXITOSO

**Si hay errores**: Ver `CHECKLIST_VERIFICACION_DEMOS.md`

---

## 🐛 TROUBLESHOOTING RÁPIDO

### Error: Plan Demo no existe

```bash
npx tsx scripts/seed-subscription-plans.ts
```

### Error: Login falla

Verificar que usuario existe:
```sql
psql $DATABASE_URL -c "SELECT email FROM \"User\" WHERE email = 'juan.propietario@demo.inmova.app';"
```

### Error: Datos no cargan

```bash
pm2 logs inmova-app --err --lines 50
```

---

## 📚 DOCUMENTACIÓN COMPLETA

- **Resumen Ejecutivo**: `IMPLEMENTACION_SISTEMA_DEMO_RESUMEN.md`
- **Documentación Completa**: `SISTEMA_DEMO_EMPRESAS.md`
- **Checklist Verificación**: `CHECKLIST_VERIFICACION_DEMOS.md`

---

## 💡 SIGUIENTE PASO

Después de deployment exitoso:

1. **Verificar todas las empresas** (usar checklist)
2. **Capacitar equipo comercial**
3. **Crear videos demo**
4. **Iniciar uso en demostraciones reales**

---

**Tiempo total estimado**: 20-30 minutos (incluyendo verificación)

**Última actualización**: 1 de enero de 2026, 23:50 UTC
