# 🌐 CONFIGURAR DOMINIO INMOVAAPP.COM

**Tu aplicación se está redeployando para usar `inmovaapp.com` como dominio principal**

---

## ✅ LO QUE YA HICE

1. ✅ Agregué `inmovaapp.com` a Vercel
2. ✅ Agregué `www.inmovaapp.com` a Vercel
3. ✅ Configuré `NEXTAUTH_URL` → `https://inmovaapp.com`
4. ✅ Inicié redeploy de producción

---

## ⚠️ LO QUE FALTA: CONFIGURAR DNS

### Estado Actual del Dominio

```
Dominio:        inmovaapp.com
Nameservers:    Cloudflare (marissa.ns.cloudflare.com, jay.ns.cloudflare.com)
IP Actuales:    104.21.72.140, 172.67.151.40 (Cloudflare)
IP Necesarias:  76.76.21.21 (Vercel)
Estado:         ⚠️ MISCONFIGURED
```

**El dominio actualmente apunta a Cloudflare, necesita apuntar a Vercel.**

---

## 🔧 CONFIGURACIÓN DNS REQUERIDA

Necesitas actualizar los registros DNS en tu proveedor de dominio (donde compraste inmovaapp.com).

### Opción 1: Usando Registro A (Recomendado)

**En tu panel de Cloudflare o tu proveedor DNS:**

#### Para el dominio raíz (inmovaapp.com)

```
Type: A
Name: @  (o dejar vacío)
Value: 76.76.21.21
TTL: 3600 (o Auto)
```

#### Para el subdominio www

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600 (o Auto)
```

### Opción 2: Usando CNAME (Alternativa)

**Si tu proveedor soporta CNAME en el apex:**

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

---

## 📋 PASOS DETALLADOS

### Si usas Cloudflare:

1. **Accede a Cloudflare Dashboard**
   - https://dash.cloudflare.com
   - Selecciona tu sitio: `inmovaapp.com`

2. **Ve a DNS**
   - Click en "DNS" en el menú lateral

3. **Elimina registros existentes (si los hay)**
   - Busca registros A o AAAA para `inmovaapp.com`
   - Click en "Delete" para cada uno

4. **Agrega nuevo registro A**

   ```
   Type: A
   Name: @
   IPv4: 76.76.21.21
   Proxy status: DNS only (nube gris, NO naranja)
   TTL: Auto
   ```

5. **Agrega registro CNAME para www**

   ```
   Type: CNAME
   Name: www
   Target: cname.vercel-dns.com
   Proxy status: DNS only (nube gris)
   TTL: Auto
   ```

6. **IMPORTANTE: Desactiva el proxy de Cloudflare**
   - La nube debe estar GRIS, no naranja
   - Si está naranja, click en ella para desactivar el proxy

### Si usas otro proveedor (GoDaddy, Namecheap, etc.):

1. **Accede al panel de control de DNS**
   - Busca la sección de "DNS Management" o "DNS Settings"

2. **Edita o agrega registros:**

   **Registro A:**

   ```
   Host: @ (o inmovaapp.com)
   Points to: 76.76.21.21
   TTL: 3600
   ```

   **Registro CNAME:**

   ```
   Host: www
   Points to: cname.vercel-dns.com
   TTL: 3600
   ```

3. **Guarda los cambios**

---

## ⏱️ TIEMPO DE PROPAGACIÓN

### Cuánto tardan los cambios:

```
Inmediato:     1-5 minutos (mejor caso)
Normal:        30-60 minutos
Máximo:        24-48 horas (raro)
```

**Promedio:** 30 minutos

---

## ✅ VERIFICAR CONFIGURACIÓN

### Desde tu terminal:

```bash
# Verificar registro A
dig inmovaapp.com A +short

# Debería mostrar: 76.76.21.21
```

```bash
# Verificar CNAME para www
dig www.inmovaapp.com CNAME +short

# Debería mostrar: cname.vercel-dns.com
```

### Desde navegador web:

Herramientas online:

- https://dnschecker.org
- Busca: `inmovaapp.com`
- Tipo: `A`
- Debería mostrar: `76.76.21.21` en todos los servidores

---

## 📊 CONFIGURACIÓN ACTUAL vs NECESARIA

### Estado Actual (Incorrecto):

```
inmovaapp.com
├── A: 104.21.72.140 ❌
├── A: 172.67.151.40 ❌
└── Apunta a: Cloudflare

www.inmovaapp.com
└── No configurado ❌
```

### Estado Requerido (Correcto):

```
inmovaapp.com
├── A: 76.76.21.21 ✅
└── Apunta a: Vercel

www.inmovaapp.com
├── CNAME: cname.vercel-dns.com ✅
└── Redirect a: inmovaapp.com
```

---

## 🎯 DESPUÉS DE CONFIGURAR DNS

### Cuando la propagación termine:

Tu aplicación estará disponible en:

```
✅ https://inmovaapp.com          (Dominio principal)
✅ https://www.inmovaapp.com      (Redirect automático)
```

### URLs antiguas seguirán funcionando:

```
✅ https://inmova.app
✅ https://workspace-inmova.vercel.app
```

**Todas las URLs apuntarán a la misma aplicación.**

---

## 🔐 CERTIFICADO SSL

**Se genera automáticamente:**

- Vercel creará un certificado SSL/TLS gratuito
- Se activará automáticamente cuando el DNS esté correcto
- Proceso: 0-5 minutos después de la propagación DNS
- Proveedor: Let's Encrypt

**No necesitas hacer nada más.**

---

## 🆘 TROUBLESHOOTING

### Problema: DNS no propaga después de 1 hora

**Solución:**

```bash
# Limpiar cache DNS local
# Mac/Linux:
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows:
ipconfig /flushdns
```

### Problema: Error SSL "Certificate not found"

**Causa:** DNS aún no ha propagado completamente

**Solución:** Espera 30 minutos más

### Problema: "This site can't be reached"

**Verificar:**

1. DNS está configurado correctamente
2. Han pasado al menos 30 minutos
3. Los registros apuntan a `76.76.21.21`

```bash
# Verificar
dig inmovaapp.com +short
# Debe mostrar: 76.76.21.21
```

### Problema: Cloudflare muestra "Error 1000"

**Causa:** Proxy de Cloudflare activado (nube naranja)

**Solución:**

1. Ve a Cloudflare DNS
2. Click en la nube naranja del registro
3. Cambia a gris (DNS only)
4. Guarda

---

## 📞 COMANDOS ÚTILES

### Verificar estado del deployment:

```bash
export VERCEL_TOKEN="7u9JXMPqs9Jn8w9a8by9hUAQ"
vercel domains ls --token=$VERCEL_TOKEN
```

### Ver dominios configurados:

```bash
vercel domains ls --token=$VERCEL_TOKEN | grep inmovaapp
```

### Verificar variables de entorno:

```bash
vercel env ls --token=$VERCEL_TOKEN | grep NEXTAUTH
```

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Acceder al panel DNS del dominio
- [ ] Eliminar registros A antiguos (si existen)
- [ ] Agregar registro A: `@ → 76.76.21.21`
- [ ] Agregar registro CNAME: `www → cname.vercel-dns.com`
- [ ] **Cloudflare:** Desactivar proxy (nube gris)
- [ ] Guardar cambios
- [ ] Esperar 30-60 minutos
- [ ] Verificar con `dig inmovaapp.com`
- [ ] Acceder a https://inmovaapp.com
- [ ] Verificar SSL activo (🔒 en navegador)

---

## 🎉 RESULTADO FINAL

Cuando todo esté configurado:

```
✅ https://inmovaapp.com
   ├── SSL/HTTPS activo
   ├── Certificado válido
   ├── Login: admin@inmova.app
   └── Password: Admin2025!

✅ https://www.inmovaapp.com
   └── Redirect automático a inmovaapp.com

✅ Variables de entorno
   └── NEXTAUTH_URL: https://inmovaapp.com
```

---

## 📊 ESTADO DEL REDEPLOY

**El redeploy está en progreso:**

```
Status:        ⏳ Building
Domain:        inmovaapp.com
NEXTAUTH_URL:  https://inmovaapp.com
Time:          ~5-8 minutos
```

**Puedes verificar el estado:**

```bash
vercel ls --token=$VERCEL_TOKEN | grep Production | head -n 1
```

---

## 💡 RECOMENDACIONES

### 1. Mantén las URLs antiguas funcionando

- No elimines `inmova.app` de Vercel
- Ambos dominios pueden coexistir
- Los usuarios que tengan bookmarks seguirán funcionando

### 2. Usa inmovaapp.com como principal

- Todas las URLs públicas usen inmovaapp.com
- Los emails de notificación usen inmovaapp.com
- La documentación referencie inmovaapp.com

### 3. Configura redirects (opcional)

- Si quieres que inmova.app redireccione a inmovaapp.com
- Se puede configurar en Vercel Dashboard

---

## 📅 TIMELINE ESTIMADO

```
Ahora:           Configurar DNS (5 min)
+30 minutos:     DNS propagado (verificar)
+35 minutos:     SSL activo
+40 minutos:     Redeploy completado
+45 minutos:     ✅ TODO LISTO
```

**Total desde ahora:** ~45 minutos

---

**¿Necesitas ayuda con la configuración DNS?**

Dime qué proveedor de dominio usas (Cloudflare, GoDaddy, Namecheap, etc.) y te doy instrucciones específicas paso a paso.
