# ✅ Fix: Error de Servidor al Hacer Login

**Fecha**: 2 de enero de 2026  
**Problema**: Error de servidor al intentar hacer login

## Diagnóstico

### Error Detectado
```
[next-auth][error][NO_SECRET]
Please define a `secret` in production.
```

**Causa**: Durante el último deploy, el archivo `.env.production` se perdió o las variables de entorno no se cargaban correctamente, causando que `NEXTAUTH_SECRET` no estuviera disponible.

## Solución Aplicada

### 1. Recreado `.env.production`
Archivo completo con todas las variables necesarias:
```bash
DATABASE_URL="postgresql://inmova_user:***@localhost:5432/inmova_production"
NEXTAUTH_SECRET="ad32775ad089b66e2fde..."
NEXTAUTH_URL="http://157.180.119.236"
NODE_ENV=production
```

### 2. Recreado `start-with-env.sh`
Script que carga las variables de entorno antes de iniciar la aplicación:
```bash
#!/bin/bash
set -a
source /opt/inmova-app/.env.production
set +a
cd /opt/inmova-app
exec npm start
```

### 3. Reiniciado PM2
```bash
pm2 restart inmova-app
```

## Verificación

### Test de Login
```
✅ Login exitoso
✅ Session API responde correctamente
✅ Redirección a dashboard funciona
```

### Credenciales de Test
```
URL: http://157.180.119.236/login
Email: admin@inmova.app
Password: Admin123!
```

## Archivos Afectados

### Servidor (157.180.119.236)
- `/opt/inmova-app/.env.production` - Recreado
- `/opt/inmova-app/start-with-env.sh` - Recreado

## Estado Final

✅ Login funcionando correctamente  
✅ Variables de entorno cargadas  
✅ PM2 estable  
✅ Aplicación respondiendo  

## Prevención

Para evitar este problema en futuros deploys:

1. **Backup de .env.production** antes de cada deploy
2. **Verificar variables** después de git pull/reset
3. **Script de deploy** debe incluir:
   ```bash
   # Backup
   cp .env.production .env.production.backup
   
   # Deploy
   git pull
   
   # Restore si se perdió
   if [ ! -f .env.production ]; then
       cp .env.production.backup .env.production
   fi
   ```

## Scripts Creados

- `/workspace/scripts/fix-nextauth-urgente.py` - Fix rápido de NEXTAUTH_SECRET

---

**Tiempo de resolución**: 5 minutos  
**Estado**: ✅ Resuelto  
**Servidor**: http://157.180.119.236
