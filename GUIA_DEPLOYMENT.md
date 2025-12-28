# 🚀 GUÍA RÁPIDA DE DEPLOYMENT - INMOVA

## 📋 OPCIONES DE DEPLOYMENT

### ✨ OPCIÓN 1: RAILWAY (Recomendado - Más Fácil)

Railway proporciona PostgreSQL automáticamente y hace el deployment con un solo comando.

**Pasos:**

1. **Instalar Railway CLI:**

   ```bash
   npm install -g @railway/cli
   ```

2. **Login en Railway:**

   ```bash
   railway login
   ```

3. **Vincular proyecto:**

   ```bash
   railway link
   ```

4. **Agregar PostgreSQL:**

   ```bash
   railway add --service postgres
   ```

5. **Deploy:**

   ```bash
   railway up
   ```

6. **Ejecutar migraciones:**
   ```bash
   railway run npx prisma migrate deploy
   ```

✅ **¡Listo!** Railway configura todo automáticamente.

---

### 🔷 OPCIÓN 2: VERCEL + BASE DE DATOS EXTERNA

**Pasos:**

1. **Configurar PostgreSQL externo** (elige uno):
   - **Supabase:** https://supabase.com (Gratis)
   - **Neon:** https://neon.tech (Gratis)
   - **Railway DB:** https://railway.app (Solo BD)
   - **ElephantSQL:** https://www.elephantsql.com

2. **Obtener DATABASE_URL** de tu proveedor

3. **Instalar Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

4. **Configurar variables de entorno en Vercel:**

   ```bash
   vercel env add DATABASE_URL
   # Pegar tu DATABASE_URL cuando te lo pida

   vercel env add NEXTAUTH_SECRET
   # Pegar: l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=

   vercel env add NEXTAUTH_URL
   # Pegar: https://www.inmova.app
   ```

5. **Deploy:**

   ```bash
   vercel --prod
   ```

6. **Ejecutar migraciones:**
   ```bash
   # Localmente con DATABASE_URL configurado
   DATABASE_URL="tu_database_url" npx prisma migrate deploy
   ```

---

### 🐳 OPCIÓN 3: DOCKER EN SERVIDOR PROPIO

**Requisitos:**

- Servidor con Docker y Docker Compose
- Acceso SSH al servidor

**Pasos:**

1. **En tu servidor, instalar Docker:**

   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt-get install docker-compose-plugin
   ```

2. **Copiar archivos al servidor:**

   ```bash
   # En tu máquina local
   scp -r /workspace usuario@tu-servidor:/opt/inmova
   ```

3. **En el servidor, configurar .env:**

   ```bash
   cd /opt/inmova
   cp .env.example .env
   nano .env
   # Configurar DATABASE_URL y otras variables
   ```

4. **Iniciar con Docker Compose:**

   ```bash
   docker-compose up -d
   ```

5. **Ejecutar migraciones:**

   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

6. **Verificar:**
   ```bash
   docker-compose logs -f app
   ```

---

### 💻 OPCIÓN 4: DEPLOYMENT MANUAL (PM2)

**Requisitos:**

- Servidor con Node.js 18+
- PostgreSQL instalado o accesible

**Pasos:**

1. **Configurar .env:**

   ```bash
   nano .env
   # Configurar todas las variables, especialmente DATABASE_URL
   ```

2. **Ejecutar script de deployment:**

   ```bash
   ./deploy.sh
   ```

3. **Instalar PM2:**

   ```bash
   npm install -g pm2
   ```

4. **Iniciar aplicación:**

   ```bash
   pm2 start npm --name "inmova" -- start
   pm2 save
   pm2 startup
   ```

5. **Configurar NGINX:**

   ```nginx
   server {
       listen 80;
       server_name www.inmova.app;

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

6. **Configurar SSL con Certbot:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d www.inmova.app
   ```

---

## 🗄️ CONFIGURACIÓN DE BASE DE DATOS

### Crear Base de Datos PostgreSQL

Si usas PostgreSQL externo, necesitas crear la base de datos:

```sql
CREATE DATABASE inmova;
CREATE USER inmova WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE inmova TO inmova;
```

### Formato de DATABASE_URL

```
postgresql://[usuario]:[password]@[host]:[puerto]/[database]?schema=public
```

**Ejemplo:**

```
DATABASE_URL=postgresql://inmova:mipassword@db.example.com:5432/inmova?schema=public
```

---

## ⚙️ VARIABLES DE ENTORNO ESENCIALES

Estas variables **DEBEN** estar configuradas:

```bash
# Base de datos (OBLIGATORIO)
DATABASE_URL=postgresql://...

# Autenticación (OBLIGATORIO)
NEXTAUTH_SECRET=l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=
NEXTAUTH_URL=https://www.inmova.app

# Encryption (OBLIGATORIO)
ENCRYPTION_KEY=e2dd0f8a254cc6aee7b93f45329363b9

# Entorno
NODE_ENV=production
```

---

## 🔍 VERIFICACIÓN POST-DEPLOYMENT

Después del deployment, verifica:

1. **Health Check:**

   ```bash
   curl https://www.inmova.app/api/health
   ```

2. **Logs:**

   ```bash
   # Railway
   railway logs

   # Vercel
   vercel logs

   # Docker
   docker-compose logs -f

   # PM2
   pm2 logs inmova
   ```

3. **Base de datos:**
   ```bash
   npx prisma studio
   ```

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Prisma Client did not initialize"

```bash
npx prisma generate
npm run build
```

### Error: "Can't reach database server"

- Verifica DATABASE_URL
- Verifica que PostgreSQL está corriendo
- Verifica firewall/security groups

### Error: "Module not found"

```bash
rm -rf node_modules .next
npm install
npm run build
```

---

## 📊 MONITOREO

**Herramientas recomendadas:**

- **Logs:** Winston (ya configurado)
- **APM:** Sentry (configurar SENTRY_DSN)
- **Uptime:** UptimeRobot o Pingdom
- **Analytics:** Vercel Analytics o Google Analytics

---

## 🔐 SEGURIDAD POST-DEPLOYMENT

✅ Configurar certificado SSL (HTTPS)
✅ Configurar firewall (solo puertos 80, 443, 22)
✅ Configurar backups de base de datos
✅ Habilitar logs de auditoría
✅ Configurar rate limiting en NGINX/Cloudflare
✅ Actualizar secrets en producción

---

## 📞 SOPORTE

Si tienes problemas:

1. Lee los documentos de auditoría generados
2. Revisa logs de la aplicación
3. Verifica configuración de .env
4. Consulta DEPLOYMENT.md para más detalles

---

**¡Tu aplicación está lista para producción! 🎉**
