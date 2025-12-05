# ⚡ Quick Start - Deploy INMOVA en Vercel (5 minutos)

## 🎯 Pasos Mínimos para Deploy

### 1️⃣ Preparar Repositorio (2 minutos)

```bash
# En tu terminal local
cd /ruta/a/homming_vidaro

# Inicializar git
git init
git add .
git commit -m "Initial commit"

# Crear repo en GitHub y pushear
git remote add origin https://github.com/TU_USUARIO/inmova-app.git
git branch -M main
git push -u origin main
```

### 2️⃣ Import en Vercel (1 minuto)

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Click "Import" en tu repositorio
3. Configura:
   - **Framework**: Next.js
   - **Root Directory**: `nextjs_space`
   - **Build Command**: `yarn build`

### 3️⃣ Variables de Entorno MÍNIMAS (2 minutos)

En Vercel > Project Settings > Environment Variables, agrega:

```bash
# Database (OBLIGATORIO)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Auth (OBLIGATORIO - genera con: openssl rand -base64 32)
NEXTAUTH_SECRET=tu_secret_generado
NEXTAUTH_URL=https://tu-proyecto.vercel.app

# S3 (OBLIGATORIO para uploads)
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=tu_key
AWS_SECRET_ACCESS_KEY=tu_secret
AWS_BUCKET_NAME=tu-bucket
```

### 4️⃣ Deploy y Migrar DB

```bash
# Después del primer deploy
vercel env pull .env.local
cd nextjs_space
yarn prisma db push
yarn tsx scripts/create-super-admin.ts
```

---

## ✅ ¡Listo!

**Login**: https://tu-proyecto.vercel.app/login

**Credenciales**:
- Email: `superadmin@inmova.com`
- Password: `superadmin123`

---

## 🔗 Recursos

- [Guía Completa de Deployment](./DEPLOYMENT_VERCEL.md)
- [Variables de Entorno](./nextjs_space/.env.example)
- [Troubleshooting](./DEPLOYMENT_VERCEL.md#-troubleshooting)

---

## 📞 ¿Problemas?

**Error común**: "Database connection failed"
```bash
# Asegúrate de que DATABASE_URL incluye ?sslmode=require
```

**Error común**: "Module not found"
```bash
vercel --prod --force  # Limpia cache y redeploy
```

---

💡 **Tip**: Revisa los logs en tiempo real con:
```bash
vercel logs --follow
```
