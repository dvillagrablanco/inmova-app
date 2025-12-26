# ⚠️ PROBLEMA DE FIREWALL EXTERNO - INMOVA.APP

## 🔴 Estado Actual: BLOQUEADO POR FIREWALL EXTERNO

**Fecha:** 26 de diciembre de 2025  
**Servidor:** 157.180.119.236  
**Dominio:** inmova.app  

---

## 📋 Resumen del Problema

### ✅ Lo que está funcionando:
1. **Servidor configurado correctamente:**
   - ✅ Aplicación Next.js compilada y corriendo (PM2)
   - ✅ Nginx configurado para inmova.app
   - ✅ Firewall UFW local con puertos 80, 443, 22 abiertos
   - ✅ DNS apuntando correctamente (inmova.app → 157.180.119.236)
   - ✅ Aplicación accesible desde localhost (dentro del servidor)

### ❌ El problema:
1. **Firewall externo bloqueando conexiones:**
   - ❌ NO accesible desde internet por dominio (inmova.app)
   - ❌ NO accesible desde internet por IP (157.180.119.236)
   - ❌ Timeout en puertos 80 y 443
   - ❌ Let's Encrypt no puede verificar el dominio

---

## 🔍 Diagnóstico Técnico

### Verificaciones realizadas:

```bash
# DNS resuelve correctamente
$ dig inmova.app +short
157.180.119.236  ✅

# Servidor responde internamente
$ curl http://localhost:80
HTTP/1.1 200 OK  ✅

# Firewall local configurado
$ ufw status
80/tcp    ALLOW  ✅
443/tcp   ALLOW  ✅
22/tcp    ALLOW  ✅

# Nginx escuchando correctamente
$ netstat -tlnp | grep :80
0.0.0.0:80  LISTEN  nginx  ✅

# Pero desde fuera...
$ curl http://inmova.app
Timeout ❌

$ curl http://157.180.119.236
Timeout ❌
```

### Conclusión:
**Hay un firewall EXTERNO del proveedor de hosting bloqueando las conexiones HTTP/HTTPS entrantes.**

---

## 🛠️ SOLUCIÓN REQUERIDA

### Acción Necesaria del Usuario:

Debes **contactar con tu proveedor de hosting** o **acceder a su panel de control** para:

1. **Identificar el proveedor:**
   - ¿Quién proporciona el servidor 157.180.119.236?
   - Ejemplos: Hetzner, OVH, AWS, DigitalOcean, etc.

2. **Acceder al panel de firewall:**
   - La mayoría de proveedores tienen un panel web
   - Buscar sección: "Firewall", "Security", "Network", etc.

3. **Abrir los puertos necesarios:**
   ```
   Puerto 80  (HTTP)   → PERMITIR desde 0.0.0.0/0
   Puerto 443 (HTTPS)  → PERMITIR desde 0.0.0.0/0
   Puerto 22  (SSH)    → PERMITIR desde tu IP o 0.0.0.0/0
   ```

4. **Alternativa - Soporte técnico:**
   ```
   Asunto: Abrir puertos 80 y 443 en servidor 157.180.119.236
   
   Mensaje:
   Hola, necesito que abran los puertos 80 (HTTP) y 443 (HTTPS)
   para el servidor con IP 157.180.119.236 ya que actualmente
   están bloqueados y no puedo acceder a mi aplicación web.
   
   Gracias.
   ```

---

## 📊 Configuración Actual del Servidor

### Servicios Configurados (Listos para usar):

#### 1. Nginx
```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name inmova.app www.inmova.app 157.180.119.236;
    return 301 https://$server_name$request_uri;
}

# HTTPS con certificado autofirmado temporal
server {
    listen 443 ssl http2;
    server_name inmova.app www.inmova.app 157.180.119.236;
    
    ssl_certificate /etc/nginx/ssl/inmova.crt;
    ssl_certificate_key /etc/nginx/ssl/inmova.key;
    
    location / {
        proxy_pass http://localhost:3000;
        # ... configuración proxy ...
    }
}
```

#### 2. PM2
```
App: inmova
Status: ONLINE
Port: 3000
Memory: ~78MB
```

#### 3. PostgreSQL
```
Database: inmova_db
User: inmova_user
Status: RUNNING
```

#### 4. Firewall UFW
```
Status: ACTIVE
80/tcp:   ALLOW
443/tcp:  ALLOW
22/tcp:   ALLOW
```

---

## 🚀 Pasos Después de Resolver el Firewall

Una vez que el proveedor de hosting abra los puertos, automáticamente:

### 1. La aplicación será accesible:
```
✅ http://inmova.app  → Redirige a HTTPS
✅ https://inmova.app → Aplicación funcionando
   (Certificado autofirmado - warning temporal en navegador)
```

### 2. Instalar certificado SSL válido:
```bash
# Conectar al servidor
ssh root@157.180.119.236

# Obtener certificado de Let's Encrypt
certbot --nginx -d inmova.app -d www.inmova.app

# Esto reemplazará el certificado autofirmado
# con uno válido y confiable
```

### 3. Verificar funcionamiento:
```bash
# Debería responder 200 OK
curl -I https://inmova.app

# Ver logs
pm2 logs inmova

# Estado de servicios
systemctl status nginx
pm2 status
```

---

## 📞 Información del Proveedor de Hosting

### Datos del servidor:
- **IP:** 157.180.119.236
- **OS:** Ubuntu 22.04.5 LTS
- **SSH Port:** 22
- **Usuario:** root

### Preguntas para identificar proveedor:

1. ¿Dónde contrataste el servidor?
2. ¿Tienes acceso a un panel web de control?
3. ¿Has configurado algún firewall adicional?
4. ¿Es un servidor dedicado, VPS, o cloud?

### Proveedores comunes y sus paneles:

| Proveedor | Panel de Firewall |
|-----------|-------------------|
| **Hetzner** | Cloud Console → Firewalls |
| **OVH** | Manager → Cloud → Network Security Groups |
| **DigitalOcean** | Networking → Firewalls |
| **AWS** | EC2 → Security Groups |
| **Google Cloud** | VPC Network → Firewall |
| **Azure** | Network Security Groups |

---

## ✅ Lista de Verificación

Marca cuando completes cada paso:

- [ ] Identificar proveedor de hosting
- [ ] Acceder al panel de control del proveedor
- [ ] Localizar sección de Firewall/Security
- [ ] Abrir puerto 80 (HTTP)
- [ ] Abrir puerto 443 (HTTPS)
- [ ] Guardar/Aplicar cambios
- [ ] Esperar 1-5 minutos para propagación
- [ ] Verificar acceso: `curl http://inmova.app`
- [ ] Instalar certificado SSL válido con Let's Encrypt
- [ ] Verificar HTTPS: `curl https://inmova.app`

---

## 🔧 Comandos para Verificar (Después de abrir firewall)

```bash
# 1. Verificar que el sitio responde
curl -I http://inmova.app

# 2. Verificar DNS
dig inmova.app +short

# 3. Verificar certificado SSL (después de Let's Encrypt)
openssl s_client -connect inmova.app:443 -servername inmova.app < /dev/null

# 4. Ver logs de acceso
tail -f /var/log/nginx/access.log

# 5. Estado de servicios
ssh root@157.180.119.236 "pm2 status && systemctl status nginx"
```

---

## 📝 Notas Importantes

1. **El servidor está 100% configurado y listo**
   - Solo falta abrir el firewall externo

2. **Certificado SSL temporal**
   - Actualmente hay un certificado autofirmado
   - Los navegadores mostrarán warning de seguridad
   - Se reemplazará automáticamente con Let's Encrypt después

3. **La aplicación funciona perfectamente**
   - Verificado desde dentro del servidor (localhost)
   - PM2 gestiona el proceso
   - Nginx hace proxy correctamente

4. **Acceso SSH funcionando**
   - Puedes conectar por SSH en cualquier momento
   - Puerto 22 no está bloqueado externamente

---

## 🎯 Resumen

### Estado:
- 🟢 **Servidor:** Configurado y funcionando
- 🟢 **Aplicación:** Compilada y corriendo
- 🟢 **DNS:** Apuntando correctamente
- 🔴 **Firewall:** BLOQUEADO POR PROVEEDOR
- 🟡 **SSL:** Autofirmado temporal (OK para testing)

### Próximo paso:
**ABRIR PUERTOS 80 Y 443 EN EL FIREWALL DEL PROVEEDOR DE HOSTING**

Una vez hecho esto, la aplicación estará completamente accesible públicamente en https://inmova.app

---

**Última verificación:** 26 de diciembre de 2025, 19:32 UTC  
**Estado:** Esperando apertura de firewall externo
