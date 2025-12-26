# ⚡ Comandos Rápidos de Migración

## 🚀 Migración en 3 Comandos

```bash
# 1. Verificar que todo está listo
./scripts/check-pre-migracion.sh

# 2. Crear backup
./scripts/backup-pre-migracion.sh

# 3. Ejecutar migración
export SERVER_IP="xxx.xxx.xxx.xxx"
./scripts/migracion-servidor.sh

# 4. Verificar resultado
./scripts/verificacion-post-migracion.sh
```

---

## 📋 Preparación Rápida

### Configurar variables de entorno

```bash
# Generar NEXTAUTH_SECRET
openssl rand -base64 32

# Generar ENCRYPTION_KEY
openssl rand -base64 32

# Generar MFA_ENCRYPTION_KEY
openssl rand -base64 32

# Generar VAPID Keys
npx web-push generate-vapid-keys

# Generar CRON_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Configurar SSH

```bash
# Dar permisos a la clave
chmod 600 ~/.ssh/inmova_deployment_key

# Probar conexión
ssh -i ~/.ssh/inmova_deployment_key root@[IP_SERVIDOR]

# Verificar fingerprint (debe ser):
# 55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78
```

---

## 🔧 Comandos Post-Migración

### Conectar al servidor

```bash
ssh inmova-deployment
# O con IP directa:
ssh -i ~/.ssh/inmova_deployment_key root@[IP_SERVIDOR]
```

### Ver estado de la aplicación

```bash
# Estado de PM2
pm2 status

# Ver logs
pm2 logs inmova-production

# Reiniciar aplicación
pm2 restart inmova-production
```

### Ver logs del sistema

```bash
# Logs de Nginx
tail -f /var/log/nginx/inmova_access.log
tail -f /var/log/nginx/inmova_error.log

# Logs de PM2
tail -f /var/log/inmova/out.log
tail -f /var/log/inmova/error.log

# Logs de PostgreSQL
tail -f /var/log/postgresql/postgresql-15-main.log
```

### Verificar servicios

```bash
# Estado de servicios
systemctl status nginx
systemctl status postgresql
systemctl status redis-server

# Verificar puertos
netstat -tlnp | grep -E '(80|443|3000|5432)'

# Recursos del sistema
htop  # o top
df -h  # espacio en disco
free -m  # memoria
```

---

## 🔄 Actualizar Aplicación

```bash
# 1. Conectar al servidor
ssh inmova-deployment

# 2. Navegar al directorio
cd /var/www/inmova

# 3. Backup rápido
pg_dump inmova_production > backup_$(date +%Y%m%d).sql

# 4. Actualizar código
git pull origin main

# 5. Instalar dependencias
yarn install

# 6. Migraciones
yarn prisma migrate deploy

# 7. Rebuild
yarn build

# 8. Reiniciar
pm2 restart inmova-production
```

---

## 🗄️ Base de Datos

### Conectar a PostgreSQL

```bash
sudo -u postgres psql -d inmova_production
```

### Comandos útiles

```sql
-- Listar tablas
\dt

-- Ver estructura de tabla
\d "User"

-- Contar registros
SELECT COUNT(*) FROM "User";

-- Ver conexiones activas
SELECT count(*) FROM pg_stat_activity;

-- Tamaño de la base de datos
SELECT pg_size_pretty(pg_database_size('inmova_production'));
```

### Backup y restore

```bash
# Backup
pg_dump inmova_production > backup.sql

# Backup comprimido
pg_dump inmova_production | gzip > backup.sql.gz

# Restore
psql inmova_production < backup.sql

# Restore comprimido
gunzip < backup.sql.gz | psql inmova_production
```

---

## 🔒 SSL/HTTPS (después de configurar dominio)

```bash
# Instalar certificado
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Renovar certificado (automático)
sudo certbot renew

# Verificar renovación
sudo certbot renew --dry-run

# Ver certificados instalados
sudo certbot certificates
```

---

## 🛡️ Firewall

```bash
# Ver estado
ufw status

# Permitir puerto
ufw allow 80/tcp
ufw allow 443/tcp

# Denegar puerto
ufw deny 8080/tcp

# Habilitar firewall
ufw enable

# Ver reglas numeradas
ufw status numbered

# Eliminar regla
ufw delete [número]
```

---

## 🔍 Troubleshooting Rápido

### Aplicación no responde

```bash
# Ver logs
pm2 logs inmova-production --lines 100

# Reiniciar
pm2 restart inmova-production

# Restart completo
pm2 delete inmova-production
cd /var/www/inmova
pm2 start ecosystem.config.js
```

### Error 502 Bad Gateway

```bash
# Verificar app
pm2 status

# Verificar puerto
netstat -tlnp | grep 3000

# Reiniciar Nginx
systemctl restart nginx
```

### Base de datos no conecta

```bash
# Verificar PostgreSQL
systemctl status postgresql

# Reiniciar PostgreSQL
systemctl restart postgresql

# Ver logs
tail -f /var/log/postgresql/postgresql-15-main.log
```

### Disco lleno

```bash
# Ver uso
df -h

# Limpiar logs PM2
pm2 flush

# Limpiar logs del sistema
find /var/log -type f -name "*.log" -mtime +30 -delete

# Limpiar cache de Next.js
cd /var/www/inmova
rm -rf .next/cache
```

---

## 📊 Monitoreo

### Recursos en tiempo real

```bash
# CPU y RAM
htop

# Disco
watch -n 1 df -h

# Red
iftop

# Procesos de Node
watch -n 1 'ps aux | grep node'
```

### PM2 Monit

```bash
# Monitoreo interactivo
pm2 monit

# Información detallada
pm2 show inmova-production

# Logs en tiempo real
pm2 logs inmova-production --raw
```

---

## 🔄 Backup Automático

### Configurar cron para backups diarios

```bash
# Editar crontab
crontab -e

# Agregar (backup diario a las 2 AM):
0 2 * * * cd /var/www/inmova && ./scripts/backup-pre-migracion.sh >> /var/log/inmova/backup.log 2>&1

# Ver crontab actual
crontab -l

# Logs de cron
tail -f /var/log/cron.log
```

---

## 🧹 Mantenimiento

### Limpiar espacio en disco

```bash
# Limpiar apt cache
apt-get clean
apt-get autoclean

# Eliminar paquetes no usados
apt-get autoremove

# Limpiar logs antiguos
journalctl --vacuum-time=7d

# Limpiar node_modules no usados
cd /var/www/inmova
yarn clean
```

### Actualizar sistema

```bash
# Actualizar paquetes
apt-get update
apt-get upgrade -y

# Actualizar Node.js
npm install -g npm@latest
npm install -g yarn@latest
npm install -g pm2@latest

# Actualizar dependencias de la app
cd /var/www/inmova
yarn upgrade-interactive
```

---

## 🎯 Variables de Entorno Importantes

```bash
# Ver variables (sin mostrar secretos)
cd /var/www/inmova
cat .env | grep -v "PASSWORD\|SECRET\|KEY"

# Editar variables
nano /var/www/inmova/.env

# Después de cambiar, reiniciar app
pm2 restart inmova-production
```

---

## 📞 Información del Servidor

```bash
# Información del sistema
uname -a
lsb_release -a

# Versiones instaladas
node --version
yarn --version
pm2 --version
postgres --version
nginx -v

# Información de red
ip addr show
hostname -I
```

---

## 🆘 Contacto y Soporte

### Archivos de documentación:
- `INICIO_RAPIDO_MIGRACION.md` - Guía de inicio rápido
- `GUIA_MIGRACION_SERVIDOR_INMOVA.md` - Guía completa
- `SERVIDOR_MIGRACION_SSH.md` - Configuración SSH
- Este archivo - Comandos rápidos

### Scripts disponibles:
- `scripts/check-pre-migracion.sh` - Verificar preparación
- `scripts/backup-pre-migracion.sh` - Crear backup
- `scripts/migracion-servidor.sh` - Ejecutar migración
- `scripts/verificacion-post-migracion.sh` - Verificar instalación

---

**Última actualización:** 26/12/2025  
**Servidor:** inmova-deployment  
**Fingerprint:** 55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78
