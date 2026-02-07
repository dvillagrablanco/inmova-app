# 🔐 Información del Servidor

**ESTE ARCHIVO NO SE SUBE A GIT** (está en .gitignore)

---

## 📍 Datos de Acceso

**IP del Servidor**: 157.180.119.236  
**Usuario**: root  
**Password**: XVcL9qHxqA7f  
**OS**: Ubuntu

---

## 🚀 Deployment

### Opción 1: Deployment Automático (Recomendado)

```bash
bash quick-deploy.sh
```

**Tiempo**: 10-15 minutos  
**Requiere**: sshpass instalado

### Opción 2: Deployment Manual

```bash
ssh root@157.180.119.236
# Password: XVcL9qHxqA7f

# Seguir instrucciones de DEPLOYMENT_INSTRUCTIONS.md
```

---

## 🌐 URLs

**Después del deployment:**

### Local (IP directa)

- **Aplicación**: http://157.180.119.236:3000
- **Health Check**: http://157.180.119.236:3000/api/health

### Público (con dominio)

- **Aplicación**: https://inmovaapp.com
- **WWW**: https://www.inmovaapp.com
- **Health Check**: https://inmovaapp.com/api/health
- **API Version**: https://inmovaapp.com/api/version

---

## ⚠️ IMPORTANTE: Cambiar Password

```bash
ssh root@157.180.119.236
passwd
# Ingresar nuevo password
```

---

## 🔧 Comandos Útiles

### Conectar al servidor

```bash
ssh root@157.180.119.236
```

### Ver logs de la aplicación

```bash
ssh root@157.180.119.236
cd /home/deploy/inmova-app
docker-compose -f docker-compose.production.yml logs -f app
```

### Restart aplicación

```bash
ssh root@157.180.119.236
cd /home/deploy/inmova-app
docker-compose -f docker-compose.production.yml restart app
```

### Ver estado de containers

```bash
ssh root@157.180.119.236
cd /home/deploy/inmova-app
docker-compose -f docker-compose.production.yml ps
```

### Actualizar código

```bash
ssh root@157.180.119.236
cd /home/deploy/inmova-app
git pull origin main
bash deploy.sh
```

---

## 📊 Recursos del Servidor

Para verificar recursos:

```bash
ssh root@157.180.119.236

# Ver uso de recursos
htop

# Ver disk space
df -h

# Ver memoria
free -h

# Ver docker stats
docker stats
```

---

## 🐛 Troubleshooting

### App no responde

```bash
ssh root@157.180.119.236
cd /home/deploy/inmova-app

# Ver logs
docker-compose logs -f app

# Restart containers
docker-compose restart

# Rebuild
docker-compose down
docker-compose up -d --build
```

### Base de datos no conecta

```bash
# Verificar PostgreSQL
docker-compose logs postgres

# Verificar .env.production
cat .env.production | grep DATABASE_URL
```

---

## 🔐 Configurar SSL (Opcional)

Si tienes un dominio:

1. Configurar DNS:

   ```
   A record: tudominio.com → 157.180.119.236
   ```

2. Ejecutar certbot:

   ```bash
   ssh root@157.180.119.236
   certbot --nginx -d tudominio.com -d www.tudominio.com
   ```

3. Actualizar .env.production:

   ```bash
   NEXTAUTH_URL=https://tudominio.com
   NEXT_PUBLIC_BASE_URL=https://tudominio.com
   ```

4. Restart:
   ```bash
   cd /home/deploy/inmova-app
   docker-compose restart app
   ```

---

**Fecha**: 29 de diciembre de 2025
