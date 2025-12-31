# 🚀 Deployment de inmovaapp.com - Guía Completa

## ✅ Estado Actual del Servidor

**Servidor:** 157.180.119.236
**Usuario:** root
**Aplicación:** Corriendo en puerto 3000
**Base de datos:** PostgreSQL en puerto 5433
**Cache:** Redis en puerto 6379
**Web Server:** Nginx (reverse proxy)

---

## 🌐 Configuración del Dominio

### Opción 1: Con Cloudflare (RECOMENDADO)

Tu dominio **inmovaapp.com** ya está en Cloudflare. Sigue estos pasos:

#### Paso 1: Actualizar DNS en Cloudflare

1. Ve a tu panel de Cloudflare: https://dash.cloudflare.com
2. Selecciona el dominio **inmovaapp.com**
3. Ve a **DNS → Records**
4. Edita o crea estos registros:

```
Tipo: A
Nombre: @
Destino: 157.180.119.236
Proxy: ✅ ACTIVADO (nube naranja)
TTL: Auto

Tipo: A
Nombre: www
Destino: 157.180.119.236
Proxy: ✅ ACTIVADO (nube naranja)
TTL: Auto
```

#### Paso 2: Configurar SSL en Cloudflare

1. Ve a **SSL/TLS → Overview**
2. Cambia el modo SSL a: **Full (strict)** ⚠️ IMPORTANTE
3. Ve a **SSL/TLS → Origin Server**
4. Clic en **"Create Certificate"**
5. Configura:
   - Private key type: RSA (2048)
   - Hostnames: `*.inmovaapp.com, inmovaapp.com`
   - Certificate Validity: 15 years
6. Clic en **"Create"**
7. **COPIA** el certificado y la clave privada

#### Paso 3: Instalar Certificado en el Servidor

Desde tu terminal local, ejecuta:

```bash
cd /path/to/inmova-app
python3 scripts/setup-cloudflare-ssl.py
```

El script te pedirá que pegues:

1. El certificado (Origin Certificate)
2. La clave privada (Private Key)

Alternativamente, puedes hacerlo manualmente vía SSH:

```bash
ssh root@157.180.119.236

# Crear directorio
mkdir -p /etc/ssl/cloudflare

# Guardar certificado
nano /etc/ssl/cloudflare/inmovaapp.com.pem
# [Pegar certificado aquí]

# Guardar clave
nano /etc/ssl/cloudflare/inmovaapp.com.key
# [Pegar clave aquí]

# Permisos
chmod 600 /etc/ssl/cloudflare/inmovaapp.com.key
chmod 644 /etc/ssl/cloudflare/inmovaapp.com.pem

# Actualizar Nginx
sed -i 's|ssl_certificate .*;|ssl_certificate /etc/ssl/cloudflare/inmovaapp.com.pem;|' /etc/nginx/sites-available/inmovaapp.com
sed -i 's|ssl_certificate_key .*;|ssl_certificate_key /etc/ssl/cloudflare/inmovaapp.com.key;|' /etc/nginx/sites-available/inmovaapp.com

# Probar y recargar
nginx -t
systemctl reload nginx
```

#### Paso 4: Esperar Propagación DNS

Verifica que el DNS haya propagado (5-10 minutos):

```bash
# Verificar DNS
dig inmovaapp.com +short

# Debe mostrar IPs de Cloudflare (104.x.x.x o 172.x.x.x)
# Esto es CORRECTO si estás usando Cloudflare como proxy
```

#### Paso 5: Verificar la Aplicación

Abre en tu navegador:

✅ https://inmovaapp.com
✅ https://www.inmovaapp.com (debe redirigir a sin www)
✅ http://inmovaapp.com (debe redirigir a HTTPS)

---

### Opción 2: Sin Cloudflare (DNS Directo)

Si prefieres apuntar directamente al servidor:

#### Paso 1: Actualizar DNS

En tu proveedor de DNS (Namecheap, GoDaddy, etc.):

```
Tipo: A
Host: @
Valor: 157.180.119.236
TTL: 300

Tipo: A
Host: www
Valor: 157.180.119.236
TTL: 300
```

#### Paso 2: Obtener Certificado SSL con Let's Encrypt

```bash
ssh root@157.180.119.236

# Obtener certificado
certbot --nginx -d inmovaapp.com -d www.inmovaapp.com

# Seguir las instrucciones interactivas
```

---

## 🔐 Actualizar Variables de Entorno

Actualiza `.env.production` en el servidor para usar el dominio:

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
nano .env.production
```

Actualiza estas variables:

```env
# URL de la aplicación
NEXTAUTH_URL=https://inmovaapp.com
NEXT_PUBLIC_APP_URL=https://inmovaapp.com

# Allowed Origins para CORS
ALLOWED_ORIGINS=https://inmovaapp.com,https://www.inmovaapp.com
```

Reinicia la aplicación:

```bash
cd /opt/inmova-app
bash scripts/deploy-direct.sh
```

---

## 🧪 Verificación Final

### Checklist

- [ ] DNS configurado (apunta a 157.180.119.236 o Cloudflare)
- [ ] Cloudflare SSL en modo "Full (strict)"
- [ ] Certificado Origin instalado en el servidor
- [ ] Nginx corriendo: `systemctl status nginx`
- [ ] Aplicación corriendo: `docker ps | grep inmova`
- [ ] https://inmovaapp.com carga correctamente
- [ ] Certificado SSL válido (candado verde en navegador)
- [ ] Redirección HTTP → HTTPS funciona
- [ ] Variables de entorno actualizadas

### Comandos de Verificación

```bash
# Verificar DNS
dig inmovaapp.com +short

# Verificar HTTPS
curl -I https://inmovaapp.com

# Ver logs de Nginx
tail -f /var/log/nginx/access.log

# Ver logs de la aplicación
docker logs -f inmova-app_app_1

# Estado de servicios
systemctl status nginx
docker ps
```

---

## 🐛 Troubleshooting

### Error: "Too many redirects"

**Causa:** Cloudflare SSL en modo "Flexible"

**Solución:**

1. Ve a Cloudflare → SSL/TLS → Overview
2. Cambia a "Full (strict)"

### Error: 502 Bad Gateway

**Causa:** La aplicación no está corriendo

**Solución:**

```bash
ssh root@157.180.119.236
cd /opt/inmova-app
docker ps -a  # Ver estado
docker logs inmova-app_app_1  # Ver errores
bash scripts/deploy-direct.sh  # Reiniciar
```

### Error: Certificado SSL inválido

**Causa:** Modo "Full (strict)" sin certificado válido

**Solución:**

1. Instala el certificado Origin de Cloudflare
2. O cambia temporalmente a modo "Full" (menos seguro)

### La aplicación no carga

**Verificar:**

```bash
# ¿Nginx está corriendo?
systemctl status nginx

# ¿Puerto 80 y 443 abiertos?
netstat -tulpn | grep nginx

# ¿Aplicación respondiendo?
curl http://localhost:3000

# ¿Firewall bloqueando?
ufw status
```

---

## 📞 Soporte Adicional

Si tienes problemas, revisa:

1. **Logs de Nginx:** `/var/log/nginx/error.log`
2. **Logs de la app:** `docker logs inmova-app_app_1`
3. **Propagación DNS:** https://dnschecker.org/#A/inmovaapp.com
4. **Test SSL:** https://www.ssllabs.com/ssltest/analyze.html?d=inmovaapp.com

---

## ⚡ Optimizaciones Adicionales (Opcional)

### Configurar Cloudflare Page Rules

Para mejorar el rendimiento:

1. Ve a Cloudflare → Rules → Page Rules
2. Crea regla para assets estáticos:

```
URL: inmovaapp.com/_next/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
```

### Activar HTTP/3

1. Ve a Cloudflare → Network
2. Activa HTTP/3 (with QUIC)
3. Activa 0-RTT Connection Resumption

### Activar Brotli Compression

1. Ve a Cloudflare → Speed → Optimization
2. Activa Brotli

---

## 🎉 ¡Listo!

Tu aplicación debería estar disponible en:

**🌐 https://inmovaapp.com**

Con:

- ✅ SSL/TLS configurado
- ✅ Protección DDoS de Cloudflare
- ✅ CDN global
- ✅ Redirecciones automáticas
- ✅ Headers de seguridad
