# 🚀 Plan de Mantenimiento Post-Lanzamiento - Inmova

## 📋 Para "Dormir Tranquilo" con Clientes en Producción

---

## 🎯 Resumen Ejecutivo

Este documento contiene **todas las acciones críticas** que debes completar **antes y después** de lanzar Inmova con clientes reales.

**Tiempo de implementación:** 2-3 horas  
**Impacto:** Alta disponibilidad (99.9% uptime), respuesta rápida a incidentes, clientes satisfechos

---

## ✅ FASE 1: Pre-Lanzamiento (Antes del Primer Cliente)

### 1.1 🛡️ Configurar la Triada de Mantenimiento

**Comando:**

```bash
npm run setup:triada
```

**Checklist:**

- [ ] **Sentry configurado** (Error Tracking)
  - [ ] Cuenta creada en https://sentry.io
  - [ ] Proyecto "inmova-app" creado
  - [ ] `NEXT_PUBLIC_SENTRY_DSN` en `.env.production`
  - [ ] Verificar: Forzar error y ver en Sentry dashboard
  
- [ ] **Crisp configurado** (Chat de Soporte)
  - [ ] Cuenta creada en https://crisp.chat
  - [ ] `NEXT_PUBLIC_CRISP_WEBSITE_ID` en `.env.production`
  - [ ] Verificar: Widget aparece en esquina inferior derecha
  - [ ] Configurar respuestas automáticas básicas
  - [ ] Añadir tu email para recibir notificaciones de chat
  
- [ ] **BetterStack configurado** (Status Page)
  - [ ] Cuenta creada en https://betterstack.com/uptime
  - [ ] Monitor creado para `https://inmovaapp.com/api/health`
  - [ ] Status Page creada y pública
  - [ ] `NEXT_PUBLIC_STATUS_PAGE_URL` en `.env.production`
  - [ ] Configurar alertas por email/SMS si el sitio cae

**Verificación:**

```bash
npm run verify:triada
```

**Resultado esperado:** ✅ Todo configurado correctamente

---

### 1.2 🔐 Reforzar Seguridad

#### Variables Críticas de Entorno

**Checklist:**

- [ ] **Secretos robustos generados:**
  ```bash
  # NEXTAUTH_SECRET (32+ caracteres aleatorios)
  openssl rand -base64 32
  
  # ENCRYPTION_KEY (32 bytes)
  openssl rand -base64 32
  
  # CRON_SECRET (para proteger endpoints de cron)
  openssl rand -base64 32
  
  # MFA_ENCRYPTION_KEY (para 2FA)
  openssl rand -base64 32
  ```

- [ ] **Variables de producción verificadas:**
  ```env
  # En .env.production o panel de Vercel/Railway
  
  # CRÍTICO: Cambiar TODOS estos valores
  NEXTAUTH_SECRET=<generado-con-openssl>
  ENCRYPTION_KEY=<generado-con-openssl>
  CRON_SECRET=<generado-con-openssl>
  MFA_ENCRYPTION_KEY=<generado-con-openssl>
  
  # URL correcta
  NEXTAUTH_URL=https://inmovaapp.com
  NEXT_PUBLIC_BASE_URL=https://inmovaapp.com
  
  # Database (NO usar credenciales de desarrollo)
  DATABASE_URL=postgresql://prod_user:STRONG_PASSWORD@host/prod_db?connect_timeout=15
  
  # Stripe PRODUCCIÓN (no test keys)
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_PUBLISHABLE_KEY=pk_live_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
  ```

- [ ] **IP Whitelisting para /admin** (opcional pero recomendado):
  ```env
  # Solo tu IP puede acceder a rutas de administración
  ADMIN_IP_WHITELIST=tu.ip.publica.aqui
  ```

#### Seguridad de Base de Datos

- [ ] **Backups automáticos habilitados:**
  - Si usas Railway/Heroku: Verificar backups diarios activos
  - Si usas VPS: Configurar cron job para `pg_dump`
  
  ```bash
  # Ejemplo cron para backup diario a las 3 AM
  0 3 * * * pg_dump $DATABASE_URL | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
  ```

- [ ] **Conexiones seguras:**
  - `DATABASE_URL` debe usar SSL: `?sslmode=require`
  - Ejemplo: `postgresql://user:pass@host/db?sslmode=require&connect_timeout=15`

- [ ] **Usuario de BD con permisos mínimos:**
  - NO usar usuario `postgres` o `root`
  - Crear usuario específico con solo permisos necesarios

---

### 1.3 📊 Configurar Monitoreo Proactivo

#### BetterStack: Monitores Adicionales

**Además del monitor de salud, añadir:**

- [ ] **Monitor de Login:**
  - URL: `https://inmovaapp.com/login`
  - Frecuencia: 3 minutos
  - Alerta si response time > 2 segundos
  
- [ ] **Monitor de API Key:**
  - URL: `https://inmovaapp.com/api/health`
  - Keyword check: `"status":"ok"`
  - Alerta si keyword no aparece
  
- [ ] **Monitor de Base de Datos:**
  - Endpoint custom: `/api/health/database`
  - Verifica conexión a Prisma

#### Sentry: Alertas Personalizadas

- [ ] **Configurar Rules en Sentry:**
  - Settings → Alerts → Create Alert
  - **Regla 1:** "Errors in Production > 10 in 5 minutes"
    - Notificar por: Email + Slack
  - **Regla 2:** "New issue first seen"
    - Notificar por: Email
  - **Regla 3:** "High error rate (> 5% of users)"
    - Notificar por: Email + SMS (urgente)

- [ ] **Filtrar ruido:**
  - Ignorar errores de bots/crawlers
  - Settings → Inbound Filters → Enable "Web Crawlers"

#### Crisp: Configuración de Soporte

- [ ] **Respuestas automáticas:**
  - Chatbox → Settings → Triggers
  - **Trigger 1:** "Fuera de horario" (si no tienes 24/7)
    - Horario: Lunes-Viernes 9-18h
    - Mensaje: "Gracias por contactarnos. Nuestro horario es L-V 9-18h. Te responderemos en menos de 2 horas."
  - **Trigger 2:** "Bienvenida instantánea"
    - Cuando: Usuario abre chat
    - Mensaje: "¡Hola! 👋 ¿En qué podemos ayudarte?"

- [ ] **Shortcuts (respuestas rápidas):**
  - `/reset-password` → "Para resetear tu contraseña, ve a..."
  - `/support-hours` → "Nuestro horario es..."
  - `/docs` → "Puedes ver la documentación en..."

---

### 1.4 🧪 Tests Finales Pre-Lanzamiento

**Ejecutar este checklist completo:**

```bash
# 1. Tests unitarios
npm run test

# 2. Tests E2E (Playwright)
npm run test:e2e

# 3. Verificar build de producción
npm run build

# 4. Test de carga básico (opcional)
# Instalar: npm install -g autocannon
autocannon -c 10 -d 30 https://inmovaapp.com
```

**Checklist manual:**

- [ ] **Login funciona** (con credenciales reales de BD producción)
- [ ] **Registro de usuario funciona**
- [ ] **Crear propiedad funciona**
- [ ] **Subir imágenes funciona** (verificar AWS S3 configurado)
- [ ] **Crear contrato funciona**
- [ ] **Pagos con Stripe funcionan** (modo test primero)
- [ ] **Emails se envían** (verificar SMTP/SendGrid configurado)
- [ ] **Responsive en móvil** (Chrome DevTools → Device Mode)

---

## ✅ FASE 2: Post-Lanzamiento (Primeras 48 Horas)

### 2.1 👀 Monitoreo Intensivo

**Acciones inmediatas después del lanzamiento:**

- [ ] **Día 1 (cada 2 horas):**
  - Ver Sentry dashboard: https://sentry.io
  - Ver BetterStack uptime: https://betterstack.com
  - Revisar Crisp chats: https://app.crisp.chat
  
- [ ] **Día 2 (cada 4 horas):**
  - Ver métricas de Sentry (errors, performance)
  - Ver logs de servidor (PM2/Vercel)
  - Revisar chats pendientes en Crisp

**Comandos útiles (si usas servidor propio):**

```bash
# Ver logs en tiempo real
pm2 logs inmova-app --lines 100

# Ver estado de procesos
pm2 status

# Ver uso de recursos
pm2 monit

# Ver errores recientes
pm2 logs inmova-app --err --lines 50
```

---

### 2.2 🚨 Plan de Respuesta a Incidentes

**Si algo falla, sigue este protocolo:**

#### Nivel 1: Error Menor (afecta < 10% usuarios)

**Ejemplos:** Imagen no carga, botón no responde en un navegador específico

**Acciones:**

1. **Capturar error en Sentry:**
   - Ir a https://sentry.io/issues/
   - Ver stack trace completo
   - Ver breadcrumbs (qué hizo el usuario antes)

2. **Reproducir localmente:**
   ```bash
   git checkout main
   npm run dev
   # Reproducir el error
   ```

3. **Fix rápido:**
   ```bash
   # Crear branch
   git checkout -b hotfix/descripcion-corta
   
   # Hacer cambio
   # ...
   
   # Commit y push
   git add .
   git commit -m "hotfix: descripción del fix"
   git push origin hotfix/descripcion-corta
   
   # Merge a main y deploy automático
   ```

4. **Verificar en producción:**
   - Esperar 2-3 minutos
   - Probar de nuevo
   - Verificar en Sentry que el error desapareció

---

#### Nivel 2: Error Crítico (sitio caído o login roto)

**Ejemplos:** 502 Bad Gateway, Database down, Auth roto

**Acciones (en orden):**

1. **COMUNICAR (dentro de 5 minutos):**
   - Actualizar Status Page manualmente:
     - BetterStack → Manual Status Update
     - Mensaje: "Estamos investigando un problema con [login/base de datos]. Tiempo estimado: 15 min."

2. **DIAGNOSTICAR (5-10 minutos):**
   ```bash
   # Ver logs
   pm2 logs inmova-app --lines 200
   
   # Verificar BD
   psql $DATABASE_URL -c "SELECT 1;"
   
   # Verificar disco/memoria
   df -h
   free -h
   
   # Ver procesos
   pm2 status
   top
   ```

3. **ROLLBACK SI ES NECESARIO (2 minutos):**
   ```bash
   # Ver commits recientes
   git log --oneline -10
   
   # Rollback a commit estable
   git reset --hard <commit-hash-estable>
   pm2 restart inmova-app
   
   # O en Vercel: Dashboard → Deployments → Rollback
   ```

4. **FIX PERMANENTE (15-60 minutos):**
   - Reproducir localmente
   - Hacer fix con tests
   - Deploy con verificación

5. **POST-MORTEM (dentro de 24h):**
   - Documento con:
     - Qué pasó
     - Causa raíz
     - Cómo se solucionó
     - Cómo prevenir en el futuro

---

### 2.3 📈 Métricas de Éxito (Primera Semana)

**Monitorear diariamente:**

| Métrica | Objetivo | Dónde Ver |
|---------|----------|-----------|
| **Uptime** | > 99.5% | BetterStack Dashboard |
| **Errores en Sentry** | < 10/día | Sentry Issues |
| **Response time** | < 1s (p95) | BetterStack + Sentry Performance |
| **Chats respondidos** | < 2h tiempo promedio | Crisp Analytics |
| **Usuarios activos** | Tracking | Google Analytics / Mixpanel |

**Comandos útiles:**

```bash
# Ver errores últimas 24h en Sentry (usando CLI)
sentry-cli issues list --status unresolved

# Ver uptime en BetterStack (API)
curl -H "Authorization: Bearer $BETTERSTACK_TOKEN" \
  https://uptime.betterstack.com/api/v2/monitors

# Verificar health de la app
curl https://inmovaapp.com/api/health
```

---

## ✅ FASE 3: Mantenimiento Continuo (Mensual)

### 3.1 🔄 Tareas Mensuales

**Primer lunes de cada mes:**

- [ ] **Revisar Sentry Insights:**
  - Errores más frecuentes
  - Performance issues
  - Crear issues en GitHub para fixes

- [ ] **Revisar BetterStack Reports:**
  - Uptime del mes pasado
  - Incidentes ocurridos
  - Tiempo de resolución promedio

- [ ] **Revisar Crisp Analytics:**
  - Chats totales
  - Tiempo de respuesta promedio
  - Preguntas frecuentes → añadir a FAQ

- [ ] **Backups de Base de Datos:**
  - Verificar que backups se crearon correctamente
  - Test de restore (1 backup aleatorio)
  ```bash
  # Listar backups
  ls -lh /backups/
  
  # Test restore en BD temporal
  createdb test_restore
  gunzip -c /backups/db_20260101.sql.gz | psql test_restore
  dropdb test_restore
  ```

- [ ] **Actualizar Dependencias:**
  ```bash
  # Ver outdated
  npm outdated
  
  # Actualizar dependencias menores
  npm update
  
  # Test
  npm run test
  npm run build
  
  # Deploy
  git add package.json package-lock.json
  git commit -m "chore: actualizar dependencias menores"
  git push
  ```

---

### 3.2 🔐 Auditoría de Seguridad (Trimestral)

**Cada 3 meses:**

- [ ] **Revisar dependencias vulnerables:**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **Rotar secretos críticos:**
  - `NEXTAUTH_SECRET` (si hay breach)
  - `ENCRYPTION_KEY` (solo si necesario)
  - Passwords de base de datos
  - API keys de terceros

- [ ] **Revisar logs de acceso:**
  - Intentos de login fallidos
  - IPs sospechosas
  - Actividad anormal

- [ ] **Actualizar Next.js y Prisma:**
  ```bash
  npm install next@latest prisma@latest @prisma/client@latest
  npx prisma migrate deploy
  npm run test
  ```

---

## 🎯 CHECKLIST FINAL: "¿Estoy Listo para Lanzar?"

### Antes de Pulsar el Botón de "Deploy"

**Configuración:**

- [ ] ✅ Triada configurada (`npm run verify:triada` pasa)
- [ ] ✅ Todas las variables de `.env.example` tienen valores en producción
- [ ] ✅ Secretos generados con `openssl` (no valores de desarrollo)
- [ ] ✅ Stripe en modo LIVE (no test keys)
- [ ] ✅ Backups de BD habilitados
- [ ] ✅ Status Page pública y visible

**Testing:**

- [ ] ✅ Tests unitarios pasan (`npm run test`)
- [ ] ✅ Tests E2E pasan (`npm run test:e2e`)
- [ ] ✅ Build de producción exitoso (`npm run build`)
- [ ] ✅ Checklist manual de flujos críticos completado

**Monitoreo:**

- [ ] ✅ Sentry captura errores (probado forzando error)
- [ ] ✅ Crisp widget aparece y funciona
- [ ] ✅ BetterStack monitor está "UP" (verde)
- [ ] ✅ Alertas de Sentry configuradas (email + Slack)
- [ ] ✅ Alertas de BetterStack configuradas (email + SMS)

**Documentación:**

- [ ] ✅ Plan de respuesta a incidentes impreso/accesible
- [ ] ✅ Contraseñas y secretos guardados en 1Password/LastPass
- [ ] ✅ Contactos de emergencia anotados (hosting, BD, DNS)

---

## 📞 Contactos de Emergencia

**Guarda estos contactos en tu teléfono:**

| Servicio | Contacto | Notas |
|----------|----------|-------|
| **Hosting** | (Railway/Vercel Support) | Si el sitio cae completamente |
| **DNS** | (Cloudflare Support) | Si el dominio no resuelve |
| **Base de Datos** | (Supabase/Neon/Railway) | Si hay error de conexión |
| **Payment** | Stripe Support: support@stripe.com | Si hay problema con pagos |

---

## 💰 Costos Esperados (Primeros 100 Usuarios)

| Servicio | Plan Gratuito | Cuándo Actualizar | Costo Siguiente Tier |
|----------|---------------|-------------------|---------------------|
| **Sentry** | 5,000 errores/mes | > 150 usuarios activos | $26/mes (50k errores) |
| **Crisp** | 2 agentes, ilimitado | Necesitas > 2 agentes | $25/mes (agentes ilimitados) |
| **BetterStack** | 10 monitores | Necesitas más monitores | $18/mes (30 monitores) |
| **Hosting** | (depende) | Según uso de CPU/RAM | Variable |
| **Base de Datos** | (depende) | Según storage | Variable |

**Estimación total:** $0-20/mes (primeros 100 usuarios) → ~$100/mes (500+ usuarios)

---

## 🎓 Recursos Adicionales

### Documentación Interna

- **Triada de Mantenimiento:** `docs/TRIADA-MANTENIMIENTO.md`
- **Protocolo Zero-Headache:** `docs/PROTOCOLO-ZERO-HEADACHE.md`
- **Guía Rápida Setup:** `GUIA-RAPIDA-TRIADA.md`

### Documentación Externa

- **Sentry:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Crisp:** https://docs.crisp.chat/
- **BetterStack:** https://betterstack.com/docs/uptime/

---

## 🚀 Siguientes Pasos (Ahora Mismo)

```bash
# 1. Configurar la Triada (15 min)
npm run setup:triada

# 2. Verificar configuración
npm run verify:triada

# 3. Añadir variables a producción (Vercel/Railway)
# - NEXT_PUBLIC_SENTRY_DSN
# - NEXT_PUBLIC_CRISP_WEBSITE_ID
# - NEXT_PUBLIC_STATUS_PAGE_URL

# 4. Deploy
git push origin main

# 5. Verificar en producción
curl https://inmovaapp.com/api/health

# 6. Test manual completo (20 min)
# - Login, registro, crear propiedad, etc.

# 7. Monitorear primeras 48 horas intensivamente
```

---

## ✅ Resultado Esperado

**Con este plan implementado:**

- 🛡️ **Tu app está blindada:** Errores capturados automáticamente
- 💬 **Soporte 24/7:** Usuarios pueden contactarte al instante
- 📊 **Transparencia:** Clientes ven el estado del sistema
- 🚨 **Respuesta rápida:** Protocolo claro para incidentes
- 😴 **Dormir tranquilo:** Alertas automáticas te avisan si algo falla

**¡Estás listo para lanzar con confianza!** 🚀
