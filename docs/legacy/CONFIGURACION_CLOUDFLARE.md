# 🌐 Configuración de inmovaapp.com con Cloudflare

## ✅ Estado Actual

- ✅ Nginx configurado en el servidor (157.180.119.236)
- ✅ Aplicación corriendo en puerto 3000
- ✅ Cloudflare detectado como proxy DNS

---

## 📋 Pasos para Configurar Cloudflare

### 1. Actualizar Registro DNS en Cloudflare

Ve a tu panel de Cloudflare → DNS → Records:

```
Tipo: A
Nombre: @
Destino: 157.180.119.236
Proxy: ✅ Activado (nube naranja)
TTL: Auto
```

```
Tipo: A
Nombre: www
Destino: 157.180.119.236
Proxy: ✅ Activado (nube naranja)
TTL: Auto
```

### 2. Configurar SSL en Cloudflare

**Panel de Cloudflare → SSL/TLS → Overview:**

- Modo SSL: `Full (strict)` ⚠️ IMPORTANTE

**Explicación de modos SSL:**

- ❌ `Off`: Sin SSL (no usar)
- ❌ `Flexible`: Cloudflare→Usuario (HTTPS), Cloudflare→Servidor (HTTP) - Inseguro
- ✅ `Full`: Cloudflare→Usuario (HTTPS), Cloudflare→Servidor (HTTPS con certificado autofirmado)
- ✅ **`Full (strict)`**: Cloudflare→Usuario (HTTPS), Cloudflare→Servidor (HTTPS con certificado válido) - **RECOMENDADO**

### 3. Obtener Certificado SSL en el Servidor

**OPCIÓN A: Certificado Origin de Cloudflare (Recomendado)**

1. Ve a Cloudflare → SSL/TLS → Origin Server
2. Clic en "Create Certificate"
3. Selecciona:
   - Hostnames: `*.inmovaapp.com, inmovaapp.com`
   - Validez: 15 años
4. Copia el certificado y la clave privada
5. Guárdalos en el servidor:

```bash
ssh root@157.180.119.236

# Crear directorio
mkdir -p /etc/ssl/cloudflare

# Guardar certificado
cat > /etc/ssl/cloudflare/inmovaapp.com.pem << 'EOF'
[PEGAR CERTIFICADO AQUÍ]
EOF

# Guardar clave privada
cat > /etc/ssl/cloudflare/inmovaapp.com.key << 'EOF'
[PEGAR CLAVE PRIVADA AQUÍ]
EOF

# Permisos seguros
chmod 600 /etc/ssl/cloudflare/inmovaapp.com.key
chmod 644 /etc/ssl/cloudflare/inmovaapp.com.pem
```

6. Actualizar configuración de Nginx:

```bash
# Editar configuración
nano /etc/nginx/sites-available/inmovaapp.com

# Cambiar las líneas SSL:
ssl_certificate /etc/ssl/cloudflare/inmovaapp.com.pem;
ssl_certificate_key /etc/ssl/cloudflare/inmovaapp.com.key;

# Probar y reiniciar
nginx -t
systemctl reload nginx
```

**OPCIÓN B: Usar Let's Encrypt con validación DNS**

Si prefieres Let's Encrypt (más complejo con Cloudflare):

```bash
# En el servidor
certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  -d inmovaapp.com \
  -d www.inmovaapp.com
```

Requiere configurar API Token de Cloudflare.

### 4. Configurar Reglas de Firewall (Opcional pero Recomendado)

**Cloudflare → Security → WAF:**

- ✅ Activar "Browser Integrity Check"
- ✅ Activar "Challenge Passage"
- ✅ Activar protección contra bots

### 5. Configurar Cache (Opcional)

**Cloudflare → Caching → Configuration:**

```
Caching Level: Standard
Browser Cache TTL: Respect Existing Headers
```

**Page Rules (opcional):**

```
URL: inmovaapp.com/_next/static/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month
```

### 6. Verificar Configuración

Después de los cambios, espera **5-10 minutos** y verifica:

```bash
# Verificar DNS
dig inmovaapp.com +short

# Verificar HTTPS
curl -I https://inmovaapp.com

# Verificar certificado
openssl s_client -connect inmovaapp.com:443 -servername inmovaapp.com
```

---

## 🚀 Verificación Final

✅ https://inmovaapp.com → Debe cargar tu aplicación
✅ https://www.inmovaapp.com → Debe redirigir a inmovaapp.com
✅ http://inmovaapp.com → Debe redirigir a HTTPS
✅ Certificado SSL válido (candado verde)

---

## ⚡ Ventajas de Usar Cloudflare

- ✅ Protección DDoS
- ✅ CDN global (tu app carga más rápido en todo el mundo)
- ✅ Cache automático de assets estáticos
- ✅ SSL/TLS gratis
- ✅ Firewall de aplicaciones web (WAF)
- ✅ Analytics y métricas
- ✅ Oculta la IP real del servidor

---

## 🆘 Troubleshooting

### Error "Too many redirects"

**Causa:** Cloudflare SSL en modo `Flexible` pero Nginx redirige HTTP a HTTPS

**Solución:** Cambiar Cloudflare SSL a `Full` o `Full (strict)`

### Error 502 Bad Gateway

**Causa:** El servidor no responde en el puerto 3000

**Solución:**

```bash
# Verificar que la app esté corriendo
docker ps | grep inmova-app

# Ver logs
docker logs inmova-app_app_1
```

### Certificado SSL inválido

**Causa:** Usando certificado autofirmado con modo `Full (strict)`

**Solución:** Usar certificado Origin de Cloudflare o Let's Encrypt

---

## 📞 Soporte

Si tienes problemas, verifica:

1. DNS propagado: https://dnschecker.org/#A/inmovaapp.com
2. SSL configurado correctamente en Cloudflare
3. Nginx corriendo: `systemctl status nginx`
4. App corriendo: `docker ps`
