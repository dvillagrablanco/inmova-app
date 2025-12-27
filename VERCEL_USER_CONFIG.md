# 👤 Configuración de Usuario - Vercel

## Información de la Cuenta

- **User ID**: `pAzq4g0vFjJlrK87sQhlw08I`
- **Email**: `dvillagra@vidaroinversiones.com`
- **Proyecto**: INMOVA
- **Fecha de configuración**: Diciembre 27, 2024

---

## 🔗 Enlaces Directos

### Dashboard Principal
```
https://vercel.com/dashboard
```

### Configuración de Cuenta
```
https://vercel.com/account
```

### Tokens de Acceso
```
https://vercel.com/account/tokens
```

### Configuración General
```
https://vercel.com/account/general
```

---

## 🎯 Pasos para Crear un Proyecto

### Opción 1: Via CLI (Recomendado)

```bash
# 1. Autenticarte
vercel login
# Email: dvillagra@vidaroinversiones.com

# 2. Desplegar (esto creará el proyecto automáticamente)
cd /workspace
vercel

# 3. Responde las preguntas:
# - Set up and deploy? Yes
# - Which scope? Selecciona tu cuenta
# - Link to existing project? No
# - What's your project's name? inmova (o el que prefieras)
# - In which directory is your code located? ./
# - Want to override settings? No
```

### Opción 2: Via Dashboard Web

1. Ve a https://vercel.com/new
2. Selecciona "Import Git Repository" o "Deploy from CLI"
3. Si importas desde Git:
   - Conecta tu repositorio de GitHub
   - Vercel detectará Next.js automáticamente
   - Configura las variables de entorno
   - Click "Deploy"

---

## 🔑 Crear Token para CI/CD

Si quieres usar GitHub Actions o deployment automático:

1. Ve a https://vercel.com/account/tokens
2. Click en "Create Token"
3. Nombre: `github-actions-inmova` (o el que prefieras)
4. Scope: Full Account
5. Expiration: Sin expiración (o según prefieras)
6. Click "Create Token"
7. **COPIA EL TOKEN AHORA** (no podrás verlo después)

Luego configura el token:

```bash
# Como variable de entorno
export VERCEL_TOKEN=tu_token_aqui

# O úsalo con el script
VERCEL_TOKEN=tu_token_aqui ./deploy-with-token.sh
```

---

## 📊 Obtener IDs del Proyecto

Después del primer deployment, necesitarás estos IDs para GitHub Actions:

```bash
# 1. Vincula el proyecto (si aún no lo has hecho)
vercel link

# 2. Los IDs se guardan en .vercel/project.json
cat .vercel/project.json

# Verás algo como:
# {
#   "orgId": "team_xxxxxxxxxxxxx",  # Este es VERCEL_ORG_ID
#   "projectId": "prj_xxxxxxxxxxxxx" # Este es VERCEL_PROJECT_ID
# }
```

Guarda estos valores para configurar GitHub Actions.

---

## 🔐 Variables de Entorno en Vercel

Para añadir variables de entorno a tu proyecto:

### Via Dashboard:
1. Ve a tu proyecto en https://vercel.com/dashboard
2. Settings → Environment Variables
3. Añade cada variable:
   - Name: nombre de la variable
   - Value: valor de la variable
   - Environment: selecciona Production, Preview, Development
4. Click "Save"

### Via CLI:
```bash
# Añadir una variable
vercel env add VARIABLE_NAME production

# Ver todas las variables
vercel env ls

# Descargar variables localmente
vercel env pull .env.local
```

---

## 📁 Estructura del Proyecto en Vercel

Después del deployment, tu proyecto tendrá:

```
Tu Proyecto en Vercel
├── Settings
│   ├── General (nombre, framework, región)
│   ├── Domains (dominios personalizados)
│   ├── Environment Variables (variables de entorno)
│   ├── Git (integración con GitHub)
│   └── Functions (configuración de serverless)
├── Deployments (historial de deployments)
├── Analytics (estadísticas de uso)
├── Logs (logs en tiempo real)
└── Preview Deployments (deployments de PRs)
```

---

## 🚀 Comandos Útiles

```bash
# Ver información de tu cuenta
vercel whoami

# Ver lista de proyectos
vercel list

# Ver deployments del proyecto actual
vercel ls

# Ver logs en tiempo real
vercel logs https://tu-proyecto.vercel.app --follow

# Inspeccionar un deployment
vercel inspect https://tu-proyecto.vercel.app

# Promover un deployment a producción
vercel promote https://tu-deployment-url.vercel.app

# Rollback a versión anterior
vercel rollback

# Eliminar un proyecto
vercel remove nombre-proyecto
```

---

## 🎯 Configuración Recomendada del Proyecto

### General Settings:
- **Build Command**: `yarn build` (automático)
- **Output Directory**: `.next` (automático)
- **Install Command**: `yarn install` (automático)
- **Node.js Version**: 18.x (recomendado)

### Function Settings:
- **Function Region**: `iad1` (Washington D.C. - default)
- **Function Memory**: 1024 MB (puede aumentar a 3008 MB si es necesario)
- **Function Duration**: 10s (puede aumentar a 60s con plan Pro)

### Performance:
- **Edge Network**: Habilitado (automático)
- **Automatic HTTPS**: Habilitado (automático)
- **HTTP/2**: Habilitado (automático)

---

## 🌐 Configurar Dominio Personalizado

### Añadir inmova.app:

1. Ve a tu proyecto → Settings → Domains
2. Click "Add Domain"
3. Ingresa: `inmova.app`
4. Click "Add"
5. Vercel te dará instrucciones de DNS:

```
# Configuración DNS:
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

6. Configura estos registros en tu proveedor de DNS
7. Espera propagación (5-30 minutos)
8. Vercel verificará automáticamente y emitirá certificado SSL

### Actualizar variables después del dominio:

```bash
# Actualiza NEXTAUTH_URL en Vercel
# De: https://tu-proyecto.vercel.app
# A:  https://inmova.app

# Luego re-despliega
vercel --prod
```

---

## 📞 Soporte

### Documentación Oficial:
- Vercel Docs: https://vercel.com/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs

### Status:
- Vercel Status: https://vercel-status.com

### Soporte:
- Community: https://github.com/vercel/vercel/discussions
- Email: support@vercel.com (requiere plan Pro)

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Vercel creada y verificada
- [ ] User ID confirmado: `pAzq4g0vFjJlrK87sQhlw08I`
- [ ] Vercel CLI instalado localmente
- [ ] Autenticado con `vercel login`
- [ ] Proyecto desplegado al menos una vez
- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado añadido (opcional)
- [ ] GitHub Actions configurado (opcional)
- [ ] Token de acceso creado para CI/CD (opcional)

---

**Última actualización**: Diciembre 27, 2024  
**User ID**: pAzq4g0vFjJlrK87sQhlw08I  
**Email**: dvillagra@vidaroinversiones.com
