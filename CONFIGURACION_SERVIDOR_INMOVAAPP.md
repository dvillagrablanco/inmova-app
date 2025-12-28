# 🎉 Configuración del Servidor para inmovaapp.com

## ✅ Estado Actual - TODO FUNCIONANDO

```
DNS Cloudflare:     ✅ CONFIGURADO (propagado)
CDN Cloudflare:     ✅ ACTIVO (CF-RAY detectado)
IP Servidor:        ✅ 157.180.119.236
Nginx:              ✅ ACTIVO
Tests Playwright:   ✅ PASADOS (3/3)
```

---

## 📊 Verificación Exitosa

### DNS Records Configurados:
```
A      inmovaapp.com      → 157.180.119.236 🟠 Proxied
A      www.inmovaapp.com  → 157.180.119.236 🟠 Proxied  
A      cdn.inmovaapp.com  → 157.180.119.236 🟠 Proxied
```

### Cloudflare Activo:
```
✅ Server: cloudflare
✅ CF-RAY: 9b5004a9c8f8fc83-PDX
✅ Tiempo de carga: 664ms
✅ 7 requests via CDN
```

### IPs de Cloudflare:
```
172.67.151.40
104.21.72.140
```

---

## ⚙️ CONFIGURACIÓN NECESARIA EN EL SERVIDOR

El servidor responde con **404** porque nginx necesita configuración para el dominio.

### 1. Configurar Nginx Virtual Host

Crea el archivo de configuración en el servidor:

```bash
# Conectar al servidor
ssh usuario@157.180.119.236

# Crear configuración de nginx
sudo nano /etc/nginx/sites-available/inmovaapp.com
```

**Contenido del archivo** (ajusta según tu configuración):

```nginx
# HTTP - Redirigir a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name inmovaapp.com www.inmovaapp.com cdn.inmovaapp.com;

    # Permitir que Cloudflare valide SSL
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirigir todo a HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name inmovaapp.com www.inmovaapp.com cdn.inmovaapp.com;

    # Logs
    access_log /var/log/nginx/inmovaapp.access.log;
    error_log /var/log/nginx/inmovaapp.error.log;

    # SSL Configuration (Cloudflare Origin Certificate)
    ssl_certificate /etc/ssl/cloudflare/cert.pem;
    ssl_certificate_key /etc/ssl/cloudflare/key.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Cloudflare Real IP
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
    real_ip_header CF-Connecting-IP;

    # Proxy a la aplicación Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
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

    # Assets estáticos (si los sirves desde nginx)
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

### 2. Generar Certificado SSL de Cloudflare

**Opción A: Cloudflare Origin Certificate (Recomendado)**

1. Ve a Cloudflare Dashboard → SSL/TLS → Origin Server
2. Click "Create Certificate"
3. Selecciona:
   - Hostnames: `*.inmovaapp.com, inmovaapp.com`
   - Validity: 15 years
4. Click "Create"
5. Copiar el certificado y la llave privada

En el servidor:

```bash
# Crear directorio para certificados
sudo mkdir -p /etc/ssl/cloudflare

# Crear archivo del certificado
sudo nano /etc/ssl/cloudflare/cert.pem
# Pegar el certificado de Cloudflare

# Crear archivo de la llave privada
sudo nano /etc/ssl/cloudflare/key.pem
# Pegar la llave privada

# Establecer permisos
sudo chmod 600 /etc/ssl/cloudflare/key.pem
sudo chmod 644 /etc/ssl/cloudflare/cert.pem
```

**Opción B: Let's Encrypt (Alternativa)**

Si prefieres Let's Encrypt:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d inmovaapp.com -d www.inmovaapp.com
```

### 3. Activar la Configuración

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/inmovaapp.com /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Si todo está OK, recargar nginx
sudo systemctl reload nginx
```

### 4. Verificar Aplicación Next.js

Asegúrate de que tu aplicación está corriendo:

```bash
# Ver si el puerto 3000 está escuchando
sudo netstat -tlnp | grep 3000

# O con ss
sudo ss -tlnp | grep 3000

# Si no está corriendo, iniciar la app
cd /ruta/a/tu/app
npm start
# O si usas PM2:
pm2 start npm --name "inmova-app" -- start
```

---

## 🔐 Configuración SSL en Cloudflare

En Cloudflare Dashboard → SSL/TLS:

### Encryption Mode:
```
Full (strict) ✅
```

Esta configuración requiere que tu servidor tenga un certificado SSL válido (Cloudflare Origin Certificate o Let's Encrypt).

### Always Use HTTPS:
```
ON ✅
```

### Automatic HTTPS Rewrites:
```
ON ✅
```

---

## 🧪 Verificación Final

Una vez configurado nginx:

```bash
# En tu máquina local
npm run domain:test

# Verificar HTTPS
curl -I https://inmovaapp.com

# Debe retornar:
# HTTP/2 200
# server: cloudflare
# cf-ray: ...
```

---

## 📋 Checklist de Configuración del Servidor

- [ ] Conectar al servidor (SSH)
- [ ] Crear archivo `/etc/nginx/sites-available/inmovaapp.com`
- [ ] Generar certificado SSL de Cloudflare
- [ ] Guardar certificado en `/etc/ssl/cloudflare/cert.pem`
- [ ] Guardar llave privada en `/etc/ssl/cloudflare/key.pem`
- [ ] Establecer permisos correctos
- [ ] Crear symlink en sites-enabled
- [ ] Probar configuración nginx (`nginx -t`)
- [ ] Recargar nginx
- [ ] Verificar que la app Next.js está corriendo en puerto 3000
- [ ] Probar https://inmovaapp.com en navegador
- [ ] Ejecutar tests: `npm run domain:test`

---

## 🔧 Troubleshooting

### Error: "502 Bad Gateway"
**Causa**: La aplicación no está corriendo en el puerto 3000  
**Solución**: Iniciar la aplicación Next.js

```bash
cd /ruta/a/tu/app
npm start
```

### Error: "SSL handshake failed"
**Causa**: Certificado SSL no configurado correctamente  
**Solución**: Verificar rutas de certificados en nginx

### Error: "nginx: [emerg] cannot load certificate"
**Causa**: Rutas incorrectas o permisos  
**Solución**: 
```bash
sudo chmod 600 /etc/ssl/cloudflare/key.pem
sudo chmod 644 /etc/ssl/cloudflare/cert.pem
```

### Ver logs de nginx:
```bash
sudo tail -f /var/log/nginx/inmovaapp.error.log
sudo tail -f /var/log/nginx/inmovaapp.access.log
```

---

## 📊 Estado Actual vs Final

### Ahora:
```
✅ DNS configurado
✅ Cloudflare CDN activo
⏳ Nginx responde 404 (falta virtual host)
⏳ SSL pendiente (certificado de Cloudflare)
```

### Después de configurar:
```
✅ DNS configurado
✅ Cloudflare CDN activo
✅ Nginx sirviendo la app
✅ SSL funcionando
✅ https://inmovaapp.com accesible
```

---

## 💡 Configuración Rápida (Script)

Si quieres automatizar parte del proceso:

```bash
#!/bin/bash
# Script de configuración rápida

DOMAIN="inmovaapp.com"
APP_PORT="3000"

# Crear directorio SSL
sudo mkdir -p /etc/ssl/cloudflare

echo "Por favor, pega el certificado SSL de Cloudflare y presiona Ctrl+D:"
sudo tee /etc/ssl/cloudflare/cert.pem > /dev/null

echo "Por favor, pega la llave privada y presiona Ctrl+D:"
sudo tee /etc/ssl/cloudflare/key.pem > /dev/null

# Establecer permisos
sudo chmod 600 /etc/ssl/cloudflare/key.pem
sudo chmod 644 /etc/ssl/cloudflare/cert.pem

# Activar configuración
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Probar y recargar
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Configuración completada!"
```

---

## 🌐 URLs Finales

Una vez configurado:

- **Principal**: https://inmovaapp.com
- **WWW**: https://www.inmovaapp.com (redirige a principal)
- **CDN**: https://cdn.inmovaapp.com

---

**¿Necesitas ayuda con algún paso de la configuración del servidor?** 🚀
