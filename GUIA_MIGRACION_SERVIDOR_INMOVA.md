# 🚀 Guía Completa de Migración al Servidor INMOVA-DEPLOYMENT

## 📋 Información del Servidor

| Campo | Valor |
|-------|-------|
| **Nombre del servidor** | `inmova-deployment` |
| **Fingerprint SSH** | `55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78` |
| **Clave del servidor** | `hhk8JqPEpJ3C` |
| **Fecha de preparación** | 26 de Diciembre, 2025 |

---

## 🎯 Objetivos de la Migración

1. ✅ Migrar la aplicación INMOVA al nuevo servidor de producción
2. ✅ Configurar todos los servicios necesarios (Node.js, PostgreSQL, Nginx, Redis)
3. ✅ Implementar sistema de monitoreo con PM2
4. ✅ Configurar seguridad (Firewall, SSL)
5. ✅ Realizar backups y verificación completa

---

## 📦 Prerrequisitos

### 1. En tu máquina local:

```bash
# Instalar herramientas necesarias
sudo apt-get update
sudo apt-get install -y openssh-client postgresql-client rsync curl

# Verificar que tienes acceso al repositorio
git status
```

### 2. Clave SSH del servidor:

- La clave privada SSH debe estar en: `~/.ssh/inmova_deployment_key`
- Permisos correctos: `chmod 600 ~/.ssh/inmova_deployment_key`

### 3. Variables de entorno necesarias:

```bash
# IP del servidor (debe ser proporcionada)
export SERVER_IP="xxx.xxx.xxx.xxx"

# Usuario SSH (normalmente root)
export SERVER_USER="root"

# Ruta de instalación
export DEPLOY_PATH="/var/www/inmova"
```

---

## 🔐 Configuración de SSH

### 1. Agregar configuración SSH

Edita `~/.ssh/config` y agrega:

```
Host inmova-deployment
    HostName [IP_DEL_SERVIDOR]
    User root
    IdentityFile ~/.ssh/inmova_deployment_key
    StrictHostKeyChecking yes
    IdentitiesOnly yes
```

### 2. Verificar fingerprint en la primera conexión

Al conectar por primera vez, verifica que el fingerprint sea:
```
55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78
```

### 3. Probar conexión

```bash
ssh inmova-deployment "echo 'Conexión exitosa'"
```

---

## 🚀 Proceso de Migración Paso a Paso

### FASE 1: Preparación y Backup 📦

#### 1.1. Crear backup pre-migración

```bash
# Ejecutar script de backup
./scripts/backup-pre-migracion.sh
```

Este script creará:
- ✅ Backup de la base de datos
- ✅ Backup de variables de entorno
- ✅ Backup de configuración
- ✅ Backup de scripts
- ✅ Checksums para verificación

**Ubicación del backup:** `./backups/migracion_[FECHA]/`

#### 1.2. Verificar el backup

```bash
# Listar backups
ls -lh backups/

# Verificar integridad (opcional)
cd backups/migracion_[FECHA]
sha256sum -c checksums.txt
```

#### 1.3. Guardar backup en lugar seguro

```bash
# Copiar a almacenamiento externo o S3
cp backups/migracion_*.tar.gz /ruta/segura/
# O subir a S3
aws s3 cp backups/migracion_*.tar.gz s3://tu-bucket/backups/
```

---

### FASE 2: Configuración de Variables de Entorno 🔐

#### 2.1. Copiar plantilla de configuración

```bash
cp .env.servidor.inmova-deployment .env.production
```

#### 2.2. Editar variables críticas

Abre `.env.production` y configura:

**Variables OBLIGATORIAS:**

```bash
# 1. NextAuth Secret (generar nueva)
openssl rand -base64 32
# Copiar el resultado en NEXTAUTH_SECRET

# 2. Encryption Keys (generar nuevas)
openssl rand -base64 32  # Para ENCRYPTION_KEY
openssl rand -base64 32  # Para MFA_ENCRYPTION_KEY

# 3. VAPID Keys para Push Notifications
npx web-push generate-vapid-keys
# Copiar en NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY

# 4. Actualizar URL base con la IP del servidor
NEXTAUTH_URL=http://[IP_DEL_SERVIDOR]
NEXT_PUBLIC_BASE_URL=http://[IP_DEL_SERVIDOR]
```

**Variables de AWS S3:**
```env
AWS_BUCKET_NAME=[tu_bucket]
AWS_ACCESS_KEY_ID=[tu_access_key]
AWS_SECRET_ACCESS_KEY=[tu_secret_key]
```

**Variables de Stripe (PRODUCCIÓN):**
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### 2.3. Verificar configuración

```bash
# Verificar que no hay placeholders
grep -i "\[CAMBIAR\]" .env.production
# No debe devolver resultados

# Verificar variables críticas
grep "NEXTAUTH_SECRET\|DATABASE_URL\|AWS_BUCKET_NAME" .env.production
```

---

### FASE 3: Ejecutar Migración 🎯

#### 3.1. Iniciar migración

```bash
# Exportar IP del servidor
export SERVER_IP="xxx.xxx.xxx.xxx"

# Ejecutar script de migración
./scripts/migracion-servidor.sh
```

El script realizará automáticamente:

1. ✅ Verificar conectividad SSH
2. ✅ Instalar dependencias del sistema (Node.js, PostgreSQL, Nginx, Redis, PM2)
3. ✅ Crear estructura de directorios
4. ✅ Transferir archivos al servidor
5. ✅ Configurar variables de entorno
6. ✅ Instalar dependencias de Node.js
7. ✅ Configurar PostgreSQL y crear base de datos
8. ✅ Ejecutar migraciones de Prisma
9. ✅ Compilar aplicación Next.js
10. ✅ Configurar PM2 para gestión de procesos
11. ✅ Configurar Nginx como reverse proxy
12. ✅ Configurar firewall (UFW)

#### 3.2. Monitorear progreso

El script mostrará el progreso en tiempo real. Puede tardar **15-30 minutos** dependiendo de:
- Velocidad de conexión
- Recursos del servidor
- Tamaño de la aplicación

#### 3.3. En caso de error

Si el script falla:

```bash
# Ver logs del último error
cat /tmp/migracion_error.log

# Verificar conexión al servidor
ssh inmova-deployment

# Reintenta desde el paso que falló
# El script es idempotente, puedes ejecutarlo múltiples veces
```

---

### FASE 4: Verificación Post-Migración ✅

#### 4.1. Ejecutar script de verificación

```bash
export SERVER_IP="xxx.xxx.xxx.xxx"
./scripts/verificacion-post-migracion.sh
```

Este script verificará:
- ✅ Conectividad SSH
- ✅ Servicios del sistema (Node.js, PostgreSQL, Nginx, Redis)
- ✅ Aplicación PM2 ejecutándose
- ✅ Base de datos y tablas
- ✅ Archivos de la aplicación
- ✅ Conectividad HTTP/HTTPS
- ✅ Logs sin errores críticos
- ✅ Firewall configurado
- ✅ Recursos del sistema (CPU, RAM, Disco)

#### 4.2. Verificación manual

```bash
# Conectar al servidor
ssh inmova-deployment

# Verificar PM2
pm2 status
pm2 logs inmova-production --lines 50

# Verificar base de datos
sudo -u postgres psql -d inmova_production -c "SELECT COUNT(*) FROM \"User\";"

# Verificar Nginx
systemctl status nginx
curl -I http://localhost

# Verificar recursos
htop  # o top
df -h
free -m
```

#### 4.3. Verificación desde navegador

1. Abrir en el navegador: `http://[IP_DEL_SERVIDOR]`
2. Verificar que la página carga correctamente
3. Probar inicio de sesión
4. Verificar funcionalidades principales

---

### FASE 5: Configuración SSL/HTTPS 🔒

Una vez que tengas un dominio configurado:

#### 5.1. Actualizar DNS

Apunta tu dominio al servidor:
```
Tipo A: tudominio.com → [IP_DEL_SERVIDOR]
Tipo A: www.tudominio.com → [IP_DEL_SERVIDOR]
```

#### 5.2. Instalar certificado SSL

```bash
# Conectar al servidor
ssh inmova-deployment

# Instalar certificado con Certbot
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

#### 5.3. Actualizar variables de entorno

```bash
# Editar .env en el servidor
nano /var/www/inmova/.env

# Actualizar URLs con HTTPS
NEXTAUTH_URL=https://tudominio.com
NEXT_PUBLIC_BASE_URL=https://tudominio.com

# Reiniciar aplicación
pm2 restart inmova-production
```

---

## 🔧 Comandos Útiles Post-Migración

### Gestión de PM2

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs inmova-production --lines 100 --raw

# Reiniciar aplicación
pm2 restart inmova-production

# Recargar sin downtime
pm2 reload inmova-production

# Ver monitoreo
pm2 monit

# Ver información detallada
pm2 show inmova-production
```

### Gestión de Nginx

```bash
# Ver estado
systemctl status nginx

# Reiniciar
systemctl restart nginx

# Recargar configuración
systemctl reload nginx

# Test de configuración
nginx -t

# Ver logs
tail -f /var/log/nginx/inmova_access.log
tail -f /var/log/nginx/inmova_error.log
```

### Gestión de Base de Datos

```bash
# Conectar a PostgreSQL
sudo -u postgres psql -d inmova_production

# Backup manual
pg_dump inmova_production > backup_$(date +%Y%m%d).sql

# Ver tamaño de base de datos
sudo -u postgres psql -d inmova_production -c "
  SELECT pg_size_pretty(pg_database_size('inmova_production'));"

# Ver conexiones activas
sudo -u postgres psql -d inmova_production -c "
  SELECT count(*) FROM pg_stat_activity;"
```

### Monitoreo del Sistema

```bash
# Uso de CPU y RAM
htop

# Espacio en disco
df -h

# Uso de memoria
free -m

# Procesos de Node.js
ps aux | grep node

# Puertos en uso
netstat -tlnp | grep -E '(80|443|3000|5432)'
```

---

## 🔄 Actualización de la Aplicación

Para actualizar el código en el servidor:

```bash
# En tu máquina local

# 1. Hacer commit de los cambios
git add .
git commit -m "Actualización de features"
git push

# 2. Conectar al servidor
ssh inmova-deployment

# 3. Navegar al directorio
cd /var/www/inmova

# 4. Hacer backup antes de actualizar
./scripts/backup-pre-migracion.sh

# 5. Actualizar código
git pull origin main  # o la rama correspondiente

# 6. Instalar nuevas dependencias
yarn install

# 7. Ejecutar migraciones si hay cambios en DB
yarn prisma migrate deploy

# 8. Rebuild
yarn build

# 9. Reiniciar aplicación
pm2 restart inmova-production

# 10. Verificar
pm2 logs inmova-production
```

---

## 🆘 Troubleshooting

### Problema: La aplicación no inicia

```bash
# Ver logs de PM2
pm2 logs inmova-production --err

# Ver logs del sistema
journalctl -u inmova -n 50

# Verificar variables de entorno
cd /var/www/inmova
cat .env | grep -v "PASSWORD\|SECRET\|KEY"

# Reiniciar con logs verbosos
pm2 delete inmova-production
NODE_ENV=production yarn start
```

### Problema: Error de base de datos

```bash
# Verificar que PostgreSQL está corriendo
systemctl status postgresql

# Verificar conexión
sudo -u postgres psql -d inmova_production -c "\dt"

# Regenerar Prisma Client
cd /var/www/inmova
yarn prisma generate
yarn prisma migrate deploy

# Reiniciar
pm2 restart inmova-production
```

### Problema: Error 502 Bad Gateway en Nginx

```bash
# Verificar que la app está corriendo
pm2 status

# Verificar puerto 3000
netstat -tlnp | grep 3000

# Ver logs de Nginx
tail -f /var/log/nginx/inmova_error.log

# Test configuración de Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### Problema: Disco lleno

```bash
# Ver uso de disco
df -h

# Limpiar logs antiguos
find /var/log -type f -name "*.log" -mtime +30 -delete

# Limpiar PM2 logs
pm2 flush

# Limpiar builds antiguos de Next.js
cd /var/www/inmova
rm -rf .next/cache

# Ver directorios grandes
du -h /var/www/inmova | sort -rh | head -20
```

---

## 📊 Monitoreo y Mantenimiento

### Backups Automáticos

Configurar cron job para backups diarios:

```bash
# Editar crontab
crontab -e

# Agregar backup diario a las 2 AM
0 2 * * * cd /var/www/inmova && ./scripts/backup-pre-migracion.sh >> /var/log/inmova/backup.log 2>&1
```

### Monitoreo de Recursos

Usar herramientas como:
- **Netdata**: Monitoreo en tiempo real
- **Grafana + Prometheus**: Métricas avanzadas
- **PM2 Plus**: Monitoreo de aplicación Node.js

### Actualizaciones de Seguridad

```bash
# Actualizar sistema regularmente
apt-get update
apt-get upgrade -y

# Actualizar dependencias de Node.js
cd /var/www/inmova
yarn upgrade-interactive

# Verificar vulnerabilidades
yarn audit
yarn audit fix
```

---

## 📞 Contacto y Soporte

### En caso de problemas:

1. **Verificar logs**:
   - PM2: `pm2 logs inmova-production`
   - Nginx: `/var/log/nginx/inmova_error.log`
   - Sistema: `journalctl -xe`

2. **Ejecutar verificación**:
   ```bash
   ./scripts/verificacion-post-migracion.sh
   ```

3. **Revisar documentación**:
   - Esta guía
   - Logs de migración en `backups/`
   - Configuración en `/var/www/inmova/`

---

## ✅ Checklist Final

### Pre-Migración
- [ ] Backup completo realizado
- [ ] Variables de entorno configuradas
- [ ] Clave SSH probada
- [ ] IP del servidor confirmada

### Durante Migración
- [ ] Script de migración ejecutado sin errores
- [ ] Todos los servicios instalados
- [ ] Aplicación compilada correctamente
- [ ] PM2 configurado y corriendo

### Post-Migración
- [ ] Script de verificación pasado
- [ ] Aplicación accesible desde navegador
- [ ] Login funcionando
- [ ] Base de datos operativa
- [ ] Logs sin errores críticos
- [ ] SSL configurado (si aplica)
- [ ] DNS configurado (si aplica)
- [ ] Backups automáticos configurados
- [ ] Monitoreo activo

---

## 🎉 ¡Migración Completada!

Si has llegado hasta aquí y todos los checks están ✅, **¡felicitaciones!** 

Tu aplicación INMOVA está ahora corriendo en el servidor de producción `inmova-deployment`.

---

**Última actualización:** 26 de Diciembre, 2025  
**Versión:** 1.0  
**Plataforma:** INMOVA - Sistema de Gestión Inmobiliaria  
**Servidor:** inmova-deployment
