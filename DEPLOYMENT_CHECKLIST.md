# ✅ Checklist de Deployment - Sistema de Partners INMOVA

## 🛠️ Pre-Deployment

### Base de Datos
- [ ] Ejecutar migraciones de Prisma
  ```bash
  cd nextjs_space
  yarn prisma migrate deploy
  yarn prisma generate
  ```
- [ ] Verificar que todos los modelos nuevos existen:
  - MarketingMaterial
  - MaterialDownload
  - PartnerCertification
  - PartnerCertificationAwarded
- [ ] Verificar nuevos campos en SalesRepresentative:
  - apiKey, apiSecret, apiEnabled
  - whiteLabelEnabled, whiteLabelConfig
  - nivel, parentSalesRepId

### Variables de Entorno
- [ ] Configurar `CRON_SECRET_TOKEN` (token largo y aleatorio)
- [ ] Configurar SMTP (si se usará email en producción):
  - SMTP_HOST
  - SMTP_PORT
  - SMTP_USER
  - SMTP_PASSWORD
- [ ] Configurar `NEXT_PUBLIC_APP_URL` con la URL de producción
- [ ] Verificar que todas las variables de entorno estén en el sistema de deployment

### Código
- [ ] Compilar el proyecto sin errores
  ```bash
  yarn build
  ```
- [ ] Verificar que no hay errores TypeScript
  ```bash
  yarn tsc --noEmit
  ```
- [ ] Verificar que todos los servicios están importados correctamente
- [ ] Revisar logs de consola en modo desarrollo

---

## 🚀 Deployment

### 1. Deploy de Base de Datos
- [ ] Hacer backup de la base de datos actual
- [ ] Ejecutar migraciones en producción:
  ```bash
  yarn prisma migrate deploy
  yarn prisma generate
  ```
- [ ] Verificar que las tablas nuevas existen

### 2. Deploy de Aplicación
#### Usando herramienta de deploy de Abacus.AI:
- [ ] Ejecutar `deploy_nextjs_project` con hostname `inmova.app`
- [ ] Esperar confirmación de deployment exitoso
- [ ] Verificar URL pública

#### O manualmente:
- [ ] Build del proyecto
- [ ] Deploy a servidor/plataforma
- [ ] Configurar DNS si es necesario

### 3. Configurar CRON Jobs

#### Opción A: Usar cron-job.org
1. [ ] Ir a https://cron-job.org
2. [ ] Registrarse/Login
3. [ ] Crear 3 cron jobs:

**Job 1: Comisiones Mensuales**
- URL: `https://inmova.app/api/cron/monthly-commissions`
- Método: POST
- Header: `Authorization: Bearer [CRON_SECRET_TOKEN]`
- Schedule: `0 0 1 * *` (Día 1 a las 00:00)

**Job 2: Actualizar Métricas**
- URL: `https://inmova.app/api/cron/update-metrics`
- Método: POST
- Header: `Authorization: Bearer [CRON_SECRET_TOKEN]`
- Schedule: `0 2 * * *` (Diario a las 02:00)

**Job 3: Recordatorio Objetivos**
- URL: `https://inmova.app/api/cron/monthly-goals-reminder`
- Método: POST
- Header: `Authorization: Bearer [CRON_SECRET_TOKEN]`
- Schedule: `0 9 * * 1` (Lunes a las 09:00)

#### Opción B: Usar Vercel Cron (si estás en Vercel)
- [ ] Crear archivo `vercel.json` con configuración de crons
- [ ] Deploy a Vercel

#### Opción C: Usar GitHub Actions
- [ ] Crear workflows en `.github/workflows/`
- [ ] Configurar secrets en GitHub

---

## ✅ Post-Deployment

### Verificaciones Básicas
- [ ] La aplicación carga correctamente en `https://inmova.app`
- [ ] Login de administrador funciona
- [ ] Dashboard de admin carga
- [ ] No hay errores en la consola del navegador

### Verificaciones del Sistema de Partners

#### 1. Gestión de Comerciales
- [ ] Crear un comercial de prueba desde admin
- [ ] Verificar que se recibe email de bienvenida (o log si está en modo demo)
- [ ] Login con las credenciales del comercial en `/portal-comercial/login`
- [ ] Ver dashboard del comercial

#### 2. Gestión de Leads
- [ ] Crear un lead desde el portal del comercial
- [ ] Verificar que aparece en la lista de leads
- [ ] Actualizar estado del lead
- [ ] Convertir lead a cliente
- [ ] Verificar que se genera comisión de captación

#### 3. Comisiones
- [ ] Ver comisiones en dashboard de comercial
- [ ] Ver comisiones en dashboard de admin
- [ ] Aprobar una comisión desde admin
- [ ] Marcar comisión como pagada
- [ ] Verificar que el estado se actualiza correctamente

#### 4. API Keys
- [ ] Generar API Key para un comercial
- [ ] Copiar las credenciales
- [ ] Probar crear lead con la API pública:
  ```bash
  curl -X POST https://inmova.app/api/partners/public/leads/create \
    -H "X-API-Key: pk_xxxxx" \
    -H "X-API-Secret: sk_xxxxx" \
    -H "Content-Type: application/json" \
    -d '{
      "nombreContacto": "Test",
      "emailContacto": "test@test.com",
      "nombreEmpresa": "Test Company"
    }'
  ```
- [ ] Verificar que el lead aparece en el sistema

#### 5. White Label
- [ ] Configurar White Label para un comercial
- [ ] Verificar que se guarda la configuración
- [ ] Obtener configuración con GET

#### 6. Materiales de Marketing
- [ ] Crear un material de marketing desde admin
- [ ] Listar materiales disponibles
- [ ] Descargar un material como comercial
- [ ] Verificar tracking de descarga

#### 7. Certificaciones
- [ ] Crear una certificación desde admin
- [ ] Otorgar certificación a un comercial
- [ ] Verificar que se recibe email (o log)
- [ ] Ver certificaciones del comercial

#### 8. Sub-Afiliados
- [ ] Crear un sub-afiliado bajo un comercial existente
- [ ] Verificar que el nivel es 2
- [ ] Crear lead con el sub-afiliado
- [ ] Convertir lead
- [ ] Verificar que se generan 2 comisiones:
  - Comisión normal para el sub-afiliado
  - Comisión NIVEL2 para el comercial padre (10%)

#### 9. Reportes
- [ ] Exportar comisiones a CSV desde `/api/reports/commissions?format=csv`
- [ ] Exportar leads a CSV
- [ ] Obtener datos de gráficas
- [ ] Ver ranking de comerciales
- [ ] Ver estadísticas generales

#### 10. CRON Jobs
- [ ] Ejecutar manualmente el CRON de comisiones mensuales:
  ```bash
  curl -X POST https://inmova.app/api/cron/monthly-commissions \
    -H "Authorization: Bearer [CRON_SECRET_TOKEN]"
  ```
- [ ] Verificar respuesta exitosa
- [ ] Verificar que se generan comisiones
- [ ] Ejecutar CRON de métricas
- [ ] Ejecutar CRON de recordatorios

---

## 📊 Monitoreo Post-Deployment

### Día 1
- [ ] Verificar que los CRON jobs se ejecutan correctamente
- [ ] Revisar logs de errores
- [ ] Verificar que no hay errores 500 en producción
- [ ] Monitorear uso de base de datos

### Primera Semana
- [ ] Verificar que los emails automáticos se envían
- [ ] Revisar feedback de usuarios iniciales
- [ ] Ajustar configuraciones si es necesario
- [ ] Documentar cualquier problema encontrado

### Primer Mes
- [ ] Esperar al día 1 del mes siguiente
- [ ] Verificar que el CRON de comisiones mensuales funciona
- [ ] Revisar que todas las comisiones se generan correctamente
- [ ] Verificar que los emails de comisiones se envían
- [ ] Recolectar feedback de comerciales

---

## 🛡️ Seguridad

- [ ] Verificar que el `CRON_SECRET_TOKEN` es fuerte y secreto
- [ ] Verificar que las API Keys se generan correctamente
- [ ] Verificar que los secrets se hashean antes de guardar
- [ ] Revisar permisos de roles (admin, partner)
- [ ] Verificar que las APIs públicas tienen rate limiting (si aplicable)
- [ ] Revisar logs de acceso sospechoso

---

## 📝 Documentación

- [ ] Actualizar documentación para usuarios finales
- [ ] Crear guías para comerciales
- [ ] Crear guías para administradores
- [ ] Documentar API pública con ejemplos
- [ ] Crear FAQs

---

## 👥 Capacitación

- [ ] Capacitar al equipo administrativo
- [ ] Crear materiales de onboarding para nuevos partners
- [ ] Grabar video tutorial del sistema
- [ ] Preparar presentación del programa de partners

---

## ✅ Sign-off

- [ ] **Product Owner**: Sistema revisado y aprobado
- [ ] **Tech Lead**: Deployment exitoso y verificado
- [ ] **QA**: Todas las pruebas pasadas
- [ ] **Admin**: Capacitado y listo para usar el sistema

---

**Fecha de Deployment**: _______________
**Firmado por**: _______________
**Notas adicionales**: 

---

## 🎉 ¡Deployment Completado!

El sistema de partners está ahora en producción y listo para usar.

### URLs Útiles
- Aplicación: https://inmova.app
- Admin Dashboard: https://inmova.app/admin/sales-team
- Portal Comercial: https://inmova.app/portal-comercial
- API Docs: https://inmova.app/api/docs (si existe)

### Contactos de Soporte
- Email: soporte@inmova.com
- Slack: #inmova-partners
- GitHub: [enlace al repo]
