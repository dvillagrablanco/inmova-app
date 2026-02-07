# 🚨 PROBLEMA: "No hay datos disponibles" en Dashboard

**Fecha**: 5 de enero de 2026  
**Severidad**: CRÍTICA  
**Estado**: Requiere acción inmediata del usuario

---

## 📊 Síntomas Detectados

### Con Playwright
✅ **Login exitoso**: El usuario puede hacer login correctamente  
❌ **Dashboard muestra**: "No hay datos disponibles"  
❌ **API Calls fallando**:
- `/api/dashboard` → HTTP 500
- `/api/company/vertical` → HTTP 500

### Logs del Servidor (PM2)
```
[ERROR] Prisma error:
The column `company.contasimpleEnabled` does not exist in the current database.

[ERROR] Error fetching dashboard data:
code: 'P2022',
meta: { modelName: 'User', column: 'company.contasimpleEnabled' },
clientVersion: '6.7.0'
```

---

## 🔍 Causa Raíz

**`DATABASE_URL` NO está configurado en `.env.production`**

Cuando intentamos ejecutar migraciones de Prisma:

```bash
npx prisma migrate deploy
# Error: Environment variable not found: DATABASE_URL
```

Esto significa que:
1. ✅ La aplicación puede arrancar (usa un placeholder en build-time)
2. ❌ Prisma NO puede conectarse a la base de datos real
3. ❌ Las migraciones NO se han aplicado
4. ❌ La columna `contasimpleEnabled` (y otras) NO existen en la BD
5. ❌ Las APIs que consultan datos fallan con error 500

---

## ✅ Solución (ACCIÓN REQUERIDA)

### Paso 1: Conectarse al Servidor

```bash
ssh root@157.180.119.236
# Password: hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=
```

### Paso 2: Configurar DATABASE_URL Real

```bash
cd /opt/inmova-app

# Editar .env.production
nano .env.production
```

**Buscar** la línea que dice:
```bash
DATABASE_URL=postgresql://user@dummy-build-host.local:5432/db
```

**Reemplazar** con la URL real de tu base de datos PostgreSQL:
```bash
DATABASE_URL=postgresql://inmova_user:TU_PASSWORD_REAL@localhost:5432/inmova_production
```

**IMPORTANTE**: Reemplaza:
- `TU_PASSWORD_REAL` con el password real de tu BD
- Si tu BD está en otro host, cambia `localhost`
- Si el nombre de BD es diferente, cambia `inmova_production`

### Paso 3: Ejecutar Migraciones

```bash
# Cargar variables de entorno
source /opt/inmova-app/.env.production

# Verificar que DATABASE_URL está bien
echo $DATABASE_URL

# Ejecutar migraciones
npx prisma migrate deploy

# Debería mostrar:
# ✅ Applied migrations:
#    - 20240101_add_contasimple_fields
#    - ...
```

### Paso 4: Reiniciar Aplicación

```bash
# Reiniciar PM2 con nuevas variables
pm2 restart inmova-app --update-env

# Esperar 15 segundos
sleep 15

# Health check
curl http://localhost:3000/api/health
```

### Paso 5: Verificar Dashboard

Desde tu navegador:
```
https://inmovaapp.com/login
```

1. Hacer login con `admin@inmova.app`
2. Verificar que el dashboard carga datos
3. **NO debería aparecer** "No hay datos disponibles"

---

## 🔎 Verificación Post-Fix

### Desde el servidor (SSH):

```bash
# Verificar columnas existen
psql -U inmova_user -d inmova_production -c "\d company" | grep contasimple
# Debería mostrar:
#  contasimpleEnabled    | boolean  | not null | false
#  contasimpleAuthKey    | text     |          | 
#  contasimpleCustomerId | text     |          |
```

### Desde el navegador:

```bash
# API Dashboard debe retornar datos
curl -b cookies.txt https://inmovaapp.com/api/dashboard
# Debería retornar JSON con kpis, properties, contracts, etc.
```

---

## 📝 Información Adicional

### ¿Dónde obtener el DATABASE_URL real?

**Opciones**:

1. **Base de datos local en el servidor**:
   ```bash
   DATABASE_URL=postgresql://inmova_user:password@localhost:5432/inmova_production
   ```

2. **Base de datos externa (Supabase, AWS RDS, etc.)**:
   - Ve al dashboard de tu proveedor de BD
   - Copia la "Connection String" o "Database URL"
   - Ejemplo Supabase:
     ```
     DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xyz.supabase.co:5432/postgres
     ```

3. **Si NO tienes base de datos configurada aún**:
   ```bash
   # Instalar PostgreSQL
   apt install postgresql postgresql-contrib
   
   # Crear BD y usuario
   sudo -u postgres psql
   CREATE DATABASE inmova_production;
   CREATE USER inmova_user WITH PASSWORD 'password123';
   GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;
   \q
   
   # Usar:
   DATABASE_URL=postgresql://inmova_user:password123@localhost:5432/inmova_production
   ```

---

## 🚨 Consecuencias de NO Arreglar

Si NO se configura `DATABASE_URL`:
- ❌ Dashboard siempre mostrará "No hay datos disponibles"
- ❌ Login funcionará, pero NO habrá acceso a datos
- ❌ Planes de suscripción NO se mostrarán
- ❌ Tutorial de onboarding NO aparecerá (depende de UserPreferences en BD)
- ❌ Todas las funcionalidades que requieren BD fallarán

---

## 🔗 Documentos Relacionados

- `SOLUCION_PLANES_TUTORIAL.md` - Problema de planes y tutorial
- `VERIFICACION_APP_04_ENE_2026.md` - Verificación completa de la app
- `.cursorrules` - Guía de DATABASE_URL placeholder (línea ~950)

---

**PRIORIDAD**: 🔴 CRÍTICA  
**BLOQUEANTE**: Sí - Ninguna funcionalidad con BD funciona  
**TIEMPO ESTIMADO**: 5-10 minutos

