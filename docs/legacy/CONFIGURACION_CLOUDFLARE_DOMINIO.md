# ☁️ CONFIGURACIÓN DE INMOVAAPP.COM CON CLOUDFLARE

## 🔍 SITUACIÓN ACTUAL

El dominio `inmovaapp.com` **ya está configurado con Cloudflare como proxy/CDN**.

```bash
$ dig +short inmovaapp.com
104.21.72.140  # ← IP de Cloudflare, NO del servidor

$ IP del servidor: 157.180.119.236
```

Esto significa que:

- ✅ El dominio existe y está activo
- ✅ Cloudflare está haciendo de proxy
- ⚠️ El tráfico pasa por Cloudflare antes de llegar al servidor
- ⚠️ Se necesita configuración específica para Cloudflare

---

## 📋 OPCIONES DE CONFIGURACIÓN

### Opción 1: Usar Cloudflare como Proxy (RECOMENDADO)

**Ventajas**:

- ✅ CDN global (contenido más rápido)
- ✅ DDoS protection automática
- ✅ SSL/TLS gratis (Cloudflare lo maneja)
- ✅ Caching automático
- ✅ Firewall WAF incluido
- ✅ Analytics incluido

**Desventajas**:

- ⚠️ Configuración más compleja
- ⚠️ Necesitas configurar "Real IP" en Nginx
- ⚠️ SSL Full o Flexible (no Full Strict sin certificado propio)

### Opción 2: DNS Only (Sin Proxy)

**Ventajas**:

- ✅ Configuración más simple
- ✅ SSL directo con Let's Encrypt
- ✅ No dependes de Cloudflare

**Desventajas**:

- ❌ Sin CDN (más lento para usuarios lejanos)
- ❌ Sin DDoS protection
- ❌ Expones IP real del servidor

---

## 🚀 OPCIÓN 1: CONFIGURACIÓN CON CLOUDFLARE (RECOMENDADO)

### Paso 1: Configurar Cloudflare Dashboard

1. **Ir a Cloudflare Dashboard**
   - URL: https://dash.cloudflare.com
   - Login con tu cuenta

2. **Seleccionar inmovaapp.com**

3. **SSL/TLS Settings**
   - SSL/TLS → Overview
   - Encryption mode: **Flexible** (recomendado para empezar)
     - Cloudflare ↔ Usuario: HTTPS (con certificado de Cloudflare)
     - Cloudflare ↔ Servidor: HTTP

   **O si quieres más seguridad**:
   - Encryption mode: **Full**
     - Requiere certificado SSL en el servidor también
     - Usa `scripts/setup-domain.sh` para instalar Let's Encrypt

4. **Verificar DNS**
   - DNS → Records
   - Debe existir:
     ```
     A   inmovaapp.com     157.180.119.236   Proxied (nube naranja)
     A   www.inmovaapp.com 157.180.119.236   Proxied (nube naranja)
     ```

### Paso 2: Configurar Nginx en el Servidor

Ejecutar script especial para Cloudflare:

```bash
ssh root@157.180.119.236 'bash -s' < scripts/setup-cloudflare-nginx.sh
```

O manual:

```bash
ssh root@157.180.119.236

# Instalar Nginx
apt-get update && apt-get install -y nginx

# Configurar Nginx para Cloudflare
cat > /etc/nginx/sites-available/inmova << 'EOF'
# Obtener IP real del visitante desde Cloudflare
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;

# Header que contiene la IP real
real_ip_header CF-Connecting-IP;

upstream nextjs_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name inmovaapp.com www.inmovaapp.com;

    location / {
        proxy_pass http://nextjs_backend;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;

        # Headers estándar
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Headers de Cloudflare
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;
        proxy_set_header CF-Ray $http_cf_ray;
        proxy_set_header CF-Visitor $http_cf_visitor;
    }

    # Static caching
    location /_next/static/ {
        proxy_pass http://nextjs_backend;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
EOF

# Activar configuración
ln -sf /etc/nginx/sites-available/inmova /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test y reload
nginx -t && systemctl reload nginx

echo "✅ Nginx configurado para Cloudflare"
```

### Paso 3: Actualizar .env.production

```bash
ssh root@157.180.119.236

# Actualizar NEXTAUTH_URL con HTTPS
sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://inmovaapp.com|g' /opt/inmova-app/.env.production

# Reiniciar PM2
pm2 restart inmova-app --update-env

echo "✅ Variables de entorno actualizadas"
```

### Paso 4: Verificar

```bash
# Test HTTPS (desde Cloudflare)
curl -I https://inmovaapp.com

# Debe retornar:
# HTTP/2 200
# server: cloudflare
# cf-ray: ...

# Test health check
curl https://inmovaapp.com/api/health

# Debe retornar:
# {"status":"ok","database":"connected",...}
```

---

## 🔧 OPCIÓN 2: DNS ONLY (SIN PROXY CLOUDFLARE)

### Paso 1: Desactivar Proxy en Cloudflare

1. **Ir a Cloudflare Dashboard**
   - DNS → Records
   - Click en la **nube naranja** de `inmovaapp.com`
   - Cambiar a **gris** (DNS only)
   - Hacer lo mismo para `www.inmovaapp.com`

2. **Esperar propagación**
   - 5-15 minutos

3. **Verificar**
   ```bash
   dig +short inmovaapp.com
   # Ahora debe retornar: 157.180.119.236
   ```

### Paso 2: Configurar Nginx + SSL

```bash
# Ejecutar script normal
ssh root@157.180.119.236 'bash -s' < scripts/setup-domain.sh
```

Este script:

- Instala Nginx
- Configura reverse proxy
- Obtiene certificado SSL con Let's Encrypt
- Configura auto-renovación

---

## 📊 COMPARACIÓN

| Feature                  | Con Cloudflare Proxy   | DNS Only                  |
| ------------------------ | ---------------------- | ------------------------- |
| **CDN Global**           | ✅ Sí                  | ❌ No                     |
| **DDoS Protection**      | ✅ Sí                  | ❌ No                     |
| **SSL/TLS**              | ✅ Gratis (Cloudflare) | ✅ Gratis (Let's Encrypt) |
| **Firewall WAF**         | ✅ Sí                  | ❌ No                     |
| **Caching**              | ✅ Automático          | ⚠️ Manual (Nginx)         |
| **Analytics**            | ✅ Incluido            | ❌ No                     |
| **Setup Complexity**     | ⚠️ Media               | ✅ Simple                 |
| **IP Servidor Expuesta** | ❌ No (oculta)         | ✅ Sí (visible)           |
| **Certificado SSL**      | ✅ Cloudflare maneja   | ✅ Let's Encrypt          |
| **Latencia**             | ✅ Menor (CDN)         | ⚠️ Mayor (sin CDN)        |

---

## 🎯 RECOMENDACIÓN

### Para Producción: Opción 1 (Cloudflare Proxy) ⭐

**Por qué**:

- CDN global = usuarios contentos (más rápido)
- DDoS protection = tranquilidad
- WAF = seguridad adicional
- SSL gratis sin gestión
- Analytics incluido

**Cuándo NO usar**:

- Si necesitas ver IP real en logs (aunque Cloudflare la pasa en headers)
- Si tienes tráfico muy específico que no se lleva bien con proxies

### Para Desarrollo/Testing: Opción 2 (DNS Only)

**Por qué**:

- Setup más simple
- Debug más fácil
- No dependes de servicio externo

---

## 🚀 QUICK START

### Si Eliges Cloudflare Proxy (Opción 1)

```bash
# 1. Configurar Cloudflare Dashboard
# - SSL/TLS: Flexible o Full
# - DNS: Verificar A records con proxy (nube naranja)

# 2. Crear script de configuración
cat > /tmp/setup-cloudflare.sh << 'EOF'
#!/bin/bash
# ... (contenido del script de Nginx para Cloudflare) ...
EOF

# 3. Ejecutar en servidor
ssh root@157.180.119.236 'bash -s' < /tmp/setup-cloudflare.sh

# 4. Actualizar .env
ssh root@157.180.119.236 "
  sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://inmovaapp.com|g' /opt/inmova-app/.env.production
  pm2 restart inmova-app --update-env
"

# 5. Verificar
curl https://inmovaapp.com/api/health
```

### Si Eliges DNS Only (Opción 2)

```bash
# 1. Desactivar proxy en Cloudflare Dashboard
# - DNS → Records
# - Click nube naranja → gris (DNS only)

# 2. Esperar propagación (5-15 min)
watch -n 5 'dig +short inmovaapp.com'
# Cuando retorne 157.180.119.236 → continuar

# 3. Ejecutar script
ssh root@157.180.119.236 'bash -s' < scripts/setup-domain.sh

# 4. Verificar
curl https://inmovaapp.com/api/health
```

---

## 🔍 TROUBLESHOOTING

### "Site can't be reached"

**Causa**: Cloudflare proxy activo pero servidor no configurado

**Solución**:

```bash
# Verificar Nginx en servidor
ssh root@157.180.119.236 'systemctl status nginx'

# Si no está instalado, instalar
ssh root@157.180.119.236 'apt-get install -y nginx'

# Configurar para Cloudflare (ver Opción 1)
```

### "Too many redirects"

**Causa**: Loop de redirects entre Cloudflare y servidor

**Solución**:

```bash
# Opción A: Cambiar SSL mode en Cloudflare a "Flexible"

# Opción B: Si tienes SSL en servidor, usar "Full"

# Opción C: Remover redirects de Nginx config
ssh root@157.180.119.236 '
  sed -i "/return 301 https/d" /etc/nginx/sites-available/inmova
  systemctl reload nginx
'
```

### "SSL handshake failed"

**Causa**: SSL mode incorrecto en Cloudflare

**Solución**:

- Cloudflare Dashboard → SSL/TLS
- Si NO tienes certificado en servidor: **Flexible**
- Si tienes Let's Encrypt en servidor: **Full**

---

## 📞 SOPORTE

Si tienes problemas:

1. **Verificar DNS**:

   ```bash
   dig +short inmovaapp.com
   # Con proxy: 104.21.x.x (Cloudflare)
   # Sin proxy: 157.180.119.236 (tu servidor)
   ```

2. **Test directo al servidor**:

   ```bash
   curl -H "Host: inmovaapp.com" http://157.180.119.236/api/health
   # Debe funcionar incluso con Cloudflare
   ```

3. **Ver logs**:
   ```bash
   ssh root@157.180.119.236 'tail -f /var/log/nginx/error.log'
   ssh root@157.180.119.236 'pm2 logs inmova-app'
   ```

---

**Fecha**: 3 de enero de 2026  
**Dominio**: inmovaapp.com  
**IP Servidor**: 157.180.119.236  
**Cloudflare**: Activo (proxy)  
**Recomendación**: Opción 1 (Cloudflare Proxy) para producción
