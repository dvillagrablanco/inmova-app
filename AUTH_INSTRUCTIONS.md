# 🔐 Instrucciones de Autenticación - Vercel

## Situación Actual

El deployment está esperando tu autenticación en Vercel.

---

## ✅ Opción 1: Autenticación con Código de Dispositivo (Actual)

### Paso 1: Abre el enlace de autenticación
```
https://vercel.com/oauth/device?user_code=XRQW-PDSD
```

### Paso 2: Inicia sesión
- Email: `dvillagra@vidaroinversiones.com`
- User ID: `pAzq4g0vFjJlrK87sQhlw08I`

### Paso 3: Autoriza el acceso
- Vercel te pedirá autorización
- Haz clic en "Authorize" o "Permitir"

### Paso 4: Continúa el deployment
Una vez autenticado, vuelve a ejecutar:
```bash
./deploy-to-vercel.sh
```

---

## ⚡ Opción 2: Usar Token de Vercel (Más Rápido)

### Paso 1: Crear un token
1. Ve a: https://vercel.com/account/tokens
2. Haz clic en "Create Token"
3. Nombre: `inmova-deployment`
4. Scope: Full Account
5. Copia el token

### Paso 2: Configurar el token
```bash
export VERCEL_TOKEN=tu_token_aqui
```

### Paso 3: Desplegar
```bash
# Opción A: Script rápido
./deploy-now.sh

# Opción B: Script completo con token
./deploy-with-token.sh

# Opción C: Comando directo
vercel --token="$VERCEL_TOKEN" --yes
vercel --prod --token="$VERCEL_TOKEN" --yes
```

---

## 🖥️ Opción 3: Desde tu Terminal Local

Si estás trabajando en tu computadora local, abre una terminal:

```bash
cd /workspace

# Autenticarte (abre navegador automáticamente)
vercel login

# Desplegar a preview
vercel

# Desplegar a producción
vercel --prod
```

---

## 📋 Variables de Entorno POST-Deployment

Después de tu primer deployment, **DEBES configurar** estas variables en Vercel:

### Via Dashboard Web:
1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Settings → Environment Variables
4. Añade cada variable:

```env
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

### Via CLI:
```bash
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... etc
```

---

## 🆘 Solución de Problemas

### "Device code expired"
El código del dispositivo expira después de unos minutos. Si expira:
```bash
vercel login
```
Esto generará un nuevo código.

### "Authentication failed"
Verifica que estés usando el email correcto:
- Email: `dvillagra@vidaroinversiones.com`
- User ID: `pAzq4g0vFjJlrK87sQhlw08I`

### "Token invalid"
Si el token no funciona:
1. Genera un nuevo token en: https://vercel.com/account/tokens
2. Asegúrate de copiarlo completamente
3. Verifica que no tenga espacios al inicio/final

---

## ⏭️ Siguiente Paso

Elige UNA de estas opciones:

1. **Abrir el navegador** → https://vercel.com/oauth/device?user_code=XRQW-PDSD
2. **Usar token** → Crear token y ejecutar `./deploy-now.sh`
3. **Terminal local** → Ejecutar `vercel login` en tu computadora

Después del deployment, configura las variables de entorno en Vercel Dashboard.

---

**Documentación Completa**: Ver `DEPLOYMENT_READY.md`
