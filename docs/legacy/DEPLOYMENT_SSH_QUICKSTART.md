# 🚀 DEPLOYMENT SSH - QUICK START

## ⚡ EJECUCIÓN RÁPIDA

### Opción 1: Python Script (Recomendado)

```bash
cd /workspace
python3 scripts/deploy-ssh-paramiko.py
```

### Opción 2: Deployment Manual

```bash
# Conectar al servidor
ssh root@157.180.119.236
# Password: xcc9brgkMMbf

# Ejecutar comandos de deployment
cd /opt/inmova-app
./scripts/server-deploy.sh
```

---

## 📋 LO QUE HACE EL SCRIPT

### 1. Pre-deployment Checks ✅

- Verifica Node.js
- Verifica npm
- Verifica PostgreSQL
- Instala PM2 si no existe

### 2. Backup Automático 💾

- Crea backup de PostgreSQL
- Guarda en `/var/backups/inmova/`
- Mantiene últimos 5 backups

### 3. Actualiza Código 📥

- Git pull (o clona si no existe)
- Stash cambios locales si hay

### 4. Instala Dependencias 📦

- `npm ci --production=false`
- Incluye devDependencies para tests

### 5. Setup Prisma 🔧

- `npx prisma generate`
- `npx prisma migrate deploy`

### 6. Ejecuta Tests 🧪

- Tests unitarios en servidor
- Reporta estadísticas
- Warning si > 5 tests fallan

### 7. Build 🏗️

- `npm run build`
- Compila Next.js

### 8. Restart PM2 🔄

- PM2 reload (zero-downtime)
- O PM2 start si es primera vez
- Guarda configuración

### 9. Health Checks 🏥

- HTTP: `http://localhost:3000/api/health`
- PM2 status
- Verifica que todo funciona

### 10. Cleanup 🧹

- Elimina archivos temporales
- Mantiene solo últimos backups

---

## 🎯 PRIMERA VEZ - SETUP INICIAL

Si es la **primera vez** que deployás en este servidor:

```bash
# 1. Conectar
ssh root@157.180.119.236

# 2. Instalar Node.js (si no está)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 3. Instalar PostgreSQL (si no está)
apt-get install -y postgresql postgresql-contrib

# 4. Crear base de datos
sudo -u postgres psql -c "CREATE DATABASE inmova_production;"
sudo -u postgres psql -c "CREATE USER inmova_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE inmova_production TO inmova_user;"

# 5. Crear directorios
mkdir -p /opt/inmova-app
mkdir -p /var/log/inmova
mkdir -p /var/backups/inmova

# 6. Clonar repositorio
cd /opt/inmova-app
# Necesitas configurar SSH keys o usar HTTPS con token
git clone git@github.com:tu-usuario/inmova-app.git .

# 7. Configurar variables de entorno
cp .env.production.example .env.production
nano .env.production
# Editar con valores reales

# 8. Instalar PM2
npm install -g pm2

# 9. Ejecutar deployment
python3 scripts/deploy-ssh-paramiko.py
```

---

## 🔒 SEGURIDAD

### ⚠️ IMPORTANTE: Credenciales en Código

El script `deploy-ssh-paramiko.py` contiene:

- Host: 157.180.119.236
- Usuario: root
- Password: xcc9brgkMMbf

**ACCIONES RECOMENDADAS**:

1. **Cambiar password** después del primer deployment:

```bash
ssh root@157.180.119.236
passwd
# Ingresar nuevo password
```

2. **Usar SSH keys** en lugar de password:

```bash
# En tu máquina local
ssh-keygen -t ed25519 -C "deploy@inmova"
ssh-copy-id root@157.180.119.236
```

3. **Eliminar credenciales del script**:

```python
# En deploy-ssh-paramiko.py, cambiar a:
SERVER_CONFIG = {
    'host': os.environ.get('SERVER_HOST', '157.180.119.236'),
    'username': os.environ.get('SERVER_USER', 'root'),
    'password': os.environ.get('SERVER_PASSWORD'),  # Desde env var
}
```

4. **No commitear a Git**:

```bash
# Ya está en .gitignore
git status  # Verificar que no aparece el script
```

---

## 🐛 TROUBLESHOOTING

### Script falla en "Conectando"

**Error**: `Authentication failed` o `Connection timeout`

**Solución**:

```bash
# Verificar conectividad
ping 157.180.119.236

# Test SSH manual
ssh root@157.180.119.236
# Si funciona, problema es con paramiko

# Verificar firewall
ufw status
ufw allow 22/tcp
```

### Script falla en "Git pull"

**Error**: `Repository not found`

**Solución**:

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Clonar repositorio manualmente
git clone https://github.com/tu-usuario/inmova-app.git .

# Configurar Git
git config --global user.name "Deploy Bot"
git config --global user.email "deploy@inmova.app"
```

### Script falla en "npm install"

**Error**: `npm ERR! code ENOENT`

**Solución**:

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Verificar package.json existe
ls -la package.json

# Install manual
npm install

# Verificar Node.js version
node -v  # Debe ser >= 18.0.0
```

### Script falla en "Prisma migrate"

**Error**: `Database connection failed`

**Solución**:

```bash
ssh root@157.180.119.236

# Verificar PostgreSQL
pg_isready

# Verificar .env.production
cat /opt/inmova-app/.env.production | grep DATABASE_URL

# Test conexión
psql -U inmova_user -d inmova_production -c "SELECT 1;"
```

### Tests fallan en servidor

**Solución**:

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Run tests manual
npm test -- --run

# Ver qué falló
npm test -- --run --reporter=verbose | grep FAIL

# Verificar test database
cat .env.production | grep TEST_DATABASE_URL
```

---

## 📊 VERIFICAR DEPLOYMENT

Después del deployment, verificar:

```bash
# 1. HTTP
curl http://157.180.119.236:3000/api/health

# 2. PM2 Status
ssh root@157.180.119.236 'pm2 status'

# 3. Logs
ssh root@157.180.119.236 'pm2 logs inmova-app --lines 50'

# 4. Tests
ssh root@157.180.119.236 'cd /opt/inmova-app && npm test -- --run | grep -E "Test Files|Tests"'
```

---

## 🎯 COMANDOS RÁPIDOS

```bash
# Deployment completo
python3 scripts/deploy-ssh-paramiko.py

# Solo restart (sin rebuild)
ssh root@157.180.119.236 'pm2 reload inmova-app'

# Ver logs en tiempo real
ssh root@157.180.119.236 'pm2 logs inmova-app -f'

# Rollback
ssh root@157.180.119.236 'cd /opt/inmova-app && git reset --hard HEAD~1 && pm2 reload inmova-app'

# Health check
curl http://157.180.119.236:3000/api/health
```

---

## ✅ CHECKLIST

- [ ] Servidor accesible vía SSH
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos creada
- [ ] Repositorio clonado en `/opt/inmova-app`
- [ ] `.env.production` configurado
- [ ] PM2 instalado
- [ ] Firewall permite puerto 3000
- [ ] Script de deployment ejecutable
- [ ] Tests pasando (≥95%)

---

## 🚀 RESULTADO ESPERADO

```
============================================================
✅ DEPLOYMENT COMPLETADO EXITOSAMENTE
============================================================

Aplicación: http://157.180.119.236:3000
Logs: pm2 logs inmova-app

Para ver status:
  ssh root@157.180.119.236 'pm2 status'

============================================================
```

---

**Última actualización**: 3 de enero de 2026  
**Servidor**: 157.180.119.236  
**Usuario**: root  
**Path**: /opt/inmova-app  
**Puerto**: 3000
