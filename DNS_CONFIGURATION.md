# 🌐 Configuración DNS para inmovaapp.com

**IMPORTANTE**: Debes configurar esto ANTES de ejecutar el deployment con dominio.

---

## 📍 Configuración Requerida

### En Tu Proveedor de Dominio

Ve a la sección de **DNS Management** de tu proveedor (Namecheap, GoDaddy, Cloudflare, etc.) y añade estos registros:

```
Tipo    Nombre    Valor              TTL
A       @         157.180.119.236    300 (o automático)
A       www       157.180.119.236    300 (o automático)
```

### Explicación

- **Tipo A**: Apunta el dominio a una dirección IP
- **@**: Representa el dominio raíz (inmovaapp.com)
- **www**: Subdominio www (www.inmovaapp.com)
- **157.180.119.236**: IP del servidor VPS
- **TTL**: Time To Live (tiempo de caché DNS)

---

## 🔍 Verificar Configuración DNS

### Antes del Deployment

```bash
# Verificar DNS propagado
dig inmovaapp.com +short
# Debería mostrar: 157.180.119.236

dig www.inmovaapp.com +short
# Debería mostrar: 157.180.119.236

# O usar herramienta online
# https://dnschecker.org
```

### ⏰ Tiempo de Propagación

- **Mínimo**: 15-30 minutos
- **Normal**: 2-4 horas
- **Máximo**: 24-48 horas

**Recomendación**: Espera al menos 30 minutos después de configurar DNS antes de ejecutar el deployment.

---

## 📋 Paso a Paso por Proveedor

### Namecheap

1. Login en namecheap.com
2. Domain List → Manage
3. Advanced DNS
4. Add New Record:
   - Type: A Record
   - Host: @
   - Value: 157.180.119.236
   - TTL: Automatic
5. Add New Record:
   - Type: A Record
   - Host: www
   - Value: 157.180.119.236
   - TTL: Automatic
6. Save All Changes

### GoDaddy

1. Login en godaddy.com
2. My Products → DNS
3. Add → A:
   - Name: @
   - Value: 157.180.119.236
   - TTL: 600 seconds
4. Add → A:
   - Name: www
   - Value: 157.180.119.236
   - TTL: 600 seconds
5. Save

### Cloudflare

1. Login en cloudflare.com
2. Seleccionar dominio
3. DNS → Add record
4. Type: A
   - Name: @
   - IPv4: 157.180.119.236
   - Proxy: OFF (nube gris)
5. Add record
6. Type: A
   - Name: www
   - IPv4: 157.180.119.236
   - Proxy: OFF (nube gris)
7. Save

**IMPORTANTE con Cloudflare**: Desactiva el proxy (nube gris) para que Let's Encrypt funcione correctamente.

### Google Domains

1. Login en domains.google.com
2. Manage → DNS
3. Custom records → Manage custom records
4. Create new record:
   - Host name: @
   - Type: A
   - TTL: 300
   - Data: 157.180.119.236
5. Create new record:
   - Host name: www
   - Type: A
   - TTL: 300
   - Data: 157.180.119.236
6. Save

---

## ✅ Checklist Pre-Deployment

- [ ] DNS A record para @ → 157.180.119.236
- [ ] DNS A record para www → 157.180.119.236
- [ ] Esperado al menos 30 minutos después de configurar
- [ ] Verificado con `dig inmovaapp.com` o dnschecker.org
- [ ] DNS propagado correctamente

---

## 🚀 Después de Configurar DNS

Una vez verificado que DNS está propagado:

```bash
bash full-deploy-with-domain.sh
```

El script configurará automáticamente:

- ✅ Nginx con el dominio
- ✅ SSL con Let's Encrypt
- ✅ Redirect HTTP → HTTPS
- ✅ Variables de entorno con el dominio

---

## 🔧 Troubleshooting DNS

### DNS no propaga

```bash
# Verificar nameservers
dig NS inmovaapp.com

# Limpiar cache DNS local
# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches

# Windows
ipconfig /flushdns
```

### DNS apunta a IP incorrecta

1. Verifica la configuración en tu proveedor
2. Espera unos minutos (cache DNS)
3. Verifica con: `dig inmovaapp.com +short`

### Certificado SSL falla

Si el DNS no está propagado cuando ejecutas certbot:

```bash
# Espera y reintenta manualmente
ssh root@157.180.119.236
certbot --nginx -d inmovaapp.com -d www.inmovaapp.com
```

---

**Fecha**: 29 de diciembre de 2025  
**Servidor**: 157.180.119.236  
**Dominio**: inmovaapp.com
