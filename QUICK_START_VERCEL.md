# ⚡ Quick Start - Desplegar INMOVA a Vercel

## 🚀 En 3 Comandos

```bash
# 1. Autenticarte con Vercel
vercel login

# 2. Desplegar
./deploy-to-vercel.sh

# 3. Configurar variables de entorno en Vercel Dashboard
# https://vercel.com/tu-proyecto/settings/environment-variables
```

## 📋 Secrets Generados (Cópialos ahora)

```env
NEXTAUTH_SECRET=34Z15OHM7VJIU5JTX4LlbGRvlFkX6VGRY3HYlghi+YY=
ENCRYPTION_KEY=2ae9029120303be4a34206d19364ea8d3f3f33232bd234f5a0ae8e4e18565a2f
CRON_SECRET=0a1012992791d1a0e7108e3716667cf516dd81776a281d4c317818bfcd39e38d
```

## ⚠️ Variables Que DEBES Configurar

Mínimo necesario para que funcione:

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=<copiar de arriba>
NEXTAUTH_URL=https://tu-proyecto.vercel.app
AWS_REGION=eu-west-1
AWS_BUCKET_NAME=tu-bucket
AWS_FOLDER_PREFIX=inmova
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
ABACUSAI_API_KEY=tu-api-key
ENCRYPTION_KEY=<copiar de arriba>
CRON_SECRET=<copiar de arriba>
```

## 📚 Documentación Completa

- `DEPLOYMENT_READY.md` - Estado completo y plan de deployment
- `DEPLOYMENT_INSTRUCTIONS.md` - Guía paso a paso detallada
- `GITHUB_ACTIONS_SETUP.md` - CI/CD automático
- `.env.vercel.template` - Todas las variables disponibles

## ⏱️ Tiempo Estimado

- ⚡ Deployment: 5 minutos
- ⚙️ Configuración variables: 10 minutos
- 🌐 Dominio custom: 15 minutos
- **Total: 30 minutos**

---

**¿Problemas?** Lee `DEPLOYMENT_READY.md` para troubleshooting completo.
