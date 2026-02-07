# ✅ FASE 1 PREPARADA - LISTA PARA EJECUTAR

## 🎉 TODO LISTO PARA COMENZAR

He completado la preparación de la **Fase 1** del lanzamiento de Inmova. Todos los scripts están listos y los secrets generados.

---

## 📦 LO QUE HE PREPARADO

### 1. Scripts Automatizados (5)

```bash
✅ scripts/phase1-security-setup.sh      # Día 1: Seguridad
✅ scripts/phase1-ssl-tests.sh           # Día 2: SSL + Tests  
✅ scripts/phase1-verification.sh        # Día 3: Verificación
✅ scripts/phase1-fix-vulnerabilities.sh # Fix npm audit
✅ scripts/phase1-clean-credentials.sh   # Limpiar docs
```

### 2. Secrets Generados con OpenSSL

```bash
NEXTAUTH_SECRET: 64FgrHU6R7rRMEtdQCLK/HvHS1l16EZEGmUWFidGsVg=
DB_PASSWORD: GBTwDE/HrcEJTiybX2SQZoUQAFKRNZgXMZAoZVTe+WI=
ENCRYPTION_KEY: +L1ZOTWbWY2bOpr8V5EvHXC0wDk1Uvthozh+OYOC/Xs=
CRON_SECRET: Ej7Su0z79BGxBtN76NfNkGJD/PaE58x6FOFPtARQpoo=
ROOT_PASSWORD: hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=
```

⚠️ **GUARDAR ESTOS VALORES AHORA EN PASSWORD MANAGER**

### 3. Documentación Completa

```bash
✅ AUDITORIA_ESTADO_PROYECTO_03_ENE_2026.md  # Auditoría completa
✅ FASE_1_EJECUCION_GUIA.md                  # Guía paso a paso
✅ FASE_1_LISTA_EJECUTAR.md                  # Este archivo
```

---

## 🚀 EJECUCIÓN EN 3 PASOS

### Paso 1: Conectar al Servidor

```bash
ssh root@157.180.119.236
# Password actual: xcc9brgkMMbf (se cambiará en Fase 1)
```

### Paso 2: Ir al Directorio de la App

```bash
cd /opt/inmova-app

# Verificar que los scripts están presentes
ls -la scripts/phase1-*.sh

# Si no están, hacer git pull
git pull origin main
```

### Paso 3: Ejecutar Fase 1 Completa

```bash
# DÍA 1: Seguridad (30 minutos)
bash scripts/phase1-security-setup.sh

# DÍA 2: SSL + Tests (1 hora)
bash scripts/phase1-ssl-tests.sh

# DÍA 3: Verificación (30 minutos)
bash scripts/phase1-verification.sh
```

---

## ⏱️ TIEMPO ESTIMADO

| Script | Tiempo | Dificultad |
|--------|--------|------------|
| phase1-security-setup.sh | 30 min | 🟢 Fácil |
| phase1-ssl-tests.sh | 1 hora | 🟡 Media |
| phase1-verification.sh | 30 min | 🟢 Fácil |
| **TOTAL** | **2 horas** | 🟢 Interactivo |

---

## 📋 QUÉ HARÁ CADA SCRIPT

### Script 1: Seguridad (phase1-security-setup.sh)

**Acciones Automáticas:**
- ✅ Genera secrets seguros (ya generados, pero los regenerará)
- ✅ Configura firewall UFW (puertos 22, 80, 443)
- ✅ Cambia root password
- ✅ Cambia PostgreSQL password
- ✅ Actualiza .env.production con nuevos secrets
- ✅ Reinicia PM2 con nuevas variables
- ✅ Verifica que todo funciona

**Lo que te pedirá:**
- Confirmar inicio (y/n)
- Confirmar después de guardar secrets
- Opcional: Configurar SSH keys

### Script 2: SSL + Tests (phase1-ssl-tests.sh)

**Acciones Automáticas:**
- ✅ Instala Certbot (si no está)
- ✅ Obtiene certificado SSL de Let's Encrypt
- ✅ Configura auto-renovación SSL
- ✅ Actualiza NEXTAUTH_URL a https://
- ✅ Ejecuta 6 tests automatizados
- ✅ Configura backups automáticos (cron diario)
- ✅ Test de backup manual

**Lo que te pedirá:**
- Confirmar que DNS apunta al servidor
- Sentry DSN (opcional)

**Pre-requisito CRÍTICO:**
```bash
# Verificar DNS ANTES de ejecutar
dig +short inmovaapp.com
# Debe retornar: 157.180.119.236

# Si no apunta, configurar en tu DNS provider:
# Tipo A: inmovaapp.com → 157.180.119.236
# Tipo A: www.inmovaapp.com → 157.180.119.236
```

### Script 3: Verificación (phase1-verification.sh)

**Acciones Automáticas:**
- ✅ Ejecuta 10 smoke tests
- ✅ Verifica variables de entorno
- ✅ Verifica seguridad
- ✅ Muestra métricas del sistema
- ✅ Genera checklist de lanzamiento
- ✅ Emite decisión: LISTO o NO LISTO
- ✅ Genera reporte final

**Lo que te pedirá:**
- Confirmar tests manuales completados (login, crear contrato, etc.)

---

## 🎯 RESULTADO ESPERADO

Después de ejecutar los 3 scripts:

```
🟢 Seguridad: 9/10 (Hardened)
🟢 Tests: 9/10 (Verificados)
🟢 DevOps: 9/10 (SSL + Backups)
🟢 Monitoring: 7/10 (Básico)

PUNTUACIÓN GLOBAL: 8.5/10

DECISIÓN: ✅ LISTO PARA LANZAMIENTO PÚBLICO
```

---

## 📊 VULNERABILIDADES NPM DETECTADAS

Durante la auditoría encontré **4 vulnerabilidades**:

| Paquete | Severidad | Estado | Fix |
|---------|-----------|--------|-----|
| next-auth <4.24.12 | MODERATE | ✅ Fixeable | npm install next-auth@4.24.13 |
| postcss <8.4.31 | MODERATE | ✅ Fixeable | npm audit fix |
| qs <6.14.1 | HIGH | ✅ Fixeable | npm audit fix |
| xlsx | HIGH | ❌ No fix | Considerar alternativa |

**Ejecutar después:**
```bash
bash scripts/phase1-fix-vulnerabilities.sh
```

---

## 🔐 SEGURIDAD: ACCIONES POST-FASE 1

Después de ejecutar los scripts, hacer manualmente:

### 1. Remover Credenciales de Documentación

```bash
bash scripts/phase1-clean-credentials.sh
```

### 2. Actualizar Credenciales en Otros Servicios

Si usas estos servicios, actualizar con nuevos secrets:

- [ ] AWS Credentials (si están en .env)
- [ ] Stripe Keys (cambiar a LIVE mode)
- [ ] Sentry DSN
- [ ] Email provider (SendGrid, etc.)

### 3. Configurar SSH Keys (Recomendado)

```bash
# En tu máquina LOCAL
ssh-keygen -t ed25519 -C "deploy-inmova"

# Copiar al servidor
ssh-copy-id root@157.180.119.236

# Test
ssh root@157.180.119.236
# Debe entrar sin pedir password

# Después, deshabilitar password auth:
# nano /etc/ssh/sshd_config
# PasswordAuthentication no
# systemctl restart sshd
```

---

## 🌐 VERIFICACIÓN FINAL

Después de Fase 1, verificar estas URLs:

```bash
# Health Check
curl https://inmovaapp.com/api/health
# Esperado: {"status":"ok","database":"connected"}

# Login Page
curl -I https://inmovaapp.com/login
# Esperado: HTTP/2 200

# SSL Test
curl -I https://inmovaapp.com
# Esperado: HTTP/2 200

# Redirect HTTP → HTTPS
curl -I http://inmovaapp.com
# Esperado: 301 Moved Permanently → https://
```

### URLs para Navegador

```
App: https://inmovaapp.com
Login: https://inmovaapp.com/login
Dashboard: https://inmovaapp.com/dashboard
Admin: https://inmovaapp.com/admin/dashboard

Credenciales Test:
Email: admin@inmova.app
Password: Admin123!
```

---

## ⚠️ TROUBLESHOOTING RÁPIDO

### Si algo falla durante ejecución:

```bash
# Ver logs de PM2
pm2 logs inmova-app --err --lines 50

# Restart manual
pm2 restart inmova-app --update-env

# Health check local
curl http://localhost:3000/api/health

# Ver estado completo
pm2 status
systemctl status nginx
ufw status
```

### Si necesitas rollback:

```bash
# Restaurar .env anterior
cd /opt/inmova-app
ls -la .env.production.backup.*
cp .env.production.backup.TIMESTAMP .env.production

# Restart
pm2 restart inmova-app
```

---

## 📞 SOPORTE

Si encuentras problemas:

### Logs Importantes

```bash
# Logs de aplicación
pm2 logs inmova-app

# Logs de Nginx
tail -f /var/log/nginx/error.log

# Logs de sistema
journalctl -u nginx -f
```

### Verificar Estado

```bash
# PM2
pm2 status

# Nginx
systemctl status nginx

# Firewall
ufw status verbose

# SSL Certificate
certbot certificates

# Backups
ls -lh /var/backups/inmova/
```

---

## ✅ CHECKLIST PRE-EJECUCIÓN

Antes de comenzar, verifica:

- [ ] Tienes acceso SSH al servidor (157.180.119.236)
- [ ] DNS apunta al servidor (dig +short inmovaapp.com)
- [ ] Tienes los secrets guardados en password manager
- [ ] Leíste la guía completa (FASE_1_EJECUCION_GUIA.md)
- [ ] Hiciste backup manual de BD (opcional pero recomendado)
- [ ] Tienes ~2 horas disponibles para ejecutar
- [ ] Estás en horario de bajo tráfico (recomendado)

---

## 🚀 COMANDO ÚNICO (Para Expertos)

Si quieres ejecutar todo de una vez (no recomendado sin supervisión):

```bash
ssh root@157.180.119.236 << 'ENDSSH'
cd /opt/inmova-app
bash scripts/phase1-security-setup.sh < <(echo -e "y\n\ny\n")
bash scripts/phase1-ssl-tests.sh < <(echo -e "y\n\nn\n")
bash scripts/phase1-verification.sh < <(echo -e "y\n")
ENDSSH
```

⚠️ **NO RECOMENDADO** - Mejor ejecutar interactivamente paso a paso.

---

## 📝 PRÓXIMOS PASOS DESPUÉS DE FASE 1

### Inmediato (Hoy)

1. ✅ Ejecutar Fase 1 completa
2. ✅ Verificar que todo funciona
3. ✅ Guardar secrets en password manager
4. ✅ Commit de scripts a git

### Mañana

1. Configurar UptimeRobot (5 min)
2. Actualizar credenciales en servicios externos
3. Remover credenciales de docs
4. Comunicar a stakeholders

### Esta Semana

1. Implementar funcionalidades avanzadas (IA, Tours 360°)
2. Aumentar coverage de tests a >80%
3. Optimización de performance
4. Preparar anuncio de lanzamiento

---

## 🎉 RESUMEN

**Has preparado exitosamente la Fase 1 con:**

- ✅ 5 scripts automatizados listos para ejecutar
- ✅ 5 secrets seguros generados con OpenSSL
- ✅ Guía completa paso a paso
- ✅ Documentación de troubleshooting
- ✅ Checklist de verificación

**Tiempo total de ejecución:** 2 horas  
**Nivel de dificultad:** 🟢 Fácil (scripts interactivos)  
**Resultado esperado:** 🟢 LISTO PARA LANZAMIENTO PÚBLICO

---

## 🚀 ¡COMIENZA AHORA!

```bash
# Paso 1: Conectar
ssh root@157.180.119.236

# Paso 2: Ir a directorio
cd /opt/inmova-app

# Paso 3: Ejecutar Día 1
bash scripts/phase1-security-setup.sh
```

**¡Buena suerte con el lanzamiento de Inmova! 🎉**

---

**Fecha:** 3 Enero 2026  
**Scripts Creados:** 5  
**Secrets Generados:** 5  
**Documentación:** 3 archivos  
**Estado:** ✅ LISTO PARA EJECUTAR

**Próxima Actualización:** Después de ejecutar phase1-verification.sh
