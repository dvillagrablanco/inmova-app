# 🚀 Quick Start: Deploy INMOVA a Vercel en 15 minutos

## Paso 1: Subir a Git (si aún no está)

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space

# Inicializar repo
git init

# Crear .gitignore
cat > .gitignore << 'EOF'
node_modules
.next
.env
.env.local
*.log
core
.build
EOF

# Commit
git add .
git commit -m "Preparado para Vercel"

# Subir a GitHub (crea el repo primero en github.com)
git remote add origin https://github.com/tu-usuario/inmova.git
git push -u origin main
```

## Paso 2: Deploy en Vercel

1. Ve a https://vercel.com
2. Login con: `dvillagra@vidaroinversiones.com` / `Pucela00`
3. Click en **"Add New..."** → **"Project"**
4. Conecta tu cuenta de GitHub
5. Selecciona el repositorio `inmova`
6. Configurar:
   - **Root Directory**: `nextjs_space`
   - **Build Command**: `yarn prisma generate && yarn build`
   - **Output Directory**: `.next`

## Paso 3: Añadir Variables de Entorno

En la misma página, antes de hacer deploy, pega estas variables:

```bash
DATABASE_URL=postgresql://role_587683780:5kWw7vKJBDp9ZA2Jfkt5BdWrAjR0XDe5@db-587683780.db003.hosteddb.reai.io:5432/587683780?connect_timeout=15
NEXTAUTH_SECRET=wJqizZO73C6pU4tjLTNwzjeoGLaMWvr9
NEXTAUTH_URL=https://inmova.app
AWS_REGION=us-west-2
AWS_BUCKET_NAME=abacusai-apps-030d8be4269891ba0e758624-us-west-2
AWS_FOLDER_PREFIX=12952/
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib27SzV9p3F-Jq-6-kxq9RwD9qdL4U3JfYxSh_Vu_WG2cEg8u7kJ7-vQTmE
VAPID_PRIVATE_KEY=p-K-PxeghWxVyGxvxHYVsT3xhp5fKWvUqNfNqN-J4XM
ABACUSAI_API_KEY=a66d474df9e547058d3b977b3771d53b
CRON_SECRET=inmova-cron-secret-2024-secure-key-xyz789
ENCRYPTION_KEY=151b21e7b3a0ebb00a2ff5288f3575c9d4167305d3a84ccd385564955adefd2b
NEXT_PUBLIC_VIDEO_URL=https://www.youtube.com/embed/zm55Gdl5G1Q
```

## Paso 4: Deploy

1. Click en **"Deploy"**
2. Espera 5-10 minutos
3. ¡Listo! Tu app estará en: `https://tu-proyecto.vercel.app`

## Paso 5: Configurar inmova.app

### En Vercel:
1. Ve a **Settings** → **Domains**
2. Añade: `inmova.app`
3. Vercel te dará estos registros DNS:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

### En tu proveedor DNS (donde compraste inmova.app):
1. Ve a la sección de DNS
2. Añade los registros de arriba
3. Guarda y espera 5-30 minutos

## Paso 6: Actualizar NEXTAUTH_URL

**MUY IMPORTANTE**: Después de configurar el dominio:

1. Ve a **Settings** → **Environment Variables**
2. Edita `NEXTAUTH_URL`
3. Cambia a: `https://inmova.app`
4. Guarda
5. Ve a **Deployments** → Click en los 3 puntos del último deployment → **Redeploy**

## ✅ Verificación

Visita `https://inmova.app` y verifica:

- [ ] La página carga
- [ ] Login funciona
- [ ] Dashboard muestra datos
- [ ] Imágenes se ven

## 🔥 Si algo falla

1. Ve a tu proyecto en Vercel
2. Click en **Deployments** → Último deployment
3. Click en **Runtime Logs**
4. Busca errores en rojo

Errores comunes:
- **Database connection failed**: Verifica `DATABASE_URL`
- **NEXTAUTH_URL not defined**: Añade la variable
- **Build timeout**: Aumenta timeout en Settings → Functions

## 📞 Ayuda

Si necesitas ayuda:
- Revisa `DEPLOYMENT_VERCEL.md` para guía completa
- Contacta soporte de Vercel (responden en < 24h en plan Pro)
- Revisa: https://vercel.com/docs

---

**¡Eso es todo!** 🎉
