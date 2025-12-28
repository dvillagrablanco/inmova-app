# 🚀 SOLUCIONES SIN ACCESO A AWS

## OPCIÓN 1: Cloudflare Proxy (RECOMENDADO - MÁS RÁPIDO)

**Ventajas:**

- ✅ SSL automático y gratuito
- ✅ CDN global incluido
- ✅ Protección DDoS
- ✅ Configuración en 2 minutos

**Pasos:**

1. Ve a tu panel de DeepAgent/Cloudflare
2. **ACTIVA el proxy (nube naranja)** para:
   - inmova.app → 54.201.20.43 (Proxy: 🟠 ACTIVADO)
   - www.inmova.app → 54.201.20.43 (Proxy: 🟠 ACTIVADO)
3. Espera 5 minutos
4. Accede a https://inmova.app

**¡Listo! SSL funcionará automáticamente.**

Cloudflare:

- Maneja el SSL entre usuario y Cloudflare
- Se conecta al servidor con el certificado autofirmado
- No necesitas abrir puertos en AWS

---

## OPCIÓN 2: Cloudflare Tunnel (Sin abrir puertos)

**Ventajas:**

- ✅ No necesita abrir puertos en firewall
- ✅ SSL automático
- ✅ Muy seguro
- ✅ Gratis

**Instalación:**

```bash
# Instalar cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Autenticar con Cloudflare
cloudflared tunnel login

# Crear túnel
cloudflared tunnel create inmova

# Configurar túnel
cat > /etc/cloudflared/config.yml << EOF
tunnel: inmova
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: inmova.app
    service: http://localhost:3000
  - hostname: www.inmova.app
    service: http://localhost:3000
  - service: http_status:404
EOF

# Configurar DNS (desde Cloudflare dashboard)
# Agregar registro CNAME: inmova.app -> <TUNNEL_ID>.cfargotunnel.com

# Iniciar túnel
cloudflared tunnel run inmova
```

---

## OPCIÓN 3: Nginx Proxy Manager en otro servidor

Si tienes otro servidor con firewall abierto:

1. Instala Nginx Proxy Manager
2. Configura reverse proxy hacia 54.201.20.43:80
3. Obtén SSL en ese servidor
4. Apunta el DNS al servidor proxy

---

## OPCIÓN 4: Servicio de Túnel Temporal (ngrok, localtunnel)

**ngrok (Pruebas/desarrollo):**

```bash
# Instalar ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Registrarse en ngrok.com y obtener token
ngrok config add-authtoken <TU_TOKEN>

# Exponer puerto 80
ngrok http 80 --domain=inmova.app
```

**Nota:** ngrok requiere plan de pago para dominios personalizados.

---

## OPCIÓN 5: Contactar al propietario del servidor

Si alguien más gestiona el servidor AWS:

```
Hola,

Necesito abrir los siguientes puertos en el Security Group
del servidor 54.201.20.43:

- Puerto 80 (HTTP) desde 0.0.0.0/0
- Puerto 443 (HTTPS) desde 0.0.0.0/0

Es para permitir acceso web público a la aplicación.

Gracias.
```

---

## OPCIÓN 6: Usar certificado SSL existente

Si ya tienes un certificado SSL válido:

```bash
# Copiar certificado al servidor
sudo cp tu-certificado.crt /etc/ssl/certs/inmova.crt
sudo cp tu-clave-privada.key /etc/ssl/private/inmova.key

# Actualizar configuración NGINX
sudo nano /etc/nginx/sites-available/inmova.app
# Cambiar las líneas:
# ssl_certificate /etc/ssl/certs/inmova.crt;
# ssl_certificate_key /etc/ssl/private/inmova.key;

sudo service nginx restart
```

---

## 🎯 RECOMENDACIÓN INMEDIATA

**OPCIÓN 1 (Cloudflare Proxy)** es la más rápida:

1. Activa el proxy naranja en DeepAgent para ambos dominios
2. Espera 5 minutos
3. Accede a https://inmova.app

¡Funcionará de inmediato!
