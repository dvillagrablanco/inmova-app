# ⚡ INSTRUCCIONES URGENTES - Configurar Railway para inmovaapp.com

**Fecha**: 28 Dic 2025  
**PRIORIDAD**: 🔴 CRÍTICA

---

## 🚨 PROBLEMA ACTUAL

NextAuth está crasheando en **www.inmovaapp.com** con HTTP 500 porque:

1. ❌ `NEXTAUTH_URL` está configurado para `www.inmova.app` (dominio incorrecto)
2. ⚠️ `DATABASE_URL` puede no estar configurada correctamente

---

## ✅ SOLUCIÓN INMEDIATA (5 MINUTOS)

### Paso 1: Acceder a Railway

1. Ve a: **https://railway.app/dashboard**
2. Login con tu cuenta
3. Busca tu proyecto (probablemente se llama similar a `inmova-app` o `loving-creation`)
4. Click en el servicio/proyecto

### Paso 2: Verificar/Actualizar Variables de Entorno

1. En el panel del proyecto, click en la pestaña **"Variables"**
2. Busca estas variables y verifica sus valores:

#### Variables CRÍTICAS:

```bash
# ✅ DEBE SER EXACTAMENTE ASÍ:
NEXTAUTH_URL=https://www.inmovaapp.com

# ✅ DEBE EXISTIR Y SER VÁLIDA:
NEXTAUTH_SECRET=l7AMZ3AiGDSBNBrcXLCpEPiapxYSGZielDF7bUauXGI=

# ✅ DEBE EXISTIR - Verifica que tenga este formato:
DATABASE_URL=postgresql://usuario:password@host.railway.app:5432/nombre_db

# ✅ DEBE SER:
NODE_ENV=production
```

### Paso 3: Actualizar NEXTAUTH_URL

Si `NEXTAUTH_URL` dice `www.inmova.app` o algo diferente:

1. Click en **"NEXTAUTH_URL"**
2. Cambiar valor a: `https://www.inmovaapp.com`
3. Click en **"Save"** o presiona Enter

**¡MUY IMPORTANTE!**: Railway redeploya automáticamente al cambiar variables

### Paso 4: Verificar DATABASE_URL

1. Busca la variable `DATABASE_URL`
2. **Si NO existe**:
   - Click en **"New Variable"**
   - Nombre: `DATABASE_URL`
   - Valor: (obtener de PostgreSQL service en Railway)
3. **Si existe**: Verificar que tenga el formato correcto:
   ```
   postgresql://usuario:password@host.railway.app:5432/database
   ```

---

## 🔍 CÓMO OBTENER DATABASE_URL CORRECTO

### Si tienes PostgreSQL service en Railway:

1. En el proyecto, busca el servicio **PostgreSQL**
2. Click en PostgreSQL service
3. Ir a pestaña **"Connect"** o **"Variables"**
4. Copiar el valor de **"DATABASE_URL"** o **"POSTGRES_URL"**
5. Pegarlo en las variables del servicio principal

### Formato esperado:

```
postgresql://postgres:PASSWORD@containers-us-west-XXX.railway.app:5432/railway
```

**Nota**: El host termina en `.railway.app` y el puerto es `5432`

---

## ⏱️ TIMELINE ESPERADO

```
00:00 - Actualizar variables
00:01 - Railway detecta cambios
00:02 - Build iniciando
05:00 - Build completa
06:00 - Deploy completa
07:00 - ✅ Sitio funcionando
```

---

## ✅ VERIFICACIÓN POST-DEPLOYMENT

### Después de ~7 minutos, verificar:

1. **API Auth funciona**:

   ```bash
   curl -i https://www.inmovaapp.com/api/auth/session

   # Debe responder:
   # HTTP/2 200
   # {"user":null}
   ```

2. **Health Check funciona**:

   ```bash
   curl -s https://www.inmovaapp.com/api/health-check | jq .

   # Debe mostrar:
   # {
   #   "status": "healthy",
   #   "services": {
   #     "database": {"status": "healthy"},
   #     ...
   #   }
   # }
   ```

3. **Sitio carga sin errores**:
   - Abre: https://www.inmovaapp.com
   - Abre consola del navegador (F12)
   - NO deberías ver errores de NextAuth

---

## 🚨 SI ALGO FALLA

### Error: "Build failed"

**Solución**:

1. Ve a Railway Dashboard → Deployments → View Logs
2. Busca errores tipo:
   - `Prisma Client could not be generated`
   - `Out of memory`
   - `Cannot find module`

3. Si ves "Out of memory":
   - Settings → Change plan (temporalmente)
   - O en Build Command agregar: `NODE_OPTIONS="--max-old-space-size=4096" yarn build`

### Error: "Database connection failed"

**Solución**:

1. Verifica que PostgreSQL service está running
2. Verifica que DATABASE_URL es correcto
3. En PostgreSQL service → Settings → Restart

### Error: "NEXTAUTH_URL mismatch"

**Solución**:

1. Verifica EXACTAMENTE: `https://www.inmovaapp.com`
2. Sin `/` al final
3. Con `https://`
4. Con `www.`

---

## 📸 SCREENSHOTS DE DÓNDE CONFIGURAR

### 1. Localizar Variables:

```
Railway Dashboard
  └── Tu Proyecto
       └── inmova-app (o similar)
            └── Tab: "Variables" ← AQUÍ
```

### 2. Ver el formato esperado:

```
Variables mostradas como:

┌──────────────────┬──────────────────────────────────┐
│ Name             │ Value                             │
├──────────────────┼───────────────────────────────────┤
│ NEXTAUTH_URL     │ https://www.inmovaapp.com        │
│ NEXTAUTH_SECRET  │ l7AMZ3AiGDSBNBrcX...             │
│ DATABASE_URL     │ postgresql://postgres:...        │
│ NODE_ENV         │ production                        │
└──────────────────┴───────────────────────────────────┘
```

---

## 🔄 ALTERNATIVA: Redeploy Manual

Si las variables ya están correctas pero el sitio sigue fallando:

1. Railway Dashboard → Deployments
2. Click en el deployment más reciente
3. Click en **"Redeploy"**
4. Esperar ~7 minutos

---

## 📊 CHECKLIST FINAL

Antes de considerar completado:

- [ ] `NEXTAUTH_URL` = `https://www.inmovaapp.com` ✅
- [ ] `NEXTAUTH_SECRET` existe y tiene valor ✅
- [ ] `DATABASE_URL` existe y está conectando ✅
- [ ] Deployment completó exitosamente ✅
- [ ] `/api/auth/session` responde 200 ✅
- [ ] `/api/health-check` responde 200 ✅
- [ ] www.inmovaapp.com carga sin errores ✅
- [ ] Login funciona ✅

---

## 📞 SI NECESITAS AYUDA

### Ver Logs en Tiempo Real:

1. Railway Dashboard → Deployments
2. Click en deployment actual
3. Pestaña **"Build Logs"** - Ver si build completa
4. Pestaña **"Deploy Logs"** - Ver si hay errores al iniciar

### Buscar Errores Específicos:

```bash
# En los logs, buscar:
- "Error: Cannot find module"
- "Prisma Client"
- "DATABASE_URL"
- "NEXTAUTH"
- "500"
```

---

## 🎯 RESULTADO ESPERADO

Una vez configurado correctamente:

✅ **www.inmovaapp.com**:

- Carga en <3 segundos
- Sin errores en consola
- Login funciona
- Dashboard accesible
- 0 errores NextAuth

✅ **APIs**:

- `/api/auth/session` → 200 OK
- `/api/health-check` → 200 OK
- Todas las rutas API funcionando

---

## 📝 NOTAS IMPORTANTES

1. **No tocar otras variables** - Solo actualizar NEXTAUTH_URL y verificar DATABASE_URL
2. **Railway redeploya automático** - No necesitas hacer nada más después de guardar
3. **Esperar 7 minutos** - El deploy completo tarda este tiempo
4. **Verificar con curl** - Más confiable que navegador para verificar APIs

---

**ÚLTIMA ACTUALIZACIÓN**: El código fue pusheado hace 2 minutos con fix para manejar errores de Prisma gracefully. Una vez que actualices las variables en Railway, todo debería funcionar perfectamente.

**¡IMPORTANTE!**: Este fix permite que NextAuth no crashee completamente si hay problemas de DB, pero DEBES configurar las variables correctamente para funcionalidad completa.
