# ✅ CHECKLIST DE PRE-DESPLIEGUE - INMOVA
## Lista Completa de Verificación Antes de Subir a Producción

**Versión:** 2.0  
**Última Actualización:** 26 Diciembre 2025  
**Responsable:** DevOps + Tech Lead  
**Prioridad:** 🔴 CRÍTICA

---

## 🎯 CÓMO USAR ESTA CHECKLIST

### ⚠️ REGLA DE ORO
> **SI UN ITEM ESTÁ MARCADO COMO BLOQUEANTE Y NO SE CUMPLE, NO DESPLEGAR.**

### Leyenda de Prioridades
- 🔴 **BLOQUEANTE:** No desplegar si no se cumple
- 🟠 **CRÍTICO:** Debe cumplirse, excepto con aprobación de CTO
- 🟡 **IMPORTANTE:** Altamente recomendado
- 🟢 **RECOMENDADO:** Nice to have

### Proceso de Verificación
1. Marcar cada item con ✅ cuando esté completado
2. Añadir nombre y fecha de quien verificó
3. Si algo falla, documentar en sección de "Issues Encontrados"
4. Obtener sign-off final de Tech Lead y CTO

---

## 📋 SECCIÓN 1: CÓDIGO Y COMPILACIÓN

### 1.1 Control de Versiones

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 1.1.1 | Todo el código está commiteado en Git | 🔴 BLOQUEANTE | ☐ | | |
| 1.1.2 | No hay cambios sin commitear (`git status` limpio) | 🔴 BLOQUEANTE | ☐ | | |
| 1.1.3 | Branch principal (main/master) está actualizado | 🔴 BLOQUEANTE | ☐ | | |
| 1.1.4 | Tags de versión creados (ej: `v1.2.0`) | 🟠 CRÍTICO | ☐ | | |
| 1.1.5 | CHANGELOG.md actualizado con cambios | 🟡 IMPORTANTE | ☐ | | |
| 1.1.6 | No hay merge conflicts pendientes | 🔴 BLOQUEANTE | ☐ | | |

### 1.2 Build y Compilación

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 1.2.1 | `yarn build` ejecuta sin errores | 🔴 BLOQUEANTE | ☐ | | |
| 1.2.2 | `yarn lint` pasa sin errores críticos | 🔴 BLOQUEANTE | ☐ | | |
| 1.2.3 | `yarn type-check` pasa sin errores TypeScript | 🟠 CRÍTICO | ☐ | | |
| 1.2.4 | Bundle size está dentro del límite (<500KB inicial) | 🟡 IMPORTANTE | ☐ | | |
| 1.2.5 | No hay warnings críticos en build | 🟡 IMPORTANTE | ☐ | | |
| 1.2.6 | `next.config.js` configurado correctamente para producción | 🔴 BLOQUEANTE | ☐ | | |
| 1.2.7 | Todas las dependencias están instaladas (`yarn install`) | 🔴 BLOQUEANTE | ☐ | | |
| 1.2.8 | No hay vulnerabilidades críticas (`yarn audit`) | 🟠 CRÍTICO | ☐ | | |

**Comandos de Verificación:**
```bash
# Limpiar y rebuild
rm -rf .next node_modules
yarn install
yarn build

# Verificar lint y tipos
yarn lint
yarn type-check

# Audit de seguridad
yarn audit --level moderate
```

---

## 🔐 SECCIÓN 2: SEGURIDAD

### 2.1 Variables de Entorno

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 2.1.1 | Todas las variables de entorno están en Vercel/plataforma | 🔴 BLOQUEANTE | ☐ | | |
| 2.1.2 | `NEXTAUTH_SECRET` generado con `openssl rand -base64 32` | 🔴 BLOQUEANTE | ☐ | | |
| 2.1.3 | `NEXTAUTH_URL` apunta a dominio de producción | 🔴 BLOQUEANTE | ☐ | | |
| 2.1.4 | `DATABASE_URL` apunta a base de datos de producción | 🔴 BLOQUEANTE | ☐ | | |
| 2.1.5 | Credenciales AWS (S3) son de producción | 🔴 BLOQUEANTE | ☐ | | |
| 2.1.6 | Stripe keys son de producción (no test mode) | 🔴 BLOQUEANTE | ☐ | | |
| 2.1.7 | No hay secrets hardcodeados en código | 🔴 BLOQUEANTE | ☐ | | |
| 2.1.8 | `.env.local` NO está commiteado en Git | 🔴 BLOQUEANTE | ☐ | | |
| 2.1.9 | `SENTRY_DSN` configurado para producción | 🟠 CRÍTICO | ☐ | | |
| 2.1.10 | Rate limiting configurado (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW`) | 🟠 CRÍTICO | ☐ | | |

**Variables de Entorno Mínimas Requeridas:**
```bash
# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Database
DATABASE_URL=

# AWS S3
AWS_REGION=
AWS_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=
```

### 2.2 Autenticación y Autorización

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 2.2.1 | Todas las rutas API tienen auth check | 🔴 BLOQUEANTE | ☐ | | |
| 2.2.2 | Sistema de roles y permisos funciona correctamente | 🔴 BLOQUEANTE | ☐ | | |
| 2.2.3 | Impersonación solo accesible por Super Admins | 🔴 BLOQUEANTE | ☐ | | |
| 2.2.4 | Tokens JWT tienen expiración razonable (≤7 días) | 🟠 CRÍTICO | ☐ | | |
| 2.2.5 | Password reset funciona y expira tokens | 🟠 CRÍTICO | ☐ | | |
| 2.2.6 | Logout limpia sesión completamente | 🟠 CRÍTICO | ☐ | | |
| 2.2.7 | No hay endpoints públicos expuestos accidentalmente | 🔴 BLOQUEANTE | ☐ | | |

### 2.3 Protección contra Ataques

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 2.3.1 | Rate limiting implementado en todas las APIs | 🔴 BLOQUEANTE | ☐ | | |
| 2.3.2 | CSRF protection activo en formularios | 🟠 CRÍTICO | ☐ | | |
| 2.3.3 | XSS protection: inputs sanitizados | 🔴 BLOQUEANTE | ☐ | | |
| 2.3.4 | SQL injection protection: queries parametrizadas (Prisma) | 🔴 BLOQUEANTE | ☐ | | |
| 2.3.5 | CORS configurado correctamente (no `*` en producción) | 🔴 BLOQUEANTE | ☐ | | |
| 2.3.6 | Headers de seguridad configurados (HSTS, X-Frame-Options, etc.) | 🟠 CRÍTICO | ☐ | | |
| 2.3.7 | File uploads validados (tipo, tamaño, contenido) | 🟠 CRÍTICO | ☐ | | |
| 2.3.8 | No hay console.log con información sensible | 🟠 CRÍTICO | ☐ | | |

**Headers de Seguridad Recomendados (next.config.js):**
```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY'
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains'
        }
      ]
    }
  ]
}
```

---

## 🗄️ SECCIÓN 3: BASE DE DATOS

### 3.1 Migraciones

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 3.1.1 | Todas las migraciones de Prisma ejecutadas | 🔴 BLOQUEANTE | ☐ | | |
| 3.1.2 | `prisma migrate deploy` ejecutado en producción | 🔴 BLOQUEANTE | ☐ | | |
| 3.1.3 | Schema de base de datos coincide con `schema.prisma` | 🔴 BLOQUEANTE | ☐ | | |
| 3.1.4 | Backup de base de datos creado ANTES de migrar | 🔴 BLOQUEANTE | ☐ | | |
| 3.1.5 | Plan de rollback preparado si migración falla | 🔴 BLOQUEANTE | ☐ | | |
| 3.1.6 | Migraciones testeadas en staging primero | 🔴 BLOQUEANTE | ☐ | | |

### 3.2 Performance y Optimización

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 3.2.1 | Índices creados en campos frecuentemente consultados | 🟠 CRÍTICO | ☐ | | |
| 3.2.2 | No hay queries N+1 identificadas | 🟠 CRÍTICO | ☐ | | |
| 3.2.3 | Queries lentas optimizadas (<500ms) | 🟡 IMPORTANTE | ☐ | | |
| 3.2.4 | Paginación implementada en listados grandes | 🟠 CRÍTICO | ☐ | | |
| 3.2.5 | Connection pooling configurado correctamente | 🟠 CRÍTICO | ☐ | | |

### 3.3 Datos y Seeders

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 3.3.1 | Usuario administrador inicial creado | 🔴 BLOQUEANTE | ☐ | | |
| 3.3.2 | Datos de prueba eliminados de producción | 🔴 BLOQUEANTE | ☐ | | |
| 3.3.3 | Datos sensibles anonimizados en desarrollo | 🟠 CRÍTICO | ☐ | | |

**Comandos de Verificación:**
```bash
# Generar cliente Prisma
yarn prisma generate

# Ejecutar migraciones
yarn prisma migrate deploy

# Verificar estado
yarn prisma migrate status

# Crear backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🧪 SECCIÓN 4: TESTING

### 4.1 Tests Unitarios e Integración

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 4.1.1 | Tests unitarios pasan (`yarn test`) | 🟠 CRÍTICO | ☐ | | |
| 4.1.2 | Coverage de tests >70% en código crítico | 🟡 IMPORTANTE | ☐ | | |
| 4.1.3 | Tests de integración de APIs críticas pasan | 🟠 CRÍTICO | ☐ | | |

### 4.2 Tests E2E

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 4.2.1 | Tests E2E de autenticación pasan (10 tests) | 🔴 BLOQUEANTE | ☐ | | |
| 4.2.2 | Tests E2E de contratos pasan (12 tests) | 🔴 BLOQUEANTE | ☐ | | |
| 4.2.3 | Tests E2E de pagos pasan (15 tests) | 🔴 BLOQUEANTE | ☐ | | |
| 4.2.4 | Tests E2E de impersonación pasan (11 tests) | 🟠 CRÍTICO | ☐ | | |
| 4.2.5 | Tests E2E ejecutados en ambiente staging | 🔴 BLOQUEANTE | ☐ | | |
| 4.2.6 | No hay flaky tests (tests que fallan intermitentemente) | 🟡 IMPORTANTE | ☐ | | |

### 4.3 Testing Manual

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 4.3.1 | Login/logout funciona correctamente | 🔴 BLOQUEANTE | ☐ | | |
| 4.3.2 | Crear contrato funciona end-to-end | 🔴 BLOQUEANTE | ☐ | | |
| 4.3.3 | Registrar pago funciona correctamente | 🔴 BLOQUEANTE | ☐ | | |
| 4.3.4 | Stripe payments funcionan (test en modo live) | 🔴 BLOQUEANTE | ☐ | | |
| 4.3.5 | Upload de archivos a S3 funciona | 🔴 BLOQUEANTE | ☐ | | |
| 4.3.6 | Emails se envían correctamente | 🟠 CRÍTICO | ☐ | | |
| 4.3.7 | Notificaciones push funcionan (si aplica) | 🟡 IMPORTANTE | ☐ | | |
| 4.3.8 | Exportación CSV funciona | 🟠 CRÍTICO | ☐ | | |
| 4.3.9 | Todas las rutas principales cargan (<3s) | 🟠 CRÍTICO | ☐ | | |
| 4.3.10 | Responsive design funciona en mobile/tablet | 🟠 CRÍTICO | ☐ | | |

**Comandos de Testing:**
```bash
# Tests unitarios
yarn test

# Tests E2E
yarn test:e2e

# Tests E2E en modo UI (debugging)
yarn test:e2e:ui

# Coverage report
yarn test:coverage
```

---

## 🌐 SECCIÓN 5: FRONTEND Y UX

### 5.1 Performance

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 5.1.1 | Lighthouse score >90 en performance | 🟡 IMPORTANTE | ☐ | | |
| 5.1.2 | First Contentful Paint (FCP) <1.8s | 🟠 CRÍTICO | ☐ | | |
| 5.1.3 | Largest Contentful Paint (LCP) <2.5s | 🟠 CRÍTICO | ☐ | | |
| 5.1.4 | Time to Interactive (TTI) <3.8s | 🟡 IMPORTANTE | ☐ | | |
| 5.1.5 | Cumulative Layout Shift (CLS) <0.1 | 🟠 CRÍTICO | ☐ | | |
| 5.1.6 | No hay memory leaks en cliente | 🟠 CRÍTICO | ☐ | | |
| 5.1.7 | Imágenes optimizadas (Next/Image con lazy loading) | 🟡 IMPORTANTE | ☐ | | |
| 5.1.8 | Code splitting implementado | 🟡 IMPORTANTE | ☐ | | |

### 5.2 Compatibilidad

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 5.2.1 | Funciona en Chrome (últimas 2 versiones) | 🔴 BLOQUEANTE | ☐ | | |
| 5.2.2 | Funciona en Firefox (últimas 2 versiones) | 🟠 CRÍTICO | ☐ | | |
| 5.2.3 | Funciona en Safari (últimas 2 versiones) | 🟠 CRÍTICO | ☐ | | |
| 5.2.4 | Funciona en Edge (últimas 2 versiones) | 🟡 IMPORTANTE | ☐ | | |
| 5.2.5 | Responsive en mobile (iOS Safari, Chrome Android) | 🔴 BLOQUEANTE | ☐ | | |
| 5.2.6 | Responsive en tablet (iPad, Android tablets) | 🟠 CRÍTICO | ☐ | | |

### 5.3 Accesibilidad

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 5.3.1 | Lighthouse accessibility score >90 | 🟡 IMPORTANTE | ☐ | | |
| 5.3.2 | Navegación por teclado funciona | 🟠 CRÍTICO | ☐ | | |
| 5.3.3 | ARIA labels en elementos interactivos | 🟡 IMPORTANTE | ☐ | | |
| 5.3.4 | Contraste de colores cumple WCAG AA | 🟡 IMPORTANTE | ☐ | | |
| 5.3.5 | Formularios tienen labels asociados | 🟠 CRÍTICO | ☐ | | |

### 5.4 Errores y Estados

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 5.4.1 | No hay errores en consola del navegador | 🔴 BLOQUEANTE | ☐ | | |
| 5.4.2 | No hay warnings críticos en consola | 🟡 IMPORTANTE | ☐ | | |
| 5.4.3 | Error boundaries implementados en todas las rutas | 🟠 CRÍTICO | ☐ | | |
| 5.4.4 | Loading states visibles en operaciones lentas | 🟠 CRÍTICO | ☐ | | |
| 5.4.5 | Mensajes de error son descriptivos y útiles | 🟠 CRÍTICO | ☐ | | |
| 5.4.6 | 404 page personalizada funciona | 🟡 IMPORTANTE | ☐ | | |
| 5.4.7 | 500 page personalizada funciona | 🟠 CRÍTICO | ☐ | | |
| 5.4.8 | No hay hydration errors | 🔴 BLOQUEANTE | ☐ | | |

---

## 🔌 SECCIÓN 6: INTEGRACIONES EXTERNAS

### 6.1 Stripe

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 6.1.1 | Stripe keys de producción configuradas | 🔴 BLOQUEANTE | ☐ | | |
| 6.1.2 | Webhooks de Stripe configurados y funcionando | 🔴 BLOQUEANTE | ☐ | | |
| 6.1.3 | `STRIPE_WEBHOOK_SECRET` configurado | 🔴 BLOQUEANTE | ☐ | | |
| 6.1.4 | Payments test en modo live exitoso | 🔴 BLOQUEANTE | ☐ | | |
| 6.1.5 | Refunds funcionan correctamente | 🟠 CRÍTICO | ☐ | | |
| 6.1.6 | Invoices se generan correctamente | 🟠 CRÍTICO | ☐ | | |

### 6.2 AWS S3

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 6.2.1 | Bucket de producción creado | 🔴 BLOQUEANTE | ☐ | | |
| 6.2.2 | Credenciales AWS correctas en env vars | 🔴 BLOQUEANTE | ☐ | | |
| 6.2.3 | CORS configurado en bucket | 🔴 BLOQUEANTE | ☐ | | |
| 6.2.4 | Upload de archivos funciona | 🔴 BLOQUEANTE | ☐ | | |
| 6.2.5 | Descarga de archivos funciona | 🔴 BLOQUEANTE | ☐ | | |
| 6.2.6 | Permisos de bucket configurados correctamente (no público) | 🔴 BLOQUEANTE | ☐ | | |

### 6.3 Email (SendGrid/Mailgun/etc.)

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 6.3.1 | API keys de email configuradas | 🟠 CRÍTICO | ☐ | | |
| 6.3.2 | Email de bienvenida se envía | 🟠 CRÍTICO | ☐ | | |
| 6.3.3 | Email de recuperación de contraseña funciona | 🔴 BLOQUEANTE | ☐ | | |
| 6.3.4 | Notificaciones por email funcionan | 🟡 IMPORTANTE | ☐ | | |
| 6.3.5 | Domain de email verificado (no spam) | 🟠 CRÍTICO | ☐ | | |
| 6.3.6 | Templates de email se ven bien en todos los clientes | 🟡 IMPORTANTE | ☐ | | |

### 6.4 Contabilidad (A3, Contasimple, etc.)

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 6.4.1 | Credenciales de integración configuradas | 🟡 IMPORTANTE | ☐ | | |
| 6.4.2 | Sync de facturas funciona | 🟡 IMPORTANTE | ☐ | | |
| 6.4.3 | Manejo de errores de API implementado | 🟡 IMPORTANTE | ☐ | | |

### 6.5 Open Banking (Bankinter/Redsys)

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 6.5.1 | Certificados eIDAS instalados | 🟡 IMPORTANTE | ☐ | | |
| 6.5.2 | Conexión bancaria funciona | 🟡 IMPORTANTE | ☐ | | |
| 6.5.3 | Conciliación automática activa | 🟡 IMPORTANTE | ☐ | | |

---

## 🚀 SECCIÓN 7: DEPLOYMENT Y DEVOPS

### 7.1 Configuración de Plataforma (Vercel/Railway/etc.)

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 7.1.1 | Proyecto configurado en plataforma de hosting | 🔴 BLOQUEANTE | ☐ | | |
| 7.1.2 | Variables de entorno configuradas | 🔴 BLOQUEANTE | ☐ | | |
| 7.1.3 | Dominio personalizado configurado | 🟠 CRÍTICO | ☐ | | |
| 7.1.4 | SSL/HTTPS activo y funcionando | 🔴 BLOQUEANTE | ☐ | | |
| 7.1.5 | DNS configurado correctamente | 🟠 CRÍTICO | ☐ | | |
| 7.1.6 | Build commands configurados | 🔴 BLOQUEANTE | ☐ | | |
| 7.1.7 | Node version especificada (`engines` en package.json) | 🟠 CRÍTICO | ☐ | | |

### 7.2 Monitoring y Logging

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 7.2.1 | Sentry configurado y recibiendo errores | 🔴 BLOQUEANTE | ☐ | | |
| 7.2.2 | Log aggregation configurado (Vercel Logs, CloudWatch, etc.) | 🟠 CRÍTICO | ☐ | | |
| 7.2.3 | Alertas configuradas para errores críticos | 🟠 CRÍTICO | ☐ | | |
| 7.2.4 | Uptime monitoring activo (UptimeRobot, Pingdom, etc.) | 🟠 CRÍTICO | ☐ | | |
| 7.2.5 | Analytics configurado (Vercel Analytics, Google Analytics) | 🟡 IMPORTANTE | ☐ | | |
| 7.2.6 | Performance monitoring activo | 🟡 IMPORTANTE | ☐ | | |

### 7.3 Backups

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 7.3.1 | Backups automáticos de base de datos configurados | 🔴 BLOQUEANTE | ☐ | | |
| 7.3.2 | Frecuencia de backups: Diario mínimo | 🔴 BLOQUEANTE | ☐ | | |
| 7.3.3 | Retención de backups: 30 días mínimo | 🟠 CRÍTICO | ☐ | | |
| 7.3.4 | Backup manual creado antes de deployment | 🔴 BLOQUEANTE | ☐ | | |
| 7.3.5 | Proceso de restore testeado | 🟠 CRÍTICO | ☐ | | |

### 7.4 CI/CD

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 7.4.1 | Pipeline de CI/CD configurado | 🟡 IMPORTANTE | ☐ | | |
| 7.4.2 | Tests automáticos en CI | 🟡 IMPORTANTE | ☐ | | |
| 7.4.3 | Deploy automático desde branch main | 🟡 IMPORTANTE | ☐ | | |
| 7.4.4 | Preview deployments funcionan | 🟢 RECOMENDADO | ☐ | | |

---

## 📱 SECCIÓN 8: PWA Y MÓVIL

### 8.1 Progressive Web App

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 8.1.1 | `manifest.json` configurado correctamente | 🟡 IMPORTANTE | ☐ | | |
| 8.1.2 | Service worker funciona | 🟡 IMPORTANTE | ☐ | | |
| 8.1.3 | App es instalable en mobile | 🟡 IMPORTANTE | ☐ | | |
| 8.1.4 | Iconos de diferentes tamaños incluidos | 🟡 IMPORTANTE | ☐ | | |
| 8.1.5 | Funcionalidad offline básica funciona | 🟢 RECOMENDADO | ☐ | | |

### 8.2 Push Notifications

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 8.2.1 | VAPID keys configuradas | 🟡 IMPORTANTE | ☐ | | |
| 8.2.2 | Push notifications funcionan en mobile | 🟡 IMPORTANTE | ☐ | | |
| 8.2.3 | Permisos de notificación solicitados correctamente | 🟡 IMPORTANTE | ☐ | | |

---

## 📄 SECCIÓN 9: DOCUMENTACIÓN Y LEGAL

### 9.1 Documentación Técnica

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 9.1.1 | README actualizado con instrucciones claras | 🟡 IMPORTANTE | ☐ | | |
| 9.1.2 | Documentación de API actualizada | 🟡 IMPORTANTE | ☐ | | |
| 9.1.3 | CHANGELOG con cambios de versión | 🟡 IMPORTANTE | ☐ | | |
| 9.1.4 | Guía de deployment documentada | 🟠 CRÍTICO | ☐ | | |
| 9.1.5 | Runbook de incidentes preparado | 🟠 CRÍTICO | ☐ | | |

### 9.2 Documentación Legal

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 9.2.1 | Términos y Condiciones actualizados | 🟠 CRÍTICO | ☐ | | |
| 9.2.2 | Política de Privacidad actualizada (GDPR) | 🔴 BLOQUEANTE | ☐ | | |
| 9.2.3 | Aviso Legal presente | 🟠 CRÍTICO | ☐ | | |
| 9.2.4 | Política de Cookies configurada | 🟠 CRÍTICO | ☐ | | |
| 9.2.5 | Banner de cookies implementado | 🟠 CRÍTICO | ☐ | | |

### 9.3 Comunicación

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 9.3.1 | Email de notificación a clientes preparado | 🟡 IMPORTANTE | ☐ | | |
| 9.3.2 | Anuncio en redes sociales preparado | 🟢 RECOMENDADO | ☐ | | |
| 9.3.3 | Blog post de lanzamiento escrito | 🟢 RECOMENDADO | ☐ | | |
| 9.3.4 | Equipo de soporte notificado del deployment | 🟠 CRÍTICO | ☐ | | |

---

## 🔧 SECCIÓN 10: CONFIGURACIÓN ESPECÍFICA

### 10.1 Next.js Configuration

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 10.1.1 | `typescript.ignoreBuildErrors` configurado según necesidad | 🟠 CRÍTICO | ☐ | | |
| 10.1.2 | Image domains whitelisted en `next.config.js` | 🟠 CRÍTICO | ☐ | | |
| 10.1.3 | Redirects configurados si aplica | 🟡 IMPORTANTE | ☐ | | |
| 10.1.4 | Headers de seguridad en `next.config.js` | 🟠 CRÍTICO | ☐ | | |
| 10.1.5 | Experimental features documentadas | 🟡 IMPORTANTE | ☐ | | |

### 10.2 Prisma Configuration

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 10.2.1 | `postinstall` script incluye `prisma generate` | 🔴 BLOQUEANTE | ☐ | | |
| 10.2.2 | Connection pooling configurado | 🟠 CRÍTICO | ☐ | | |
| 10.2.3 | Query logging desactivado en producción | 🟡 IMPORTANTE | ☐ | | |

---

## 🎬 SECCIÓN 11: PRE-LAUNCH FINAL

### 11.1 Smoke Tests en Producción

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 11.1.1 | Homepage carga correctamente | 🔴 BLOQUEANTE | ☐ | | |
| 11.1.2 | Login funciona | 🔴 BLOQUEANTE | ☐ | | |
| 11.1.3 | Dashboard principal carga | 🔴 BLOQUEANTE | ☐ | | |
| 11.1.4 | Crear un contrato de prueba funciona | 🔴 BLOQUEANTE | ☐ | | |
| 11.1.5 | Registrar un pago de prueba funciona | 🔴 BLOQUEANTE | ☐ | | |
| 11.1.6 | Todas las rutas principales cargan (200 status) | 🔴 BLOQUEANTE | ☐ | | |

### 11.2 Rollback Plan

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 11.2.1 | Plan de rollback documentado | 🔴 BLOQUEANTE | ☐ | | |
| 11.2.2 | Backup de base de datos pre-deployment creado | 🔴 BLOQUEANTE | ☐ | | |
| 11.2.3 | Versión anterior de código taggeada en Git | 🔴 BLOQUEANTE | ☐ | | |
| 11.2.4 | Comando de rollback testeado | 🟠 CRÍTICO | ☐ | | |
| 11.2.5 | Equipo sabe cómo hacer rollback | 🔴 BLOQUEANTE | ☐ | | |

### 11.3 Monitoring Post-Deploy

| # | Item | Prioridad | Estado | Verificado Por | Fecha |
|---|------|-----------|--------|----------------|-------|
| 11.3.1 | Dashboards de monitoring abiertos | 🔴 BLOQUEANTE | ☐ | | |
| 11.3.2 | Alertas de errores activas | 🔴 BLOQUEANTE | ☐ | | |
| 11.3.3 | Equipo en standby para primeras 2 horas | 🔴 BLOQUEANTE | ☐ | | |
| 11.3.4 | Canal de Slack/comunicación abierto | 🟠 CRÍTICO | ☐ | | |

---

## ✅ SIGN-OFF FINAL

### Aprobaciones Requeridas

| Rol | Nombre | Firma | Fecha | Comentarios |
|-----|--------|-------|-------|-------------|
| **Tech Lead** | | ☐ | | |
| **DevOps Lead** | | ☐ | | |
| **QA Lead** | | ☐ | | |
| **CTO** | | ☐ | | |
| **Product Manager** | | ☐ | | |

### Criterios de Aprobación

Para aprobar el deployment, deben cumplirse:
- ✅ **100% de items BLOQUEANTES** completados
- ✅ **95% de items CRÍTICOS** completados
- ✅ **80% de items IMPORTANTES** completados
- ✅ **Smoke tests** pasados exitosamente
- ✅ **Plan de rollback** documentado y testeado

---

## 🚨 ISSUES ENCONTRADOS

### Template de Reporte de Issues

```markdown
## Issue #[número]

**Prioridad:** [BLOQUEANTE/CRÍTICO/IMPORTANTE/RECOMENDADO]
**Sección:** [Número de sección]
**Item:** [Número de item]
**Descripción:** [Descripción detallada del issue]
**Impacto:** [Cuál es el impacto si no se resuelve]
**Propuesta de Solución:** [Cómo resolverlo]
**Responsable:** [Quién lo resolverá]
**ETA:** [Tiempo estimado para resolver]
**Status:** [ABIERTO/EN PROGRESO/RESUELTO/POSTPONED]

**Decisión:** [Bloquear deployment / Continuar con mitigación / Postponer para próxima release]
```

### Issues Registrados

_(Completar durante la revisión de checklist)_

---

## 📊 RESUMEN DE ESTADO

### Estadísticas de Completitud

| Categoría | Total Items | Completados | % |
|-----------|-------------|-------------|---|
| 🔴 BLOQUEANTES | 0 | 0 | 0% |
| 🟠 CRÍTICOS | 0 | 0 | 0% |
| 🟡 IMPORTANTES | 0 | 0 | 0% |
| 🟢 RECOMENDADOS | 0 | 0 | 0% |
| **TOTAL** | **0** | **0** | **0%** |

### Estado General

- **LISTO PARA DEPLOY:** ☐ SÍ / ☐ NO
- **Fecha de Deployment:** ______________
- **Hora de Deployment:** ______________
- **Responsable de Deployment:** ______________

---

## 🎯 PRÓXIMOS PASOS POST-DEPLOYMENT

### Inmediatamente Después (0-2 horas)

1. ✅ Monitoring activo de errores en Sentry
2. ✅ Verificar que no hay picos de errores
3. ✅ Smoke tests en producción
4. ✅ Verificar métricas de performance
5. ✅ Monitorear logs en tiempo real

### Primeras 24 horas

1. ✅ Revisar analytics y user behavior
2. ✅ Monitorear quejas en soporte
3. ✅ Verificar que webhooks funcionan
4. ✅ Revisar tasas de error
5. ✅ Backup automático funcionando

### Primera Semana

1. ✅ Retrospectiva de deployment
2. ✅ Actualizar documentación con lecciones aprendidas
3. ✅ Resolver issues menores identificados
4. ✅ Optimizaciones basadas en métricas reales
5. ✅ Comunicación con stakeholders sobre éxito

---

## 📚 REFERENCIAS Y DOCUMENTOS RELACIONADOS

### Documentos Internos
- `ROADMAP_4_SEMANAS_PRIORIZADO.md` - Roadmap de desarrollo
- `DEPLOYMENT.md` - Guía general de deployment
- `IMPORTANTE_ANTES_DE_DESPLEGAR.md` - Notas críticas previas
- `SEMANA_2_COMPLETADA.md` - Estado del proyecto
- `TESTS_E2E_IMPLEMENTADOS.md` - Documentación de tests
- `DOCS/RUNBOOK_INCIDENTES.md` - Guía de resolución de incidentes

### Comandos Útiles

```bash
# Verificar estado de Git
git status
git log -5

# Build local
yarn build

# Tests
yarn test
yarn test:e2e

# Prisma
yarn prisma migrate status
yarn prisma generate

# Deploy (Vercel)
vercel --prod

# Logs
vercel logs --follow

# Rollback (si es necesario)
vercel rollback

# Backup de DB
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 💡 TIPS Y MEJORES PRÁCTICAS

### Antes de Desplegar

1. **Deploy en Staging primero** - Siempre testear en staging antes de producción
2. **Horario óptimo** - Desplegar en horarios de bajo tráfico (madrugada/fines de semana)
3. **Comunicación** - Avisar al equipo y clientes con anticipación
4. **Backup SIEMPRE** - Nunca desplegar sin backup reciente
5. **Rollback plan** - Tener plan B siempre listo

### Durante el Deployment

1. **Monitoring activo** - Tener dashboards abiertos
2. **Equipo disponible** - Al menos 2 personas monitoreando
3. **Canal abierto** - Slack/Discord/Teams para comunicación rápida
4. **Documentar todo** - Anotar cualquier issue o decisión tomada

### Después del Deployment

1. **No irte inmediatamente** - Monitorear al menos 2 horas
2. **Smoke tests** - Verificar funcionalidades críticas manualmente
3. **Comunicar éxito** - Notificar a stakeholders
4. **Retrospectiva** - Reunión post-mortem para mejorar proceso

---

## 🆘 CONTACTOS DE EMERGENCIA

### Equipo Técnico

| Rol | Nombre | Teléfono | Email | Disponibilidad |
|-----|--------|----------|-------|----------------|
| CTO | | | | 24/7 |
| Tech Lead | | | | 24/7 |
| DevOps Lead | | | | 24/7 |
| Backend Lead | | | | On-call |
| Frontend Lead | | | | On-call |

### Proveedores Externos

| Servicio | Soporte | Teléfono | Email | SLA |
|----------|---------|----------|-------|-----|
| Vercel | soporte@vercel.com | - | support@vercel.com | 24h |
| AWS | AWS Support Console | - | - | Según plan |
| Stripe | dashboard.stripe.com/support | - | - | 24h |
| Sentry | support@sentry.io | - | - | 24h |

---

**Documento creado por:** DevOps Team INMOVA  
**Fecha:** 26 Diciembre 2025  
**Versión:** 2.0  
**Última Revisión:** Antes de cada deployment  
**Status:** 🔴 DOCUMENTO VIVO - Actualizar constantemente

---

## 📝 NOTAS FINALES

> **Recuerda:** Esta checklist es una guía, no un dogma. Usa tu criterio profesional para determinar qué es crítico para tu contexto específico. Cuando dudes, pregunta a un senior o al Tech Lead.

> **Regla de Oro:** Si tienes dudas significativas sobre la estabilidad del deployment, NO DESPLIEGUES. Mejor perder un día investigando que tener la app caída en producción.

> **Documentación es clave:** Si encuentras algo no documentado aquí pero importante, añádelo. Este documento debe mejorar con cada deployment.

---

**🚀 ¡Buen Deployment!**
