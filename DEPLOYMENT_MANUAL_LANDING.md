# 🚀 Deployment Manual - Nueva Landing Page

**Fecha:** 29 Diciembre 2025  
**Objetivo:** Deployar la nueva landing optimizada en `/landing`

---

## ✅ Cambios Implementados

1. ✅ Creado `app/landing/page.tsx` - Landing nueva optimizada
2. ✅ Eliminado `app/home/page.tsx` - Resuelto conflicto de rutas
3. ✅ Redirect raíz (`/`) apunta a `/landing`
4. ✅ Metadata SEO completa configurada
5. ✅ Componentes modulares listos

---

## 📋 Instrucciones Paso a Paso

### 1️⃣ Conectar al Servidor

```bash
ssh root@157.180.119.236
```

### 2️⃣ Ir al Directorio de la App

```bash
cd /opt/inmova-app
```

### 3️⃣ Limpiar Rutas Conflictivas

```bash
# Eliminar páginas /home que causan conflicto
rm -rf app/home/
rm -rf app/\(public\)/
```

### 4️⃣ Actualizar Código desde GitHub

```bash
# Fetch cambios
git fetch origin

# Ver qué archivos cambiarán
git diff origin/main --name-only

# Resetear a última versión
git reset --hard origin/main

# Limpiar archivos no trackeados
git clean -fd
```

### 5️⃣ Verificar Estructura (Importante)

```bash
# Verificar que solo existe /landing
find app -name 'page.tsx' | grep -E 'landing|home'
```

**Resultado esperado:**

```
app/landing/page.tsx    ← ✅ Solo debe aparecer esta línea
```

**Si aparece `app/home/page.tsx`:**

```bash
rm -rf app/home/
git status  # Verificar
```

### 6️⃣ Verificar .env.production

```bash
cat .env.production | grep -E "NEXTAUTH_URL|APP_URL"
```

**Debería mostrar:**

```
NEXTAUTH_URL=https://inmovaapp.com
NEXT_PUBLIC_APP_URL=https://inmovaapp.com
```

**Si no, actualizar:**

```bash
nano .env.production
# Cambiar las URLs
# Ctrl+X, Y, Enter para guardar
```

### 7️⃣ Limpiar Cache de Next.js (Recomendado)

```bash
# Limpiar cache de Next.js
rm -rf .next
rm -rf node_modules/.cache
```

### 8️⃣ Ejecutar Deployment

```bash
# Opción A: Deployment en foreground (ver todo el proceso)
bash scripts/deploy-direct.sh

# Opción B: Deployment en background (más rápido)
nohup bash scripts/deploy-direct.sh > /tmp/deploy.log 2>&1 &

# Si usaste Opción B, monitorear:
tail -f /tmp/deploy.log
```

**Tiempo estimado:** 3-5 minutos

### 9️⃣ Monitorear el Build

El script mostrará:

```
🚀 DEPLOYMENT DIRECTO - INMOVA APP
================================================================================
1️⃣  Verificando Git...
✅ Git disponible

2️⃣  Actualizando código...
...

3️⃣  Construyendo imagen Docker...
[+] Building 120.5s
...

4️⃣  Deteniendo contenedores antiguos...
✅ Contenedores detenidos

5️⃣  Iniciando nuevo contenedor...
✅ Contenedor iniciado

6️⃣  Verificando salud del contenedor...
✅ La aplicación está respondiendo correctamente
```

### 🔟 Verificar que Funciona

```bash
# Test 1: Verificar que el contenedor está corriendo
docker ps | grep inmova-app

# Test 2: Verificar que responde en puerto 3000
curl -I http://localhost:3000

# Test 3: Verificar que Nginx está sirviendo
curl -I http://localhost

# Test 4: Salir del servidor
exit
```

### 1️⃣1️⃣ Verificar desde tu Navegador

Abre en tu navegador:

- ✅ **https://inmovaapp.com** - Debe mostrar la nueva landing
- ✅ **http://inmovaapp.com** - Debe redirigir a HTTPS

---

## 🐛 Troubleshooting

### ❌ Error: "Cannot have two parallel pages"

**Causa:** Todavía existe `app/home/page.tsx`

**Solución:**

```bash
cd /opt/inmova-app
rm -rf app/home/
rm -rf app/\(public\)/
bash scripts/deploy-direct.sh
```

### ❌ Error: "Cannot read properties of undefined (reading 'title')"

**Causa:** Problema con metadata

**Solución:**

```bash
cd /opt/inmova-app
git pull origin main  # Asegurarse de tener última versión
grep "seoMetadata" app/landing/page.tsx  # Debe aparecer, no "landingMetadata"
bash scripts/deploy-direct.sh
```

### ❌ Docker build falla con timeout

**Solución:**

```bash
# Limpiar cache de Docker
docker builder prune --all --force

# Reintentar
bash scripts/deploy-direct.sh
```

### ❌ La app no responde después del deployment

**Solución:**

```bash
# Ver logs del contenedor
docker logs -f inmova-app_app_1

# Reiniciar contenedor
docker restart inmova-app_app_1

# Si no funciona, rebuild completo
cd /opt/inmova-app
bash scripts/deploy-direct.sh
```

### ❌ Nginx muestra 502 Bad Gateway

**Solución:**

```bash
# Verificar que la app está corriendo
docker ps

# Verificar que responde en puerto 3000
curl http://localhost:3000

# Reiniciar Nginx
systemctl restart nginx

# Ver logs de Nginx
tail -50 /var/log/nginx/error.log
```

---

## ✅ Checklist de Verificación Post-Deployment

Después del deployment, verifica:

- [ ] `https://inmovaapp.com` carga correctamente
- [ ] Muestra la **nueva landing** (no la antigua)
- [ ] HTTP redirige a HTTPS
- [ ] Candado verde (SSL) en el navegador
- [ ] No hay errores en la consola del navegador (F12)
- [ ] La página es responsive en móvil
- [ ] Los CTAs (botones) funcionan correctamente

---

## 📊 Comandos Útiles

```bash
# Ver estado de contenedores
docker ps

# Ver logs de la aplicación
docker logs -f inmova-app_app_1

# Ver logs de Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Reiniciar todo
cd /opt/inmova-app && bash scripts/deploy-direct.sh

# Ver espacio en disco
df -h

# Ver uso de memoria
free -h

# Ver procesos de Docker
docker stats
```

---

## 🎯 Resultado Esperado

Después del deployment exitoso:

```
✅ https://inmovaapp.com - Landing nueva optimizada
✅ SEO mejorado (metadata completa)
✅ Performance optimizado (lazy loading)
✅ Componentes modulares cargando correctamente
✅ Analytics integrados
✅ Responsive design funcionando
✅ Sin errores en consola
```

---

## 📞 Si Necesitas Ayuda

Si encuentras algún problema:

1. Copia el mensaje de error exacto
2. Captura de pantalla si es visual
3. Envía los logs relevantes

---

## 🚀 Comandos Resumidos (Copy-Paste)

```bash
# Conectar y deployar (todo en uno)
ssh root@157.180.119.236

cd /opt/inmova-app
rm -rf app/home/ app/\(public\)/
git fetch origin && git reset --hard origin/main && git clean -fd
rm -rf .next node_modules/.cache
bash scripts/deploy-direct.sh

# Esperar 3-5 minutos, luego verificar:
docker ps
curl -I http://localhost:3000
exit

# En tu navegador:
# https://inmovaapp.com
```

---

**¡Listo para deployar! 🎉**
