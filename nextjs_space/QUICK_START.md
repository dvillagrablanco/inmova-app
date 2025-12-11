# 🚀 INMOVA - Quick Start para Deployment en Vercel

## Opción 1: Deployment Automático (Recomendado) ✨

Esta es la forma más fácil y recomendada:

### 1. Configura los Secrets en GitHub

Ve a: https://github.com/dvillagrab/inmova-app/settings/secrets/actions

Añade estos 3 secrets:

```
VERCEL_TOKEN=tu_token_de_vercel
VERCEL_ORG_ID=tu_org_id
VERCEL_PROJECT_ID=tu_project_id
```

📚 **¿Cómo obtener estos valores?** Consulta `VERCEL_DEPLOYMENT_GUIDE.md`

### 2. Haz Push a GitHub

```bash
git add .
git commit -m "feat: setup Vercel deployment"
git push origin main
```

### 3. ¡Listo! 🎉

El deployment se ejecutará automáticamente. Ver progreso en:
https://github.com/dvillagrab/inmova-app/actions

---

## Opción 2: Deployment Manual Rápido ⚡

Si prefieres hacerlo manualmente desde tu máquina:

### 1. Da permisos al script

```bash
chmod +x deploy-to-vercel.sh
```

### 2. Ejecuta el script

```bash
./deploy-to-vercel.sh
```

### 3. Sigue las instrucciones

El script te guiará paso a paso.

---

## 📊 Monitoreo

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Actions**: https://github.com/dvillagrab/inmova-app/actions
- **Tu App**: https://inmova.app

---

## 🆘 ¿Necesitas Ayuda?

Consulta la guía completa: `VERCEL_DEPLOYMENT_GUIDE.md`

---

## ✅ Verificación de Deployment

Despues del deployment, verifica que todo funcione:

```bash
# Verifica que el sitio esté accesible
curl -I https://inmova.app

# Verifica que Next.js responda
curl -s https://inmova.app | grep -i "next"
```

Si ves código HTML y no errores, ¡está funcionando! 🎉
