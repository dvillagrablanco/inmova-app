# 🛠️ COMANDOS ÚTILES - INMOVA APP

**Servidor**: 157.180.119.236  
**Usuario**: root  
**Path**: /opt/inmova-app

---

## 🔐 Acceso SSH

```bash
# Conectar al servidor
ssh root@157.180.119.236

# Ir al directorio de la app
cd /opt/inmova-app
```

---

## 📊 Monitoreo

### PM2 (Proceso Node.js)

```bash
# Ver status de la app
pm2 status

# Ver logs en tiempo real
pm2 logs inmova-app

# Ver logs con filtros
pm2 logs inmova-app | grep -i "error"
pm2 logs inmova-app | grep -i "email"
pm2 logs inmova-app | grep -i "stripe"

# Ver últimas 50 líneas
pm2 logs inmova-app --lines 50

# Ver logs sin streaming (termina solo)
pm2 logs inmova-app --lines 100 --nostream

# Ver estadísticas de uso
pm2 monit

# Ver información detallada
pm2 describe inmova-app
```

### Logs del Sistema

```bash
# Logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs de Inmova
tail -f /var/log/inmova/out.log
tail -f /var/log/inmova/error.log

# Buscar errores en logs
grep -i "error" /var/log/inmova/*.log

# Buscar emails en logs
grep -i "email\|smtp" /var/log/inmova/*.log
```

### Health Checks

```bash
# Health check interno
curl http://localhost:3000/api/health

# Health check externo (dominio)
curl https://inmovaapp.com/api/health

# Con más detalles
curl -v https://inmovaapp.com/api/health

# Test de login page
curl -I https://inmovaapp.com/login
```

---

## 🔄 Gestión de la App

### Reiniciar la App

```bash
# Restart rápido (con downtime)
pm2 restart inmova-app

# Reload sin downtime (recomendado)
pm2 reload inmova-app

# Restart con variables actualizadas
pm2 restart inmova-app --update-env

# Stop y start (restart completo)
pm2 stop inmova-app
pm2 start inmova-app
```

### Actualizar Código

```bash
# Ir al directorio
cd /opt/inmova-app

# Ver cambios pendientes
git status

# Actualizar código
git pull origin main

# Instalar nuevas dependencias (si hay)
npm install

# Aplicar migraciones de BD (si hay)
npx prisma migrate deploy

# Restart de la app
pm2 reload inmova-app
```

### Limpiar Cache

```bash
# Limpiar cache de Next.js
rm -rf .next/cache

# Limpiar node_modules (solo si hay problemas)
rm -rf node_modules
npm install

# Rebuild completo
rm -rf .next
npm run build
pm2 restart inmova-app
```

---

## 📧 Gmail SMTP

### Verificar Configuración

```bash
# Ver variables SMTP
cd /opt/inmova-app
cat .env.local | grep SMTP
cat .env.production | grep SMTP

# Test de conexión
node -e "const nodemailer = require('nodemailer'); \
const t = nodemailer.createTransport({ \
  host: 'smtp.gmail.com', port: 587, secure: false, \
  auth: { user: 'inmovaapp@gmail.com', pass: 'eeemxyuasvsnyxyu' } \
}); \
t.verify().then(() => console.log('✅ OK')).catch(e => console.error('❌', e.message));"
```

### Actualizar Password

```bash
# Si necesitas cambiar la App Password
cd /opt/inmova-app
sed -i 's/^SMTP_PASSWORD=.*/SMTP_PASSWORD=NUEVA_PASSWORD/' .env.local
sed -i 's/^SMTP_PASSWORD=.*/SMTP_PASSWORD=NUEVA_PASSWORD/' .env.production
pm2 restart inmova-app
```

### Monitorear Emails

```bash
# Ver logs de emails
pm2 logs inmova-app | grep -i "email\|smtp\|nodemailer"

# Ver emails enviados
grep -i "email sent" /var/log/inmova/*.log

# Ver errores de email
grep -i "error sending email" /var/log/inmova/*.log
```

---

## 💳 Stripe

### Verificar Webhook

```bash
# Ver configuración
cd /opt/inmova-app
cat .env.local | grep STRIPE

# Test del endpoint
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"type":"test"}'
```

### Monitorear Pagos

```bash
# Ver logs de Stripe
pm2 logs inmova-app | grep -i "stripe\|payment\|webhook"

# Ver webhooks recibidos
grep -i "webhook" /var/log/inmova/*.log | grep stripe
```

---

## 🗄️ Base de Datos

### Prisma Studio (GUI para BD)

```bash
# Abrir Prisma Studio (web UI)
cd /opt/inmova-app
npx prisma studio

# Se abre en: http://localhost:5555
# Crear túnel SSH para acceder desde tu PC:
# En TU PC:
ssh -L 5555:localhost:5555 root@157.180.119.236
# Luego abrir: http://localhost:5555
```

### Consultas SQL

```bash
# Conectar a PostgreSQL
psql -U inmova_user -d inmova_production

# Ver usuarios
SELECT email, role, activo FROM users;

# Ver propiedades
SELECT address, city, price, status FROM properties;

# Ver pagos recientes
SELECT amount, status, "createdAt" FROM payments ORDER BY "createdAt" DESC LIMIT 10;

# Salir
\q
```

### Migraciones

```bash
# Ver status de migraciones
cd /opt/inmova-app
npx prisma migrate status

# Aplicar migraciones pendientes
npx prisma migrate deploy

# Resetear BD (⚠️ PELIGRO - borra todos los datos)
npx prisma migrate reset
```

---

## 📦 Backups

### Backup de BD

```bash
# Backup manual
pg_dump -U inmova_user inmova_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Comprimir backup
gzip backup_*.sql

# Ver backups existentes
ls -lh /var/backups/inmova/
```

### Backup de .env

```bash
# Backup de variables de entorno
cd /opt/inmova-app
cp .env.production .env.production.backup_$(date +%Y%m%d)
cp .env.local .env.local.backup_$(date +%Y%m%d)
```

### Restaurar desde Backup

```bash
# Restaurar BD
psql -U inmova_user -d inmova_production < backup_20260103.sql

# Restaurar .env
cd /opt/inmova-app
cp .env.production.backup_20260103 .env.production
pm2 restart inmova-app
```

---

## 🔧 Troubleshooting

### App no responde

```bash
# 1. Ver logs
pm2 logs inmova-app --lines 50

# 2. Ver status de PM2
pm2 status

# 3. Reiniciar
pm2 restart inmova-app

# 4. Si sigue sin funcionar, restart completo
pm2 delete inmova-app
pm2 kill
cd /opt/inmova-app
pm2 start ecosystem.config.js --env production
pm2 save
```

### Puerto 3000 ocupado

```bash
# Ver qué proceso usa el puerto
lsof -i :3000
# o
ss -tlnp | grep :3000

# Matar proceso
kill -9 <PID>
# o
fuser -k 3000/tcp

# Reiniciar PM2
pm2 restart inmova-app
```

### BD no conecta

```bash
# Test de conexión
cd /opt/inmova-app
npx prisma db push

# Ver status de PostgreSQL
systemctl status postgresql

# Reiniciar PostgreSQL
systemctl restart postgresql
```

### Emails no llegan

```bash
# 1. Verificar variables
cat .env.local | grep SMTP

# 2. Test de conexión
node -e "const nodemailer = require('nodemailer'); \
const t = nodemailer.createTransport({ \
  host: 'smtp.gmail.com', port: 587, secure: false, \
  auth: { user: 'inmovaapp@gmail.com', pass: 'eeemxyuasvsnyxyu' } \
}); \
t.verify().then(() => console.log('✅ OK')).catch(e => console.error('❌', e.message));"

# 3. Ver logs
pm2 logs inmova-app | grep -i email

# 4. Reiniciar app
pm2 restart inmova-app
```

### Disco lleno

```bash
# Ver uso de disco
df -h

# Ver archivos grandes
du -sh * | sort -h

# Limpiar logs antiguos
find /var/log -name "*.log" -mtime +30 -delete

# Limpiar cache de npm
npm cache clean --force

# Limpiar backups antiguos
find /var/backups/inmova -name "*.sql.gz" -mtime +30 -delete
```

---

## 🚀 Deployment

### Deployment Manual

```bash
# 1. Conectar al servidor
ssh root@157.180.119.236

# 2. Ir al directorio
cd /opt/inmova-app

# 3. Backup de BD
pg_dump -U inmova_user inmova_production > /var/backups/inmova/pre-deploy-$(date +%Y%m%d_%H%M%S).sql

# 4. Actualizar código
git pull origin main

# 5. Instalar dependencias
npm install

# 6. Aplicar migraciones
npx prisma migrate deploy

# 7. Reload PM2 (sin downtime)
pm2 reload inmova-app

# 8. Esperar warm-up
sleep 10

# 9. Health check
curl https://inmovaapp.com/api/health

# 10. Ver logs
pm2 logs inmova-app --lines 20
```

### Rollback

```bash
# Ver commits recientes
git log --oneline -10

# Rollback a versión anterior
git reset --hard <commit-hash>

# Reinstalar dependencias de esa versión
npm install

# Aplicar migraciones
npx prisma migrate deploy

# Restart
pm2 reload inmova-app
```

---

## 📊 Métricas y Estadísticas

### Uso de Recursos

```bash
# CPU y RAM
top
# o
htop

# Uso por proceso
pm2 monit

# Disco
df -h

# Memoria
free -h

# Uptime del servidor
uptime
```

### Estadísticas de la App

```bash
# Número de usuarios en BD
psql -U inmova_user -d inmova_production -c "SELECT COUNT(*) FROM users;"

# Número de propiedades
psql -U inmova_user -d inmova_production -c "SELECT COUNT(*) FROM properties;"

# Pagos del último mes
psql -U inmova_user -d inmova_production -c "SELECT COUNT(*), SUM(amount) FROM payments WHERE \"createdAt\" > NOW() - INTERVAL '30 days';"

# Requests en última hora (Nginx)
tail -1000 /var/log/nginx/access.log | grep "$(date '+%d/%b/%Y:%H')" | wc -l
```

---

## 🔐 Seguridad

### Firewall (UFW)

```bash
# Ver status
ufw status

# Ver reglas
ufw status numbered

# Permitir puerto
ufw allow 3000/tcp

# Denegar puerto
ufw deny 3000/tcp

# Reload
ufw reload
```

### SSL (Certbot)

```bash
# Ver certificados
certbot certificates

# Renovar certificados
certbot renew

# Renovar con dry-run (test)
certbot renew --dry-run
```

### Logs de Seguridad

```bash
# Ver intentos de login fallidos
grep "Failed password" /var/log/auth.log

# Ver accesos SSH exitosos
grep "Accepted password" /var/log/auth.log
```

---

## 📱 Accesos Rápidos

### Dashboards

```bash
# Stripe (pagos)
https://dashboard.stripe.com/

# AWS S3 (archivos)
https://s3.console.aws.amazon.com/

# Gmail (emails)
https://myaccount.google.com/
https://myaccount.google.com/apppasswords

# Signaturit (firmas)
https://app.signaturit.com/

# DocuSign (firmas backup)
https://demo.docusign.net/
```

### Aplicación

```bash
# Landing
https://inmovaapp.com/landing

# Login
https://inmovaapp.com/login

# Dashboard
https://inmovaapp.com/dashboard

# API Docs
https://inmovaapp.com/docs

# Health Check
https://inmovaapp.com/api/health
```

---

## 🆘 Soporte Rápido

### Comandos de Diagnóstico Completo

```bash
# Ejecutar esto y compartir el output:
echo "=== SISTEMA ==="
uname -a
uptime
df -h
free -h

echo "=== PM2 ==="
pm2 status
pm2 describe inmova-app

echo "=== HEALTH CHECK ==="
curl -I https://inmovaapp.com/api/health

echo "=== ÚLTIMOS LOGS (20 líneas) ==="
pm2 logs inmova-app --lines 20 --nostream

echo "=== VARIABLES CRÍTICAS ==="
cd /opt/inmova-app && grep -E "(DATABASE_URL|NEXTAUTH_URL|STRIPE_SECRET_KEY|SMTP_HOST)" .env.local | grep -v "PASSWORD\|SECRET_KEY"
```

---

**Última actualización**: 3 de enero de 2026  
**Servidor**: 157.180.119.236  
**App**: https://inmovaapp.com
