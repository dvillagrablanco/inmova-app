# 🚀 Despliegue Rápido en Vercel - INMOVA

## ✅ Problema Resuelto

**Problema**: Agotamiento de memoria del compilador TypeScript durante el build  
**Solución**: Configuración optimizada con 8GB de memoria para el proceso de build

---

## 💻 Opción 1: Despliegue mediante CLI (5 minutos)

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Autenticarse
```bash
vercel login
```

### 3. Desplegar
```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
vercel
```

### 4. Producción
```bash
vercel --prod
```

🎉 **¡Listo!** Tu app estará en: `https://tu-proyecto.vercel.app`

---

## 👁️ Opción 2: Despliegue mediante Dashboard (10 minutos)

### 1. Crear repositorio Git

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
git init
git add .
git commit -m "Initial commit"
```

### 2. Subir a GitHub

```bash
# Crea primero el repositorio en GitHub
git remote add origin https://github.com/tu-usuario/inmova.git
git branch -M main
git push -u origin main
```

### 3. Importar en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Clic en "New Project"
3. Importa tu repositorio
4. Clic en "Deploy"

---

## ⚙️ Variables de Entorno IMPORTANTES

En **Vercel Dashboard > Project Settings > Environment Variables**, agrega:

### Esenciales
```bash
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/db

# NextAuth
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=genera_con_openssl_rand_base64_32

# Optimización (ya configurado en .env pero reconfírmalo)
NODE_OPTIONS=--max-old-space-size=8192
```

### AWS S3 (si aplica)
```bash
AWS_BUCKET_NAME=tu-bucket
AWS_FOLDER_PREFIX=tu-prefix
AWS_REGION=eu-west-1
```

### Stripe (si aplica)
```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🔧 Si el Build Falla en Vercel

### Aumentar recursos

1. Ve a **Project Settings > General**
2. **Function Memory**: 3008 MB
3. **Function Duration**: 60s
4. **Build Command**: Ya está configurado en `vercel.json`

### Si persiste el error

```bash
# Limpia la cache local
cd /home/ubuntu/homming_vidaro/nextjs_space
rm -rf .next node_modules
yarn install

# En Vercel Dashboard
# Settings > General > Scroll hasta "Deployment Protection"
# Desactiva temporalmente "Vercel Authentication" para pruebas
```

---

## ✅ Verificación Post-Despliegue

- [ ] Página principal carga
- [ ] Login funciona
- [ ] Dashboard es accesible
- [ ] APIs responden
- [ ] Imágenes se cargan
- [ ] No hay errores en consola

---

## 📊 Configuración de Dominio Personalizado

### En Vercel Dashboard:

1. **Domains** > **Add Domain**
2. Ingresa: `inmova.app`
3. Configura DNS:
   ```
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```

---

## 📘 Archivos de Configuración Creados

- ✅ `vercel.json` - Configuración principal de Vercel
- ✅ `.vercelignore` - Archivos excluidos del build
- ✅ `.npmrc` - Configuración de Node.js
- ✅ `tsconfig.json` - Optimizado para reducir memoria
- ✅ `NODE_OPTIONS` en `.env` - 8GB de memoria

---

## 🆘 Ayuda Rápida

### Ver logs en tiempo real
```bash
vercel logs
```

### Ver deployments
```bash
vercel list
```

### Rollback a versión anterior
```bash
vercel rollback
```

### Eliminar proyecto
```bash
vercel remove tu-proyecto
```

---

## 📄 Documentación Completa

Para más detalles, consulta: **DESPLIEGUE_VERCEL.md** en el directorio raíz del proyecto.

---

## ✅ Estado Actual

- ✅ Problema de memoria resuelto
- ✅ TypeScript configurado (strict: false)
- ✅ Build command optimizado
- ✅ Variables de entorno configuradas
- ✅ Archivos de configuración creados
- ✅ Listo para desplegar

---

**Última actualización**: Diciembre 2024  
**Versión de Node.js recomendada**: 18.x o superior  
**Memoria de build**: 8GB
