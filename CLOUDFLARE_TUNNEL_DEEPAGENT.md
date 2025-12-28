# 🚇 Cloudflare Tunnel - Configuración con DeepAgent

## ✅ **YA INSTALADO EN EL SERVIDOR**

- ✅ cloudflared versión 2025.11.1
- ✅ Configuración básica en ~/.cloudflared/config.yml
- ✅ Aplicación Next.js corriendo en localhost:3000

---

## 📋 **LO QUE NECESITAS SOLICITAR A DEEPAGENT**

Como DeepAgent gestiona tu dominio en Cloudflare, necesitas pedirles que configuren un **Cloudflare Tunnel** (también llamado Argo Tunnel).

### Opción A: DeepAgent configura el túnel completo

**Envía este mensaje a DeepAgent:**

```
Asunto: Configurar Cloudflare Tunnel para inmova.app

Hola,

Necesito configurar un Cloudflare Tunnel para mi dominio inmova.app
porque mi servidor (54.201.20.43) tiene firewall que bloquea
puertos 80 y 443.

¿Pueden configurar un túnel de Cloudflare que apunte:
- inmova.app → Mi servidor (les pasaré las credenciales del túnel)
- www.inmova.app → Mi servidor

El servidor ya tiene cloudflared instalado y la aplicación
corriendo en localhost:3000.

¿Cómo procedo?

Gracias.
```

### Opción B: Crear túnel tú mismo (si DeepAgent te da acceso)

Si DeepAgent te da acceso temporal a Cloudflare:

1. **Ir a Cloudflare Dashboard:**
   - https://dash.cloudflare.com
   - Seleccionar dominio: inmova.app
   - Ir a: Zero Trust → Networks → Tunnels

2. **Crear túnel:**
   - Clic en "Create a tunnel"
   - Nombre: "inmova-production"
   - Tipo: Cloudflared
   - Copiar el token generado

3. **Ejecutar en el servidor:**

   ```bash
   sudo cloudflared service install <TOKEN_COPIADO>
   sudo systemctl start cloudflared
   sudo systemctl enable cloudflared
   ```

4. **Configurar rutas públicas (en Cloudflare Dashboard):**
   - Hostname: inmova.app → http://localhost:3000
   - Hostname: www.inmova.app → http://localhost:3000

---

## 🎯 **ALTERNATIVA SIMPLE: Activar Proxy de Cloudflare**

**Si DeepAgent no puede configurar el túnel**, usa esta opción más simple:

1. **Pídeles que activen el proxy (🟠 naranja) en los registros DNS:**

   ```
   inmova.app (A) → 54.201.20.43 [PROXY: 🟠 ACTIVADO]
   www.inmova.app (A) → 54.201.20.43 [PROXY: 🟠 ACTIVADO]
   ```

2. **Configura SSL en Cloudflare como "Flexible":**
   - Cloudflare Dashboard → SSL/TLS → Overview
   - Modo: Flexible (Cloudflare maneja SSL)

3. **Espera 5 minutos y accede a:**
   - https://inmova.app

**¡Listo! Esta opción es más simple y no requiere túnel.**

---

## 📊 **COMPARACIÓN DE OPCIONES**

| Opción   | Complejidad  | Requiere           | Resultado       |
| -------- | ------------ | ------------------ | --------------- |
| Proxy 🟠 | ⭐ Muy fácil | Solo activar proxy | SSL instantáneo |
| Túnel    | ⭐⭐⭐ Media | Configuración      | Más seguro      |

---

## 🆘 **SI DEEPAGENT NO PUEDE AYUDAR**

Si DeepAgent no ofrece estas opciones, tienes 2 alternativas:

1. **Transferir el dominio a tu cuenta de Cloudflare** (gratis)
2. **Contactar al dueño del servidor AWS** para abrir puertos 80/443

---

## 🎯 **RECOMENDACIÓN**

**OPCIÓN MÁS RÁPIDA:** Pedir a DeepAgent que active el **proxy naranja** (🟠).

Esto:

- ✅ Toma 2 minutos
- ✅ SSL automático
- ✅ No requiere configuración adicional
- ✅ CDN gratis incluido
