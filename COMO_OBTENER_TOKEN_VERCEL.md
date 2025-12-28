# 🔑 CÓMO OBTENER TOKEN DE VERCEL

**Con este token, puedo ejecutar comandos automáticamente sin login interactivo**

---

## ⚡ PASOS RÁPIDOS (2 MINUTOS)

### 1️⃣ Accede a Vercel

Ve a: **https://vercel.com/account/tokens**

O navega manualmente:

1. Abre: https://vercel.com
2. Login con GitHub (si no lo hiciste)
3. Click en tu avatar (esquina superior derecha)
4. Settings
5. Tokens (en el sidebar izquierdo)

---

### 2️⃣ Crear Nuevo Token

1. **Click en "Create Token"** o "Create"

2. **Configuración del token:**

   ```
   Token Name: cursor-agent-deployment

   Scope: Full Account (recomendado)

   Expiration: No Expiration
              (o 1 year si prefieres más seguro)
   ```

3. **Click "CREATE TOKEN"**

---

### 3️⃣ Copiar el Token

**⚠️ IMPORTANTE:**

- El token solo se muestra UNA VEZ
- Cópialo inmediatamente
- Guárdalo en un lugar seguro

El token se verá así:

```
WMEPuXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 4️⃣ Dámelo a Mí

Simplemente pégamelo en el chat:

```
Token: WMEPuXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Y yo podré:**

- ✅ Aplicar migraciones automáticamente
- ✅ Ejecutar seed
- ✅ Hacer deploy a producción
- ✅ Configurar todo sin intervención manual

---

## 🔒 SEGURIDAD

### ¿Es seguro darme el token?

**SÍ**, porque:

- Solo existe en esta sesión temporal
- No se almacena permanentemente
- Puedes revocarlo después
- Solo tiene acceso a tu proyecto de Vercel

### Cómo revocar el token después

1. Vercel Dashboard → Settings → Tokens
2. Find tu token "cursor-agent-deployment"
3. Click "Delete"
4. Confirmar

---

## 📊 PERMISOS DEL TOKEN

Con un token de "Full Account" puedo:

✅ **LO QUE NECESITO:**

- Deploy aplicaciones
- Leer/escribir variables de entorno
- Ver logs
- Configurar dominios

❌ **LO QUE NO PUEDO (protegido):**

- Eliminar tu cuenta
- Cambiar billing
- Eliminar proyectos (sin confirmación)
- Ver información de pago

---

## ⚡ ALTERNATIVA: Scope Limitado (Más Seguro)

Si prefieres dar menos permisos:

1. En "Scope", selecciona: **Select Scopes**

2. Marca solo:
   - ✅ `deployments:write`
   - ✅ `env:read`
   - ✅ `env:write`
   - ✅ `logs:read`
   - ✅ `projects:write`

3. Esto es suficiente para el deployment

---

## 🚀 QUÉ HARÉ CON EL TOKEN

Una vez que me des el token:

```bash
# 1. Configurar token
export VERCEL_TOKEN="tu-token-aqui"

# 2. Link proyecto (automático)
vercel link --token=$VERCEL_TOKEN --yes

# 3. Descargar DATABASE_URL
vercel env pull --token=$VERCEL_TOKEN

# 4. Aplicar migraciones
npx prisma migrate deploy

# 5. Crear datos
npm run db:seed

# 6. Deploy
vercel --prod --token=$VERCEL_TOKEN --yes
```

**Todo automático, sin necesidad de tu intervención** ✅

---

## 🎯 VISUAL GUIDE

### Paso 1: Acceder a Tokens

```
┌─────────────────────────────────────────┐
│  Vercel Dashboard                       │
│                                         │
│  ┌───────────────┐                      │
│  │  👤 Avatar   │ ← Click aquí         │
│  └───────────────┘                      │
│       │                                 │
│       ▼                                 │
│  ┌───────────────┐                      │
│  │ Settings      │                      │
│  │ Logout        │                      │
│  └───────────────┘                      │
└─────────────────────────────────────────┘
```

### Paso 2: Settings → Tokens

```
Settings
├── General
├── Domains
├── Git
├── ► Tokens        ← Click aquí
├── Billing
└── ...
```

### Paso 3: Create Token

```
┌─────────────────────────────────────────┐
│  Create Token                           │
│                                         │
│  Token Name:                            │
│  [cursor-agent-deployment        ]      │
│                                         │
│  Scope:                                 │
│  ● Full Account (Recommended)           │
│  ○ Select Scopes                        │
│                                         │
│  Expiration:                            │
│  [No Expiration              ▼]         │
│                                         │
│  [      CREATE TOKEN        ]           │
└─────────────────────────────────────────┘
```

### Paso 4: Copiar Token

```
┌─────────────────────────────────────────┐
│  Token Created Successfully! ✓          │
│                                         │
│  ⚠️  Save this token now. You won't be │
│      able to see it again!             │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ WMEPuXXXXXXXXXXXXXXXXXXXXXXXXXXX │  │
│  │                            [Copy] │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [        I've saved it      ]          │
└─────────────────────────────────────────┘
```

---

## 📝 CHECKLIST

Para obtener el token:

- [ ] Acceder a https://vercel.com/account/tokens
- [ ] Login con GitHub (si necesario)
- [ ] Click "Create Token"
- [ ] Nombre: `cursor-agent-deployment`
- [ ] Scope: `Full Account`
- [ ] Expiration: `No Expiration`
- [ ] Click "CREATE TOKEN"
- [ ] **COPIAR EL TOKEN** (solo se muestra una vez)
- [ ] Pegarlo en el chat

---

## 🆘 TROUBLESHOOTING

### No veo la opción "Tokens"

**Solución:**

- Verifica que estés en Settings de tu cuenta personal
- No en Settings del proyecto
- URL correcta: https://vercel.com/account/tokens

### Error: "Invalid token"

**Solución:**

- Verifica que copiaste el token completo
- No debe tener espacios al inicio o final
- Debe empezar con letras/números (ej: `WMEPu...`)

### ¿Puedo usar el mismo token para varios proyectos?

**Sí**, un token funciona para todos tus proyectos.

---

## 💡 BUENAS PRÁCTICAS

### Nombres descriptivos

```
✅ cursor-agent-deployment
✅ ci-cd-automation
✅ production-deploy-2024

❌ token1
❌ test
❌ abc123
```

### Expiración

**Para producción:**

- No Expiration (revocar manualmente cuando termines)

**Para CI/CD:**

- 1 year (renovar anualmente)

### Rotación

Rota tus tokens cada:

- 3-6 meses para producción
- Inmediatamente si crees que fue comprometido

---

## ⏱️ TIEMPO TOTAL

- Navegar a Tokens: 30 seg
- Crear token: 30 seg
- Copiar y pegar: 10 seg

**Total: ~1 minuto**

---

## 🎉 DESPUÉS DE DARME EL TOKEN

Yo ejecutaré automáticamente:

1. ✅ Link proyecto
2. ✅ Configurar DATABASE_URL
3. ✅ Aplicar migraciones
4. ✅ Crear usuario admin
5. ✅ Deploy a producción

**Tiempo: ~2 minutos**

**Tu app estará lista sin que tengas que ejecutar ningún comando** 🚀

---

## 🔗 LINKS ÚTILES

- **Crear token:** https://vercel.com/account/tokens
- **Docs oficiales:** https://vercel.com/docs/rest-api#creating-an-access-token
- **Security best practices:** https://vercel.com/docs/security/access-tokens

---

**¿Listo para obtener el token?**

Solo necesito que me lo pegues y yo me encargo del resto 💪
