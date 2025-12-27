# 🚀 Alternativas de Deployment - INMOVA

## ❌ Problema Detectado

El CLI de Vercel v50.1.3 tiene un bug con la opción `--yes` que impide el deployment automatizado.

Error: `TypeError: Cannot read properties of undefined (reading 'value')`

---

## ✅ SOLUCIÓN 1: Deployment via Dashboard Web (MÁS FÁCIL) ⭐

### Paso 1: Sube el código a GitHub

```bash
cd /workspace

# Si aún no tienes repositorio remoto configurado:
git remote add origin https://github.com/tu-usuario/inmova.git

# Sube el código
git add .
git commit -m "Prepare for Vercel deployment"
git push -u origin main
```

### Paso 2: Importa en Vercel

1. Ve a https://vercel.com/new
2. Haz clic en "Import Git Repository"
3. Selecciona tu repositorio
4. Vercel detectará Next.js automáticamente
5. Haz clic en "Deploy"

**Ventajas**:

- ✅ Más confiable
- ✅ Deployments automáticos en cada push
- ✅ Preview deployments en PRs
- ✅ No requiere configuración adicional

---

## ✅ SOLUCIÓN 2: Deployment Manual con CLI Interactivo

Desde tu terminal local (no este ambiente remoto):

```bash
cd /ruta/a/tu/proyecto

# Autentica
vercel login

# Despliega (responde las preguntas interactivamente)
vercel

# Para producción
vercel --prod
```

**Preguntas que te hará**:

- "Set up and deploy?" → **Yes**
- "Which scope?" → Selecciona tu cuenta
- "Link to existing project?" → **No**
- "What's your project's name?" → **inmova**
- "In which directory is your code located?" → **./
  **
- "Want to override settings?" → **No**

---

## ✅ SOLUCIÓN 3: Usar Versión Anterior del CLI

```bash
# Instalar versión específica que funciona
npm install -g vercel@49.0.0

# Intentar deployment
cd /workspace
vercel deploy --yes --token="mrahnG6wAoMRYDyGA9sWXGQH"
```

---

## ✅ SOLUCIÓN 4: GitHub Actions (Deployment Automático)

Ya está configurado en `.github/workflows/vercel-deploy.yml`

### Configuración:

1. **Sube el código a GitHub**
2. **Ve a tu repositorio → Settings → Secrets → Actions**
3. **Añade estos secrets**:
   - `VERCEL_TOKEN`: mrahnG6wAoMRYDyGA9sWXGQH
   - `VERCEL_ORG_ID`: Obtén con `cat .vercel/project.json` después del primer deploy
   - `VERCEL_PROJECT_ID`: Obtén con `cat .vercel/project.json` después del primer deploy

4. **Haz push** y el deployment será automático

---

## 🎯 RECOMENDACIÓN INMEDIATA

### Opción Más Rápida: Dashboard Web

1. **Crea un repositorio en GitHub** (si aún no existe):
   - Ve a https://github.com/new
   - Nombre: `inmova` (o el que prefieras)
   - Click "Create repository"

2. **Sube el código**:

```bash
cd /workspace
git remote add origin https://github.com/TU_USUARIO/inmova.git
git branch -M main
git add .
git commit -m "Initial commit for Vercel"
git push -u origin main
```

3. **Importa en Vercel**:
   - https://vercel.com/new
   - Import Git Repository
   - Selecciona tu repo
   - Deploy

4. **Configura variables de entorno** en Vercel Dashboard

---

## ⚙️ Variables de Entorno para Configurar

Después del deployment, ve a:
**Settings → Environment Variables**

```env
# Críticas
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=34Z15OHM7VJIU5JTX4LlbGRvlFkX6VGRY3HYlghi+YY=
NEXTAUTH_URL=https://tu-proyecto.vercel.app
AWS_REGION=eu-west-1
AWS_BUCKET_NAME=tu-bucket
AWS_FOLDER_PREFIX=inmova
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
ABACUSAI_API_KEY=...
ENCRYPTION_KEY=2ae9029120303be4a34206d19364ea8d3f3f33232bd234f5a0ae8e4e18565a2f
CRON_SECRET=0a1012992791d1a0e7108e3716667cf516dd81776a281d4c317818bfcd39e38d
```

Ver lista completa en: `.env.vercel.template`

---

## 📊 Comparación de Opciones

| Opción          | Tiempo | Dificultad | Recomendación |
| --------------- | ------ | ---------- | ------------- |
| Dashboard Web   | 10 min | Fácil      | ⭐⭐⭐⭐⭐    |
| CLI Interactivo | 5 min  | Media      | ⭐⭐⭐⭐      |
| GitHub Actions  | 15 min | Media      | ⭐⭐⭐⭐⭐    |
| CLI v49         | 10 min | Media      | ⭐⭐⭐        |

---

## 🆘 Si Necesitas Ayuda

- Vercel Docs: https://vercel.com/docs/getting-started-with-vercel
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Support: https://vercel.com/support

---

## ✅ Tu Token de Vercel

Ya está configurado y funciona correctamente:

```
mrahnG6wAoMRYDyGA9sWXGQH
```

Usuario: `dvillagrab-7604`

---

**Recomiendo usar la Opción 1 (Dashboard Web) para un deployment inmediato y confiable.**
