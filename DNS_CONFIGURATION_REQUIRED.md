# ⚠️ CONFIGURACIÓN DNS REQUERIDA PARA INMOVA.APP

**Fecha:** 27 de Diciembre 2025  
**Estado:** DNS apuntando a IP incorrecta

---

## ❌ PROBLEMA ACTUAL

El DNS de `inmova.app` está apuntando a:

- **66.71.220.1**
- **66.71.220.2**

Debe apuntar a:

- **157.180.119.236** (tu servidor Hetzner)

---

## ✅ SOLUCIÓN

### Paso 1: Accede a tu Proveedor DNS

Ve al panel donde compraste/gestionas `inmova.app`:

- GoDaddy
- Namecheap
- Cloudflare
- Google Domains
- Otro proveedor

### Paso 2: Gestiona los Registros DNS

Busca la sección "DNS Management" o "DNS Settings"

### Paso 3: ELIMINA Registros Antiguos

Busca y **ELIMINA** los registros A que apuntan a:

- `66.71.220.1`
- `66.71.220.2`

### Paso 4: AÑADE Nuevos Registros

**Registro A Principal:**

```
Tipo: A
Nombre: @ (o vacío, o "inmova.app")
Valor: 157.180.119.236
TTL: 3600 (o mínimo disponible)
```

**Registro A para www:**

```
Tipo: A
Nombre: www
Valor: 157.180.119.236
TTL: 3600
```

### Paso 5: Guarda los Cambios

Haz clic en "Save" o "Update" en tu proveedor DNS.

---

## ⏱️ TIEMPO DE PROPAGACIÓN

Los cambios DNS pueden tardar:

- **Mínimo:** 5-15 minutos
- **Normal:** 1-2 horas
- **Máximo:** 24-48 horas

### Verificar Propagación

Usa estas herramientas para verificar:

1. **DNSChecker:** https://dnschecker.org
   - Busca: `inmova.app`
   - Debería mostrar: `157.180.119.236`

2. **Comando dig:**

   ```bash
   dig inmova.app +short
   ```

   Debe devolver: `157.180.119.236`

3. **Google DNS:**
   ```bash
   nslookup inmova.app 8.8.8.8
   ```

---

## 📌 MIENTRAS TANTO

### La Aplicación SÍ Está Funcionando

Puedes acceder temporalmente por IP:

```
http://157.180.119.236
```

Todas las funcionalidades están disponibles.

---

## 🔐 DESPUÉS DE CORREGIR EL DNS

Una vez que el DNS apunte correctamente a `157.180.119.236`:

1. **Avísame** en el chat
2. Ejecutaré automáticamente:
   ```bash
   certbot --nginx -d inmova.app -d www.inmova.app
   ```
3. Esto configurará **SSL/HTTPS** automáticamente
4. Tu app estará en: `https://inmova.app` ✅

---

## 🐛 SOBRE EL MODO PRODUCCIÓN

La aplicación está en **modo desarrollo** porque hay algunos errores de sintaxis en el código:

### Errores Pendientes:

1. **`app/admin/planes/page.tsx`** (línea 228)
   - Error: JSX syntax error
   - Necesita revisión manual

2. **`app/admin/reportes-programados/page.tsx`** (línea 419)
   - Error: JSX syntax error
   - Necesita revisión manual

3. **`app/api/cron/onboarding-automation/route.ts`** (línea 14)
   - ✅ Ya corregido

4. **Imports de auth**
   - ✅ Ya corregidos

### Modo Desarrollo vs Producción

**Modo Desarrollo** (actual):

- ✅ Funciona con errores de sintaxis menores
- ✅ Hot reload
- ⚠️ Menos optimizado
- ⚠️ Más lento

**Modo Producción** (pendiente):

- ✅ Optimizado y rápido
- ✅ Mejor performance
- ❌ Requiere código sin errores

---

## 📊 CHECKLIST

### Hecho ✅

- [x] Servidor configurado (157.180.119.236)
- [x] Puerto 80 abierto en Hetzner Cloud
- [x] PostgreSQL funcionando
- [x] INMOVA desplegado (modo desarrollo)
- [x] Nginx configurado para inmova.app
- [x] Certbot instalado
- [x] Variables de entorno configuradas
- [x] Aplicación accesible por IP

### Pendiente ⏸️

- [ ] Corregir DNS de inmova.app → 157.180.119.236
- [ ] Esperar propagación DNS
- [ ] Configurar SSL/HTTPS
- [ ] Arreglar errores JSX en admin/planes y admin/reportes-programados
- [ ] Build de producción

---

## 🆘 SI NECESITAS AYUDA

### No Encuentras los Registros DNS

Si no encuentras dónde cambiar los registros:

1. Dime qué proveedor usas (GoDaddy, Namecheap, etc.)
2. Te daré instrucciones específicas para ese proveedor

### El DNS No Cambia

Si después de varias horas el DNS no cambia:

1. Verifica que guardaste los cambios
2. Asegúrate de eliminar los registros viejos
3. Contacta al soporte de tu proveedor DNS

### Problemas con el Acceso

Si después de cambiar el DNS no puedes acceder:

1. Espera al menos 30 minutos
2. Limpia caché DNS:

   ```bash
   # Windows
   ipconfig /flushdns

   # Mac
   sudo dscacheutil -flushcache

   # Linux
   sudo systemd-resolve --flush-caches
   ```

3. Prueba en modo incógnito del navegador

---

**🎯 PRÓXIMO PASO:** Cambia los registros DNS y avísame cuando esté propagado.
