# 🔐 Configuración SSL con Cloudflare

## 📋 Situación Actual

El dominio `inmovaapp.com` está usando **Cloudflare como proxy**, lo que significa:

- DNS apunta a IPs de Cloudflare (104.21.72.140, 172.67.151.40)
- Cloudflare maneja el tráfico HTTPS público
- El servidor (157.180.119.236) recibe tráfico desde Cloudflare

---

## 🎯 Configuración Recomendada

### Opción 1: Flexible SSL (Más Simple) ✅ RECOMENDADO

**Flujo:**
```
Usuario → HTTPS (Cloudflare) → HTTP (Nginx) → Next.js
```

**Configuración en Cloudflare Dashboard:**

1. Login en https://dash.cloudflare.com
2. Seleccionar dominio `inmovaapp.com`
3. Ir a **SSL/TLS** → **Overview**
4. Seleccionar modo: **Flexible**

**Ventajas:**
- ✅ Configuración inmediata (sin cambios en servidor)
- ✅ HTTPS para usuarios final
- ✅ No requiere certificado en servidor
- ✅ Cloudflare maneja toda la complejidad SSL

**Desventajas:**
- ⚠️ Conexión Cloudflare → Servidor es HTTP (no encriptada)
- ⚠️ Menos seguro para tráfico interno

**Ya configurado en servidor:**
- ✅ Nginx escuchando en puerto 80
- ✅ Sin necesidad de cambios

---

### Opción 2: Full SSL (Más Seguro) 🔒 MEJOR SEGURIDAD

**Flujo:**
```
Usuario → HTTPS (Cloudflare) → HTTPS (Nginx) → Next.js
```

**Configuración en Cloudflare Dashboard:**

1. Login en https://dash.cloudflare.com
2. Seleccionar dominio `inmovaapp.com`
3. Ir a **SSL/TLS** → **Overview**
4. Seleccionar modo: **Full** (o **Full (strict)** para mayor seguridad)

**Configuración en Servidor:**

Ya tienes certificado Let's Encrypt instalado:
```
/etc/letsencrypt/live/inmovaapp.com/fullchain.pem
/etc/letsencrypt/live/inmovaapp.com/privkey.pem
```

**Actualizar Nginx para HTTPS:**

```bash
ssh root@157.180.119.236

# Editar configuración
nano /etc/nginx/sites-available/inmova
```

**Añadir bloque HTTPS:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name 157.180.119.236 inmovaapp.com www.inmovaapp.com;
    
    return 301 https://$host$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name inmovaapp.com www.inmovaapp.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/inmovaapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/inmovaapp.com/privkey.pem;
    
    # SSL protocols
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        
        # WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static assets cache
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # Images cache
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=2592000";
    }
}
```

**Aplicar cambios:**

```bash
# Test configuración
nginx -t

# Si OK, reload
systemctl reload nginx
```

**Ventajas:**
- ✅ Encriptación end-to-end
- ✅ Mayor seguridad
- ✅ Certificado Let's Encrypt gratis
- ✅ Auto-renovación configurada

**Desventajas:**
- ⚠️ Requiere configuración en servidor
- ⚠️ Certificado debe renovarse (automático)

---

### Opción 3: Full (strict) SSL 🔐 MÁXIMA SEGURIDAD

Igual que **Full SSL** pero Cloudflare **verifica** que el certificado del servidor sea válido.

**Requerimientos:**
- ✅ Certificado firmado por CA reconocida (Let's Encrypt ✓)
- ✅ Certificado no expirado
- ✅ Dominio coincide con certificado

**Configuración:**
1. Mismo setup que Full SSL en servidor
2. En Cloudflare: Seleccionar **Full (strict)**

---

## 🔧 Actualizar NEXTAUTH_URL

Si configuras HTTPS (cualquier opción), actualiza `.env.production`:

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
nano .env.production
```

**Cambiar:**
```env
NEXTAUTH_URL=https://inmovaapp.com
```

**Restart app:**
```bash
pm2 restart inmova-app
```

---

## ✅ Verificación

### Test HTTPS

```bash
# Desde tu máquina local
curl -I https://inmovaapp.com/landing

# Debe retornar:
# HTTP/2 200
# server: cloudflare
```

### Test Redirect HTTP → HTTPS

```bash
curl -I http://inmovaapp.com/landing

# Si configuraste Full SSL, debe redirigir a HTTPS:
# HTTP/1.1 301 Moved Permanently
# Location: https://inmovaapp.com/landing
```

### Test en Navegador

1. Abrir: https://inmovaapp.com/landing
2. Verificar candado 🔒 en barra de direcciones
3. Click en candado → Ver certificado
4. Verificar que es de Cloudflare (modo Flexible) o Let's Encrypt (modo Full)

---

## 📊 Comparación de Modos

| Característica | Flexible | Full | Full (strict) |
|----------------|----------|------|---------------|
| **HTTPS Usuario** | ✅ Sí | ✅ Sí | ✅ Sí |
| **HTTPS Cloudflare-Servidor** | ❌ No | ✅ Sí | ✅ Sí |
| **Certificado en Servidor** | ❌ No | ✅ Sí | ✅ Sí |
| **Validación Certificado** | N/A | ❌ No | ✅ Sí |
| **Facilidad Setup** | 🟢 Fácil | 🟡 Media | 🟡 Media |
| **Seguridad** | 🟡 Media | 🟢 Alta | 🟢 Máxima |

---

## 🎯 Recomendación Final

### Para Desarrollo/Testing:
**→ Flexible SSL**
- Setup inmediato
- Sin cambios en servidor
- HTTPS para usuarios

### Para Producción:
**→ Full SSL** o **Full (strict)**
- Encriptación completa
- Mayor seguridad
- Certificado gratis Let's Encrypt

---

## 🔄 Pasos para Implementar Full SSL

```bash
# 1. Conectar al servidor
ssh root@157.180.119.236

# 2. Backup configuración actual
cp /etc/nginx/sites-available/inmova /etc/nginx/sites-available/inmova.backup

# 3. Actualizar configuración (ver bloque HTTPS arriba)
nano /etc/nginx/sites-available/inmova

# 4. Test
nginx -t

# 5. Aplicar
systemctl reload nginx

# 6. Actualizar Cloudflare Dashboard
#    → SSL/TLS → Overview → Full

# 7. Actualizar NEXTAUTH_URL
cd /opt/inmova-app
nano .env.production
# Cambiar a: NEXTAUTH_URL=https://inmovaapp.com

# 8. Restart app
pm2 restart inmova-app

# 9. Verificar
curl -I https://inmovaapp.com/landing
```

---

## 📞 Soporte

Si algo falla:

1. **Ver logs Nginx:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

2. **Ver certificado:**
   ```bash
   certbot certificates
   ```

3. **Renovar certificado (si expiró):**
   ```bash
   certbot renew
   systemctl reload nginx
   ```

4. **Rollback a HTTP:**
   ```bash
   cp /etc/nginx/sites-available/inmova.backup /etc/nginx/sites-available/inmova
   systemctl reload nginx
   ```

---

**Generado:** 2 de enero de 2026  
**Para:** Configuración SSL con Cloudflare + Nginx
