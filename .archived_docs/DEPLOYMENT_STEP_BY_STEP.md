# 🚀 DEPLOYMENT PASO A PASO - GUÍA PRÁCTICA

**Para:** Usuario que hará el deployment  
**Tiempo estimado:** 30-45 minutos (primera vez)  
**Requisitos:** Servidor con Ubuntu/Debian, acceso SSH, dominio configurado

---

## 📋 ANTES DE EMPEZAR

### ¿Tienes un servidor?

**SÍ** → Continúa al [Paso 1](#paso-1-preparar-servidor)  
**NO** → [Crear servidor primero](#crear-servidor-opcional)

### Información que necesitarás:

- ✅ IP del servidor: `___________________`
- ✅ Usuario SSH: `___________________`
- ✅ Dominio: `___________________`
- ✅ Database URL: `___________________`

---

## PASO 1: PREPARAR SERVIDOR

### 1.1 Conectar al Servidor

```bash
# Conectar vía SSH
ssh tu-usuario@tu-ip-servidor

# Ejemplo:
ssh ubuntu@192.168.1.100
```

### 1.2 Instalar Dependencias

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
sudo apt install -y docker.io docker-compose

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Instalar Git
sudo apt install -y git

# Verificar instalaciones
docker --version
nginx -v
certbot --version
git --version
```

**✅ Checkpoint:** Todas las versiones deben mostrarse correctamente.

### 1.3 Configurar Docker

```bash
# Iniciar Docker
sudo systemctl start docker
sudo systemctl enable docker

# Añadir usuario a grupo docker (evitar sudo)
sudo usermod -aG docker $USER

# IMPORTANTE: Logout y login para aplicar cambios
exit
# Volver a conectar
ssh tu-usuario@tu-ip-servidor

# Verificar (ya no debe pedir sudo)
docker ps
```

**✅ Checkpoint:** `docker ps` debe ejecutarse sin sudo.

---

## PASO 2: CLONAR REPOSITORIO

### 2.1 Crear Directorio

```bash
# Crear directorio de aplicaciones
sudo mkdir -p /opt
cd /opt

# Dar permisos
sudo chown -R $USER:$USER /opt
```

### 2.2 Clonar Proyecto

```bash
# Clonar repositorio
git clone https://github.com/dvillagrablanco/inmova-app.git
cd inmova-app

# Verificar contenido
ls -la

# Ver commits recientes
git log --oneline -5
```

**✅ Checkpoint:** Debes ver archivos como `Dockerfile`, `package.json`, etc.

---

## PASO 3: CONFIGURAR VARIABLES DE ENTORNO

### 3.1 Crear .env.production

```bash
# Copiar ejemplo
cp .env.production.example .env.production

# Editar con nano
nano .env.production
```

### 3.2 Configurar Variables OBLIGATORIAS

**Copia y pega estas variables con TUS valores reales:**

```env
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://usuario:password@localhost:5432/inmova_prod"
# Reemplaza con tu URL real de PostgreSQL

# ============================================
# NEXTAUTH
# ============================================
NEXTAUTH_URL="https://inmovaapp.com"
# Reemplaza con tu dominio real

NEXTAUTH_SECRET="GENERA_UNO_NUEVO_ABAJO"
# Ejecuta en terminal: openssl rand -base64 32
# Y pega el resultado aquí

# ============================================
# ANALYTICS (CRÍTICO para landing)
# ============================================
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
# Tu ID de Google Analytics 4

NEXT_PUBLIC_HOTJAR_ID="1234567"
# Tu ID de Hotjar (opcional)

NEXT_PUBLIC_CLARITY_ID="xxxxxxxxxx"
# Tu ID de Microsoft Clarity (opcional)

# ============================================
# APP
# ============================================
NEXT_PUBLIC_BASE_URL="https://inmovaapp.com"
NODE_ENV="production"
```

### 3.3 Generar NEXTAUTH_SECRET

```bash
# Generar secret
openssl rand -base64 32

# Copiar output y pegarlo en .env.production
# en la variable NEXTAUTH_SECRET
```

### 3.4 Guardar y Salir

```
Ctrl+X → Y → Enter
```

**✅ Checkpoint:** Verifica que se guardó:

```bash
cat .env.production | head -10
```

---

## PASO 4: VERIFICACIÓN PRE-DEPLOYMENT

### 4.1 Ejecutar Check

```bash
# Hacer script ejecutable
chmod +x scripts/pre-deployment-check.sh

# Ejecutar verificación
./scripts/pre-deployment-check.sh
```

### 4.2 Interpretar Resultado

**Si ves:**

- ✅ TODO LISTO PARA DEPLOYMENT → Continúa al Paso 5
- ⚠️ READY CON WARNINGS → Puedes continuar (pero revisa warnings)
- ❌ NO LISTO PARA DEPLOYMENT → Corrige errores y vuelve a ejecutar

---

## PASO 5: CONFIGURAR DNS (IMPORTANTE)

### 5.1 Apuntar Dominio a Servidor

**En tu proveedor de DNS (GoDaddy, Namecheap, Cloudflare, etc.):**

1. Crear registro A:
   - **Host:** `@` o `inmovaapp.com`
   - **Type:** `A`
   - **Value:** `TU_IP_SERVIDOR`
   - **TTL:** `3600`

2. Crear registro A para www:
   - **Host:** `www`
   - **Type:** `A`
   - **Value:** `TU_IP_SERVIDOR`
   - **TTL:** `3600`

### 5.2 Verificar DNS

```bash
# Verificar que el dominio apunta al servidor
dig inmovaapp.com +short
# Debe mostrar tu IP

# O con nslookup
nslookup inmovaapp.com
```

**⏱️ IMPORTANTE:** DNS puede tardar 5-30 minutos en propagarse.

**✅ Checkpoint:** El comando debe mostrar tu IP del servidor.

---

## PASO 6: DEPLOYMENT (¡POR FIN!)

### 6.1 Ejecutar Deployment Completo

```bash
# Asegurarse de estar en el directorio correcto
cd /opt/inmova-app

# Ejecutar deployment
./scripts/deploy-direct.sh production
```

### 6.2 ¿Qué hace este script?

El script automáticamente:

1. ✅ Verifica rama Git
2. ✅ Pull último código
3. ✅ Verifica variables de entorno
4. ✅ Stop contenedor anterior (si existe)
5. ✅ Build nueva imagen Docker
6. ✅ Start nuevo contenedor
7. ✅ Health check
8. ✅ Cleanup

**⏱️ Tiempo:** 5-10 minutos (primera vez puede ser más).

### 6.3 ¿Qué esperar?

Verás salida similar a:

```
╔══════════════════════════════════════════════════╗
║  🚀 DEPLOYMENT DIRECTO - INMOVA APP            ║
╚══════════════════════════════════════════════════╝

📦 Entorno: production
🏷️  Imagen: inmova-app:production

1️⃣  Verificando rama de Git...
✅ Rama: main

2️⃣  Actualizando código...
✅ Código actualizado

3️⃣  Verificando variables de entorno...
✅ .env.production encontrado

4️⃣  Deteniendo contenedor anterior...
✅ Contenedor anterior eliminado

5️⃣  Limpiando imagen anterior...
✅ Imagen anterior eliminada

6️⃣  Construyendo nueva imagen...
   [Build logs...]
✅ Imagen construida exitosamente

7️⃣  Iniciando nuevo contenedor...
✅ Contenedor iniciado

8️⃣  Esperando que el servidor esté listo...
✅ Contenedor corriendo

9️⃣  Health check...
✅ Aplicación respondiendo en puerto 3000

🔟 Limpiando imágenes huérfanas...
✅ Limpieza completada

╔══════════════════════════════════════════════════╗
║  ✅ DEPLOYMENT COMPLETADO EXITOSAMENTE          ║
╚══════════════════════════════════════════════════╝

🎉 ¡Deployment exitoso!
```

**✅ Checkpoint:** Debes ver "DEPLOYMENT COMPLETADO EXITOSAMENTE".

---

## PASO 7: CONFIGURAR NGINX

### 7.1 Ejecutar Setup Automático

```bash
# Ejecutar con tu dominio real
sudo ./scripts/setup-nginx.sh inmovaapp.com
```

### 7.2 Verificar Configuración

```bash
# Test configuración
sudo nginx -t

# Debe mostrar:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 7.3 Abrir Puertos en Firewall

```bash
# Si usas UFW
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable

# Verificar
sudo ufw status
```

**✅ Checkpoint:** Nginx configurado y puerto 80/443 abiertos.

---

## PASO 8: CONFIGURAR SSL (HTTPS)

### 8.1 Obtener Certificado

```bash
# Ejecutar Certbot
sudo certbot --nginx -d inmovaapp.com -d www.inmovaapp.com
```

### 8.2 Responder Preguntas

```
1. Email: tu@email.com
   → Para notificaciones de expiración

2. Terms of Service: Y
   → Aceptar términos

3. Share email: N
   → No compartir email (opcional)

4. Redirect HTTP to HTTPS: 2
   → SÍ, forzar HTTPS (recomendado)
```

### 8.3 Verificar SSL

```bash
# Test manual
curl -I https://inmovaapp.com

# Debe mostrar:
# HTTP/2 200
```

**✅ Checkpoint:** HTTPS funcionando (candado verde en navegador).

---

## PASO 9: VERIFICACIÓN FINAL

### 9.1 Acceder a la Aplicación

```bash
# Abrir en navegador:
https://inmovaapp.com
```

**Debes ver:** Landing page de INMOVA

### 9.2 Verificar Contenedor

```bash
# Ver logs
docker logs -f inmova-app-production

# Ver estado
docker ps | grep inmova

# Ver stats
docker stats inmova-app-production --no-stream
```

### 9.3 Ejecutar Script de Verificación

```bash
./scripts/verify-deployment.sh
```

**Debe mostrar:**

- ✅ Sitio accesible
- ✅ Landing content presente
- ✅ Analytics scripts cargados
- ✅ Componentes críticos

**✅ Checkpoint:** Todos los checks en verde.

---

## PASO 10: MONITOREO POST-DEPLOYMENT

### 10.1 Ver Logs en Tiempo Real

```bash
# Logs de la aplicación
docker logs -f inmova-app-production

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
```

### 10.2 Comandos Útiles

```bash
# Reiniciar aplicación
docker restart inmova-app-production

# Ver estado
docker ps

# Ver uso de recursos
docker stats inmova-app-production

# Entrar al contenedor
docker exec -it inmova-app-production sh
```

---

## ✅ CHECKLIST FINAL

Verifica que todo esté OK:

- [ ] ✅ Aplicación accesible en https://tudominio.com
- [ ] ✅ SSL funcionando (candado verde)
- [ ] ✅ Redirect HTTP → HTTPS activo
- [ ] ✅ Landing page se ve correctamente
- [ ] ✅ Google Analytics registrando
- [ ] ✅ Contenedor corriendo (`docker ps`)
- [ ] ✅ Logs sin errores críticos
- [ ] ✅ SSL renovación automática (`certbot renew --dry-run`)

---

## 🐛 TROUBLESHOOTING

### Problema: Build falla

```bash
# Ver logs completos
./scripts/deploy-direct.sh production 2>&1 | tee deployment.log

# Verificar espacio en disco
df -h

# Limpiar Docker
docker system prune -a
```

### Problema: Contenedor no inicia

```bash
# Ver logs de error
docker logs inmova-app-production

# Verificar variables de entorno
docker exec inmova-app-production env | grep DATABASE

# Verificar puerto 3000
sudo lsof -i :3000
```

### Problema: Error 502 (Nginx)

```bash
# Verificar que contenedor corre
docker ps | grep inmova

# Test local
curl http://localhost:3000

# Ver logs Nginx
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: SSL no funciona

```bash
# Verificar certificados
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal

# Test Nginx config
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🎉 ¡DEPLOYMENT COMPLETADO!

Si llegaste aquí, ¡felicidades! Tu aplicación está deployada.

### Próximos pasos recomendados:

1. **Configurar backups automáticos**

   ```bash
   # Crear script de backup
   sudo crontab -e
   # Añadir: 0 2 * * * /opt/inmova-app/scripts/backup-db.sh
   ```

2. **Setup monitoring**
   - UptimeRobot: https://uptimerobot.com
   - Configurar alertas

3. **Lighthouse audit**

   ```bash
   lighthouse https://inmovaapp.com --view
   ```

4. **Test en móviles**
   - Ver guía: `GUIA_TESTING_MOVIL.md`

---

## 📞 SOPORTE

Si tienes problemas:

1. **Revisar logs:**

   ```bash
   docker logs --tail 100 inmova-app-production
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Consultar documentación:**
   - `DEPLOYMENT_DIRECTO_GUIDE.md`
   - `RESUMEN_DEPLOYMENT_DIRECTO.md`

3. **Rollback (si es necesario):**
   ```bash
   # Volver a versión anterior
   docker stop inmova-app-production
   git checkout HEAD~1
   ./scripts/deploy-direct.sh production
   ```

---

**🚀 ¡Buena suerte con tu deployment!**

---

_Creado: 29 Diciembre 2025_  
_Versión: 1.0_  
_Para: Deployment manual paso a paso_
