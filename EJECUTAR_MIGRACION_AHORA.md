# 🚀 EJECUTAR MIGRACIÓN AHORA - Servidor 157.180.119.236

## 📋 Información del Servidor

```
IP:          157.180.119.236
Servidor:    inmova-deployment
Fingerprint: 55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78
Clave:       hhk8JqPEpJ3C
```

---

## ⚠️ IMPORTANTE: Completar Variables de Entorno

El archivo `.env.production` ha sido creado pero necesitas **completar las variables críticas**.

### 1️⃣ Generar Claves de Seguridad

Ejecuta estos comandos para generar las claves necesarias:

```bash
# NEXTAUTH_SECRET
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# ENCRYPTION_KEY
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)"

# MFA_ENCRYPTION_KEY
echo "MFA_ENCRYPTION_KEY=$(openssl rand -base64 32)"

# CRON_SECRET
echo "CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"

# VAPID Keys (copia AMBAS claves)
npx web-push generate-vapid-keys
```

### 2️⃣ Editar .env.production

```bash
nano .env.production
```

**Reemplaza TODAS las líneas que tienen `[CAMBIAR...]` con:**
- Las claves generadas arriba
- Tus credenciales de AWS S3
- Tus claves de Stripe PRODUCCIÓN (sk_live_..., pk_live_...)
- Email de SendGrid (si lo usas)

**Verifica que NO queden placeholders:**
```bash
grep "\[CAMBIAR" .env.production
# Este comando NO debe devolver nada
```

---

## 🚀 PASOS DE MIGRACIÓN

### PASO 1: Verificar Preparación ✅

```bash
export SERVER_IP="157.180.119.236"
./scripts/check-pre-migracion.sh
```

**Debe pasar TODOS los checks.** Si hay errores, corrígelos antes de continuar.

---

### PASO 2: Configurar Clave SSH 🔐

**Si aún no tienes la clave SSH configurada:**

```bash
# Crear directorio SSH si no existe
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# La clave SSH debe estar en este archivo:
# ~/.ssh/inmova_deployment_key

# Configurar permisos correctos
chmod 600 ~/.ssh/inmova_deployment_key

# Probar conexión (el fingerprint debe coincidir)
ssh -i ~/.ssh/inmova_deployment_key root@157.180.119.236
```

**Fingerprint esperado:** `55:0e:12:f9:8f:a3:b0:4b:04:7e:fe:de:00:3f:53:78`

---

### PASO 3: Crear Backup 💾

```bash
./scripts/backup-pre-migracion.sh
```

Esto creará un backup completo en `backups/migracion_[FECHA]/`

---

### PASO 4: Ejecutar Migración 🚀

```bash
export SERVER_IP="157.180.119.236"
./scripts/migracion-servidor.sh
```

**Este script ejecutará 12 pasos automáticamente:**
1. Verificar SSH
2. Instalar dependencias (Node.js, PostgreSQL, Nginx, Redis, PM2)
3. Crear directorios
4. Transferir archivos
5. Configurar .env
6. Instalar dependencias Node
7. Configurar PostgreSQL
8. Ejecutar migraciones Prisma
9. Compilar aplicación
10. Configurar PM2
11. Configurar Nginx
12. Configurar firewall

**Tiempo estimado: 15-30 minutos**

---

### PASO 5: Verificar Instalación ✅

```bash
export SERVER_IP="157.180.119.236"
./scripts/verificacion-post-migracion.sh
```

Este script verificará:
- ✅ Servicios activos
- ✅ Aplicación funcionando
- ✅ Base de datos operativa
- ✅ HTTP respondiendo
- ✅ Logs sin errores

---

## 🌐 Acceder a la Aplicación

Una vez completada la migración:

**URL:** http://157.180.119.236

Abre en tu navegador y verifica que:
- ✅ La página carga correctamente
- ✅ Puedes hacer login
- ✅ Las funcionalidades principales funcionan

---

## 🔧 Comandos Post-Migración

### Conectar al servidor

```bash
ssh -i ~/.ssh/inmova_deployment_key root@157.180.119.236
```

O si configuraste el alias:
```bash
ssh inmova-deployment
```

### Ver estado de la aplicación

```bash
# Estado de PM2
ssh inmova-deployment "pm2 status"

# Ver logs
ssh inmova-deployment "pm2 logs inmova-production"

# Reiniciar aplicación
ssh inmova-deployment "pm2 restart inmova-production"
```

### Ver logs en tiempo real

```bash
# Logs de la aplicación
ssh inmova-deployment "pm2 logs inmova-production --lines 100"

# Logs de Nginx
ssh inmova-deployment "tail -f /var/log/nginx/inmova_access.log"
```

---

## 📋 Checklist de Verificación

### Antes de Migrar
- [ ] `.env.production` completado (sin [CAMBIAR...])
- [ ] Claves de seguridad generadas
- [ ] Credenciales AWS y Stripe configuradas
- [ ] Clave SSH en `~/.ssh/inmova_deployment_key` con permisos 600
- [ ] Script `check-pre-migracion.sh` pasó todos los checks

### Durante Migración
- [ ] Script ejecutado sin errores
- [ ] Los 12 pasos completados exitosamente

### Después de Migrar
- [ ] Script `verificacion-post-migracion.sh` pasó
- [ ] Aplicación accesible en http://157.180.119.236
- [ ] Login funcionando
- [ ] PM2 activo: `pm2 status` muestra online

---

## 🆘 Si Algo Falla

### Error: No puedo conectar por SSH

```bash
# Verificar permisos de la clave
chmod 600 ~/.ssh/inmova_deployment_key

# Test de conexión detallado
ssh -v -i ~/.ssh/inmova_deployment_key root@157.180.119.236
```

### Error: Variables no configuradas

```bash
# Verificar que no quedan placeholders
grep "\[CAMBIAR" .env.production

# Si hay resultados, edita el archivo:
nano .env.production
```

### Error: Script falla durante migración

```bash
# Los scripts son idempotentes, puedes ejecutarlos de nuevo
export SERVER_IP="157.180.119.236"
./scripts/migracion-servidor.sh
```

### Error: Aplicación no responde

```bash
# Ver logs
ssh inmova-deployment "pm2 logs inmova-production --lines 50"

# Reiniciar
ssh inmova-deployment "pm2 restart inmova-production"
```

---

## 🎯 Próximos Pasos (Después de Migrar)

### 1. Configurar Dominio (Opcional)

Si tienes un dominio, configura el DNS:
```
A    tudominio.com     → 157.180.119.236
A    www.tudominio.com → 157.180.119.236
```

### 2. Instalar SSL (Después de configurar dominio)

```bash
ssh inmova-deployment

# Instalar certificado
sudo certbot --nginx -d tudominio.com -d www.tudominio.com

# Actualizar .env
nano /var/www/inmova/.env
# Cambiar a HTTPS:
# NEXTAUTH_URL=https://tudominio.com
# NEXT_PUBLIC_BASE_URL=https://tudominio.com

# Reiniciar
pm2 restart inmova-production
```

### 3. Configurar Backups Automáticos

```bash
ssh inmova-deployment

# Agregar cron para backups diarios
crontab -e

# Agregar esta línea (backup a las 2 AM):
0 2 * * * cd /var/www/inmova && ./scripts/backup-pre-migracion.sh >> /var/log/inmova/backup.log 2>&1
```

---

## ✅ ¡TODO LISTO!

**Comienza con el PASO 1: Verificar Preparación**

```bash
export SERVER_IP="157.180.119.236"
./scripts/check-pre-migracion.sh
```

---

**Servidor:** 157.180.119.236  
**Fecha:** 26/12/2025  
**Estado:** ✅ LISTO PARA MIGRAR
