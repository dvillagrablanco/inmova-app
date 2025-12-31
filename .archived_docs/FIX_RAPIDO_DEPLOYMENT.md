# 🚀 Fix Rápido - Deployment en 10 Minutos

## 🎯 Problema

El deployment falla porque 2 archivos API están importando Prisma incorrectamente, causando error durante `yarn build`.

## ✅ Solución (5 minutos)

### Archivo 1: `/app/api/crm/import/route.ts`

**Buscar** esta línea al principio del archivo:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

**Reemplazar** con:

```typescript
import { getPrismaClient } from '@/lib/db';
```

**Y dentro de cada función** (GET, POST, etc.), cambiar:

```typescript
// ❌ Antes (usa la variable global)
const data = await prisma.user.findMany();

// ✅ Ahora (llama a la función)
const prisma = getPrismaClient();
const data = await prisma.user.findMany();
```

### Archivo 2: `/app/api/crm/leads/[id]/route.ts`

**Mismo cambio** que el archivo anterior.

## 🚀 Deployment Inmediato

### Paso 1: Commit y Push (1 min)

```bash
git add app/api/crm/import/route.ts app/api/crm/leads/\[id\]/route.ts
git commit -m "fix: use lazy-loading for Prisma Client in API routes"
git push origin main
```

### Paso 2: Deploy en Servidor (5 min)

```bash
# Conectar
ssh root@157.180.119.236
# Password: XVcL9qHxqA7f

# Actualizar y deployar
cd /home/deploy/inmova-app
git pull origin main
docker-compose -f docker-compose.simple.yml down
docker-compose -f docker-compose.simple.yml up -d --build

# Esperar 2-3 minutos y verificar
curl http://localhost:3000/api/health
```

### Paso 3: Verificar (1 min)

```bash
# Ver logs
docker-compose -f docker-compose.simple.yml logs -f app

# Verificar que responde
curl http://157.180.119.236:3000
```

## ✅ Señales de Éxito

Verás en los logs:

```
✓ Ready in XXXms
▲ Next.js 15.5.9
- Local: http://localhost:3000
```

Y el curl devolverá HTML (código de la página).

## 🌐 Acceso Web

Una vez funcionando:

- **HTTP**: http://157.180.119.236:3000
- **Health Check**: http://157.180.119.236:3000/api/health

Para HTTPS con dominio:

1. Configurar DNS: `A record @ → 157.180.119.236`
2. Esperar propagación (5-10 min)
3. Ejecutar: `certbot --nginx -d inmovaapp.com -d www.inmovaapp.com`

## ⚠️ Si Algo Falla

### Error: "Port 3000 already in use"

```bash
docker stop $(docker ps -aq)
docker-compose -f docker-compose.simple.yml up -d
```

### Error: "Cannot connect to database"

```bash
# Verificar que Postgres está corriendo
docker-compose -f docker-compose.simple.yml ps postgres

# Si no está, iniciarlo
docker-compose -f docker-compose.simple.yml up -d postgres
```

### Error: Build sigue fallando

```bash
# Ver logs completos del build
docker-compose -f docker-compose.simple.yml build app 2>&1 | less

# Verificar que los cambios se aplicaron
grep -n "getPrismaClient" app/api/crm/import/route.ts
```

## 📞 Ayuda Adicional

Si después del fix aún hay problemas, revisar:

- `DEPLOYMENT_STATUS_FINAL.md` - Estado completo
- `RESUMEN_FINAL_DEPLOYMENT.md` - Resumen ejecutivo
- `.cursorrules` - Sección "DEPLOYMENT AUTOMATIZADO CON SSH"

---

**Tiempo total estimado**: 10 minutos  
**Dificultad**: Baja  
**Requiere**: Git + SSH access al servidor
