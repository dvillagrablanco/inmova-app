# 🌐 ACCESO TEMPORAL A LA APLICACIÓN

## ✅ **URL ACTUAL (FUNCIONANDO AHORA)**

```
https://counseling-sight-holmes-toolbar.trycloudflare.com
```

**Puedes acceder YA a tu aplicación desde esta URL.**

---

## 🔧 **CÓMO FUNCIONA**

He configurado un **Cloudflare Quick Tunnel** que:

- Conecta tu aplicación (localhost:3000) a internet
- Proporciona SSL automático
- Evita el problema del firewall
- No requiere dominio propio

---

## ⚠️ **IMPORTANTE**

**Esta URL es temporal y cambiará si:**

- Reinicias el servidor
- Se detiene el proceso cloudflared
- Hay un corte de conexión

**Para mantenerla activa permanentemente hasta que tengas tu dominio:**

```bash
# Detener el proceso actual
pkill cloudflared

# Iniciar túnel permanente con PM2
pm2 start cloudflared --name tunnel -- tunnel --url http://localhost:3000
pm2 save
```

Esto hará que el túnel se reinicie automáticamente.

---

## 🎯 **OTRAS OPCIONES DE ACCESO**

### Opción 2: Crear múltiples túneles

Si necesitas más URLs o URLs personalizadas:

```bash
# Túnel 1 (actual)
pm2 start cloudflared --name tunnel1 -- tunnel --url http://localhost:3000

# Túnel 2 (otra URL)
pm2 start cloudflared --name tunnel2 -- tunnel --url http://localhost:3000
```

Cada uno generará una URL diferente.

### Opción 3: ngrok (URLs personalizadas con cuenta gratuita)

```bash
# Instalar ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Registrarte en: https://ngrok.com (gratis)
# Obtener token y ejecutar:
ngrok config add-authtoken <TU_TOKEN>
ngrok http 3000

# Obtendrás URL tipo: https://abc123.ngrok-free.app
```

### Opción 4: Subdominio de tu servidor (si tienes acceso a otro dominio)

Si tienes otro dominio donde sí puedes crear subdominios:

```
app.tuotrodominio.com → 54.201.20.43 (sin proxy)
```

Y configurar SSL con Let's Encrypt para ese dominio.

---

## 🚀 **RECOMENDACIÓN**

**Para ahora (desarrollo/pruebas):**
→ Usa la URL de Cloudflare Tunnel que ya está activa

**Para producción:**
→ Registra un nuevo dominio que controles (cuesta ~$10/año)
→ O resuelve el acceso al panel de inmova.app

---

## 📊 **ESTADO ACTUAL**

| Acceso           | Estado       | URL                                                       |
| ---------------- | ------------ | --------------------------------------------------------- |
| Túnel Cloudflare | ✅ ACTIVO    | https://counseling-sight-holmes-toolbar.trycloudflare.com |
| inmova.app       | ⏸️ Bloqueado | Requiere acceso al panel                                  |
| IP Directa       | ❌ Bloqueado | Firewall AWS                                              |

---

## 🔄 **MANTENER TÚNEL ACTIVO PERMANENTEMENTE**

El túnel actual se detendrá si reinicias el servidor. Para hacerlo permanente:

```bash
# Detener túnel temporal
pkill cloudflared

# Iniciar con PM2 (auto-reinicio)
pm2 start cloudflared --name cloudflare-tunnel -- tunnel --url http://localhost:3000
pm2 save

# Ver URL generada
pm2 logs cloudflare-tunnel | grep trycloudflare.com
```

**Nota:** La URL cambiará, pero será una nueva URL estable.
