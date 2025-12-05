# 📋 Checklist de Deployment - INMOVA

## Pre-Deployment

### Código
- [ ] Todo el código está committed en Git
- [ ] No hay archivos sensibles en el repositorio (.env, claves privadas, etc.)
- [ ] `.gitignore` está correctamente configurado
- [ ] Todos los tests pasan localmente
- [ ] Build local exitoso (`yarn build`)

### Configuración
- [ ] `vercel.json` revisado y actualizado
- [ ] `next.config.js` optimizado para producción
- [ ] Variables de entorno documentadas
- [ ] Prisma schema actualizado

### Base de Datos
- [ ] Supabase proyecto creado
- [ ] Connection string obtenida
- [ ] Migraciones preparadas
- [ ] Seeds preparados (opcional)

## Deployment en Vercel

### Configuración Inicial
- [ ] Cuenta de Vercel creada/activa
- [ ] Repositorio de GitHub conectado
- [ ] Proyecto importado en Vercel
- [ ] Build settings configurados correctamente

### Variables de Entorno
- [ ] `DATABASE_URL` configurada
- [ ] `NEXTAUTH_SECRET` configurada
- [ ] `NEXTAUTH_URL` configurada
- [ ] Todas las claves de AWS configuradas
- [ ] Todas las claves de Stripe configuradas
- [ ] Claves de VAPID configuradas
- [ ] `ABACUSAI_API_KEY` configurada
- [ ] Variables adicionales según necesidad

### Primer Deploy
- [ ] Deploy iniciado
- [ ] Build completado sin errores
- [ ] Aplicación accesible en URL de Vercel
- [ ] Login funcional
- [ ] Dashboard carga correctamente

## Post-Deployment

### Base de Datos
- [ ] Migraciones ejecutadas
- [ ] Seeds ejecutados (si aplica)
- [ ] Datos de prueba verificados
- [ ] Conexiones pooling habilitadas

### Funcionalidad
- [ ] Autenticación funciona
- [ ] CRUD básico funciona
- [ ] Uploads de archivos funcionan
- [ ] Notificaciones funcionan
- [ ] Stripe integración funciona
- [ ] Cron jobs configurados (Pro plan)

### Performance
- [ ] Lighthouse score > 80
- [ ] Tiempo de carga < 3s
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s

### Seguridad
- [ ] HTTPS habilitado
- [ ] Headers de seguridad configurados
- [ ] CORS configurado correctamente
- [ ] Rate limiting activo
- [ ] CSP configurado

### Monitoreo
- [ ] Vercel Analytics habilitado
- [ ] Error tracking configurado
- [ ] Logs accesibles
- [ ] Alertas configuradas

### Dominio (Opcional)
- [ ] Dominio personalizado agregado
- [ ] DNS configurado
- [ ] SSL certificado activo
- [ ] Redirecciones configuradas

## Testing Post-Deploy

### Funcionalidad Crítica
- [ ] Registro de usuario
- [ ] Login de usuario
- [ ] Recuperación de contraseña
- [ ] Creación de edificios
- [ ] Creación de unidades
- [ ] Creación de inquilinos
- [ ] Creación de contratos
- [ ] Registro de pagos
- [ ] Subida de documentos

### Roles y Permisos
- [ ] Super Admin puede acceder a todo
- [ ] Admin puede gestionar su empresa
- [ ] Gestor tiene permisos limitados
- [ ] Inquilino solo ve su portal

### Integraciones
- [ ] Stripe pagos funcionan
- [ ] S3 uploads funcionan
- [ ] Notificaciones push funcionan
- [ ] Email funciona
- [ ] SMS funciona (si aplica)

## Optimización

### Performance
- [ ] Imágenes optimizadas
- [ ] Lazy loading implementado
- [ ] Code splitting activo
- [ ] Cache configurado
- [ ] CDN activo

### SEO
- [ ] Meta tags configurados
- [ ] Sitemap generado
- [ ] robots.txt configurado
- [ ] Open Graph tags
- [ ] Schema.org markup

### Accesibilidad
- [ ] ARIA labels implementados
- [ ] Keyboard navigation funciona
- [ ] Screen reader compatible
- [ ] Color contrast adecuado

## Documentación

- [ ] README actualizado
- [ ] Guía de deployment creada
- [ ] Variables de entorno documentadas
- [ ] API docs actualizadas
- [ ] Changelog actualizado

## Rollback Plan

- [ ] Backup de base de datos tomado
- [ ] Versión anterior identificada
- [ ] Procedimiento de rollback documentado
- [ ] Contactos de emergencia disponibles

## Go-Live

- [ ] Equipo notificado
- [ ] Usuarios notificados (si aplica)
- [ ] Monitoring activo
- [ ] Soporte disponible
- [ ] Post-mortem programado (24h después)

---

## Notas

### Primer Deploy
```bash
# Fecha:
# Deployed by:
# Version:
# URL:
# Notas:
```

### Issues Encontrados
```
1. 
2. 
3. 
```

### Acciones de Seguimiento
```
1. 
2. 
3. 
```

---

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete
**Last Updated:** December 2024
