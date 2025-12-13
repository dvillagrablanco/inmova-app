# Guía de Deployment - INMOVA

## 📋 Prerrequisitos

### Cuentas Necesarias
1. **GitHub** - Para el repositorio de código
2. **Vercel** - Para el hosting
3. **PostgreSQL Database** (recomendado: Vercel Postgres, Supabase, o Neon)
4. **AWS S3** - Para almacenamiento de archivos
5. **Stripe** - Para pagos (opcional pero recomendado)

## 🚀 Pasos de Deployment

### 1. Preparar el Repositorio en GitHub

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit - INMOVA platform"

# Crear repositorio en GitHub y conectar
git remote add origin https://github.com/tu-usuario/tu-repo.git
git branch -M main
git push -u origin main
```

### 2. Configurar Base de Datos PostgreSQL

#### Opción A: Vercel Postgres (Recomendado)
1. Ve a tu dashboard de Vercel
2. Selecciona "Storage" > "Create Database"
3. Elige "Postgres"
4. Copia la `DATABASE_URL`

#### Opción B: Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a Settings > Database
3. Copia la Connection String (Transaction Pooler)

#### Opción C: Neon
1. Crea una cuenta en [neon.tech](https://neon.tech)
2. Crea un nuevo proyecto
3. Copia la Connection String

### 3. Ejecutar Migraciones de Prisma

```bash
# Instalar dependencias
yarn install

# Generar cliente de Prisma
yarn prisma generate

# Ejecutar migraciones
yarn prisma migrate deploy

# Opcional: Seed inicial de datos
yarn prisma db seed
```

### 4. Configurar Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. Settings > Environment Variables
3. Agrega las siguientes variables (ver `.env.example`):

#### Variables Requeridas:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<genera-uno-con-openssl>
NEXTAUTH_URL=https://tu-dominio.vercel.app
AWS_REGION=us-west-2
AWS_BUCKET_NAME=tu-bucket
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

#### Generar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 5. Configurar AWS S3

1. Crea un bucket en AWS S3
2. Configura CORS:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://tu-dominio.vercel.app"],
    "ExposeHeaders": ["ETag"]
  }
]
```
3. Crea un usuario IAM con permisos de S3
4. Guarda las credenciales

### 6. Deploy en Vercel

#### Opción A: Desde el Dashboard de Vercel
1. Ve a [vercel.com](https://vercel.com)
2. "Add New" > "Project"
3. Importa tu repositorio de GitHub
4. Configura las variables de entorno
5. Deploy!

#### Opción B: Desde CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 7. Configurar Dominio Personalizado (Opcional)

1. En Vercel, ve a Settings > Domains
2. Agrega tu dominio (ejemplo: `inmova.app`)
3. Actualiza los DNS según las instrucciones
4. Actualiza `NEXTAUTH_URL` con tu dominio

### 8. Post-Deployment

#### Crear Usuario Administrador
```bash
# Conecta a tu base de datos de producción
# Opción 1: Desde Vercel CLI
vercel env pull

# Opción 2: Ejecuta el script de creación
node scripts/create-admin-user.ts
```

#### Verificar Configuración
1. ✅ La aplicación carga correctamente
2. ✅ Puedes hacer login
3. ✅ Las imágenes se cargan (S3)
4. ✅ Los pagos funcionan (Stripe - en modo test)
5. ✅ Las notificaciones funcionan

## 🔧 Configuración Adicional

### Webhooks de Stripe
1. Ve a Stripe Dashboard > Developers > Webhooks
2. Agrega endpoint: `https://tu-dominio.vercel.app/api/stripe/webhook`
3. Selecciona eventos necesarios
4. Copia el Signing Secret
5. Agrega como `STRIPE_WEBHOOK_SECRET` en Vercel

### Configurar Notificaciones Push (Opcional)
```bash
# Generar VAPID keys
npx web-push generate-vapid-keys
```
Agrega las keys en Vercel como:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

### Configurar Sentry (Monitoreo de Errores)
1. Crea proyecto en [sentry.io](https://sentry.io)
2. Copia el DSN
3. Agrega como `NEXT_PUBLIC_SENTRY_DSN` en Vercel

## 📊 Monitoreo y Mantenimiento

### Logs
```bash
# Ver logs en tiempo real
vercel logs tu-proyecto --follow
```

### Analytics
- Vercel Analytics (incluido)
- Vercel Speed Insights (incluido)
- Google Analytics (configurar en código)

### Backups de Base de Datos
```bash
# Backup manual
pg_dump $DATABASE_URL > backup.sql
```

Configura backups automáticos en tu proveedor de base de datos.

## 🐛 Troubleshooting

### Error: Prisma Client no encontrado
```bash
# Regenerar cliente
yarn prisma generate
```

### Error: Variables de entorno no definidas
- Verifica que todas las variables estén en Vercel
- Verifica que `NEXT_PUBLIC_` esté en variables que necesitan estar en el cliente

### Error: Base de datos no conecta
- Verifica que la DATABASE_URL sea correcta
- Verifica que el IP de Vercel esté whitelisted en tu DB

### Build falla
```bash
# Limpiar caché
rm -rf .next node_modules
yarn install
yarn build
```

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Stripe](https://stripe.com/docs)

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel
2. Verifica las variables de entorno
3. Consulta la documentación
4. Contacta al equipo de desarrollo

---

**Última actualización:** Diciembre 2025  
**Versión:** 1.0  
**Plataforma:** INMOVA - Sistema de Gestión Inmobiliaria