# 🔑 Cómo Obtener Token de Vercel para Deployment Automático

Para que yo pueda hacer el deployment directamente, necesito un token de autenticación de Vercel.

## 🚀 OPCIÓN 1: Obtener Token de Vercel (2 minutos)

### Paso 1: Crear Token

1. **Ve a**: https://vercel.com/account/tokens
2. **Login** con tu cuenta (dvillagra@vidaroinversiones.com)
3. **Click** en "Create Token"
4. **Nombre**: `deployment-token` (o el que prefieras)
5. **Scope**: Full Access (o solo el proyecto workspace)
6. **Expiration**: Never (o el tiempo que prefieras)
7. **Click** "Create"
8. **Copiar** el token (aparece una sola vez)

### Paso 2: Darme el Token

Una vez que tengas el token, hay 2 formas:

#### Método A: Configurar como variable de entorno (MÁS SEGURO)

```bash
export VERCEL_TOKEN="tu_token_aqui"
```

Luego yo puedo ejecutar:

```bash
vercel --token=$VERCEL_TOKEN --prod
```

#### Método B: Pasármelo directamente

Simplemente pégalo en el chat y yo lo usaré para hacer el deployment.

---

## 🚀 OPCIÓN 2: Yo te Guío Paso a Paso (5 minutos)

Si prefieres que te guíe mientras lo haces tú:

1. Abre: https://vercel.com/dashboard
2. Ve a: Settings → Environment Variables
3. Yo te diré exactamente qué variables agregar
4. Haces clic en Redeploy
5. ¡Listo!

---

## ⚡ OPCIÓN 3: Deployment Automático desde GitHub (RECOMENDADO)

Si conectas el repo de GitHub a Vercel:

1. Ve a: https://vercel.com/new
2. Import: dvillagrablanco/inmova-app
3. Vercel hace auto-deploy en cada push
4. Solo necesitas configurar las variables una vez

**Ventaja**: No necesitas token, todo automático.

---

## 🔐 Seguridad del Token

**IMPORTANTE**:

- El token da acceso a tu cuenta de Vercel
- No lo compartas públicamente
- Yo lo usaré solo para este deployment
- Puedes revocarlo después en: https://vercel.com/account/tokens

---

## 📝 ¿Qué Haré con el Token?

Una vez que me des el token, haré:

1. ✅ Autenticarme en Vercel CLI
2. ✅ Configurar las variables de entorno necesarias:
   - NEXTAUTH_URL
   - NEXTAUTH_SECRET
   - DATABASE_URL
   - ENCRYPTION_KEY
   - NODE_ENV
3. ✅ Ejecutar deployment a producción
4. ✅ Verificar que todo funcione
5. ✅ Darte el URL del sitio funcionando

**Tiempo total**: 2-3 minutos

---

## 🎯 ¿Qué Opción Prefieres?

**Si tienes el token ya**:
→ Solo pégalo aquí y yo hago todo

**Si no tienes token**:
→ Ve a https://vercel.com/account/tokens y créalo (2 min)

**Si prefieres hacerlo tú con mi guía**:
→ Abre Vercel Dashboard y te guío paso a paso

**Si prefieres auto-deploy desde GitHub**:
→ Conecta el repo en https://vercel.com/new

---

## ⏱️ Comparación de Opciones

| Opción                  | Tiempo | Dificultad | Resultado          |
| ----------------------- | ------ | ---------- | ------------------ |
| **Dame el token**       | 2 min  | Muy fácil  | Yo hago todo       |
| **Te guío paso a paso** | 5 min  | Fácil      | Tú lo haces        |
| **Auto-deploy GitHub**  | 3 min  | Muy fácil  | Automático siempre |

---

## 🚀 Mi Recomendación

**Para ahora**: Dame el token → Yo hago el deployment  
**Para futuro**: Conecta GitHub → Auto-deploy siempre

---

¿Qué opción prefieres?
