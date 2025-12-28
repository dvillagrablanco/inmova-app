# ✅ CHECKLIST COMPLETO DE DEPLOYMENT

**Proyecto:** INMOVA  
**Dominio:** inmovaapp.com  
**Plataforma:** Vercel + PostgreSQL

---

## 📋 ANTES DEL DEPLOYMENT

### Código

- [ ] Todos los cambios commiteados
- [ ] Build local funciona sin errores (`yarn build`)
- [ ] Tests pasan (`yarn test` si los hay)
- [ ] Linting sin errores (`yarn lint`)
- [ ] No hay console.log innecesarios
- [ ] Variables de entorno documentadas

### Configuración

- [ ] `.env.production.template` completo
- [ ] `vercel.json` configurado
- [ ] `.vercelignore` optimizado
- [ ] `package.json` con scripts correctos

### Base de Datos

- [ ] Migraciones creadas y probadas
- [ ] Seed script funciona
- [ ] Schema validado (`npx prisma validate`)

---

## 🚀 DURANTE EL DEPLOYMENT

### Paso 1: Setup Vercel

- [ ] Cuenta Vercel creada
- [ ] Vercel CLI instalado (`npm i -g vercel`)
- [ ] Login exitoso (`vercel login`)
- [ ] Proyecto linkeado (`vercel link`)

### Paso 2: Base de Datos

- [ ] PostgreSQL creado (Vercel Postgres o externo)
- [ ] DATABASE_URL configurada
- [ ] Conexión verificada

### Paso 3: Variables de Entorno

- [ ] `DATABASE_URL` configurada
- [ ] `NEXTAUTH_URL` configurada (https://inmovaapp.com)
- [ ] `NEXTAUTH_SECRET` generada y configurada
- [ ] `NODE_ENV=production` configurada
- [ ] Todas las variables en "Production" environment

### Paso 4: Deploy

- [ ] `vercel --prod` ejecutado
- [ ] Build completado sin errores
- [ ] Deployment URL recibida

### Paso 5: Migraciones

- [ ] `npx prisma migrate deploy` ejecutado
- [ ] Todas las migraciones aplicadas
- [ ] Sin errores en migraciones

### Paso 6: Seed

- [ ] `npm run db:seed` ejecutado
- [ ] Usuario admin creado
- [ ] Datos iniciales creados

### Paso 7: Dominio (Opcional)

- [ ] Dominio agregado en Vercel
- [ ] DNS configurado
- [ ] SSL activo (verificar https://)

---

## ✅ VERIFICACIÓN POST-DEPLOYMENT

### Funcionalidad Básica

- [ ] App carga en producción
- [ ] Landing page se ve correctamente
- [ ] Página de login accesible
- [ ] Login con admin funciona
- [ ] Dashboard carga después de login
- [ ] Sidebar muestra módulos
- [ ] No hay errores en consola del navegador (F12)

### APIs

- [ ] `/api/health` responde 200
- [ ] `/api/auth/session` funciona
- [ ] `/api/modules/active` funciona
- [ ] `/api/notifications/unread-count` funciona
- [ ] Sin errores 500 en Network tab

### Base de Datos

- [ ] Conexión a BD funciona
- [ ] Tablas existen
- [ ] Usuario admin existe
- [ ] Queries funcionan sin errores

### Performance

- [ ] Lighthouse Score > 80
- [ ] Time to First Byte < 1s
- [ ] First Contentful Paint < 2s
- [ ] Sin warnings en Vercel Dashboard

### Seguridad

- [ ] HTTPS activo
- [ ] Headers de seguridad configurados
- [ ] CORS configurado correctamente
- [ ] Rate limiting activo
- [ ] Secrets no expuestos en código

---

## 🔍 TESTING POST-DEPLOYMENT

### Test Manual - Flujo Usuario Admin

1. **Login**
   - [ ] Ir a https://inmovaapp.com/login
   - [ ] Ingresar: admin@inmova.app / Admin2025!
   - [ ] Redirige a dashboard

2. **Dashboard**
   - [ ] Widgets cargan
   - [ ] Gráficos se muestran
   - [ ] Sin errores en consola

3. **Navegación**
   - [ ] Inquilinos: accesible
   - [ ] Contratos: accesible
   - [ ] Pagos: accesible
   - [ ] Mantenimiento: accesible
   - [ ] Documentos: accesible

4. **APIs**
   - [ ] Datos cargan
   - [ ] Sin errores 500
   - [ ] Respuestas rápidas (< 2s)

### Test Automático (Opcional)

```bash
# Ejecutar desde local
PLAYWRIGHT_TEST_BASE_URL=https://inmovaapp.com npx playwright test

# Debería pasar todos los tests
```

---

## 📊 MONITOREO

### Configurar Monitoreo

- [ ] Vercel Analytics activado
- [ ] Sentry configurado (opcional)
- [ ] Uptime monitor configurado (opcional)
- [ ] Error notifications activadas

### Métricas a Vigilar

- [ ] Uptime > 99.9%
- [ ] Response time < 1s
- [ ] Error rate < 0.1%
- [ ] Build time < 3min

---

## 🚨 PLAN DE ROLLBACK

En caso de problemas:

### Opción 1: Rollback en Vercel

1. Dashboard → Deployments
2. Click en deployment anterior estable
3. "Promote to Production"

### Opción 2: Revertir Código

```bash
git revert HEAD
git push origin main
# Vercel redesplegará automáticamente
```

### Opción 3: Rollback de BD (⚠️ CUIDADO)

```bash
# Solo si es necesario
npx prisma migrate resolve --rolled-back [migration-name]
```

---

## 📝 DOCUMENTACIÓN

### Documentar

- [ ] URL de producción guardada
- [ ] Credenciales de admin guardadas (seguras)
- [ ] DATABASE_URL guardada (segura)
- [ ] Proceso de deployment documentado
- [ ] Contactos de soporte guardados

### Compartir con Equipo

- [ ] URL de producción
- [ ] URL de staging (si existe)
- [ ] Credenciales de acceso (seguras)
- [ ] Proceso de deployment
- [ ] Troubleshooting común

---

## 🎯 OPTIMIZACIONES POST-DEPLOYMENT

### Inmediatas (Semana 1)

- [ ] Configurar monitoring
- [ ] Revisar logs de producción
- [ ] Ajustar rate limits si es necesario
- [ ] Configurar backups automáticos de BD

### Corto Plazo (Mes 1)

- [ ] Implementar CI/CD completo
- [ ] Configurar staging environment
- [ ] Configurar preview deployments
- [ ] Implementar feature flags

### Largo Plazo

- [ ] Configurar CDN para assets
- [ ] Implementar caching strategy
- [ ] Optimizar queries de BD
- [ ] Implementar serverless functions

---

## ✅ SIGN-OFF FINAL

**Deployment completado por:** ******\_\_\_******  
**Fecha:** ******\_\_\_******  
**Hora:** ******\_\_\_******

**Verificado por:** ******\_\_\_******

**Notas adicionales:**

```
[Espacio para notas]
```

**Estado Final:**

- [ ] ✅ Deployment exitoso
- [ ] ✅ Todas las verificaciones pasadas
- [ ] ✅ Monitoreo configurado
- [ ] ✅ Documentación completa
- [ ] ✅ Equipo notificado

---

## 📞 CONTACTOS DE EMERGENCIA

**Vercel Support:** https://vercel.com/support  
**Documentación:** https://vercel.com/docs  
**Status Page:** https://vercel-status.com

---

**IMPORTANTE:** Guarda este checklist completado para futura referencia.

**Próximo deployment:** Usa este mismo checklist
