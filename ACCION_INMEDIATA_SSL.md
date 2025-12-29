# ⚡ ACCIÓN INMEDIATA - Configurar SSL en Cloudflare

## ✅ Lo que Ya Está Hecho (en el servidor)

- ✅ Certificado SSL instalado
- ✅ Nginx escuchando en puerto 443 (HTTPS)
- ✅ Redirección HTTP → HTTPS configurada
- ✅ DNS apuntando correctamente

---

## 🔴 LO QUE TÚ NECESITAS HACER AHORA (2 MINUTOS)

### Paso 1: Ve a Cloudflare

🔗 https://dash.cloudflare.com

### Paso 2: Selecciona tu dominio

Clic en **inmovaapp.com**

### Paso 3: Cambia el modo SSL

1. En el menú lateral, clic en **SSL/TLS**
2. Clic en **Overview**
3. Verás una opción que dice **"SSL/TLS encryption mode"**
4. **Cambia de:**

   ```
   ❌ Flexible (ACTUAL - INSEGURO)
   ```

   **A:**

   ```
   ✅ Full (NUEVO - SEGURO)
   ```

5. Guarda los cambios

### Paso 4: Espera 30 segundos

Cloudflare necesita propagar el cambio.

### Paso 5: Verifica tu Aplicación

Abre en tu navegador:

**https://inmovaapp.com**

Deberías ver:

- ✅ Tu aplicación cargando
- ✅ Candado verde en la barra de direcciones
- ✅ HTTPS en la URL

---

## 📸 Captura de Pantalla de Referencia

Busca esta sección en Cloudflare:

```
┌─────────────────────────────────────────┐
│ SSL/TLS encryption mode                 │
├─────────────────────────────────────────┤
│                                         │
│  ○ Off (not secure)                    │
│  ○ Flexible                            │
│  ● Full                     ← SELECCIONA ESTE │
│  ○ Full (strict)                       │
│                                         │
│  [ Configure ] button                  │
└─────────────────────────────────────────┘
```

---

## ⚠️ ¿Por Qué Cambiar de "Flexible" a "Full"?

### Modo "Flexible" (INSEGURO):

```
Usuario ──HTTPS──> Cloudflare ──HTTP──> Tu Servidor
         ✅ Cifrado           ❌ SIN CIFRAR
```

**Problema:** El tráfico entre Cloudflare y tu servidor NO está cifrado.

### Modo "Full" (SEGURO):

```
Usuario ──HTTPS──> Cloudflare ──HTTPS──> Tu Servidor
         ✅ Cifrado           ✅ CIFRADO
```

**Ventaja:** Todo el tráfico está cifrado end-to-end.

---

## 🧪 Verificación

Después de cambiar, ejecuta en tu terminal:

```bash
# Verificar que responde con HTTPS
curl -I https://inmovaapp.com

# Debe mostrar algo como:
# HTTP/2 200
# server: cloudflare
```

O simplemente abre en tu navegador:

- ✅ https://inmovaapp.com
- ✅ http://inmovaapp.com (debe redirigir a HTTPS)

---

## 🐛 Si Algo No Funciona

### Error: "Too many redirects"

**Solución:**

1. Asegúrate de estar en modo "Full" (NO "Flexible")
2. Espera 1-2 minutos para que propague
3. Limpia la cache del navegador (Ctrl+Shift+R)

### Error: 502 Bad Gateway

**Solución:**

```bash
# Verificar que la app esté corriendo
ssh root@157.180.119.236 'docker ps | grep inmova'
```

### Error: Certificado SSL inválido

**Solución:**

- Con certificado autofirmado, usa modo "Full" (NO "Full strict")
- Si quieres "Full strict", instala certificado Origin de Cloudflare

---

## 📞 Contacto

Si tienes problemas, avísame y te ayudo.

---

## ✅ Checklist Rápido

- [ ] Abrir https://dash.cloudflare.com
- [ ] Seleccionar inmovaapp.com
- [ ] SSL/TLS → Overview
- [ ] Cambiar a modo "Full"
- [ ] Esperar 30 segundos
- [ ] Abrir https://inmovaapp.com
- [ ] ¡Listo! 🎉

---

**Tiempo estimado: 2 minutos**
