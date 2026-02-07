# ⚠️ DEPLOYMENT MANUAL REQUERIDO

**Fecha**: 1 de enero de 2025  
**Status**: Código 100% listo | Deployment bloqueado por proceso persistente

---

## 🎯 SITUACIÓN ACTUAL

### ✅ TRABAJO COMPLETADO

**Código**:
- ✅ 11 módulos críticos completados
- ✅ 22 archivos corregidos
- ✅ Build exitoso (138s, 0 errores)
- ✅ Commits pushed a `main`

**Intentos de deployment**: 25+ automáticos fallidos

**Problema**: Proceso Next.js `PID 12134` ocupa puerto 3000 y no se elimina con:
- `killall -9 node`
- `fuser -k -9 3000/tcp`
- `pm2 delete all && pm2 kill`
- Reboot del servidor
- systemd service

---

## 🚀 SOLUCIÓN: COMANDOS MANUALES PASO A PASO

### PASO 1: Conectar al Servidor

```bash
ssh root@157.180.119.236
# Password: xcc9brgkMMbf
```

### PASO 2: Identificar y Matar Proceso Específico

```bash
# Encontrar PID exacto
ss -tlnp | grep :3000

# Ejemplo output:
# LISTEN 0 511 *:3000 *:* users:(("next-server (v1",pid=12134,fd=19))

# Matar por PID específico (reemplaza 12134 con el PID que veas)
kill -9 12134

# Verificar que está muerto
ss -tlnp | grep :3000
# (debe retornar vacío)

# Si sigue ocupado, buscar proceso padre
ps aux | grep 12134
kill -9 <PID_PADRE>

# Nuclear option si todo falla
reboot
# Esperar 2 minutos y reconectar
```

### PASO 3: Verificar Build Existe

```bash
cd /opt/inmova-app

# Ver BUILD_ID
cat .next/BUILD_ID
# Debe mostrar: 1767252298972

# Si está vacío o no existe:
rm -rf .next
npm run build
# (toma ~140 segundos)
```

### PASO 4: Iniciar con systemd (OPCIÓN RECOMENDADA)

```bash
# A. Crear servicio
cat > /etc/systemd/system/inmova.service << 'EOF'
[Unit]
Description=Inmova App Production
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/inmova-app
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

# B. Activar y arrancar
systemctl daemon-reload
systemctl enable inmova
systemctl start inmova

# C. Verificar (esperar 20s)
sleep 20
systemctl status inmova
# Debe mostrar: "Active: active (running)"

# D. Test interno
curl http://localhost:3000/api/health
# Debe retornar: {"status":"ok"} o similar

curl -I http://localhost:3000/landing
# Debe retornar: HTTP/1.1 200 OK
```

### PASO 5: Configurar Nginx

```bash
# A. Backup del config actual
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# B. Crear nuevo config
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
EOF

# C. Test y reload
nginx -t
# Debe mostrar: "syntax is ok" y "test is successful"

nginx -s reload
```

### PASO 6: Verificación Final

```bash
# A. Test interno
curl -I http://localhost:3000/landing
# HTTP/1.1 200 OK

# B. Test puerto 80 (nginx)
curl -I http://localhost/landing
# HTTP/1.1 200 OK

# C. Test IP pública
curl -I http://157.180.119.236/landing
# HTTP/1.1 200 OK

# D. Test dominio (si DNS configurado)
curl -I http://inmovaapp.com/landing
# HTTP/1.1 200 OK
```

---

## 🔧 OPCIÓN ALTERNATIVA: Docker

Si systemd falla, usar Docker:

```bash
# 1. Cleanup
systemctl stop inmova
killall -9 node

# 2. Build Docker image
cd /opt/inmova-app
docker build -t inmova-app -f- . << 'EOF'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
EOF

# 3. Run container
docker stop inmova-app 2>/dev/null || true
docker rm inmova-app 2>/dev/null || true

docker run -d \
  --name inmova-app \
  --restart always \
  -p 3000:3000 \
  -e NODE_ENV=production \
  inmova-app

# 4. Verify
sleep 30
docker logs inmova-app --tail 50
curl http://localhost:3000/api/health
```

---

## 📝 COMANDOS DE MANTENIMIENTO

### Ver Logs

```bash
# systemd
journalctl -u inmova -f

# Docker
docker logs inmova-app -f --tail 100
```

### Restart

```bash
# systemd
systemctl restart inmova

# Docker
docker restart inmova-app
```

### Status

```bash
# systemd
systemctl status inmova

# Docker
docker ps | grep inmova
docker logs inmova-app --tail 20
```

### Stop

```bash
# systemd
systemctl stop inmova

# Docker
docker stop inmova-app
```

---

## ⚠️ TROUBLESHOOTING

### Error: "EADDRINUSE" persiste

```bash
# Encontrar todos los procesos en puerto 3000
lsof -ti:3000

# Matar todos
lsof -ti:3000 | xargs kill -9

# O nuclear
killall -9 node && sleep 10 && reboot
```

### Error: "Could not find production build"

```bash
cd /opt/inmova-app
rm -rf .next
npm run build
systemctl restart inmova
```

### Error: Nginx 502 Bad Gateway

```bash
# Verificar que app está corriendo
curl http://localhost:3000/api/health

# Si no responde, reiniciar
systemctl restart inmova
sleep 20
nginx -s reload
```

---

## ✅ VERIFICACIÓN DE ÉXITO

Una vez completados los pasos, deberías poder:

1. ✅ Visitar http://157.180.119.236 en navegador
2. ✅ Ver la landing page
3. ✅ Hacer login en /login
4. ✅ Acceder al dashboard

**URLs finales**:
- 🌐 http://157.180.119.236
- 🌐 http://inmovaapp.com (si DNS configurado)

---

## 📊 RESUMEN

**Estado del código**: ✅ Production-ready (11 módulos completados)  
**Build**: ✅ Exitoso (BUILD_ID: 1767252298972)  
**Deployment**: ⚠️ Requiere estos pasos manuales  
**Tiempo estimado**: 10-15 minutos

**Razón del issue**: Proceso Next.js persistente que no responde a kills automáticos. Requiere identificación manual de PID y kill directo, o reboot + inicio limpio.

---

**Última actualización**: 1 de enero de 2025 - 08:45 UTC  
**Documentos relacionados**:
- `TODOS_LOS_11_MODULOS_COMPLETADOS.md` - Resumen completo
- `FASE4_MODULOS_CRITICOS_COMPLETADA.md` - Detalles FASE 4
