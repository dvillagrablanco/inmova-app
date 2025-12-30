# 🚀 DEPLOYMENT A PRODUCCIÓN - INMOVA APP

## ✅ TODO LISTO PARA DEPLOY

**Fecha**: 30 Diciembre 2025  
**Rama**: `cursor/visual-inspection-protocol-setup-72ca`  
**Commit**: `4dc9f3d2`  
**Estado**: ✅ Código pusheado y listo

---

## 📊 QUÉ SE VA A DESPLEGAR

### Fixes Implementados (10 archivos)

| Archivo                                         | Cambio                       |
| ----------------------------------------------- | ---------------------------- |
| `app/admin/activity/page.tsx`                   | Fix JSON.parse con try/catch |
| `app/configuracion/page.tsx`                    | Nueva ruta redirect (NUEVO)  |
| `app/api/portal-proveedor/work-orders/route.ts` | API proveedor (NUEVO)        |
| `app/api/portal-inquilino/payments/route.ts`    | API inquilino (NUEVO)        |
| `app/globals.css`                               | CSS overflow mobile          |
| `app/admin/clientes/page.tsx`                   | Eliminada ref /home          |
| `components/layout/sidebar.tsx`                 | Eliminada ref /home          |
| `components/mobile/MobileNavigation.tsx`        | Eliminada ref /home          |
| `components/mobile/BottomNavigation.tsx`        | Eliminada ref /home          |
| `components/layout/sidebar/constants.ts`        | Eliminada ref /home          |

### Impacto Esperado

| Métrica              | Antes | Después | Mejora      |
| -------------------- | ----- | ------- | ----------- |
| **Total Errores**    | 1717  | ~400    | **-77%** ✅ |
| **Errores Críticos** | 358   | ~50     | **-86%** ✅ |
| **Errores Altos**    | 1236  | ~250    | **-80%** ✅ |
| **Overflow Mobile**  | 123   | ~50     | **-60%** ✅ |

---

## 🚀 OPCIÓN A: AUTO-DEPLOY (Vercel/Cloudflare)

**Si tu app está en Vercel o Cloudflare Pages con auto-deploy:**

### Paso 1: Merge a Main

```bash
cd /workspace
git checkout main
git pull origin main
git merge cursor/visual-inspection-protocol-setup-72ca
git push origin main
```

### Paso 2: Monitorear Deploy

- **Vercel**: https://vercel.com/dashboard
- **Cloudflare**: https://dash.cloudflare.com/pages

⏱️ **Tiempo**: 2-3 minutos  
✅ **Resultado**: Deploy automático

---

## 🖥️ OPCIÓN B: DEPLOY MANUAL (Servidor VPS)

**Si tu app está en un servidor propio (PM2/Docker):**

### Método 1: Script Automatizado (Recomendado)

```bash
# 1. Copiar script al servidor
scp DEPLOY_INSTRUCTIONS.sh usuario@157.180.119.236:/tmp/

# 2. SSH al servidor
ssh usuario@157.180.119.236

# 3. Ejecutar script
cd /opt/inmova-app  # o /home/deploy/inmova-app
bash /tmp/DEPLOY_INSTRUCTIONS.sh
```

⏱️ **Tiempo**: 5-10 minutos  
✅ **Resultado**: Deploy con backup automático

---

### Método 2: Comandos Manuales

```bash
# 1. SSH al servidor
ssh usuario@157.180.119.236

# 2. Navegar al directorio de la app
cd /opt/inmova-app  # o tu ruta

# 3. Backup (opcional pero recomendado)
tar -czf ~/backup-$(date +%Y%m%d).tar.gz .next app components

# 4. Pull cambios
git fetch origin
git pull origin cursor/visual-inspection-protocol-setup-72ca

# 5. CRÍTICO: Limpiar cache
rm -rf .next/cache
rm -rf .next/server

# 6. Rebuild
yarn build

# 7. Restart PM2 (zero-downtime)
pm2 reload inmova-app

# 8. Verificar
pm2 logs inmova-app --lines 50
curl http://localhost:3000/api/health
```

⏱️ **Tiempo**: 5-10 minutos  
✅ **Resultado**: Deploy manual

---

## 🔍 VERIFICACIÓN POST-DEPLOY

### 1. Health Check Básico

```bash
# Verificar que la app responde
curl https://inmovaapp.com/api/health

# Debe retornar: {"status":"ok"}
```

### 2. Verificar Login

1. Abrir navegador: https://inmovaapp.com/login
2. Login con: `admin@inmova.app` / `Admin123!`
3. Verificar redirect a `/dashboard` (NO a `/home`)

### 3. Probar Páginas Críticas

- ✅ `/dashboard` - Dashboard principal
- ✅ `/edificios` - Gestión edificios
- ✅ `/inquilinos` - Gestión inquilinos
- ✅ `/admin/activity` - Sin error JSON.parse
- ✅ `/configuracion` - Redirect según rol (NO 404)

### 4. Verificar Mobile

1. Abrir Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Seleccionar iPhone 14 (390x844)
4. Navegar por el dashboard
5. Verificar que NO hay scroll horizontal

---

## 📊 RE-AUDITAR POST-DEPLOY

Una vez desplegado, re-ejecutar la auditoría visual:

```bash
cd /workspace
export AUDIT_MODE=priority
export $(cat .env.test | xargs)
npx tsx scripts/visual-audit.ts
```

**Esperado**:

- Total errores: ~400 (antes: 1717)
- Errores críticos: ~50 (antes: 358)
- Sin errores de JSON.parse en /admin/activity
- Sin 404 en /configuracion
- Menos overflow mobile

---

## 🚨 TROUBLESHOOTING

### Error: "Build failed"

**Síntoma**: `yarn build` falla con errores de TypeScript

**Solución**:

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules .next
yarn install
yarn build
```

---

### Error: "PM2 no encuentra la app"

**Síntoma**: `pm2 reload inmova-app` dice "App not found"

**Solución**:

```bash
# Ver apps corriendo
pm2 list

# Si no está, iniciar
pm2 start ecosystem.config.js --env production
pm2 save
```

---

### Error: "Sigue mostrando contenido viejo"

**Síntoma**: Los cambios no se ven en el navegador

**Solución**:

```bash
# 1. Limpiar cache del navegador (Ctrl+Shift+Delete)

# 2. Verificar versión deployada
ssh usuario@servidor
cd /opt/inmova-app
git log -1 --oneline

# 3. Si es versión vieja, hacer rebuild
rm -rf .next
yarn build
pm2 restart inmova-app
```

---

### Error CSS "Invalid token" persiste

**Síntoma**: El error CSS sigue apareciendo

**Solución**:

```bash
# Rebuild completo limpio
rm -rf .next node_modules
yarn install
yarn build
pm2 restart inmova-app
```

---

## 📞 SOPORTE

Si encuentras problemas durante el deploy:

1. **Verificar logs**:

   ```bash
   pm2 logs inmova-app --lines 100
   tail -f /var/log/nginx/error.log
   ```

2. **Rollback** (si es necesario):

   ```bash
   git reset --hard HEAD~1
   yarn build
   pm2 restart inmova-app
   ```

3. **Restaurar backup**:
   ```bash
   cd ~
   tar -xzf backup-FECHA.tar.gz -C /opt/inmova-app/
   pm2 restart inmova-app
   ```

---

## ✅ CHECKLIST DE DEPLOYMENT

Antes de declarar éxito, verificar:

- [ ] App responde en https://inmovaapp.com
- [ ] Login funciona correctamente
- [ ] `/dashboard` carga sin errores
- [ ] `/admin/activity` NO tiene error JSON.parse
- [ ] `/configuracion` redirige (NO 404)
- [ ] Mobile NO tiene scroll horizontal excesivo
- [ ] PM2 muestra status "online"
- [ ] Logs NO muestran errores críticos

---

## 🎯 PRÓXIMOS PASOS POST-DEPLOY

1. **Monitorear 24h** - Verificar logs y errores
2. **Re-auditar** - Ejecutar visual audit nuevamente
3. **Auditar 53 páginas restantes** - Completar las 235 páginas
4. **Optimizar performance** - Lazy loading, code splitting
5. **Monitoreo continuo** - Setup Sentry/LogRocket

---

**¿Listo para desplegar?**

1. Elige tu opción (A o B)
2. Sigue los pasos
3. Verifica con el checklist
4. Re-audita para confirmar mejoras

🚀 **¡Éxito en el deployment!**
