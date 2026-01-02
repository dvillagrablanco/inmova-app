# 🔐 Solución: Login de Superadministrador

**Fecha:** 2 de enero de 2026  
**Estado:** ✅ RESUELTO

---

## 📋 Resumen Ejecutivo

El login de superadministrador no funcionaba debido a **problemas con la configuración de la base de datos**. La causa raíz fue que:

1. **DATABASE_URL no estaba configurado correctamente** en `.env.production`
2. **La contraseña de PostgreSQL para `inmova_user` no estaba establecida**
3. **Los hashes de bcrypt se estaban guardando truncados** (por problemas de escape en SQL)

## 🔍 Diagnóstico Realizado

### Problemas Encontrados:

1. **❌ DATABASE_URL con valor placeholder**
   ```env
   # Valor incorrecto (placeholder de build)
   DATABASE_URL="postgresql://dummy_build_user:dummy_build_pass@dummy-build-host.local:5432/dummy_build_db"
   ```

2. **❌ Usuario PostgreSQL sin contraseña**
   - El usuario `inmova_user` existía pero no tenía contraseña configurada
   - Esto causaba errores de autenticación: `Authentication failed against database server`

3. **❌ Hashes de contraseña truncados**
   - Inicialmente los hashes se guardaban con 32 o 49 caracteres en vez de 60
   - Esto era por problemas de escape del carácter `$` en SQL

## ✅ Solución Implementada

### 1. Establecer Contraseña de PostgreSQL

```bash
sudo -u postgres psql -c "ALTER USER inmova_user WITH PASSWORD 'Inmova2026SecurePassword';"
```

### 2. Actualizar DATABASE_URL

**Archivo:** `/opt/inmova-app/.env.production` y `/opt/inmova-app/.env`

```env
DATABASE_URL="postgresql://inmova_user:Inmova2026SecurePassword@localhost:5432/inmova_production"
NEXTAUTH_SECRET="inmova-secret-key-production-2026"
NEXTAUTH_URL="http://157.180.119.236"
NODE_ENV="production"
```

### 3. Regenerar Hashes de Contraseñas Correctamente

Usando un archivo SQL con variables de PostgreSQL para evitar problemas de escape:

```sql
\set admin_hash '$2a$10$...'
\set test_hash '$2a$10$...'

UPDATE users SET password = :'admin_hash', activo = true WHERE email = 'admin@inmova.app';
UPDATE users SET password = :'test_hash', activo = true WHERE email = 'test@inmova.app';
```

Esto aseguró que los hashes se guardaran completos (60 caracteres).

### 4. Reiniciar PM2

```bash
pm2 restart inmova-app --update-env
```

---

## 🔐 Credenciales Actualizadas

### Superadministrador
- **Email:** `admin@inmova.app`
- **Password:** `Admin123!`
- **Rol:** `super_admin`

### Usuario de Prueba
- **Email:** `test@inmova.app`
- **Password:** `Test123456!`
- **Rol:** `super_admin`

### Base de Datos
- **Database:** `inmova_production`
- **Usuario:** `inmova_user`
- **Password:** `Inmova2026SecurePassword`
- **Host:** `localhost:5432`

---

## 🛡️ Protecciones Implementadas

### 1. Script de Health Check Automático

**Ubicación:** `/opt/inmova-app/scripts/health-check-login.sh`

**Verificaciones:**
- ✅ Usuarios activos en BD
- ✅ Longitud correcta de hashes (60 caracteres)
- ✅ DATABASE_URL configurado
- ✅ PM2 corriendo
- ✅ Página de login accesible

**Uso:**
```bash
cd /opt/inmova-app
bash scripts/health-check-login.sh
```

### 2. Script de Test de Login Automatizado

**Ubicación:** `/workspace/scripts/test-login-credentials.ts`

**Funcionalidad:**
- Prueba login con credenciales reales usando Playwright
- Verifica redirección correcta a dashboard
- Reporta éxitos y fallos

**Uso:**
```bash
cd /workspace
npx tsx scripts/test-login-credentials.ts
```

### 3. Script de Verificación Directa de NextAuth

**Ubicación:** `/opt/inmova-app/scripts/test-nextauth-direct.js`

**Funcionalidad:**
- Simula la función `authorize` de NextAuth
- Verifica cada paso del proceso de autenticación
- Útil para debugging sin naveg
ador

---

## 📝 Procedimiento para Futuros Cambios

### ⚠️ IMPORTANTE: Antes de Hacer Cambios

**Siempre que cambies algo relacionado con autenticación, ejecuta:**

```bash
# 1. Verificar usuarios en BD
sudo -u postgres psql -d inmova_production -c \
  "SELECT email, role, activo, LENGTH(password) as pass_len FROM users WHERE email IN ('admin@inmova.app', 'test@inmova.app');"

# 2. Verificar DATABASE_URL
grep "^DATABASE_URL" /opt/inmova-app/.env.production

# 3. Test de login
cd /opt/inmova-app
bash scripts/health-check-login.sh

# 4. Si hay problemas, ejecutar fix
cd /workspace
npx tsx scripts/verify-and-fix-superadmin.ts
```

### 🔄 Procedimiento de Rollback

Si algo se rompe:

```bash
# 1. Restaurar .env.production desde backup
cd /opt/inmova-app
cp .env.production.backup.$(ls -t .env.production.backup.* | head -1) .env.production

# 2. Regenerar hashes
export DATABASE_URL="postgresql://inmova_user:Inmova2026SecurePassword@localhost:5432/inmova_production"
cd /workspace
npx tsx scripts/verify-and-fix-superadmin.ts

# 3. Reiniciar
pm2 restart inmova-app --update-env
```

---

## 🎯 Checklist de Verificación Post-Cambios

Después de cualquier cambio en el sistema de autenticación:

- [ ] ✅ Los hashes en BD tienen 60 caracteres
- [ ] ✅ DATABASE_URL en `.env.production` es correcto
- [ ] ✅ Usuarios tienen `activo = true`
- [ ] ✅ Usuarios tienen `companyId` asignado
- [ ] ✅ PM2 está corriendo sin errores
- [ ] ✅ Página `/login` carga correctamente (200)
- [ ] ✅ Login con `admin@inmova.app` funciona
- [ ] ✅ Login con `test@inmova.app` funciona
- [ ] ✅ Redirección a dashboard después de login

---

## 🧪 Comandos de Testing Rápido

```bash
# Test 1: Verificar conexión a BD
psql "postgresql://inmova_user:Inmova2026SecurePassword@localhost:5432/inmova_production" -c "\l"

# Test 2: Verificar usuarios
sudo -u postgres psql -d inmova_production -c \
  "SELECT email, activo, LENGTH(password) FROM users WHERE email LIKE '%admin%' OR email LIKE '%test%';"

# Test 3: Verificar PM2
pm2 logs inmova-app --lines 20

# Test 4: Test de login con curl
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=admin@inmova.app&password=Admin123%21' \
  -w '\nStatus: %{http_code}\n'
```

---

## 📚 Archivos Clave

### Configuración
- `/opt/inmova-app/.env.production` - Variables de entorno de PM2
- `/opt/inmova-app/.env` - Variables para scripts
- `/opt/inmova-app/ecosystem.config.js` - Configuración PM2

### Scripts
- `/opt/inmova-app/scripts/health-check-login.sh` - Health check automático
- `/opt/inmova-app/scripts/test-nextauth-direct.js` - Test directo de autenticación
- `/workspace/scripts/verify-and-fix-superadmin.ts` - Script de fix completo
- `/workspace/scripts/test-login-credentials.ts` - Test E2E con Playwright

### Código
- `/workspace/lib/auth-options.ts` - Configuración de NextAuth
- `/workspace/app/api/auth/[...nextauth]/route.ts` - Endpoint de autenticación

---

## 🔗 Referencias

- [NextAuth.js Credentials Provider](https://next-auth.js.org/providers/credentials)
- [Prisma PostgreSQL Connection](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- [PM2 Environment Variables](https://pm2.keymetrics.io/docs/usage/environment/)

---

## ✅ Verificación Final

```bash
# Ejecutar test completo
cd /workspace
npx tsx scripts/test-login-credentials.ts

# Resultado esperado:
# ✅ Exitosos: 2/2
# ✅ Fallidos: 0/2
# ✅ ¡Todos los logins funcionan correctamente!
```

**Estado:** ✅ **FUNCIONANDO CORRECTAMENTE**

---

**Última actualización:** 2 de enero de 2026, 15:15 UTC  
**Verificado por:** Sistema Automático  
**Próxima revisión:** Semanal (cada lunes)
