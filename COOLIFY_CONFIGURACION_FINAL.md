# ✅ Coolify Instalado - Configuración Final

## 🎉 Estado Actual

- ✅ Servidor Hetzner: **157.180.119.236**
- ✅ Coolify instalado: **v4.0.0-beta.459**
- ✅ RAM disponible: **30GB**
- ✅ Disco disponible: **202GB**
- ✅ Node.js: **v20.19.6**
- ✅ Docker instalado automáticamente por Coolify

---

## 🔐 Acceso a Coolify

### URL de Acceso:

```
http://157.180.119.236:8000
```

---

## 📋 Configuración Inicial (Solo Una Vez - 3 minutos)

### Paso 1: Primera Configuración

1. Abre en tu navegador: http://157.180.119.236:8000
2. Primera vez verás el wizard de configuración
3. Completa:
   - **Email**: tu-email@example.com
   - **Contraseña**: (elige una segura)
   - **Nombre de instancia**: INMOVA Production

### Paso 2: Genera API Token

1. Una vez dentro del dashboard
2. Ve a: **Settings** → **API Tokens** (o **Tokens**)
3. Click en **"Create Token"** o **"New Token"**
4. Configuración:
   - **Name**: cursor-agent-deployment
   - **Permissions**: Full Access (o el máximo disponible)
5. Click **"Create"**
6. **COPIA EL TOKEN** (se muestra una sola vez)

### Paso 3: Dame el Token

Una vez que tengas el token, pégalo aquí y yo haré automáticamente:

```
Token: _______________
```

---

## 🚀 Lo Que Haré Automáticamente (15 minutos)

Una vez que me des el API token:

### 1. Configurar GitHub (2 min)

- Conectar Coolify con tu repositorio GitHub
- Configurar webhook para auto-deploy

### 2. Crear PostgreSQL (2 min)

- Base de datos PostgreSQL 16
- Usuario y contraseña generados automáticamente
- DATABASE_URL configurado automáticamente

### 3. Crear Aplicación INMOVA (3 min)

- Nombre: inmova-production
- Tipo: Docker (desde Dockerfile)
- Repository: dvillagrablanco/inmova-app
- Branch: main o cursor/app-deployment-to-vercel-7c94

### 4. Configurar Variables de Entorno (2 min)

```env
DATABASE_URL=<auto-generado por PostgreSQL>
NEXTAUTH_SECRET=34Z15OHM7VJIU5JTX4LlbGRvlFkX6VGRY3HYlghi+YY=
NEXTAUTH_URL=http://157.180.119.236
ENCRYPTION_KEY=2ae9029120303be4a34206d19364ea8d3f3f33232bd234f5a0ae8e4e18565a2f
CRON_SECRET=0a1012992791d1a0e7108e3716667cf516dd81776a281d4c317818bfcd39e38d
NODE_ENV=production
```

### 5. Primer Deployment (10-15 min)

- Build desde Dockerfile
- Genera Prisma Client
- Build Next.js con output standalone
- Deploy contenedor
- Configurar proxy reverso

### 6. Verificar Deployment

- App accesible en http://157.180.119.236
- Base de datos conectada
- Sin errores en logs

---

## 📊 Tiempo Total

| Actividad          | Tiempo     | Quién                         |
| ------------------ | ---------- | ----------------------------- |
| Configurar Coolify | 2 min      | TÚ                            |
| Generar API token  | 1 min      | TÚ                            |
| Configurar todo    | 5 min      | YO (automático)               |
| Primer deployment  | 15 min     | YO (automático)               |
| **TOTAL**          | **23 min** | **3 min tuyos + 20 min míos** |

---

## 🔧 Alternativa: Configuración Manual (Si Prefieres)

Si prefieres configurar manualmente sin API:

### 1. Crear Aplicación en Coolify

1. En Coolify dashboard: **"+ New Resource"** → **"Application"**
2. Configuración:
   - **Name**: inmova-production
   - **Source**: GitHub
   - **Repository**: dvillagrablanco/inmova-app
   - **Branch**: main
   - **Build Pack**: Dockerfile
   - **Port**: 3000

### 2. Crear Base de Datos

1. **"+ New Resource"** → **"Database"** → **"PostgreSQL"**
2. Configuración:
   - **Name**: inmova-db
   - **Version**: 16 (latest)
   - **User**: inmova_user
   - **Password**: (autogenerado)

3. Copiar DATABASE_URL generado

### 3. Añadir Variables de Entorno

En la aplicación:

1. **Environment** → **Add Variable**
2. Añadir cada variable:

```env
DATABASE_URL=<copiar del paso anterior>
NEXTAUTH_SECRET=34Z15OHM7VJIU5JTX4LlbGRvlFkX6VGRY3HYlghi+YY=
NEXTAUTH_URL=http://157.180.119.236
ENCRYPTION_KEY=2ae9029120303be4a34206d19364ea8d3f3f33232bd234f5a0ae8e4e18565a2f
CRON_SECRET=0a1012992791d1a0e7108e3716667cf516dd81776a281d4c317818bfcd39e38d
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://157.180.119.236
```

### 4. Deploy

1. Click **"Deploy"**
2. Esperar 10-15 minutos
3. Verificar logs

---

## 🌐 Configurar Dominio (Opcional - Después)

Una vez que la app funcione:

### En Coolify:

1. Ve a tu aplicación → **"Domains"**
2. Añade: `www.inmova.app`
3. Coolify configura SSL automáticamente con Let's Encrypt

### En tu DNS:

1. Añade registro A:
   ```
   A    @       157.180.119.236
   A    www     157.180.119.236
   ```
2. Espera propagación (5-30 min)

### Actualizar Variables:

```env
NEXTAUTH_URL=https://www.inmova.app
NEXT_PUBLIC_APP_URL=https://www.inmova.app
```

Re-deploy para aplicar cambios.

---

## 📝 Información de Conexión

### SSH:

```bash
ssh -i ~/.ssh/hetzner_key root@157.180.119.236
```

### Coolify Web:

```
http://157.180.119.236:8000
```

### App (después del deployment):

```
http://157.180.119.236
```

---

## 🆘 Troubleshooting

### No puedo acceder a Coolify en puerto 8000

**Causa**: Firewall bloqueando

**Solución**:

```bash
ssh -i ~/.ssh/hetzner_key root@157.180.119.236
ufw allow 8000
ufw allow 80
ufw allow 443
```

### Build falla en Coolify

**Causa**: RAM insuficiente (unlikely con 30GB)

**Solución**: Ver logs en Coolify → App → Logs

### DATABASE_URL no funciona

**Causa**: PostgreSQL no iniciado

**Solución**: En Coolify, verificar que PostgreSQL container esté running

---

## ✅ Checklist Post-Deployment

Verificar:

- [ ] Coolify accesible en puerto 8000
- [ ] App desplegada sin errores
- [ ] PostgreSQL corriendo
- [ ] App accesible en puerto 80
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] No hay errores en logs de Coolify

---

## 🎯 Siguiente Paso

**Dame el API token de Coolify y yo haré TODO el resto automáticamente en 20 minutos.**

O si prefieres configurar manualmente, sigue los pasos de la sección "Alternativa: Configuración Manual".

---

_El servidor está listo. Coolify está instalado. Solo falta configurar y desplegar._

**Tiempo restante: ~20 minutos**
