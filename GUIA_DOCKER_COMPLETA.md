# 🐳 GUÍA COMPLETA DE DEPLOYMENT CON DOCKER

## 📋 REQUISITOS DEL SERVIDOR

### Hardware Mínimo

- **RAM:** 2GB mínimo (4GB recomendado)
- **CPU:** 2 cores mínimo
- **Disco:** 20GB mínimo (50GB recomendado)
- **SO:** Ubuntu 20.04+ / Debian 11+ / CentOS 8+

### Software

- Docker 20.10+
- Docker Compose 2.0+
- Git (para clonar el repositorio)

---

## 🚀 OPCIÓN 1: DEPLOYMENT AUTOMÁTICO (Recomendado)

### Paso 1: Copiar archivos al servidor

```bash
# En tu máquina local
scp -r /workspace usuario@tu-servidor-ip:/opt/inmova

# O si usas Git
ssh usuario@tu-servidor-ip
cd /opt
git clone tu-repositorio inmova
cd inmova
```

### Paso 2: Configurar variables de entorno

```bash
cd /opt/inmova
cp .env.docker .env
nano .env
```

**Cambiar OBLIGATORIAMENTE:**

```bash
# Cambia esto por una contraseña segura
POSTGRES_PASSWORD=TU_PASSWORD_SEGURO_AQUI

# Cambia esto por tu dominio o IP
NEXTAUTH_URL=https://www.inmova.app
NEXT_PUBLIC_BASE_URL=https://www.inmova.app
```

### Paso 3: Ejecutar deployment

```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

**¡Listo!** La aplicación estará corriendo en http://localhost:3000

---

## 🛠️ OPCIÓN 2: DEPLOYMENT MANUAL

### Paso 1: Instalar Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Agregar tu usuario al grupo docker (opcional)
sudo usermod -aG docker $USER
newgrp docker
```

### Paso 2: Preparar proyecto

```bash
cd /opt/inmova

# Copiar y configurar .env
cp .env.docker .env
nano .env

# Cambiar:
# - POSTGRES_PASSWORD
# - NEXTAUTH_URL
# - NEXT_PUBLIC_BASE_URL
```

### Paso 3: Iniciar servicios

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Esperar que PostgreSQL esté listo
sleep 10

# Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# Ver logs
docker-compose logs -f
```

---

## 🌐 CONFIGURAR NGINX COMO PROXY REVERSO

### Paso 1: Instalar NGINX

```bash
sudo apt-get update
sudo apt-get install nginx
```

### Paso 2: Crear configuración

```bash
sudo nano /etc/nginx/sites-available/inmova
```

Pegar esta configuración:

```nginx
server {
    listen 80;
    server_name www.inmova.app inmova.app;

    # Límites de tamaño de archivo
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
```

### Paso 3: Activar configuración

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar NGINX
sudo systemctl restart nginx
```

---

## 🔒 CONFIGURAR SSL CON LET'S ENCRYPT

### Paso 1: Instalar Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx
```

### Paso 2: Obtener certificado

```bash
sudo certbot --nginx -d www.inmova.app -d inmova.app
```

### Paso 3: Configurar renovación automática

```bash
# Verificar renovación automática
sudo certbot renew --dry-run

# Certbot renovará automáticamente cada 90 días
```

---

## 📊 MONITOREO Y MANTENIMIENTO

### Ver logs en tiempo real

```bash
# Logs de la aplicación
docker-compose logs -f app

# Logs de PostgreSQL
docker-compose logs -f postgres

# Logs de todos los servicios
docker-compose logs -f
```

### Ver estado de contenedores

```bash
docker-compose ps
```

### Reiniciar servicios

```bash
# Reiniciar todo
docker-compose restart

# Reiniciar solo la app
docker-compose restart app

# Reiniciar solo PostgreSQL
docker-compose restart postgres
```

### Detener servicios

```bash
# Detener (mantiene datos)
docker-compose stop

# Detener y eliminar contenedores (mantiene volúmenes)
docker-compose down

# Detener y eliminar TODO (incluyendo datos)
docker-compose down -v  # ⚠️ CUIDADO: Borra la base de datos
```

---

## 💾 BACKUPS

### Backup de base de datos

```bash
# Backup completo
docker-compose exec postgres pg_dump -U inmova inmova > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup comprimido
docker-compose exec postgres pg_dump -U inmova inmova | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restaurar backup

```bash
# Desde archivo SQL
cat backup.sql | docker-compose exec -T postgres psql -U inmova inmova

# Desde archivo comprimido
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U inmova inmova
```

### Script de backup automático

Crear `/opt/inmova/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/inmova/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cd /opt/inmova

docker-compose exec -T postgres pg_dump -U inmova inmova | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completado: backup_$DATE.sql.gz"
```

Configurar cron para backups automáticos:

```bash
chmod +x /opt/inmova/backup.sh

# Editar crontab
crontab -e

# Agregar línea (backup diario a las 2 AM)
0 2 * * * /opt/inmova/backup.sh >> /var/log/inmova-backup.log 2>&1
```

---

## 🔧 ACTUALIZAR LA APLICACIÓN

```bash
cd /opt/inmova

# Hacer backup antes de actualizar
./backup.sh

# Detener servicios
docker-compose down

# Actualizar código
git pull origin main
# O copiar nuevos archivos

# Reconstruir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ejecutar nuevas migraciones (si las hay)
docker-compose exec app npx prisma migrate deploy

# Ver logs
docker-compose logs -f app
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs app

# Ver estado
docker-compose ps

# Reconstruir imagen
docker-compose build --no-cache app
docker-compose up -d
```

### Error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Error "Prisma Client did not initialize"

```bash
# Regenerar Prisma Client dentro del contenedor
docker-compose exec app npx prisma generate
docker-compose restart app
```

### Limpiar todo y empezar de cero

```bash
# ⚠️ CUIDADO: Esto borra TODO incluyendo la base de datos

# Backup primero
./backup.sh

# Detener y eliminar todo
docker-compose down -v

# Limpiar imágenes
docker system prune -a

# Volver a construir
docker-compose build
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
```

---

## 📈 OPTIMIZACIÓN Y PERFORMANCE

### Limitar recursos de contenedores

Editar `docker-compose.yml`:

```yaml
services:
  app:
    # ... resto de configuración
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Configurar logs rotation

```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

---

## 🔐 SEGURIDAD

### Firewall (UFW)

```bash
# Instalar UFW
sudo apt-get install ufw

# Configurar reglas
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activar
sudo ufw enable

# Ver estado
sudo ufw status
```

### Cambiar contraseñas por defecto

Editar `.env`:

```bash
# CAMBIAR ESTAS CONTRASEÑAS
POSTGRES_PASSWORD=tu_password_muy_seguro_aqui
NEXTAUTH_SECRET=generar_nuevo_con_openssl_rand_base64_32
ENCRYPTION_KEY=generar_nuevo_con_openssl_rand_hex_32
```

### Configurar fail2ban

```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 📊 MONITOREO CON PORTAINER (Opcional)

```bash
docker volume create portainer_data

docker run -d \
  -p 9000:9000 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Acceder a: http://tu-servidor-ip:9000

---

## ✅ CHECKLIST POST-DEPLOYMENT

- [ ] Aplicación accesible en http://localhost:3000
- [ ] PostgreSQL corriendo correctamente
- [ ] Migraciones ejecutadas exitosamente
- [ ] NGINX configurado como proxy reverso
- [ ] SSL/HTTPS configurado con Let's Encrypt
- [ ] DNS apuntando al servidor
- [ ] Backups automáticos configurados
- [ ] Firewall configurado
- [ ] Contraseñas por defecto cambiadas
- [ ] Monitoreo configurado
- [ ] Logs rotation configurado

---

## 📞 SOPORTE

Si tienes problemas:

1. Revisar logs: `docker-compose logs -f`
2. Verificar estado: `docker-compose ps`
3. Consultar esta guía
4. Revisar DEPLOYMENT_READY.md

---

**¡Tu aplicación está lista para producción con Docker!** 🐳🚀
