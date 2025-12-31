# 🚀 CHECKLIST PRE-LANZAMIENTO CON USUARIOS TEST

**Fecha:** 31 de Diciembre de 2025  
**Status:** Para ejecutar ANTES del lanzamiento  
**Basado en:** `.cursorrules` - Sección "DEPLOYMENT CHECKLIST COMPLETO"

---

## ⚡ PASOS CRÍTICOS (Según .cursorrules)

### 📋 FASE 1: PRE-DEPLOYMENT (OBLIGATORIO)

#### 1.1 Verificación de Código

```bash
# ✅ Pull latest changes
git checkout main
git pull origin main

# ✅ Verificar que estás en la versión correcta
git log -1 --oneline
# Debe mostrar: "docs: Add comprehensive deployment instructions"
```

#### 1.2 Backup de Base de Datos

```bash
# ✅ CRÍTICO: Backup ANTES de cualquier cambio
pg_dump -U postgres inmova_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Verificar que el backup se creó
ls -lh backup_*.sql
```

#### 1.3 Verificar Variables de Entorno

```bash
# ✅ Verificar .env.production existe y está completo
cat .env.production | grep -E "DATABASE_URL|NEXTAUTH_URL|NEXTAUTH_SECRET"

# CRÍTICO: NEXTAUTH_URL debe ser correcto
# - Si usa dominio: https://inmovaapp.com (NO http://)
# - Si usa IP: http://IP_PUBLICA:3000
echo $NEXTAUTH_URL
```

**Variables críticas a verificar:**

- ✅ `DATABASE_URL` - Conexión a PostgreSQL
- ✅ `NEXTAUTH_URL` - URL completa con protocolo correcto
- ✅ `NEXTAUTH_SECRET` - Secret seguro (mínimo 32 caracteres)
- ✅ `STRIPE_SECRET_KEY` - Si usas pagos
- ✅ `AWS_BUCKET` / `AWS_REGION` - Si usas S3
- ✅ `SENTRY_DSN` - Para error tracking

#### 1.4 Test de Build Local

```bash
# ✅ OBLIGATORIO: Testear build localmente ANTES de deploy
yarn build

# Si falla, NO DEPLOYAR hasta corregir errores
# Buscar mensajes en rojo y corregir
```

#### 1.5 Verificar Base de Datos

```bash
# ✅ Verificar conexión a BD
yarn prisma db push

# ✅ Verificar usuarios de test existen
psql $DATABASE_URL -c "
  SELECT email, activo, role, companyId
  FROM users
  WHERE email IN ('admin@inmova.app', 'test@inmova.app');
"

# Deben existir y tener:
# - activo: true
# - role: ADMIN o similar
# - companyId: NO null
```

#### 1.6 Actualizar Usuarios de Test

```bash
# ✅ Asegurar credenciales de test correctas
yarn tsx scripts/fix-auth-complete.ts

# Esto crea/actualiza:
# - admin@inmova.app / Admin123!
# - test@inmova.app / Test123456!
```

---

### 📋 FASE 2: DEPLOYMENT

#### 2.1 Ejecutar Migraciones

```bash
# ✅ Aplicar migraciones pendientes
yarn prisma migrate deploy

# Verificar status
yarn prisma migrate status
```

#### 2.2 Deploy según tu método

**Si usas Vercel (RECOMENDADO):**

```bash
# Ya está deployado automáticamente desde GitHub
# Solo verificar en: https://vercel.com/dashboard
```

**Si usas servidor propio (PM2):**

```bash
# Matar procesos viejos
fuser -k 3000/tcp
pm2 delete all
pm2 kill

# Limpiar cache
rm -rf .next/cache
rm -rf .next/server

# Iniciar con PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd
```

---

### 📋 FASE 3: POST-DEPLOYMENT (OBLIGATORIO)

#### 3.1 Esperar Warm-up

```bash
# ⏱️ CRÍTICO: Esperar 10-15 segundos para warm-up
sleep 15
```

#### 3.2 Test HTTP Local

```bash
# ✅ Test en localhost (si es servidor propio)
curl -I http://localhost:3000

# Debe retornar: HTTP/1.1 200 OK
```

#### 3.3 Test Público (CRÍTICO)

```bash
# ✅ OBLIGATORIO: Test desde fuera del servidor
# Usar IP pública o dominio, NO localhost

# Si tienes dominio:
curl -I https://inmovaapp.com

# Si usas IP:
curl -I http://IP_PUBLICA:3000

# Debe retornar: 200 OK
```

#### 3.4 Test de Login Manual

**CRÍTICO según .cursorrules: NO confiar solo en tests automatizados**

1. Abrir navegador (Chrome/Firefox)
2. Ir a: https://inmovaapp.com/login
3. Ingresar: `admin@inmova.app` / `Admin123!`
4. Verificar:
   - ✅ Formulario se ve correctamente
   - ✅ Login funciona
   - ✅ Redirect a /dashboard exitoso
   - ✅ Dashboard carga con datos

#### 3.5 Verificar Logs

```bash
# ✅ Ver logs para errores
# Si usas PM2:
pm2 logs inmova-app --lines 50

# Si usas Vercel:
# Ir a Dashboard → Logs

# Buscar errores en rojo
# Cualquier error 500, 401, 403 es CRÍTICO
```

#### 3.6 Health Check Automatizado

```bash
# ✅ Ejecutar health check completo
yarn tsx scripts/full-health-check.ts

# Debe pasar todos los checks:
# ✅ HTTP 200 en landing
# ✅ API /api/health responde
# ✅ Proceso corriendo
# ✅ Puerto listening
# ✅ Database conectada
# ✅ Memoria < 90%
# ✅ Disco < 90%
# ✅ Login page renderiza
```

---

### 📋 FASE 4: SEGURIDAD (OWASP Top 10 - Según .cursorrules)

#### 4.1 Verificar Access Control

```bash
# ✅ Test: Intentar acceder sin autenticación
curl -I https://inmovaapp.com/dashboard
# Debe retornar: 401 Unauthorized o redirect a /login

# ✅ Test: Intentar acceder con rol incorrecto
# (usar credenciales de tenant, intentar acceder a /admin)
```

#### 4.2 Verificar Headers de Seguridad

```bash
# ✅ Verificar security headers
curl -I https://inmovaapp.com | grep -E "X-Frame-Options|X-Content-Type-Options|X-XSS-Protection"

# Debe mostrar:
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
```

#### 4.3 Test de SQL Injection (Básico)

```bash
# ✅ Test básico de SQL injection
# Intentar login con: admin' OR '1'='1
# Debe RECHAZARSE, no permitir login
```

#### 4.4 Verificar Rate Limiting

```bash
# ✅ Test de rate limiting
# Hacer 10+ requests rápidos
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://inmovaapp.com/api/auth/login
done

# Debe eventualmente retornar: 429 Too Many Requests
```

---

### 📋 FASE 5: PERFORMANCE & UX

#### 5.1 Lighthouse Audit

```bash
# ✅ Ejecutar Lighthouse (desde Chrome DevTools)
# O usar CLI:
npx lighthouse https://inmovaapp.com/landing --output html --output-path ./lighthouse-report.html

# Verificar scores mínimos:
# Performance: > 85
# Accessibility: > 90
# Best Practices: > 85
# SEO: > 90
```

#### 5.2 Core Web Vitals

Verificar en navegador:

1. Abrir DevTools (F12)
2. Console → Escribir:
   ```javascript
   // Verificar LCP, FID, CLS
   new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) {
       console.log(entry);
     }
   }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
   ```

**Objetivos:**

- ✅ LCP < 2.5s
- ✅ FID < 100ms
- ✅ CLS < 0.1

#### 5.3 Test Responsive Design

Verificar en:

- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

Todos deben verse correctamente sin scroll horizontal.

---

### 📋 FASE 6: USUARIOS TEST - PREPARACIÓN

#### 6.1 Crear Usuarios de Test

```typescript
// Ejecutar script de creación
yarn tsx scripts/create-test-users.ts

// O manualmente en Prisma Studio:
yarn prisma studio

// Crear usuarios:
// - test1@test.com
// - test2@test.com
// - test3@test.com
// Todos con password: Test123456!
```

#### 6.2 Preparar Datos Demo

```bash
# ✅ Crear datos demo para testing
yarn tsx scripts/seed-demo-data.ts

# Esto crea:
# - 5 propiedades de ejemplo
# - 3 inquilinos de ejemplo
# - 2 contratos de ejemplo
# - Algunos pagos de ejemplo
```

#### 6.3 Documentación para Usuarios

Crear guía rápida:

- ✅ Cómo acceder (URL + credenciales)
- ✅ Qué pueden testear
- ✅ Qué NO tocar (datos reales)
- ✅ Cómo reportar bugs
- ✅ Contacto de soporte

#### 6.4 Configurar Monitoreo

```bash
# ✅ Verificar Sentry está activo
# Dashboard: https://sentry.io/

# ✅ Verificar Web Vitals tracking
# Endpoint: https://inmovaapp.com/api/analytics/web-vitals

# ✅ Configurar alertas por email/Slack
# Si hay errores críticos > 10/hora
```

---

### 📋 FASE 7: COMUNICACIÓN CON USUARIOS TEST

#### 7.1 Email de Bienvenida

Enviar email con:

```
Asunto: Bienvenido a Inmova App - Fase de Testing Beta

Hola [Nombre],

¡Bienvenido a la fase de testing de Inmova App!

📱 Acceso:
URL: https://inmovaapp.com/login
Email: [tu_email]@test.com
Password: Test123456!

🎯 Qué queremos que pruebes:
1. Login y navegación general
2. Crear una propiedad
3. Registrar un inquilino
4. Generar un contrato
5. Registrar un pago

🐛 Reportar bugs:
- Email: soporte@inmova.app
- O usar el botón "Reportar Bug" en la app

⏱️ Tiempo estimado: 30-45 minutos

¡Gracias por tu ayuda!
El equipo de Inmova
```

#### 7.2 Establecer Canal de Soporte

Opciones:

- ✅ Email dedicado: support@inmovaapp.com
- ✅ Slack channel privado
- ✅ WhatsApp grupo
- ✅ Formulario en app

#### 7.3 Calendario de Testing

```
Día 1-2: Onboarding y primeras impresiones
Día 3-5: Testing funcional profundo
Día 6-7: Reportar bugs y feedback
Día 8-10: Re-testing de fixes
```

---

## 🚨 RED FLAGS - NO LANZAR SI:

❌ **Build local falla** → Corregir ANTES de deploy  
❌ **Tests E2E fallan** → Revisar y corregir  
❌ **Health check falla** → Investigar y resolver  
❌ **Login no funciona** → CRÍTICO, no lanzar  
❌ **Errors 500 en logs** → Resolver antes  
❌ **Lighthouse Performance < 70** → Optimizar  
❌ **Security headers faltantes** → Configurar  
❌ **No hay backup de BD** → OBLIGATORIO hacer backup

---

## ✅ CHECKLIST FINAL (Marcar antes de lanzar)

### Técnico

- [ ] ✅ Backup de BD realizado
- [ ] ✅ Build local exitoso
- [ ] ✅ Variables de entorno verificadas
- [ ] ✅ Migraciones aplicadas
- [ ] ✅ Deploy completado
- [ ] ✅ Health check passing (8/8)
- [ ] ✅ Login funciona (test manual)
- [ ] ✅ Dashboard carga correctamente
- [ ] ✅ Logs sin errores críticos
- [ ] ✅ Security headers presentes

### Seguridad

- [ ] ✅ Access control verificado
- [ ] ✅ Rate limiting activo
- [ ] ✅ SQL injection protegido
- [ ] ✅ HTTPS activo (si aplica)
- [ ] ✅ Secrets NO en código

### Performance

- [ ] ✅ Lighthouse > 85
- [ ] ✅ LCP < 2.5s
- [ ] ✅ FID < 100ms
- [ ] ✅ CLS < 0.1
- [ ] ✅ Mobile responsive

### UX

- [ ] ✅ Dark mode funciona
- [ ] ✅ i18n selector visible
- [ ] ✅ PWA install prompt (mobile)
- [ ] ✅ Offline support activo
- [ ] ✅ Formularios con validación

### Usuarios Test

- [ ] ✅ Usuarios de test creados
- [ ] ✅ Datos demo generados
- [ ] ✅ Documentación preparada
- [ ] ✅ Canal de soporte establecido
- [ ] ✅ Email de bienvenida listo

### Monitoreo

- [ ] ✅ Sentry configurado
- [ ] ✅ Web Vitals tracking activo
- [ ] ✅ Alertas configuradas
- [ ] ✅ Logs accesibles

---

## 🎯 SCRIPT DE VERIFICACIÓN RÁPIDA

Ejecutar este script para verificar todo antes de lanzar:

```bash
#!/bin/bash
# pre-launch-check.sh

echo "🚀 PRE-LAUNCH VERIFICATION"
echo "=========================="

# 1. Backup
echo "✅ Verificando backup..."
if [ -f "backup_$(date +%Y%m%d)*.sql" ]; then
  echo "✅ Backup encontrado"
else
  echo "❌ NO HAY BACKUP - CREANDO..."
  pg_dump > backup_$(date +%Y%m%d_%H%M%S).sql
fi

# 2. Build
echo "✅ Testeando build..."
yarn build || { echo "❌ BUILD FAILED"; exit 1; }

# 3. Health Check
echo "✅ Ejecutando health check..."
yarn tsx scripts/full-health-check.ts || { echo "❌ HEALTH CHECK FAILED"; exit 1; }

# 4. Login Test
echo "✅ Testeando login..."
curl -s https://inmovaapp.com/login | grep "email" || { echo "❌ LOGIN PAGE BROKEN"; exit 1; }

# 5. Security Headers
echo "✅ Verificando security headers..."
curl -I https://inmovaapp.com | grep "X-Frame-Options" || { echo "⚠️ Security headers missing"; }

echo ""
echo "✅ ✅ ✅ ALL CHECKS PASSED ✅ ✅ ✅"
echo "🚀 READY TO LAUNCH WITH TEST USERS"
```

---

## 📞 CONTACTOS DE EMERGENCIA

**Si algo sale mal durante el testing:**

- 🔥 **Error crítico**: Rollback inmediato
- 📧 **Email soporte**: Responder en < 2 horas
- 📊 **Monitorear Sentry**: Cada hora
- 📱 **Estar disponible**: Durante horas de testing

---

**Preparado por:** Cursor AI Agent  
**Basado en:** `.cursorrules` - Secciones de Deployment y Seguridad  
**Fecha:** 31 de Diciembre de 2025  
**Status:** ✅ LISTO PARA EJECUTAR ANTES DE LANZAMIENTO
