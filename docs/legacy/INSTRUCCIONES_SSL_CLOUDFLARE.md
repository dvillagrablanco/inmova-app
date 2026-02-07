# 🔐 Configuración SSL - Cloudflare + Nginx

## ✅ Estado Actual

- ✅ **DNS configurado**: inmovaapp.com → 157.180.119.236
- ✅ **Certificado SSL instalado** en el servidor (autofirmado)
- ✅ **Nginx configurado** para HTTPS (puerto 443)
- ⚠️ **SSL Cloudflare**: Actualmente en modo "Flexible" (cambiar a "Full")

---

## 🔄 PASO 1: Cambiar Modo SSL en Cloudflare (OBLIGATORIO)

### Pasos:

1. Ve a https://dash.cloudflare.com
2. Selecciona **inmovaapp.com**
3. Ve a **SSL/TLS** → **Overview**
4. Cambia el modo SSL:
   - **Actual:** Flexible ❌
   - **Nuevo:** Full ✅

### Diferencia de Modos:

| Modo          | Usuario ↔ Cloudflare | Cloudflare ↔ Servidor                   | Seguro  |
| ------------- | -------------------- | --------------------------------------- | ------- |
| Flexible      | ✅ HTTPS             | ❌ HTTP                                 | ❌ NO   |
| **Full**      | ✅ HTTPS             | ✅ HTTPS (autofirmado OK)               | ✅ SÍ   |
| Full (strict) | ✅ HTTPS             | ✅ HTTPS (certificado válido requerido) | ✅✅ SÍ |

**Recomendación:** Usa **"Full"** con el certificado actual (autofirmado).

---

## 🔐 PASO 2 (Opcional): Certificado Origin de Cloudflare

Para máxima seguridad, puedes usar un certificado Origin de Cloudflare y cambiar a **"Full (strict)"**.

### ¿Por qué hacerlo?

- ✅ Certificado válido por 15 años
- ✅ Específico para Cloudflare
- ✅ Permite modo "Full (strict)"
- ✅ Más seguro que autofirmado

### Pasos:

#### 1. Crear Certificado en Cloudflare

1. Ve a **SSL/TLS** → **Origin Server**
2. Clic en **"Create Certificate"**
3. Configura:
   ```
   Private key type: RSA (2048)
   Hostnames: *.inmovaapp.com, inmovaapp.com
   Certificate Validity: 15 years
   ```
4. Clic en **"Create"**
5. **COPIA** ambos:
   - Origin Certificate
   - Private Key

#### 2. Instalar Certificado en el Servidor

**Opción A: Usando el script automático**

Desde tu terminal local:

```bash
python3 scripts/setup-cloudflare-ssl.py
```

El script te pedirá que pegues el certificado y la clave.

**Opción B: Manualmente vía SSH**

```bash
ssh root@157.180.119.236

# Crear directorio
mkdir -p /etc/ssl/cloudflare

# Guardar certificado Origin
nano /etc/ssl/cloudflare/inmovaapp.com.pem
# Pega el "Origin Certificate" aquí (todo, incluyendo BEGIN/END)
# Guarda: Ctrl+O, Enter, Ctrl+X

# Guardar clave privada
nano /etc/ssl/cloudflare/inmovaapp.com.key
# Pega el "Private Key" aquí (todo, incluyendo BEGIN/END)
# Guarda: Ctrl+O, Enter, Ctrl+X

# Configurar permisos
chmod 600 /etc/ssl/cloudflare/inmovaapp.com.key
chmod 644 /etc/ssl/cloudflare/inmovaapp.com.pem

# Actualizar configuración de Nginx
sed -i 's|ssl_certificate .*;|ssl_certificate /etc/ssl/cloudflare/inmovaapp.com.pem;|' /etc/nginx/sites-available/inmovaapp.com
sed -i 's|ssl_certificate_key .*;|ssl_certificate_key /etc/ssl/cloudflare/inmovaapp.com.key;|' /etc/nginx/sites-available/inmovaapp.com

# Probar configuración
nginx -t

# Si todo OK, recargar Nginx
systemctl reload nginx
```

#### 3. Cambiar a "Full (strict)" en Cloudflare

1. Ve a **SSL/TLS** → **Overview**
2. Cambia el modo SSL a: **"Full (strict)"**

---

## 🧪 Verificación

### 1. Verificar HTTPS

```bash
# Debe responder con código 200 y certificado SSL
curl -I https://inmovaapp.com
```

### 2. Verificar Certificado SSL

```bash
# Ver detalles del certificado
openssl s_client -connect inmovaapp.com:443 -servername inmovaapp.com
```

### 3. Verificar en Navegador

Abre https://inmovaapp.com y verifica:

- ✅ Candado verde en la barra de direcciones
- ✅ Certificado SSL válido (clic en el candado)
- ✅ La aplicación carga correctamente

---

## 🐛 Troubleshooting

### Error: "Too many redirects"

**Causa:** Cloudflare en modo "Flexible" pero Nginx redirige HTTP a HTTPS

**Solución:** Cambiar Cloudflare a modo "Full"

### Error: 502 Bad Gateway

**Causa:** Nginx no puede conectar con la aplicación

**Verificar:**

```bash
ssh root@157.180.119.236
docker ps  # ¿La app está corriendo?
netstat -tulpn | grep :3000  # ¿Puerto 3000 abierto?
curl http://localhost:3000  # ¿Responde?
```

### Error: Certificado SSL inválido con "Full (strict)"

**Causa:** Usando certificado autofirmado con modo "Full (strict)"

**Soluciones:**

1. Instalar certificado Origin de Cloudflare (recomendado)
2. O cambiar a modo "Full" (menos seguro)

### HTTPS no funciona

**Verificar Nginx:**

```bash
ssh root@157.180.119.236

# ¿Nginx escuchando en 443?
netstat -tulpn | grep :443

# ¿Configuración correcta?
nginx -t

# Ver logs de errores
tail -50 /var/log/nginx/error.log
```

---

## 📊 Verificar Estado de Servicios

```bash
# Conectar al servidor
ssh root@157.180.119.236

# Estado de Nginx
systemctl status nginx

# Estado de la aplicación
docker ps

# Ver logs de Nginx
tail -f /var/log/nginx/access.log

# Ver logs de la app
docker logs -f inmova-app_app_1

# Puertos abiertos
netstat -tulpn | grep -E ':(80|443|3000)'
```

---

## ✅ Checklist Final

- [ ] DNS apuntando a 157.180.119.236
- [ ] Certificado SSL instalado en el servidor
- [ ] Nginx escuchando en puerto 443
- [ ] Cloudflare SSL en modo "Full" o "Full (strict)"
- [ ] https://inmovaapp.com carga correctamente
- [ ] Certificado SSL válido (candado verde)
- [ ] HTTP redirige a HTTPS
- [ ] www.inmovaapp.com funciona

---

## 🔒 Recomendaciones de Seguridad

### 1. Activar HSTS en Cloudflare

1. Ve a **SSL/TLS** → **Edge Certificates**
2. Activa **HSTS (HTTP Strict Transport Security)**
3. Configura:
   ```
   Max Age: 6 months
   Include subdomains: ✅
   Preload: ✅
   ```

### 2. Activar "Always Use HTTPS"

1. Ve a **SSL/TLS** → **Edge Certificates**
2. Activa **Always Use HTTPS**

### 3. Activar "Automatic HTTPS Rewrites"

1. Ve a **SSL/TLS** → **Edge Certificates**
2. Activa **Automatic HTTPS Rewrites**

### 4. Configurar WAF (Firewall)

1. Ve a **Security** → **WAF**
2. Activa **OWASP Core Ruleset**
3. Configura reglas personalizadas si es necesario

---

## 🎯 Resumen de Acciones

### ⏰ AHORA (ya hecho):

- [x] Certificado SSL instalado en servidor
- [x] Nginx configurado para HTTPS
- [x] DNS apuntando correctamente

### ⏰ HACER AHORA (2 minutos):

- [ ] Cambiar Cloudflare SSL a modo "Full"
- [ ] Verificar https://inmovaapp.com

### ⏰ OPCIONAL (10 minutos):

- [ ] Instalar certificado Origin de Cloudflare
- [ ] Cambiar a modo "Full (strict)"
- [ ] Activar HSTS y otras medidas de seguridad

---

**¡Tu aplicación está lista para funcionar con HTTPS! 🎉**
