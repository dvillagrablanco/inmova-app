# 🚀 Instrucciones de Deployment - INMOVA

## 📌 Estado Actual

✅ **Proyecto preparado para producción**

Todas las configuraciones de código están listas. Solo necesitas completar las configuraciones externas.

---

## 📝 Resumen de Cambios Implementados

### 1. Stripe - Modo LIVE Preparado
- ✅ Variables de entorno configuradas (requiere claves LIVE)
- ✅ Código preparado para producción
- 🟡 **Acción requerida**: Obtener claves LIVE de Stripe y actualizar `.env`

### 2. SendGrid - Email Transaccional
- ✅ Servicio de email implementado (`lib/sendgrid-service.ts`)
- ✅ Templates predefinidos para emails comunes
- ✅ Variables de entorno configuradas
- 🟡 **Acción requerida**: Obtener API Key de SendGrid y actualizar `.env`

### 3. Backups Automáticos
- ✅ Endpoints API para backups:
  - `POST /api/backup/create` - Crear backup
  - `GET /api/backup/list` - Listar backups
  - `POST /api/backup/restore` - Restaurar backup
- ✅ Sistema de autenticación con CRON_SECRET
- 🟡 **Acción requerida**: Configurar cron job (ver guía)

### 4. Sentry - Error Tracking
- ✅ Configuración completa para Client, Server y Edge
- ✅ Filtros de errores implementados
- ✅ Session Replay configurado
- 🟡 **Acción requerida**: Crear proyecto en Sentry y actualizar DSN en `.env`

### 5. UptimeRobot - Monitoring 24/7
- ✅ Health check endpoint: `GET /api/health`
- ✅ Verifica: servidor, base de datos, variables de entorno
- ✅ Reporta estado de servicios opcionales
- 🟡 **Acción requerida**: Configurar monitor en UptimeRobot

---

## 📄 Archivos Creados/Modificados

### Nuevos Archivos
```
├── app/api/health/route.ts          # Health check endpoint
├── lib/sendgrid-service.ts          # Servicio de email
├── sentry.client.config.ts          # Configuración Sentry (client)
├── sentry.server.config.ts          # Configuración Sentry (server)
├── sentry.edge.config.ts            # Configuración Sentry (edge)
├── instrumentation.ts               # Instrumentación Next.js
├── CONFIGURACION_PRODUCCION.md      # Guía completa de configuración
└── INSTRUCCIONES_DEPLOYMENT.md      # Este archivo
```

### Variables de Entorno Añadidas
```bash
# SendGrid
SENDGRID_API_KEY=SG_placeholder_OBTENER_DE_SENDGRID
SENDGRID_FROM_EMAIL=noreply@inmova.app

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://placeholder@sentry.io/placeholder
```

---

## 🛠️ Pasos para Deployment

### Paso 1: Revisar guía completa

Lee el archivo `CONFIGURACION_PRODUCCION.md` para instrucciones detalladas de cada servicio.

### Paso 2: Configurar servicios externos

En orden de prioridad:

1. **Stripe** (15 min) - Crítico para pagos
2. **SendGrid** (20 min) - Crítico para emails
3. **Backups** (5 min) - Crítico para seguridad
4. **Sentry** (15 min) - Importante para monitoring
5. **UptimeRobot** (10 min) - Importante para uptime

### Paso 3: Actualizar variables de entorno

Edita el archivo `.env` en `/home/ubuntu/homming_vidaro/nextjs_space/.env`:

```bash
# Actualizar estas variables con valores reales:
STRIPE_SECRET_KEY=sk_live_TU_CLAVE_AQUI
STRIPE_PUBLISHABLE_KEY=pk_live_TU_CLAVE_AQUI
STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_AQUI
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_TU_CLAVE_AQUI

SENDGRID_API_KEY=SG.TU_API_KEY_AQUI

NEXT_PUBLIC_SENTRY_DSN=https://TU_DSN@sentry.io/PROJECT_ID
```

### Paso 4: Rebuild y redeploy

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
yarn build
```

Luego, redeploy según tu método de deployment (Vercel, Docker, etc.)

### Paso 5: Verificar deployment

1. **Health Check**: `curl https://inmova.app/api/health`
2. **Stripe**: Hacer un pago de prueba
3. **SendGrid**: Enviar un email de prueba
4. **Sentry**: Forzar un error para verificar captura
5. **UptimeRobot**: Verificar que el monitor esté activo

---

## ✅ Checklist Pre-Deployment

### Configuración
- [ ] Todas las variables de entorno actualizadas
- [ ] Claves de producción obtenidas y configuradas
- [ ] Build exitoso sin errores

### Stripe
- [ ] Modo LIVE activado en dashboard
- [ ] Webhook configurado y verificado
- [ ] Pago de prueba realizado

### SendGrid
- [ ] API Key configurado
- [ ] Dominio verificado (recomendado)
- [ ] Email de prueba enviado

### Backups
- [ ] Backup manual creado exitosamente
- [ ] Cron job configurado (sistema o externo)
- [ ] Verificado que los backups se crean correctamente

### Sentry
- [ ] Proyecto creado en Sentry
- [ ] DSN configurado
- [ ] Error de prueba capturado

### UptimeRobot
- [ ] Monitor configurado
- [ ] Health endpoint respondiendo
- [ ] Alertas configuradas

### DNS & Dominio
- [ ] Dominio apuntando correctamente
- [ ] SSL/TLS activo
- [ ] Cloudflare configurado (opcional)

---

## 📊 Monitoring Post-Deployment

### Día 1 (Primeras 24 horas)
- Monitorear Sentry cada 2 horas
- Verificar que emails se envíen correctamente
- Revisar logs de errores
- Confirmar que los pagos funcionan

### Semana 1
- Revisar dashboards diariamente
- Verificar backups automáticos
- Monitorear uptime y performance
- Ajustar configuraciones si es necesario

### Mensual
- Revisar métricas agregadas
- Optimizar configuraciones
- Actualizar documentación si hay cambios

---

## 🔧 Troubleshooting

### Error: "SendGrid not configured"
**Solución**: Verifica que `SENDGRID_API_KEY` esté configurado en `.env` y no contenga "placeholder".

### Error: "Sentry DSN not configured"
**Solución**: Configura `NEXT_PUBLIC_SENTRY_DSN` en `.env` con tu DSN real de Sentry.

### Error: "Database connection failed" en health check
**Solución**: Verifica `DATABASE_URL` y que la base de datos esté accesible.

### Stripe webhook no funciona
**Solución**: 
1. Verifica que la URL del webhook sea correcta: `https://inmova.app/api/stripe/webhook`
2. Verifica que `STRIPE_WEBHOOK_SECRET` coincida con el de Stripe dashboard
3. Revisa los logs en Stripe dashboard para ver errores

### Backups no se crean automáticamente
**Solución**:
1. Verifica que el cron job esté configurado
2. Verifica que `CRON_SECRET` coincida en `.env` y en el cron job
3. Revisa los logs del cron job

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa `CONFIGURACION_PRODUCCION.md` para detalles específicos
2. Consulta la documentación oficial de cada servicio
3. Revisa los logs de la aplicación y Sentry
4. Contacta soporte del servicio específico

---

## 📚 Recursosútiles

- [Documentación Stripe](https://stripe.com/docs)
- [Documentación SendGrid](https://docs.sendgrid.com)
- [Documentación Sentry](https://docs.sentry.io)
- [Documentación UptimeRobot](https://uptimerobot.com/api/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0
