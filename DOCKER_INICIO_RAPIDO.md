# 🚀 INICIO RÁPIDO - DEPLOYMENT CON DOCKER

## ⚡ OPCIÓN 1: SI EL SERVIDOR ES ESTA MÁQUINA (Deployment local)

```bash
# 1. Configurar .env
cp .env.docker .env
nano .env
# Cambiar POSTGRES_PASSWORD y dominios

# 2. Ejecutar deployment
chmod +x docker-deploy.sh
./docker-deploy.sh

# 3. Acceder a la aplicación
# http://localhost:3000
```

**¡Listo en 5 minutos!**

---

## 🌐 OPCIÓN 2: SI TIENES UN SERVIDOR REMOTO

### Paso 1: Copiar archivos al servidor

```bash
# Método A: Usar el script automático
chmod +x copiar-a-servidor.sh
./copiar-a-servidor.sh

# Método B: Copiar manualmente con rsync
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  ./ usuario@tu-servidor:/opt/inmova/

# Método C: Usar Git (si el proyecto está en repositorio)
ssh usuario@tu-servidor
cd /opt
git clone tu-repositorio inmova
```

### Paso 2: Conectar al servidor

```bash
ssh usuario@tu-servidor
cd /opt/inmova
```

### Paso 3: Instalar Docker (si no está instalado)

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verificar instalación
docker --version
docker compose version
```

### Paso 4: Configurar variables de entorno

```bash
cp .env.docker .env
nano .env
```

**CAMBIAR OBLIGATORIAMENTE:**

```bash
# 1. Contraseña de PostgreSQL (¡MUY IMPORTANTE!)
POSTGRES_PASSWORD=TU_PASSWORD_SUPER_SEGURO_2024

# 2. Tu dominio o IP
NEXTAUTH_URL=https://www.inmova.app
NEXT_PUBLIC_BASE_URL=https://www.inmova.app

# 3. (Opcional) Cambiar usuario/base de datos
POSTGRES_USER=inmova
POSTGRES_DB=inmova
```

### Paso 5: Ejecutar deployment

```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

El script automáticamente:

- ✅ Verifica requisitos
- ✅ Construye las imágenes Docker
- ✅ Inicia PostgreSQL y la aplicación
- ✅ Ejecuta las migraciones
- ✅ Verifica que todo funcione

### Paso 6: Verificar que funciona

```bash
# Ver logs
docker-compose logs -f app

# Verificar estado
docker-compose ps

# Probar la aplicación
curl http://localhost:3000/api/health
```

**Aplicación disponible en: http://localhost:3000**

---

## 🌐 CONFIGURAR ACCESO EXTERNO (NGINX + SSL)

### Paso 1: Instalar NGINX

```bash
sudo apt-get update
sudo apt-get install nginx
```

### Paso 2: Configurar NGINX

```bash
sudo nano /etc/nginx/sites-available/inmova
```

Pegar:

```nginx
server {
    listen 80;
    server_name www.inmova.app inmova.app;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar:

```bash
sudo ln -s /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 3: Configurar SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d www.inmova.app -d inmova.app

# Renovación automática ya configurada
```

### Paso 4: Configurar DNS

En tu proveedor de DNS (Cloudflare, GoDaddy, etc.):

```
Tipo: A
Nombre: @
Valor: [IP de tu servidor]

Tipo: A
Nombre: www
Valor: [IP de tu servidor]
```

---

## 📊 COMANDOS ÚTILES

### Ver logs

```bash
# Logs en tiempo real
docker-compose logs -f app

# Últimas 100 líneas
docker-compose logs --tail=100 app

# Logs de PostgreSQL
docker-compose logs -f postgres
```

### Gestión de servicios

```bash
# Ver estado
docker-compose ps

# Reiniciar
docker-compose restart

# Detener
docker-compose stop

# Iniciar
docker-compose start

# Detener y eliminar (mantiene datos)
docker-compose down
```

### Backup de base de datos

```bash
# Crear backup
docker-compose exec postgres pg_dump -U inmova inmova > backup.sql

# Restaurar backup
cat backup.sql | docker-compose exec -T postgres psql -U inmova inmova
```

### Actualizar aplicación

```bash
# 1. Hacer backup
docker-compose exec postgres pg_dump -U inmova inmova > backup.sql

# 2. Actualizar código
git pull  # o copiar nuevos archivos

# 3. Reconstruir y reiniciar
docker-compose down
docker-compose build
docker-compose up -d

# 4. Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy
```

---

## 🆘 SOLUCIÓN RÁPIDA DE PROBLEMAS

### La aplicación no inicia

```bash
# Ver qué pasó
docker-compose logs app

# Reiniciar todo
docker-compose restart
```

### Error de conexión a base de datos

```bash
# Verificar PostgreSQL
docker-compose ps postgres
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Puerto 3000 ya está en uso

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3000

# Cambiar puerto en docker-compose.yml
# Buscar: "3000:3000"
# Cambiar a: "8080:3000"  # Ahora será http://localhost:8080
```

### Limpiar todo y empezar de cero

```bash
# ⚠️ CUIDADO: Esto borra TODO

# Hacer backup primero
docker-compose exec postgres pg_dump -U inmova inmova > backup.sql

# Limpiar
docker-compose down -v
docker system prune -a

# Volver a iniciar
./docker-deploy.sh
```

---

## ✅ CHECKLIST COMPLETO

### Antes del deployment

- [ ] Docker y Docker Compose instalados
- [ ] Archivos copiados al servidor
- [ ] `.env` configurado (POSTGRES_PASSWORD cambiado)
- [ ] Puertos 80, 443, 3000 disponibles

### Durante el deployment

- [ ] `./docker-deploy.sh` ejecutado sin errores
- [ ] Contenedores corriendo (`docker-compose ps`)
- [ ] Logs sin errores (`docker-compose logs`)
- [ ] Aplicación responde en http://localhost:3000

### Post-deployment

- [ ] NGINX instalado y configurado
- [ ] SSL configurado con Let's Encrypt
- [ ] DNS apuntando al servidor
- [ ] Firewall configurado
- [ ] Backups automáticos configurados

---

## 📞 ¿NECESITAS AYUDA?

1. **Ver logs detallados:**

   ```bash
   docker-compose logs -f
   ```

2. **Verificar configuración:**

   ```bash
   cat .env
   docker-compose config
   ```

3. **Consultar guía completa:**
   ```bash
   cat GUIA_DOCKER_COMPLETA.md
   ```

---

## 🎉 ¡ÉXITO!

Si todo funcionó, tu aplicación INMOVA está corriendo en Docker y lista para producción.

**Próximos pasos opcionales:**

- Configurar monitoreo (Portainer, Grafana)
- Configurar backups automáticos
- Configurar alertas
- Optimizar performance

**¡Felicitaciones por el deployment!** 🚀
