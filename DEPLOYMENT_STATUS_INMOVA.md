# 📊 ESTADO ACTUAL DEL DEPLOYMENT DE INMOVA

**Actualizado:** 27 de Diciembre 2025

---

## ✅ ¿QUÉ ESTÁ FUNCIONANDO?

### 1. Servidor Configurado

- ✅ Servidor Hetzner: 157.180.119.236
- ✅ PostgreSQL 16 corriendo
- ✅ INMOVA en Docker (modo desarrollo)
- ✅ Nginx configurado
- ✅ Coolify instalado

### 2. Aplicación

- ✅ Next.js 14.2.28 funcionando
- ✅ Base de datos conectada
- ✅ Variables de entorno configuradas
- ✅ Responde correctamente en localhost

### 3. Dominio

- ✅ Nginx configurado para `inmova.app`
- ✅ Certbot instalado para SSL

---

## ⚠️ ACCIONES REQUERIDAS DE TU PARTE

### 1. URGENTE: Abrir Puerto 80 en Hetzner Cloud

**El puerto 80 está bloqueado por el firewall de Hetzner Cloud.**

**Pasos:**

1. Ve a: https://console.hetzner.cloud
2. Selecciona tu servidor (157.180.119.236)
3. Ve a **"Firewalls"** o **"Networking"**
4. **Añade estas reglas:**

```
Protocolo: TCP
Puerto: 80
Fuente: 0.0.0.0/0 (Any/Anywhere)
```

```
Protocolo: TCP
Puerto: 443
Fuente: 0.0.0.0/0 (Any/Anywhere)
```

### 2. URGENTE: Configurar DNS de inmova.app

**Registros DNS necesarios:**

```
Tipo: A
Nombre: @
Valor: 157.180.119.236
TTL: 3600
```

```
Tipo: A
Nombre: www
Valor: 157.180.119.236
TTL: 3600
```

**¿Dónde?** En el panel de tu proveedor DNS (GoDaddy, Namecheap, Cloudflare, etc.)

**Verificación:** https://dnschecker.org (busca "inmova.app")

---

## 🔧 UNA VEZ QUE HAGAS LO ANTERIOR

### Cuando el DNS esté propagado (5 min - 48 horas):

Ejecuta este comando para obtener SSL:

```bash
ssh root@157.180.119.236 'certbot --nginx -d inmova.app -d www.inmova.app --non-interactive --agree-tos --email tu@email.com'
```

Esto configurará automáticamente HTTPS con Let's Encrypt.

---

## 🐛 ERRORES DE CÓDIGO PENDIENTES

La aplicación está en **modo desarrollo** porque hay errores que impiden el build de producción:

### Errores encontrados:

1. **`app/admin/planes/page.tsx`** - Error de sintaxis JSX
2. **`app/admin/reportes-programados/page.tsx`** - Error de sintaxis JSX
3. **`app/api/cron/onboarding-automation/route.ts`** - Comentario mal formado (línea 14)
4. **`app/api/esg/decarbonization-plans/route.ts`** - No encuentra `@/lib/auth`
5. **`app/api/esg/metrics/route.ts`** - No encuentra `@/lib/auth`
6. **Conflicto de dependencias:** zod@3.23.8 vs zod@^3.25.0 requerido por @anthropic-ai/sdk

### Para arreglar:

```bash
# Conectarse al servidor
ssh root@157.180.119.236

# Entrar al contenedor
docker exec -it inmova sh

# Editar archivos con errores
vi app/api/cron/onboarding-automation/route.ts
# Arreglar el comentario de la línea 14

# Para @/lib/auth, cambiar imports a:
# import { authOptions } from '@/lib/auth-options';
```

O mejor: arregla los errores localmente y haz un nuevo push al repositorio.

---

## 🚀 CAMBIAR A PRODUCCIÓN (Después de arreglar errores)

Una vez arreglados los errores de código:

```bash
ssh root@157.180.119.236

cd /opt/inmova-app

# Limpiar cache
rm -rf .next

# Build de producción
docker exec inmova sh -c "npm run build"

# Si build exitoso, cambiar comando del contenedor
docker stop inmova
docker rm inmova

docker run -d \
  --name inmova \
  --network inmova-network \
  -p 3001:3000 \
  -v /opt/inmova-app:/app \
  -w /app \
  --env-file /opt/inmova-app/.env.production \
  --restart unless-stopped \
  node:20-alpine \
  sh -c "npm install --legacy-peer-deps && npx prisma generate && npm start"
```

---

## 📋 CHECKLIST COMPLETO

### En el Servidor (✅ Completado)

- [x] Docker instalado
- [x] PostgreSQL desplegado
- [x] INMOVA desplegado (modo dev)
- [x] Nginx configurado
- [x] Certbot instalado
- [x] Firewall UFW configurado (puertos 80, 443, 8000)
- [x] Variables de entorno con inmova.app

### Tu Parte (⏸️ Pendiente)

- [ ] Abrir puerto 80 y 443 en Hetzner Cloud
- [ ] Configurar DNS A records para inmova.app
- [ ] Esperar propagación DNS
- [ ] Ejecutar certbot para SSL
- [ ] Arreglar errores de código (opcional pero recomendado)

### Después de lo Anterior

- [ ] SSL/HTTPS funcionando
- [ ] inmova.app accesible
- [ ] Build de producción (cuando código esté limpio)

---

## 📞 COMANDOS ÚTILES

### Ver logs

```bash
ssh root@157.180.119.236 'docker logs inmova -f'
```

### Reiniciar app

```bash
ssh root@157.180.119.236 'docker restart inmova'
```

### Verificar DNS

```bash
dig inmova.app
nslookup inmova.app
```

### Test local (desde el servidor)

```bash
ssh root@157.180.119.236 'curl http://localhost:3001'
```

### Obtener SSL (después de DNS propagado)

```bash
ssh root@157.180.119.236 'certbot --nginx -d inmova.app -d www.inmova.app'
```

---

## 🎯 RESUMEN

**Estado Actual:**

- ✅ Servidor listo y configurado
- ⏸️ Esperando que abras puerto 80 en Hetzner Cloud
- ⏸️ Esperando que configures DNS de inmova.app
- ⚠️ Modo desarrollo (funciona pero no optimizado)

**Próximo paso inmediato:**

1. Abrir puerto 80 en Hetzner Cloud
2. Configurar DNS

**Después de eso:**

- Obtener SSL con certbot
- App accesible en https://inmova.app

**A medio plazo:**

- Arreglar errores de código
- Cambiar a modo producción
- Configurar integraciones (Stripe, AWS, etc.)

---

**¿Necesitas ayuda?** Avísame cuando hayas abierto el puerto 80 y configurado el DNS.
