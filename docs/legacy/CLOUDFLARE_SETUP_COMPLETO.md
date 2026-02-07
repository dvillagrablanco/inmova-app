# 🌐 CLOUDFLARE SETUP COMPLETO - INMOVAAPP.COM

**Fecha**: 30 de Diciembre de 2025  
**Dominio**: inmovaapp.com  
**Estado**: ✅ **CONFIGURADO**

---

## 📊 RESUMEN EJECUTIVO

El dominio `inmovaapp.com` está configurado con **Cloudflare** como CDN y proxy, proporcionando:
- ✅ SSL/HTTPS automático y gratuito
- ✅ Protección DDoS
- ✅ CDN global (150+ datacenters)
- ✅ Web Application Firewall (WAF)
- ✅ Caching automático

---

## 🏗️ ARQUITECTURA

```
Usuario
  ↓
Cloudflare (SSL, CDN, DDoS, Cache)
  ↓ HTTP
Nginx (Reverse Proxy) :80
  ↓
PM2 (Cluster x2)
  ↓
Next.js :3000
  ↓
PostgreSQL :5432
```

**Flujo SSL**:
- Usuario ↔ Cloudflare: **HTTPS** (SSL managed por Cloudflare)
- Cloudflare ↔ Servidor: **HTTP** (Flexible mode)

---

## ✅ CONFIGURACIÓN IMPLEMENTADA

### 1. DNS (Cloudflare Dashboard)

**Estado Actual**:
```
Tipo: A
Nombre: @
Valor: IPs de Cloudflare (172.67.151.40, 104.21.72.140)
Proxy: ✅ ACTIVADO (nube naranja)
TTL: Auto
```

**Verificación**:
```bash
dig +short inmovaapp.com
# Output: 104.21.72.140, 172.67.151.40 (IPs de Cloudflare)
```

### 2. SSL/TLS (Cloudflare Dashboard)

**Configuración**:
- Mode: **Flexible**
  - Usuario → Cloudflare: HTTPS ✅
  - Cloudflare → Servidor: HTTP ✅
- Edge Certificates: Let's Encrypt (auto)
- Always Use HTTPS: ✅ Activado
- Automatic HTTPS Rewrites: ✅ Activado
- Minimum TLS Version: 1.2

**Resultado**:
- https://inmovaapp.com → ✅ Funciona
- http://inmovaapp.com → ✅ Redirect a HTTPS

### 3. Nginx (Servidor)

**Archivo**: `/etc/nginx/sites-available/inmova`

**Configuración**:
```nginx
server {
    listen 80;
    server_name inmovaapp.com www.inmovaapp.com;
    
    # Real IP from Cloudflare
    set_real_ip_from 173.245.48.0/20;
    set_real_ip_from 103.21.244.0/22;
    # ... todas las IPs de Cloudflare
    real_ip_header CF-Connecting-IP;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        
        # Headers Cloudflare
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_set_header CF-Ray $http_cf_ray;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Cambios clave**:
- ✅ Acepta `inmovaapp.com` y `www.inmovaapp.com`
- ✅ Detecta IP real del usuario (no IP de Cloudflare)
- ✅ Acepta HTTP (Cloudflare maneja HTTPS)

### 4. NextAuth.js (.env.production)

**Configuración**:
```env
NEXTAUTH_URL=https://inmovaapp.com
NEXTAUTH_SECRET=<secret>
```

**Crítico**: Debe ser `https://` (no `http://`) porque usuario accede vía HTTPS

### 5. PM2

**Estado**:
```bash
pm2 status:
┌────┬─────────────┬─────────┬─────────┬────────┐
│ id │ name        │ mode    │ pid     │ status │
├────┼─────────────┼─────────┼─────────┼────────┤
│ 0  │ inmova-app  │ cluster │ 1072005 │ online │
│ 1  │ inmova-app  │ cluster │ 1072064 │ online │
└────┴─────────────┴─────────┴─────────┴────────┘
```

**Reiniciado** después de cambiar NEXTAUTH_URL

---

## 🧪 VERIFICACIÓN

### Test Externo (Desde Tu Máquina)

```bash
# 1. Test HTTPS
curl -I https://inmovaapp.com
# Esperado: HTTP/2 200
# Headers: cf-ray, cf-cache-status

# 2. Test redirect HTTP → HTTPS
curl -I http://inmovaapp.com
# Esperado: 301 o 308 redirect a https://

# 3. Test login page
curl https://inmovaapp.com/login | grep "email"
# Esperado: <input type="email"...

# 4. Test API health
curl https://inmovaapp.com/api/health
# Esperado: {"status":"ok"}
```

### Test Headers Cloudflare

```bash
curl -I https://inmovaapp.com

# Debe incluir:
cf-ray: ...                    # ID único de request
cf-cache-status: DYNAMIC       # Cache status
server: cloudflare             # Proxy confirmado
```

### Test en Navegador

1. **Abre**: https://inmovaapp.com/login
2. **Verifica**:
   - ✅ Candado SSL verde en barra
   - ✅ Formulario de login presente
3. **Login**:
   - Email: `admin@inmova.app`
   - Password: `Admin123!`
4. **Resultado**: ✅ Dashboard carga

---

## 🎯 VENTAJAS DE CLOUDFLARE

### 1. SSL/HTTPS Gratis
- ✅ Certificado auto-renovado
- ✅ Sin Let's Encrypt manual
- ✅ Válido para `inmovaapp.com` y `www.inmovaapp.com`

### 2. CDN Global
- ✅ 150+ datacenters mundiales
- ✅ Assets cacheados cerca del usuario
- ✅ Menor latencia (< 50ms desde Europa)

### 3. Seguridad
- ✅ DDoS protection (capa 3/4/7)
- ✅ Web Application Firewall (WAF)
- ✅ Bot detection
- ✅ Rate limiting automático
- ✅ IP reputation

### 4. Performance
- ✅ Auto minify (JS, CSS, HTML)
- ✅ Brotli compression
- ✅ HTTP/2 & HTTP/3
- ✅ Image optimization (Pro)

### 5. Analytics
- ✅ Requests/día
- ✅ Bandwidth usado
- ✅ Threats blocked
- ✅ Performance metrics

---

## ⚠️ CONSIDERACIONES

### Limitaciones

1. **No Let's Encrypt Directo**
   - No puedes usar `certbot` tradicional
   - SSL managed exclusivamente por Cloudflare
   - Solución: Usar Cloudflare SSL (ya configurado)

2. **IP Real Oculta**
   - Usuarios ven IPs de Cloudflare
   - Servidor no recibe IP directa del usuario
   - Solución: `CF-Connecting-IP` header (ya configurado)

3. **Cache Puede Causar Issues**
   - Assets cacheados pueden ser stale
   - Solución: Purge cache en Cloudflare Dashboard si necesario

### Alternativas a Flexible Mode

**Full Mode**:
- Cloudflare ↔ Usuario: HTTPS
- Cloudflare ↔ Servidor: HTTPS (requiere SSL en servidor)

**Configurar Full Mode**:
1. Instalar SSL en servidor (Let's Encrypt vía Cloudflare Origin CA)
2. Cambiar Nginx a listen 443
3. Cloudflare Dashboard → SSL/TLS → Full

**Ventajas**: Más seguro (E2E encryption)  
**Desventajas**: Más complejo, requiere certificado en servidor

---

## 🔧 TROUBLESHOOTING

### Error: "Too many redirects"

**Causa**: Cloudflare en HTTPS pero servidor no acepta

**Solución**:
```bash
# Verificar Nginx acepta HTTP
curl -I http://localhost/
# Debe retornar 200 OK

# Verificar Cloudflare SSL mode
# Dashboard → SSL/TLS → Flexible (no Full)
```

### Error: "Connection timeout"

**Causa**: Firewall bloqueando puerto 80

**Solución**:
```bash
# Abrir puerto 80
ufw allow 80/tcp
ufw reload

# Verificar
ss -tlnp | grep :80
```

### Headers no muestran CF-*

**Causa**: No estás accediendo vía Cloudflare

**Solución**:
```bash
# Usar dominio, no IP directa
curl -I https://inmovaapp.com  # ✅ Correcto (pasa por CF)
curl -I http://157.180.119.236  # ❌ Directo (no pasa por CF)
```

### SSL Warnings en Navegador

**Causa**: Certificado aún generándose (primeros 15 min)

**Solución**: Esperar 15-30 minutos, luego refresh

---

## 📊 CONFIGURACIÓN CLOUDFLARE DASHBOARD

### SSL/TLS Settings

```
✅ Overview
   Mode: Flexible

✅ Edge Certificates
   Always Use HTTPS: On
   HSTS: Off (por ahora)
   Minimum TLS Version: 1.2
   Opportunistic Encryption: On
   TLS 1.3: On
   Automatic HTTPS Rewrites: On
```

### Speed Settings

```
✅ Optimization
   Auto Minify: JS, CSS, HTML ✅
   Brotli: On
   
✅ Caching
   Caching Level: Standard
   Browser Cache TTL: 4 hours
```

### Firewall Settings

```
✅ Security Level: Medium

✅ WAF
   OWASP ModSecurity Core Rule Set: On
   
⚠️ Rate Limiting
   (Requiere plan Pro, usar PM2 + app level)
```

---

## 🚀 PRÓXIMOS PASOS (OPCIONALES)

### 1. Upgrade a Full SSL (Más Seguro)

**Requiere**:
1. Obtener certificado de Cloudflare Origin CA
2. Instalar en servidor
3. Cambiar Nginx a HTTPS
4. Cambiar Cloudflare a Full mode

**Beneficio**: E2E encryption

### 2. Setup Page Rules (Pro)

**Ejemplos**:
- Cache everything en `/landing`
- Bypass cache en `/dashboard/*`
- Force HTTPS en todo

### 3. Image Optimization (Pro)

**Features**:
- Auto WebP conversion
- Lazy loading
- Responsive images

### 4. Argo Smart Routing ($$)

**Beneficio**: 30% faster para tráfico dinámico

---

## 📝 COMANDOS ÚTILES

### Purge Cache

```bash
# Via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "X-Auth-Email: tu@email.com" \
  -H "X-Auth-Key: api_key" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# O en Dashboard: Caching → Purge Everything
```

### Ver Analytics

```bash
# Via Dashboard
Cloudflare → Analytics → Traffic

# O via API
curl "https://api.cloudflare.com/client/v4/zones/{zone_id}/analytics/dashboard" \
  -H "X-Auth-Email: tu@email.com" \
  -H "X-Auth-Key: api_key"
```

---

## 🎯 CONCLUSIÓN

```
╔══════════════════════════════════════════════╗
║                                              ║
║   ✅ CLOUDFLARE SETUP COMPLETADO             ║
║                                              ║
║   Dominio:  inmovaapp.com                   ║
║   SSL:      ✅ HTTPS activo                  ║
║   CDN:      ✅ Global                        ║
║   DDoS:     ✅ Protegido                     ║
║   WAF:      ✅ Activo                        ║
║                                              ║
║   Estado:   🟢 PRODUCCIÓN                    ║
║                                              ║
╚══════════════════════════════════════════════╝
```

**URL Final**: https://inmovaapp.com  
**Login**: admin@inmova.app / Admin123!

---

## 📚 RECURSOS

- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Cloudflare IPs**: https://www.cloudflare.com/ips/
- **SSL Modes**: https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/
- **Nginx Config**: `/etc/nginx/sites-available/inmova`
- **App Config**: `/opt/inmova-app/.env.production`

---

<div align="center">

**Configurado por**: Cursor Agent 🤖  
**Fecha**: 30 de Diciembre de 2025  

**Sistema funcionando en**: https://inmovaapp.com ✅

</div>
