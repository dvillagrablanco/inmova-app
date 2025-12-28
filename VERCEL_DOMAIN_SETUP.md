# Configuración del Dominio en Vercel

## ✅ Estado Actual

### Cloudflare - COMPLETADO ✅

- ✅ Token válido y activo
- ✅ Zone ID obtenido: `bac26034aa12995bc7517ac376f74ca9`
- ✅ Account ID obtenido: `1cc660f5eebb7225752009a9edfd7cd8`
- ✅ DNS Records configurados:
  - `inmovaapp.com` → `cname.vercel-dns.com` (Proxied)
  - `www.inmovaapp.com` → `inmovaapp.com` (Proxied)
  - `cdn.inmovaapp.com` → `inmovaapp.com` (Proxied)
- ✅ Nameservers activos:
  - `jay.ns.cloudflare.com`
  - `marissa.ns.cloudflare.com`

---

## 🔧 Siguiente Paso: Configurar Dominio en Vercel

### Opción 1: Desde Dashboard de Vercel (Recomendado)

#### 1. Ir al proyecto en Vercel
```
https://vercel.com/dashboard
→ Seleccionar proyecto: workspace-inmova
```

#### 2. Ir a Settings → Domains

#### 3. Agregar dominios:

**Dominio principal:**
```
inmovaapp.com
```

**Subdominios adicionales:**
```
www.inmovaapp.com
```

#### 4. Verificación

Vercel detectará automáticamente que los DNS ya están configurados y mostrará:
- ✅ `inmovaapp.com` - Valid Configuration
- ✅ `www.inmovaapp.com` - Valid Configuration

---

### Opción 2: Usando Vercel CLI

Si tienes acceso a la CLI de Vercel:

```bash
# Agregar dominio principal
vercel domains add inmovaapp.com workspace-inmova

# Agregar www
vercel domains add www.inmovaapp.com workspace-inmova
```

---

## 📋 Verificación de Propagación DNS

Puedes verificar que el DNS está propagando correctamente:

```bash
# Verificar dominio principal
dig inmovaapp.com

# Verificar www
dig www.inmovaapp.com

# Verificar nameservers
dig inmovaapp.com NS
```

Deberías ver:
- Nameservers de Cloudflare
- CNAME apuntando a Vercel

---

## ⏰ Tiempos de Propagación

- **DNS Cloudflare**: Inmediato - 5 minutos
- **Propagación global**: 10-30 minutos
- **Certificado SSL**: Automático por Vercel (5-10 minutos)

---

## 🧪 Pruebas Una Vez Configurado

Una vez que agregues el dominio en Vercel, ejecuta:

```bash
# Prueba visual con Playwright
npm run domain:test

# O con interfaz visual
npm run domain:test:ui
```

Esto verificará:
- ✅ Carga de la página
- ✅ Certificado SSL válido
- ✅ Headers de Cloudflare
- ✅ Responsive design
- ✅ Tiempos de carga
- ✅ Screenshots en múltiples dispositivos

---

## 📸 Screenshots que se Generarán

Los tests crearán estos screenshots:

```
test-results/
  ├── inmovaapp-home.png          # Página principal
  ├── inmovaapp-mobile.png        # Vista móvil
  ├── inmovaapp-tablet.png        # Vista tablet
  └── inmovaapp-final.png         # Verificación final
```

---

## 🔍 Verificar Headers de Cloudflare

Una vez que todo esté funcionando:

```bash
curl -I https://inmovaapp.com
```

Deberías ver headers como:
```
cf-ray: xxxxx
cf-cache-status: DYNAMIC
server: cloudflare
```

---

## ⚠️ Importante

### Variables de Entorno en Vercel

No olvides actualizar estas variables en Vercel Dashboard → Settings → Environment Variables:

```bash
NEXTAUTH_URL=https://inmovaapp.com
NEXT_PUBLIC_BASE_URL=https://inmovaapp.com
NEXT_PUBLIC_CDN_URL=https://cdn.inmovaapp.com
```

---

## 🎯 Checklist Final

- [x] Token de Cloudflare válido
- [x] Zona activa en Cloudflare
- [x] DNS records configurados
- [x] Nameservers apuntando a Cloudflare
- [ ] Dominio agregado en Vercel Dashboard
- [ ] Variables de entorno actualizadas en Vercel
- [ ] Certificado SSL emitido (automático)
- [ ] Pruebas visuales con Playwright ejecutadas
- [ ] Sitio accesible en https://inmovaapp.com

---

## 📞 Próximos Pasos

1. **Ahora mismo**: Agrega el dominio `inmovaapp.com` en Vercel Dashboard
2. **Espera 5-10 min**: Para que se emita el certificado SSL
3. **Actualiza env vars**: En Vercel con las nuevas URLs
4. **Ejecuta tests**: `npm run domain:test`
5. **¡Listo!**: Tu app estará en https://inmovaapp.com

---

¿Necesitas ayuda con algún paso o quieres que ejecute las pruebas visuales?
