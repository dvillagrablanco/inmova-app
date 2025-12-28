# 🔧 CONFIGURACIÓN DNS NECESARIA PARA SSL

## ❌ **PROBLEMA ACTUAL**

Let's Encrypt no puede verificar los dominios porque:

1. **inmova.app** (apex/root) → ❌ No tiene registro A
2. **www.inmova.app** → ⚠️ Todavía llega al servidor antiguo

---

## ✅ **SOLUCIÓN: Configurar DNS en DeepAgent**

Necesitas agregar/verificar estos registros DNS en tu panel de **DeepAgent**:

### **Registro 1: Apex Domain (sin www)**

```
Tipo: A
Nombre: @   (o dejar vacío, o "inmova.app")
Valor: 157.180.119.236
TTL: 3600
Proxy/CDN: DESACTIVADO
```

### **Registro 2: Subdominio www**

```
Tipo: A
Nombre: www
Valor: 157.180.119.236
TTL: 3600
Proxy/CDN: DESACTIVADO
```

---

## 🔍 **VERIFICAR QUE LOS CAMBIOS FUNCIONAN**

Después de configurar, espera 5-10 minutos y verifica:

```bash
# Debe mostrar: 157.180.119.236
dig +short inmova.app A

# Debe mostrar: 157.180.119.236
dig +short www.inmova.app A

# Verificar que no hay proxy/CDN
curl -I http://www.inmova.app
# Debe mostrar: Server: nginx/1.24.0 (Ubuntu)
# Si muestra nginx/1.18.0 → Todavía está en el servidor antiguo
```

---

## ⏰ **DESPUÉS DE CONFIGURAR DNS**

Una vez que los registros DNS estén correctos y propagados:

```bash
cd /workspace
./configurar-ssl-letsencrypt.sh
```

O manualmente:

```bash
sudo /usr/bin/certbot --nginx -d inmova.app -d www.inmova.app --non-interactive --agree-tos --email admin@inmova.app --redirect
```

---

## 📊 **ESTADO ACTUAL DEL SERVIDOR**

✅ **TODO FUNCIONANDO EN EL SERVIDOR**:

- PostgreSQL corriendo
- Next.js app corriendo (PM2)
- NGINX configurado correctamente
- HTTPS temporal funcionando

❌ **SOLO FALTA**: DNS configurado correctamente en DeepAgent

---

## 💡 **ALTERNATIVA: SSL con solo WWW**

Si no puedes configurar el apex domain ahora, podemos configurar SSL solo para www:

```bash
sudo /usr/bin/certbot --nginx -d www.inmova.app --non-interactive --agree-tos --email admin@inmova.app
```

Y luego redirigir inmova.app → www.inmova.app en DeepAgent (registro CNAME o redirect).
