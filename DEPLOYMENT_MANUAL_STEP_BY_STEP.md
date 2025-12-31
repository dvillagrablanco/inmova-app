# 🚀 DEPLOYMENT MANUAL - PASO A PASO

**Servidor:** 157.180.119.236  
**Usuario:** root  
**Password:** xcc9brgkMMbf  
**Fecha:** 31 de Diciembre de 2025

---

## 📋 INSTRUCCIONES

### PASO 0: Conectar al Servidor

Abre una terminal en tu computadora y conéctate:

```bash
ssh root@157.180.119.236
# Password: xcc9brgkMMbf
```

Una vez conectado, **copia y pega cada bloque de comandos** en orden.

---

## 🔥 FASE 1: PRE-DEPLOYMENT (5 minutos)

### 1.1 Verificar Node.js

```bash
echo "✅ Verificando Node.js..."
node --version
npm --version

# Si Node.js no está instalado:
# curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
# apt-get install -y nodejs
```

### 1.2 Backup de Base de Datos (CRÍTICO)

```bash
echo "✅ Creando backup de BD..."
BACKUP_FILE="/root/backup_inmova_$(date +%Y%m%d_%H%M%S).sql"

# Si PostgreSQL está instalado:
pg_dump -U postgres inmova_production > $BACKUP_FILE 2>/dev/null || echo "⚠️ No DB configured yet"

# Verificar backup
ls -lh /root/backup_*.sql 2>/dev/null | tail -1 || echo "Sin backups previos"
```

### 1.3 Verificar Git

```bash
echo "✅ Verificando git..."
git --version

# Si git no está instalado:
# apt-get update && apt-get install -y git
```

---

## 🚀 FASE 2: DEPLOYMENT (15-20 minutos)

### 2.1 Preparar Directorio

```bash
echo "✅ Preparando directorio de aplicación..."
mkdir -p /opt/inmova-app
cd /opt/inmova-app
```

### 2.2 Clonar o Actualizar Repositorio

```bash
# Si es la primera vez:
if [ ! -d ".git" ]; then
    echo "📥 Clonando repositorio..."
    git clone https://github.com/dvillagrablanco/inmova-app.git .
else
    echo "🔄 Actualizando repositorio..."
    git fetch origin
    git checkout main
    git pull origin main
fi

# Verificar commit actual
echo "✅ Commit actual:"
git log -1 --oneline
```

### 2.3 Instalar Dependencias

```bash
echo "📦 Instalando dependencias..."
npm install --production=false

# Esto puede tardar 3-5 minutos
# Verás: [##########] 100%
```

### 2.4 Configurar Variables de Entorno

```bash
echo "🔐 Configurando .env.production..."

cat > .env.production << 'EOF'
# Core
NODE_ENV=production
PORT=3000

# Database (CAMBIAR si tienes PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/inmova_production

# NextAuth (CRÍTICO)
NEXTAUTH_URL=http://157.180.119.236:3000
NEXTAUTH_SECRET=inmova-ultra-secret-production-key-min-32-characters-long-change-this

# App URL
NEXT_PUBLIC_APP_URL=http://157.180.119.236:3000

# Optional: AWS S3 (si usas)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
# AWS_BUCKET=

# Optional: Stripe (si usas pagos)
# STRIPE_SECRET_KEY=
# STRIPE_PUBLIC_KEY=

# Optional: Sentry (error tracking)
# NEXT_PUBLIC_SENTRY_DSN=
EOF

echo "✅ .env.production creado"
echo "⚠️ IMPORTANTE: Editar valores reales si es necesario"
```

### 2.5 Generar Prisma Client

```bash
echo "🔨 Generando Prisma Client..."
npx prisma generate

# Debe completarse sin errores
```

### 2.6 Aplicar Migraciones de BD

```bash
echo "🗄️ Aplicando migraciones..."

# Si tienes PostgreSQL configurado:
npx prisma migrate deploy || echo "⚠️ Migrations skipped (no DB)"

# O push schema:
npx prisma db push || echo "⚠️ DB push skipped"
```

### 2.7 Build Next.js

```bash
echo "🏗️ Building Next.js app..."
npm run build

# Esto puede tardar 2-5 minutos
# DEBE completarse sin errores
# Verás: "✓ Compiled successfully"
```

---

## 🎯 FASE 3: POST-DEPLOYMENT (5 minutos)

### 3.1 Limpiar Procesos Viejos

```bash
echo "🧹 Limpiando procesos viejos..."

# Matar cualquier proceso en puerto 3000
fuser -k 3000/tcp 2>/dev/null || echo "No process on port 3000"

# Esperar
sleep 2
```

### 3.2 Instalar PM2 (si no existe)

```bash
echo "📦 Verificando PM2..."

if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
else
    echo "PM2 ya instalado: $(pm2 --version)"
fi
```

### 3.3 Configurar PM2

```bash
echo "⚙️ Configurando PM2..."

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'inmova-app',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    max_memory_restart: '1G',
    restart_delay: 4000,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production',
    error_file: '/var/log/inmova/error.log',
    out_file: '/var/log/inmova/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
EOF

echo "✅ ecosystem.config.js creado"
```

### 3.4 Crear Directorio de Logs

```bash
mkdir -p /var/log/inmova
chmod 755 /var/log/inmova
```

### 3.5 Iniciar Aplicación con PM2

```bash
echo "🚀 Iniciando aplicación..."

# Limpiar PM2 anterior
pm2 delete inmova-app 2>/dev/null || echo "No previous process"
pm2 kill

# Iniciar
cd /opt/inmova-app
pm2 start ecosystem.config.js --env production

# Guardar configuración
pm2 save

# Auto-start en reboot
pm2 startup systemd -u root --hp /root
```

### 3.6 Esperar Warm-up

```bash
echo "⏱️ Esperando warm-up (15 segundos)..."
sleep 15
```

### 3.7 Verificar que Está Corriendo

```bash
echo "✅ Verificando estado..."

# Ver estado PM2
pm2 status

# Test HTTP local
curl -I http://localhost:3000 2>&1 | head -5

# Ver logs
pm2 logs inmova-app --lines 20 --nostream
```

---

## 🔒 FASE 4: SEGURIDAD (5 minutos)

### 4.1 Configurar Firewall

```bash
echo "🔥 Configurando firewall..."

# Instalar UFW si no existe
apt-get update && apt-get install -y ufw

# Configurar reglas
ufw allow 22/tcp   # SSH
ufw allow 3000/tcp # App
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# Activar
ufw --force enable

# Verificar
ufw status | grep 3000
```

### 4.2 Verificar Security Headers

```bash
echo "🛡️ Verificando security headers..."

curl -I http://157.180.119.236:3000 2>&1 | grep -E "HTTP|X-Frame|X-Content|X-XSS"

# Debe mostrar:
# X-Frame-Options: ...
# X-Content-Type-Options: nosniff
```

---

## ⚡ FASE 5: VERIFICATION (5 minutos)

### 5.1 Test desde Fuera del Servidor

**En tu computadora LOCAL** (no en el servidor), ejecuta:

```bash
# Test básico
curl -I http://157.180.119.236:3000/login

# Debe retornar: HTTP/1.1 200 OK

# Test health
curl http://157.180.119.236:3000/api/health

# Debe retornar: {"status":"ok"} o similar
```

### 5.2 Test en Navegador

1. Abrir navegador (Chrome/Firefox)
2. Ir a: `http://157.180.119.236:3000/login`
3. **Verificar:**
   - ✅ Página carga completamente
   - ✅ Formulario de login visible
   - ✅ No hay errores en consola (F12)

### 5.3 Test de Login

En el navegador:

1. Email: `admin@inmova.app`
2. Password: `Admin123!`
3. Click en "Iniciar Sesión"
4. **Verificar:**
   - ✅ Login exitoso
   - ✅ Redirect a /dashboard
   - ✅ Dashboard carga con contenido

---

## 👥 FASE 6: USUARIOS TEST (10 minutos)

### 6.1 Crear Usuarios de Test

En el servidor:

```bash
echo "👥 Creando usuarios de test..."

cd /opt/inmova-app

# Ejecutar script de fix-auth si existe
if [ -f "scripts/fix-auth-complete.ts" ]; then
    npx tsx scripts/fix-auth-complete.ts
else
    echo "⚠️ Script no encontrado - crear usuarios manualmente"
fi
```

### 6.2 Verificar Usuarios en BD

```bash
# Si tienes PostgreSQL:
psql -U postgres inmova_production -c "SELECT email, activo, role FROM users WHERE email LIKE '%test%' OR email LIKE '%admin%';"

# Debe mostrar:
# admin@inmova.app | true | ADMIN
# test@inmova.app  | true | ADMIN
```

### 6.3 Generar Datos Demo (Opcional)

```bash
# Si quieres datos de ejemplo:
cd /opt/inmova-app
npx tsx scripts/seed-demo-data.ts 2>/dev/null || echo "Script not available"
```

---

## 📧 FASE 7: PREPARAR COMUNICACIÓN (15 minutos)

### 7.1 Template de Email para Usuarios Test

```markdown
Asunto: 🎉 Bienvenido a Inmova App - Fase Beta Testing

Hola [Nombre],

¡Bienvenido a la fase de testing beta de Inmova App!

📱 **Acceso a la aplicación:**

URL: http://157.180.119.236:3000/login
Email: [tu_email]@test.com
Password: Test123456!

🎯 **Qué queremos que pruebes:**

1. Login y navegación general (5 min)
2. Explorar el dashboard (10 min)
3. Crear una propiedad (10 min)
4. Registrar un inquilino (5 min)
5. Probar dark mode (toggle en header)
6. Probar cambio de idioma (selector en header)
7. Instalar como PWA en móvil (opcional)

⏱️ Tiempo estimado: 30-45 minutos

🐛 **Reportar bugs o feedback:**

- Email: soporte@inmova.app
- O responde a este email directamente
- Incluye screenshots si es posible

📋 **Qué reportar:**

- ✅ Cosas que funcionan bien
- ❌ Errores encontrados
- 💡 Sugerencias de mejora
- 🤔 Funcionalidades confusas

🙏 **¡Gracias por tu ayuda!**

Tu feedback es invaluable para mejorar Inmova App.

Saludos,
El equipo de Inmova

---

P.D.: La app está en fase beta. Algunos features pueden estar en desarrollo.
```

### 7.2 Crear Canal de Soporte

Opciones:

- ✅ Email dedicado: soporte@inmovaapp.com
- ✅ WhatsApp: Crear grupo privado
- ✅ Slack: Crear channel #inmova-beta-testing
- ✅ Google Forms: Para feedback estructurado

### 7.3 Documento de Testing

Crear documento compartido (Google Docs) con:

- [ ] Lista de features a testear
- [ ] Bugs reportados (tabla)
- [ ] Feedback recibido
- [ ] Status de cada issue

---

## ✅ CHECKLIST FINAL

### Antes de Invitar Usuarios

Marca cada item ANTES de enviar invitaciones:

#### Técnico

- [ ] ✅ Servidor conectado y funcionando
- [ ] ✅ Aplicación clonada en /opt/inmova-app
- [ ] ✅ Dependencies instaladas
- [ ] ✅ Build completado exitosamente
- [ ] ✅ PM2 corriendo (pm2 status)
- [ ] ✅ App responde en http://157.180.119.236:3000
- [ ] ✅ Login funciona (test manual)
- [ ] ✅ Dashboard carga
- [ ] ✅ Sin errores en logs (pm2 logs)

#### Seguridad

- [ ] ✅ Firewall configurado (puerto 3000 abierto)
- [ ] ✅ Security headers presentes
- [ ] ✅ Access control funciona (dashboard requiere login)
- [ ] ✅ .env.production NO commiteado a git

#### UX

- [ ] ✅ Dark mode funciona
- [ ] ✅ Selector de idioma visible
- [ ] ✅ Responsive (test en mobile)
- [ ] ✅ PWA install prompt funciona

#### Usuarios

- [ ] ✅ Usuarios de test creados
- [ ] ✅ Credenciales verificadas
- [ ] ✅ Email de bienvenida preparado
- [ ] ✅ Canal de soporte establecido
- [ ] ✅ Calendario de testing definido

---

## 🔧 COMANDOS ÚTILES DURANTE TESTING

### Monitorear en Tiempo Real

```bash
# Ver logs live
pm2 logs inmova-app

# Ver estado
pm2 status

# Reiniciar si es necesario
pm2 restart inmova-app

# Ver últimas 50 líneas de logs
pm2 logs inmova-app --lines 50 --nostream

# Ver solo errores
pm2 logs inmova-app --err --lines 30
```

### Si Algo Sale Mal

```bash
# Restart completo
pm2 restart inmova-app

# O restart limpio
pm2 delete inmova-app
cd /opt/inmova-app
pm2 start ecosystem.config.js --env production
pm2 save

# Ver logs en detalle
tail -f /var/log/inmova/error.log
tail -f /var/log/inmova/out.log
```

### Verificar Health

```bash
# Desde el servidor
curl http://localhost:3000/api/health

# Desde tu computadora
curl http://157.180.119.236:3000/api/health
```

---

## 🚨 TROUBLESHOOTING

### Problema: "npm install falla"

```bash
# Limpiar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Problema: "Build falla"

```bash
# Ver error completo
npm run build 2>&1 | tee build.log
cat build.log | grep -i error

# Limpiar cache Next.js
rm -rf .next
npm run build
```

### Problema: "PM2 no inicia"

```bash
# Ver por qué falla
pm2 logs inmova-app --lines 50

# Verificar puerto libre
ss -tlnp | grep :3000

# Matar proceso si está ocupado
fuser -k 3000/tcp

# Reintentar
pm2 restart inmova-app
```

### Problema: "Login no funciona"

```bash
# Verificar NEXTAUTH_URL
cat .env.production | grep NEXTAUTH_URL
# Debe ser: http://157.180.119.236:3000

# Verificar usuarios
npx tsx scripts/fix-auth-complete.ts

# Ver logs para errores de auth
pm2 logs inmova-app | grep -i "auth\|login\|401"
```

### Problema: "No responde desde fuera"

```bash
# Verificar firewall
ufw status | grep 3000

# Si no está abierto:
ufw allow 3000/tcp
ufw reload

# Test desde servidor
curl -I http://localhost:3000

# Si local funciona pero no externo, es firewall
```

---

## 📊 VERIFICACIÓN FINAL

### Checklist de 5 Puntos

Ejecutar en orden desde el servidor:

```bash
echo "🧪 VERIFICACIÓN FINAL"
echo "====================="

# 1. PM2 Status
echo "1. PM2 Status:"
pm2 status | grep inmova-app

# 2. HTTP Local
echo "2. HTTP Local Test:"
curl -I http://localhost:3000 2>&1 | head -1

# 3. HTTP Público
echo "3. HTTP Público Test:"
curl -I http://157.180.119.236:3000 2>&1 | head -1

# 4. Login Page
echo "4. Login Page:"
curl -s http://localhost:3000/login | grep -o "<title>.*</title>" | head -1

# 5. Logs sin errores críticos
echo "5. Logs (últimas 10 líneas):"
pm2 logs inmova-app --lines 10 --nostream

echo ""
echo "Si todos los checks pasan: ✅ LISTO PARA USUARIOS TEST"
```

---

## 🎊 DESPUÉS DEL DEPLOYMENT

### URLs Finales

```
🌐 Landing:   http://157.180.119.236:3000/landing
🔐 Login:     http://157.180.119.236:3000/login
📊 Dashboard: http://157.180.119.236:3000/dashboard
💚 Health:    http://157.180.119.236:3000/api/health
```

### Credenciales de Test

```
📧 Email:    admin@inmova.app
🔑 Password: Admin123!

📧 Email:    test@inmova.app
🔑 Password: Test123456!
```

### Monitoreo

```bash
# Ver logs en tiempo real
pm2 logs inmova-app

# Ver status cada 5 segundos
watch -n 5 'pm2 status'

# Ver logs de errores solo
tail -f /var/log/inmova/error.log
```

---

## 📞 SOPORTE

**Si necesitas ayuda durante el deployment:**

1. Copiar logs: `pm2 logs inmova-app --lines 100 --nostream > deployment-logs.txt`
2. Copiar status: `pm2 status > deployment-status.txt`
3. Copiar error logs: `cat /var/log/inmova/error.log | tail -100 > errors.txt`
4. Enviar archivos para análisis

---

## 🎯 TIEMPO TOTAL ESTIMADO

- **Fase 1 (Pre-deployment):** 5 minutos
- **Fase 2 (Deployment):** 15-20 minutos
- **Fase 3 (Post-deployment):** 5 minutos
- **Fase 4 (Seguridad):** 5 minutos
- **Fase 5 (Verificación):** 5 minutos
- **Total:** ~35-40 minutos

---

**Preparado por:** Cursor AI Agent  
**Fecha:** 31 de Diciembre de 2025  
**Status:** ✅ LISTO PARA EJECUTAR

**⚠️ IMPORTANTE:** Ejecutar cada fase en orden. No saltar pasos.
