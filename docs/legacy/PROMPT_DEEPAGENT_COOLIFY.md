# 🤖 PROMPT PARA AGENTE VISUAL - DEPLOYMENT COOLIFY

## OBJETIVO
Deployar la aplicación Inmova (Next.js + PostgreSQL) en Coolify usando el repositorio GitHub ya preparado.

## CONTEXTO
- **Repositorio**: https://github.com/dvillagrablanco/inmova-app
- **Branch**: main
- **Dominio objetivo**: www.inmova.app
- **Stack**: Next.js 15 + PostgreSQL 16 + Prisma
- **Todo configurado**: Dockerfile, docker-compose, variables de entorno

---

## INSTRUCCIONES PASO A PASO

### PASO 1: CREAR PROYECTO
1. Navegar a Coolify Dashboard
2. Click en botón "+ New" o "New Project"
3. En el campo "Name" escribir: `Inmova`
4. En el campo "Description" escribir: `Aplicación Inmova - Next.js Full Stack`
5. Click en botón "Continue" o "Create"

### PASO 2: AGREGAR APLICACIÓN DESDE GITHUB
1. En el proyecto Inmova, click en "+ New" o "New Resource"
2. Seleccionar tipo: "Application"
3. Seleccionar source: "Public Repository" o "Git Repository"
4. En el campo "Git Repository URL" pegar: `https://github.com/dvillagrablanco/inmova-app`
5. En el campo "Branch" escribir: `main`
6. Click en "Continue" o "Save"
7. **Verificar configuración auto-detectada:**
   - Build Pack: Docker (debe detectar automáticamente el Dockerfile)
   - Port: 3000
   - Base Directory: / (raíz)
8. Si pide confirmar, click "Confirm" o "Continue"

### PASO 3: AGREGAR BASE DE DATOS POSTGRESQL
1. Volver al proyecto Inmova (si no estás ahí)
2. Click en "+ New" o "New Resource"
3. Seleccionar tipo: "Database"
4. Seleccionar database type: "PostgreSQL"
5. Configurar los siguientes campos:
   - **Name**: `inmova-postgres`
   - **Version**: Seleccionar `16` (la más reciente)
   - **Database Name**: `inmova`
   - **Username**: `inmova`
   - **Password**: Dejar que Coolify auto-genere o escribir uno seguro
6. Click en "Create" o "Save"
7. Esperar a que la base de datos esté "Running" (indicador verde)

### PASO 4: CONFIGURAR VARIABLES DE ENTORNO
1. Click en la aplicación Inmova (no la base de datos)
2. Navegar a la tab "Environment Variables" o "Secrets"
3. Click en "+ Add" o "Add Variable"
4. Agregar las siguientes variables **una por una**:

**Variable 1:**
- Key: `DATABASE_URL`
- Value: `{{inmova-postgres.DATABASE_URL}}` 
  (Nota: Esta sintaxis especial de Coolify auto-conecta la base de datos)
- Scope: Production o All
- Click "Add" o "Save"

**Variable 2:**
- Key: `NEXTAUTH_URL`
- Value: `https://www.inmova.app`
- Scope: Production o All
- Click "Add" o "Save"

**Variable 3:**
- Key: `NEXTAUTH_SECRET`
- Value: `l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=`
- Scope: Production o All
- Click "Add" o "Save"

**Variable 4:**
- Key: `NODE_ENV`
- Value: `production`
- Scope: Production o All
- Click "Add" o "Save"

**Variable 5:**
- Key: `ENCRYPTION_KEY`
- Value: `e2dd0f8a254cc6aee7b93f45329363b9`
- Scope: Production o All
- Click "Add" o "Save"

5. Verificar que todas las 5 variables estén agregadas correctamente

### PASO 5: CONFIGURAR DOMINIO
1. En la aplicación Inmova, navegar a la tab "Domains" o "Settings" → "Domains"
2. Click en "+ Add" o "Add Domain"
3. En el campo de dominio escribir: `www.inmova.app`
4. Click en "Save" o "Add"
5. Coolify mostrará que configurará SSL automáticamente con Let's Encrypt
6. **IMPORTANTE**: Anotar si Coolify muestra alguna instrucción de DNS

### PASO 6: INICIAR DEPLOYMENT
1. En la aplicación Inmova, buscar el botón "Deploy" o "Start Deployment"
2. Click en "Deploy"
3. Navegar a la tab "Logs" o "Build Logs"
4. Observar el progreso del build:
   - Clonando repositorio ✓
   - Building Docker image (esto tomará 5-10 minutos)
   - Generando Prisma Client ✓
   - Building Next.js ✓
   - Starting container ✓
5. Esperar hasta ver mensajes como:
   - "✅ Migrations completed!"
   - "🎉 Starting Next.js server..."
   - "Ready" o "Deployment successful"

### PASO 7: VERIFICAR DEPLOYMENT
1. Una vez que el deployment muestre "Running" o "Success":
2. Click en la URL generada por Coolify o ir a: `https://www.inmova.app`
3. Verificar que el sitio carga correctamente
4. Probar el health check: `https://www.inmova.app/api/health`
5. Debe responder con JSON: `{"status":"ok",...}`

---

## NOTAS IMPORTANTES PARA EL AGENTE

### Si aparece error "DATABASE_URL syntax not recognized":
- Cambiar la variable DATABASE_URL a formato manual:
- Value: `postgresql://inmova:PASSWORD@inmova-postgres:5432/inmova?schema=public`
- Reemplazar PASSWORD con el password de la base de datos PostgreSQL

### Si el build falla:
1. Ir a "Logs" o "Build Logs"
2. Leer el último error
3. Si es problema de Prisma, verificar que DATABASE_URL esté configurado
4. Click en "Redeploy" o "Deploy" nuevamente

### Si necesita ejecutar migraciones manualmente:
1. Ir a la aplicación → "Terminal" o "Console"
2. Ejecutar comando: `npx prisma migrate deploy`
3. O ejecutar: `npx prisma db push`

### Verificar que SSL está activo:
- El dominio debe mostrar candado verde en el navegador
- URL debe comenzar con https://
- Coolify genera el certificado automáticamente con Let's Encrypt

---

## RESULTADO ESPERADO

Al finalizar todos los pasos:

✅ Proyecto "Inmova" creado en Coolify
✅ Aplicación conectada desde GitHub
✅ Base de datos PostgreSQL corriendo
✅ 5 variables de entorno configuradas
✅ Dominio www.inmova.app agregado
✅ Deployment exitoso (status "Running")
✅ SSL/HTTPS activo (candado verde)
✅ Frontend accesible en www.inmova.app
✅ API health check respondiendo correctamente

---

## CHECKLIST FINAL PARA VERIFICAR

- [ ] Dashboard de Coolify abierto
- [ ] Proyecto "Inmova" visible
- [ ] Aplicación con status "Running" (verde)
- [ ] Base de datos con status "Running" (verde)
- [ ] 5 variables de entorno visibles en la lista
- [ ] Dominio www.inmova.app listado en Domains
- [ ] SSL certificate: "Valid" o "Active"
- [ ] Logs muestran "Starting Next.js server"
- [ ] URL www.inmova.app carga el sitio
- [ ] Health check API responde 200 OK

---

## SI TODO ESTÁ CORRECTO

Reportar: "✅ Deployment exitoso - Inmova está live en www.inmova.app"

## SI HAY PROBLEMAS

Reportar el error específico que aparece en:
1. Build Logs (tab Logs durante deployment)
2. Application Logs (runtime logs)
3. Database Logs (si hay error de conexión)

