# 🚀 DEPLOYMENT FINAL - INSTRUCCIONES

## ⚡ OPCIÓN 1: Deployment Automatizado con Paramiko (Recomendado)

### Ejecuta este comando (reemplaza `TU_CONTRASEÑA`):

```bash
cd /workspace
python3 deploy-via-paramiko.py 'TU_CONTRASEÑA_SSH'
```

**Ejemplo**:
```bash
python3 deploy-via-paramiko.py 'miPasswordSuperSecreta123!'
```

El script automáticamente:
- ✅ Se conecta al servidor (157.180.119.236)
- ✅ Actualiza el código (git merge)
- ✅ Detecta si usas Docker, PM2, Systemd o manual
- ✅ Ejecuta el deployment apropiado
- ✅ Verifica que todo funcione

**Tiempo estimado**: 5-10 minutos

---

## 📝 OPCIÓN 2: Manual (Si prefieres más control)

### Comandos para copiar y pegar en el servidor:

```bash
# 1. CONECTAR (desde tu máquina local)
ssh root@157.180.119.236

# 2. ACTUALIZAR CÓDIGO (en el servidor)
cd /opt/inmova-app
git fetch origin
git checkout main
git merge origin/cursor/frontend-audit-inmovaapp-com-6336

# 3. DEPLOYMENT

# Si usas DOCKER:
docker-compose down
docker-compose up -d --build
docker-compose logs --tail 50 app

# Si usas PM2:
npm install
npm run build
pm2 reload inmova-app
pm2 logs inmova-app --lines 50

# Si usas SYSTEMD:
npm install
npm run build
systemctl restart inmova-app
systemctl status inmova-app

# Si es MANUAL:
npm install
npm run build
fuser -k 3000/tcp
nohup npm start > /tmp/inmova.log 2>&1 &
tail -f /tmp/inmova.log

# 4. VERIFICAR
curl http://localhost:3000/api/health
```

---

## ✅ VERIFICACIÓN POST-DEPLOYMENT

### Desde tu máquina local (NO desde el servidor):

```bash
# Health check
curl https://inmovaapp.com/api/health
# Debe retornar: {"status":"ok"}

# Headers de seguridad
curl -I https://inmovaapp.com | grep -E "x-frame|x-content|strict"
# Debe mostrar:
# x-frame-options: DENY
# x-content-type-options: nosniff
# strict-transport-security: max-age=31536000

# Test visual (navegador)
# Ve a: https://inmovaapp.com/landing
```

### Checklist Visual:

1. **Contraste de colores**:
   - Ve a https://inmovaapp.com/landing
   - Scroll a sección de promociones
   - Los códigos (FLIPPING25, ROOMPRO) deben verse más oscuros

2. **Autocomplete en formularios**:
   - Ve a https://inmovaapp.com/login
   - F12 → Elements → Inspecciona input de email
   - Debe tener: `autocomplete="email"`
   - Inspecciona input de password
   - Debe tener: `autocomplete="current-password"`

3. **Responsive móvil**:
   - F12 → Toggle device toolbar (Ctrl+Shift+M)
   - Selecciona iPhone 12 Pro (375px ancho)
   - Navega por la landing
   - NO debe haber scroll horizontal
   - Botones deben ser fáciles de tocar (≥48px)

4. **Open Graph image**:
   - Ve a https://inmovaapp.com/og-image-template.svg
   - Debe cargar imagen SVG

---

## 📊 RESULTADO ESPERADO

Una vez completado el deployment:

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| ♿ Accessibility | 65-70 | 95-100 | **+30 puntos** |
| 🔒 Best Practices | 75-80 | 95-100 | **+20 puntos** |
| 📱 Mobile Usability | 70-75 | 95-100 | **+25 puntos** |
| 🌐 Social Sharing | 0% | 100% | **+100%** |

**Tests de Playwright**:
- Antes: 13 fallidos / 26 pasados (33% fail)
- Después: 2-4 fallidos / 35-37 pasados (5-10% fail)
- **Reducción: -70% en errores críticos** 🎉

---

## 🐛 TROUBLESHOOTING

### Problema: Paramiko no puede conectar

```bash
# Verifica que el servidor está accesible
ping 157.180.119.236

# Verifica puerto SSH
nc -zv 157.180.119.236 22

# Intenta conexión manual
ssh root@157.180.119.236
```

### Problema: Git merge tiene conflictos

```bash
# En el servidor:
cd /opt/inmova-app
git status
git merge --abort  # Abortar merge
git pull origin cursor/frontend-audit-inmovaapp-com-6336  # Pull directo
```

### Problema: Build falla

```bash
# Limpiar y reintentar
rm -rf .next node_modules
npm install
npm run build
```

### Problema: Headers no aparecen

```bash
# Espera 10 minutos para propagación de CDN
# O limpia cache:
# - Vercel: vercel --prod --force
# - Cloudflare: Dashboard → Purge cache
```

---

## 📞 ¿NECESITAS AYUDA?

Si algo falla:

1. **Copia el error completo**
2. **Indica en qué paso estás**
3. **Proporciona**:
   - Output de: `git status`
   - Output de: `docker-compose ps` (o `pm2 status`)
   - Logs de error completos

---

## 🎯 ¿QUÉ MÉTODO PREFIERES?

1. **Automático con Paramiko** (5 min):
   ```bash
   python3 deploy-via-paramiko.py 'TU_CONTRASEÑA'
   ```

2. **Manual copiando comandos** (10 min):
   - Lee: `COMANDOS_SSH_RAPIDOS.txt`
   - Copia y pega en el servidor

Ambos métodos son seguros y efectivos. El automático es más rápido pero requiere proporcionar la contraseña como argumento.

---

**Preparado por**: Cursor AI Agent  
**Fecha**: 30 de Diciembre de 2025  
**Archivos de deployment listos**:
- ✅ `deploy-via-paramiko.py` - Script automatizado
- ✅ `DEPLOYMENT_MANUAL_SSH.sh` - Script bash con auto-detección
- ✅ `COMANDOS_SSH_RAPIDOS.txt` - Guía visual paso a paso

¡Todo listo para deployment! 🚀
