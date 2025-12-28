# 🔑 Configuración del Token de Cloudflare

## Pasos para Crear el Token Correcto

### 1. Acceder a Cloudflare

Ve a: **https://dash.cloudflare.com/profile/api-tokens**

O navega:
```
Dashboard → Mi Perfil (esquina superior derecha) → API Tokens
```

### 2. Crear Nuevo Token

Click en **"Create Token"**

### 3. Configuración del Token

Puedes usar dos métodos:

---

## MÉTODO 1: Usar Template (Más Fácil)

### Selecciona: **"Edit zone DNS"** template

Luego modifica con estos ajustes:

#### Permisos (Permissions):

```
Zone - DNS - Edit
Zone - Zone Settings - Edit  
Zone - Zone - Read
Zone - SSL and Certificates - Edit
Zone - Cache Purge - Purge
```

#### Recursos de Zona (Zone Resources):

```
Include → Specific zone → inmovaapp.com
```

#### Recursos de Cuenta (Account Resources) - Opcional:

Si quieres usar Cloudflare R2:
```
Include → Specific account → Tu cuenta
Account - Cloudflare R2 Storage - Edit
```

#### IP Address Filtering (Opcional):

Deja vacío para acceder desde cualquier IP, o especifica IPs si quieres mayor seguridad.

#### TTL (Time to Live):

Recomendado: **Sin expiración** o **1 año**

---

## MÉTODO 2: Configuración Manual (Más Control)

### Paso a Paso:

1. Click en **"Create Custom Token"**

2. **Token name**: 
   ```
   Inmova App - inmovaapp.com
   ```

3. **Permissions** (Agregar estos permisos):

   | Resource | Permission | Acción |
   |----------|-----------|--------|
   | Zone | DNS | Edit |
   | Zone | Zone Settings | Edit |
   | Zone | Zone | Read |
   | Zone | SSL and Certificates | Edit |
   | Zone | Cache Purge | Purge |

4. **Zone Resources**:
   ```
   Include → Specific zone → inmovaapp.com
   ```

5. **Account Resources**: (Solo si usarás R2)
   ```
   Include → Specific account → [Tu cuenta]
   ```

6. **Client IP Address Filtering**: (Opcional)
   ```
   Dejar vacío o agregar IPs específicas
   ```

7. **TTL**: 
   ```
   Selecciona: Start now
   Selecciona: No expiry (o 1 year si prefieres rotarlo)
   ```

---

## Resumen Visual de Permisos

```
┌─────────────────────────────────────────┐
│  PERMISOS NECESARIOS                    │
├─────────────────────────────────────────┤
│  ✅ Zone → DNS → Edit                   │
│  ✅ Zone → Zone Settings → Edit         │
│  ✅ Zone → Zone → Read                  │
│  ✅ Zone → SSL and Certificates → Edit  │
│  ✅ Zone → Cache Purge → Purge          │
│                                         │
│  OPCIONAL (para R2):                    │
│  ⭕ Account → R2 Storage → Edit         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  RECURSOS                               │
├─────────────────────────────────────────┤
│  Zone Resources:                        │
│    Include → Specific zone              │
│      → inmovaapp.com                    │
└─────────────────────────────────────────┘
```

---

## Verificar Token Antes de Usar

Una vez creado el token, veríficalo con:

### Opción 1: cURL
```bash
curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "errors": [],
  "messages": [],
  "result": {
    "id": "...",
    "status": "active"
  }
}
```

### Opción 2: Node.js
```bash
node -e "
fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
  headers: { 'Authorization': 'Bearer TU_TOKEN_AQUI' }
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)))
"
```

---

## Qué Hacer con el Token

Una vez que tengas el token válido:

### 1. Guardarlo en .env.cloudflare
```bash
nano .env.cloudflare
```

Pegar:
```bash
CLOUDFLARE_API_TOKEN=tu_token_aqui
```

### 2. Obtener Zone ID y Account ID
```bash
npm run cloudflare:get-info
```

Este script usará el token para obtener automáticamente:
- Zone ID
- Account ID
- Información de nameservers
- Y actualizará el archivo `.env.cloudflare`

### 3. Verificar configuración completa
```bash
npm run cloudflare:verify
```

### 4. Configurar DNS automáticamente
```bash
npm run cloudflare:configure-dns
```

### 5. Configurar SSL/TLS
```bash
npm run cloudflare:configure-ssl
```

### 6. Probar el dominio visualmente
```bash
npm run domain:test
```

---

## ⚠️ Importante: Verificar que el Dominio Esté en Cloudflare

### ¿El dominio inmovaapp.com ya está en Cloudflare?

Para verificar:

1. Ve a: https://dash.cloudflare.com
2. ¿Ves **inmovaapp.com** en la lista de sitios?
   - **SÍ** → Perfecto, continúa con crear el token
   - **NO** → Primero debes agregarlo

### Si NO está agregado:

#### 1. Agregar dominio a Cloudflare:

```
Dashboard → Add a Site → inmovaapp.com → Free Plan
```

#### 2. Cloudflare escaneará tus DNS

Te mostrará los registros DNS actuales

#### 3. Cloudflare te dará nameservers:

Ejemplo:
```
austin.ns.cloudflare.com
lara.ns.cloudflare.com
```

#### 4. Cambiar nameservers en tu registrador:

Ve al panel donde compraste el dominio (GoDaddy, Namecheap, etc.) y cambia los nameservers a los que te dio Cloudflare.

#### 5. Esperar propagación:

- Mínimo: 30 minutos
- Máximo: 48 horas
- Promedio: 2-4 horas

#### 6. Verificar:

```bash
dig inmovaapp.com NS
```

Debe mostrar los nameservers de Cloudflare.

---

## Checklist Completo

### Pre-requisitos:
- [ ] Cuenta de Cloudflare creada
- [ ] Dominio **inmovaapp.com** agregado a Cloudflare
- [ ] Nameservers cambiados y propagados
- [ ] Zona está activa (Status: Active)

### Crear Token:
- [ ] Ir a API Tokens en Cloudflare
- [ ] Crear nuevo token con permisos correctos:
  - [ ] Zone → DNS → Edit
  - [ ] Zone → Zone Settings → Edit
  - [ ] Zone → Zone → Read
  - [ ] Zone → SSL and Certificates → Edit
  - [ ] Zone → Cache Purge → Purge
- [ ] Especificar zona: inmovaapp.com
- [ ] Crear token
- [ ] **COPIAR TOKEN** (solo se muestra una vez!)

### Configurar en el proyecto:
- [ ] Guardar token en `.env.cloudflare`
- [ ] Ejecutar `npm run cloudflare:get-info`
- [ ] Verificar con `npm run cloudflare:verify`
- [ ] Configurar DNS con `npm run cloudflare:configure-dns`
- [ ] Configurar SSL con `npm run cloudflare:configure-ssl`
- [ ] Probar con `npm run domain:test`

---

## Errores Comunes

### Error: "Invalid API Token"
**Causa**: Token mal copiado o sin permisos
**Solución**: Crear nuevo token siguiendo esta guía

### Error: "Zone not found"
**Causa**: Dominio no está en Cloudflare o token sin acceso a la zona
**Solución**: 
1. Verificar que el dominio esté agregado
2. Verificar que el token incluya la zona específica

### Error: "Insufficient permissions"
**Causa**: Token sin permisos suficientes
**Solución**: Crear nuevo token con todos los permisos listados arriba

---

## Soporte

Si tienes problemas:

1. **Verificar estado del dominio**:
   ```bash
   https://dash.cloudflare.com
   # Ver si inmovaapp.com está activo
   ```

2. **Verificar nameservers**:
   ```bash
   dig inmovaapp.com NS
   ```

3. **Contactar soporte Cloudflare**:
   - Chat en dashboard
   - Community: https://community.cloudflare.com

---

## Próximos Pasos Después de Tener el Token

Una vez que tengas el token válido:

```bash
# 1. Guardar token
echo "CLOUDFLARE_API_TOKEN=tu_token" > .env.cloudflare

# 2. Obtener IDs automáticamente
npm run cloudflare:get-info

# 3. Verificar todo
npm run cloudflare:verify

# 4. Configurar DNS
npm run cloudflare:configure-dns

# 5. Configurar SSL
npm run cloudflare:configure-ssl

# 6. Probar visualmente
npm run domain:test
```

---

**¿Listo para continuar?**

Proporciona el nuevo token y yo automáticamente:
1. ✅ Verificaré que es válido
2. ✅ Obtendré Zone ID y Account ID
3. ✅ Configuraré todos los DNS records
4. ✅ Configuraré SSL/TLS
5. ✅ Probaré el dominio visualmente con Playwright
