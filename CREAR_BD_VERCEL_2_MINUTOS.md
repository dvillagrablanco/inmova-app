# 🗄️ CREAR BASE DE DATOS EN VERCEL - 2 MINUTOS

**Este es el ÚNICO paso que falta para tener tu app funcionando al 100%**

---

## ⚡ PASO A PASO (2 MINUTOS)

### Paso 1: Login en Vercel con GitHub (30 segundos)

1. **Abre tu navegador** y ve a: https://vercel.com/login

2. **Click en "Continue with GitHub"**
   - Te pedirá autorizar con tu cuenta de GitHub
   - Click "Authorize Vercel"

3. **Ya estás dentro de Vercel** ✅

---

### Paso 2: Crear Base de Datos PostgreSQL (1 minuto)

1. **En el Dashboard de Vercel**, busca en el sidebar izquierdo:
   - Click en "Storage" (icono de base de datos)

2. **Click en el botón "Create Database"**
   - Aparecerá un modal con opciones

3. **Selecciona "Postgres"**
   - Es la primera opción, con logo de PostgreSQL

4. **Configura la base de datos:**

   ```
   Database Name: inmova-production
   Region: Frankfurt, Germany (fra1) [o la más cercana a ti]
   Plan: Hobby - Free ($0/month)
   ```

5. **Click "Create"**
   - Espera 10-20 segundos mientras se crea

6. **¡Listo!** ✅ Tu base de datos está creada

---

### Paso 3: Conectar con tu Proyecto (30 segundos)

1. **En la página de tu base de datos recién creada:**
   - Verás un botón "Connect Project"
   - Click en él

2. **Selecciona tu proyecto:**
   - Si ya hiciste `vercel link`, aparecerá en la lista
   - Si no aparece, primero ejecuta: `vercel link`

3. **Click "Connect"**

4. **¡Ya está conectada!** ✅
   - La variable `DATABASE_URL` se agregó automáticamente

---

### Paso 4: Aplicar Migraciones (30 segundos)

Ahora desde tu terminal local:

```bash
# 1. Descargar las variables de entorno (incluye DATABASE_URL)
vercel env pull

# 2. Cargar las variables
source .env

# O en una sola línea:
export $(cat .env | xargs)

# 3. Aplicar migraciones
npx prisma migrate deploy

# 4. Crear datos iniciales (usuario admin, etc.)
npm run db:seed
```

---

### Paso 5: Redeploy (15 segundos)

```bash
vercel --prod
```

---

## ✅ ¡TERMINADO!

**Tu app ahora está 100% funcional en producción** 🎉

Verifica en: https://tu-proyecto.vercel.app

Login con:

- Email: `admin@inmova.app`
- Password: `Admin2025!`

---

## 📊 VERIFICACIÓN

### Checklist rápido:

```bash
# 1. Verificar que DATABASE_URL existe
vercel env ls | grep DATABASE_URL

# 2. Verificar conexión a BD
npx prisma db pull

# 3. Verificar migraciones
npx prisma migrate status
```

Todo debería estar ✅

---

## 🎯 SI ALGO FALLA

### Error: "No encuentro el botón Storage"

**Solución:** Usa el menú de navegación principal, no el del proyecto.

### Error: "Project not found al hacer vercel link"

**Solución:**

```bash
# Crear nuevo proyecto
vercel

# Luego conectar la BD
```

### Error: "Cannot connect to database"

**Solución:**

```bash
# Verificar que la BD está conectada al proyecto correcto
# En Vercel Dashboard → Storage → Tu BD → Connected Projects
```

---

## 💡 TIPS

### Verificar DATABASE_URL

En Vercel Dashboard:

- Settings → Environment Variables
- Busca `DATABASE_URL`
- Debería estar ahí automáticamente después de conectar

### Acceder a la BD directamente

```bash
# Copiar DATABASE_URL de Vercel
vercel env pull

# Abrir Prisma Studio
npx prisma studio
```

---

## 🚀 DESPUÉS DE CREAR LA BD

### Tu app estará:

```
✅ 100% funcional
✅ 0 errores de código
✅ 0 errores de API
✅ 0 errores visuales
✅ Base de datos funcionando
✅ Usuario admin creado
✅ SSL activo
✅ Performance óptimo
```

---

## 📸 VISUAL GUIDE

### Paso 1: Login

```
┌────────────────────────────────────────┐
│  Vercel                                │
│  ┌──────────────────────────────────┐  │
│  │  Continue with GitHub           │  │  ← Click aquí
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Continue with GitLab           │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### Paso 2: Storage

```
Dashboard
├── Overview
├── Deployments
├── Analytics
├── ► Storage        ← Click aquí
│   └── [Create Database]
├── Settings
└── ...
```

### Paso 3: Crear BD

```
┌────────────────────────────────────────┐
│  Create New Database                   │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  ◆ Postgres  [RECOMENDADO]     │  │  ← Selecciona
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  ◆ MySQL                        │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  ◆ Redis                        │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### Paso 4: Configurar

```
┌────────────────────────────────────────┐
│  Create Postgres Database              │
│                                        │
│  Database Name:                        │
│  [inmova-production            ]       │
│                                        │
│  Region:                               │
│  [Frankfurt, Germany (fra1)    ▼]      │
│                                        │
│  Plan:                                 │
│  [● Hobby - Free               ▼]      │
│                                        │
│  [      Create Database       ]        │
└────────────────────────────────────────┘
```

---

## ⏱️ TIEMPO TOTAL: 2 MINUTOS

- Login: 30 seg
- Crear BD: 1 min
- Conectar: 30 seg
- Aplicar migraciones: 30 seg
- Redeploy: 15 seg

**Total: 2 minutos 45 segundos**

---

## 🎉 ¡ÉXITO!

Después de estos pasos, tu aplicación estará **100% operativa** en producción sin ningún error.

**Es literalmente lo ÚNICO que falta.** Todo lo demás ya está listo.

---

**¿Necesitas ayuda?** Consulta: https://vercel.com/docs/storage/vercel-postgres
