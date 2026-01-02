# 🚀 TRIADA DE MANTENIMIENTO - CONFIGURACIÓN FINAL

---

## 📋 Resumen Ejecutivo

✅ **EL CENTINELA (Sentry)**: Configurado con logging, tracing y error capture
✅ **EL ESCUDO (Crisp Chat)**: Widget listo para activar
✅ **LA TRANSPARENCIA (Status Page)**: Link en Footer preparado

**Estado actual**: Todo el código está implementado. Solo falta obtener las credenciales.

---

## 🎯 Siguiente Paso INMEDIATO

### Opción 1: Script Interactivo en Servidor (RECOMENDADO)

El script ya está copiado en tu servidor en `/opt/inmova-app/configurar-triada.sh`.

**1. Conéctate al servidor:**
```bash
ssh root@157.180.119.236
```
**Password:** `xcc9brgkMMbf`

**2. Ejecuta el script:**
```bash
/opt/inmova-app/configurar-triada.sh
```

**3. Sigue las instrucciones en pantalla (~15 minutos):**
- El script te guiará paso a paso
- Abrirá los enlaces de registro (cópialos en tu navegador)
- Te pedirá las credenciales una por una
- Validará cada entrada
- Actualizará `.env.production`
- Reiniciará PM2 automáticamente
- Verificará que todo funciona

### Opción 2: Configuración Manual

Si prefieres configurarlo manualmente, sigue: [`INSTRUCCIONES-CONFIGURAR-TRIADA.md`](./INSTRUCCIONES-CONFIGURAR-TRIADA.md)

---

## 🛡️ Servicios a Configurar

### 1️⃣ Sentry (Error Tracking)

**¿Qué es?** Sistema de monitoreo de errores en tiempo real.

**Registro:**
1. Ve a: https://sentry.io/signup/
2. Crea una cuenta (gratis hasta 5K errores/mes)
3. Crea un nuevo proyecto:
   - Framework: **Next.js**
   - Nombre: `inmova-production`
4. Copia tu DSN (empieza con `https://...@...ingest.sentry.io/...`)

**Formato esperado:**
```
https://a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6@o123456.ingest.sentry.io/1234567
```

**Lo verás en:**
- Errores de API
- Excepciones de servidor
- Problemas de frontend
- Performance issues

### 2️⃣ Crisp (Chat de Soporte)

**¿Qué es?** Widget de chat en vivo para soporte al cliente.

**Registro:**
1. Ve a: https://crisp.chat/en/
2. Crea una cuenta (gratis hasta 2 agentes)
3. Crea un sitio web:
   - Nombre: `Inmova App`
   - URL: `https://inmovaapp.com`
4. Ve a: **Settings** → **Website Settings** → **Setup instructions**
5. Copia tu Website ID (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

**Formato esperado:**
```
12345678-abcd-1234-efgh-123456789012
```

**Lo verás en:**
- Esquina inferior derecha de la web (icono de chat)
- Dashboard de Crisp para responder conversaciones

### 3️⃣ BetterStack Status Page

**¿Qué es?** Página pública de estado del sistema.

**Registro:**
1. Ve a: https://betterstack.com/uptime
2. Crea una cuenta (gratis hasta 10 monitores)
3. Crea un Status Page:
   - Nombre: `Inmova System Status`
   - Subdomain: `inmova-status` (o el que prefieras)
4. Añade monitores:
   - URL: `https://inmovaapp.com`
   - Check interval: 60 seconds
5. Copia la URL de tu Status Page (ej: `https://inmova-status.betteruptime.com`)

**Formato esperado:**
```
https://your-subdomain.betteruptime.com
```

**Lo verás en:**
- Footer de la web (link "Estado del Sistema")
- Página pública mostrando status de servicios

---

## ⏱️ Tiempo Estimado

| Servicio | Registro | Configuración | Total |
|----------|----------|---------------|-------|
| Sentry | 3 min | 2 min | 5 min |
| Crisp | 2 min | 1 min | 3 min |
| BetterStack | 5 min | 2 min | 7 min |
| **TOTAL** | **10 min** | **5 min** | **15 min** |

---

## 📄 Variables a Configurar

```env
# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=https://...@...ingest.sentry.io/...
SENTRY_DSN=https://...@...ingest.sentry.io/...

# Crisp (Chat de Soporte)
NEXT_PUBLIC_CRISP_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# BetterStack (Status Page)
NEXT_PUBLIC_STATUS_PAGE_URL=https://your-subdomain.betteruptime.com
```

---

## ✅ Verificación Post-Configuración

### 1. Verificar que PM2 reinició correctamente:
```bash
ssh root@157.180.119.236
pm2 status
pm2 logs inmova-app --lines 20
```

### 2. Test de Sentry:
```bash
curl https://inmovaapp.com/api/test-sentry
```
Luego ve a https://sentry.io/issues/ y verifica que aparece el error de prueba.

### 3. Test de Crisp:
- Abre https://inmovaapp.com en un navegador
- Debe aparecer el widget de chat en la esquina inferior derecha
- Click en el widget y escribe un mensaje de prueba
- Ve a tu dashboard de Crisp y confirma que recibiste el mensaje

### 4. Test de Status Page:
- Ve al Footer de https://inmovaapp.com
- Click en "Estado del Sistema"
- Debe redirigir a tu Status Page de BetterStack
- Verifica que muestra el estado actual (verde = operativo)

---

## 🐛 Troubleshooting

### Sentry no captura errores
```bash
# Verificar que la variable está configurada
ssh root@157.180.119.236
cd /opt/inmova-app
grep SENTRY_DSN .env.production

# Reiniciar PM2
pm2 restart inmova-app
```

### Crisp no aparece
```bash
# Verificar variable
ssh root@157.180.119.236
cd /opt/inmova-app
grep CRISP .env.production

# Limpiar cache del navegador
# O abrir en modo incógnito
```

### Status Page no funciona
```bash
# Verificar variable
ssh root@157.180.119.236
cd /opt/inmova-app
grep STATUS_PAGE_URL .env.production

# Verificar que la URL es pública (sin login)
curl -I https://your-subdomain.betteruptime.com
```

---

## 📚 Documentación Adicional

- **Sentry Best Practices**: [`docs/SENTRY-BEST-PRACTICES.md`](./docs/SENTRY-BEST-PRACTICES.md)
- **Triada Completa**: [`docs/TRIADA-MANTENIMIENTO.md`](./docs/TRIADA-MANTENIMIENTO.md)
- **Protocolo Zero-Headache**: [`docs/PROTOCOLO-ZERO-HEADACHE.md`](./docs/PROTOCOLO-ZERO-HEADACHE.md)
- **Plan de Mantenimiento**: [`docs/PLAN-MANTENIMIENTO-POST-LANZAMIENTO.md`](./docs/PLAN-MANTENIMIENTO-POST-LANZAMIENTO.md)

---

## 💡 Beneficios de la Triada

### 🛡️ Antes de la Triada
- ❌ Descubres errores cuando los usuarios se quejan
- ❌ No sabes qué está fallando ni por qué
- ❌ Usuarios frustrados sin canal de soporte
- ❌ No hay visibilidad del estado del sistema

### ✅ Después de la Triada
- ✅ Errores detectados y notificados automáticamente
- ✅ Stack traces, contexto y métricas en Sentry
- ✅ Chat en vivo para soporte inmediato
- ✅ Página pública de estado para transparencia
- ✅ Menos tiempo resolviendo incidencias
- ✅ Mejor experiencia de usuario

---

## 🎯 TODO List

- [x] Implementar Error Boundary global
- [x] Integrar Crisp Chat Widget
- [x] Añadir link de Status Page en Footer
- [x] Configurar Sentry (client/server/edge)
- [x] Habilitar logging y tracing
- [x] Crear endpoint de test de Sentry
- [x] Preparar script de configuración en servidor
- [ ] **SIGUIENTE PASO: Ejecutar `/opt/inmova-app/configurar-triada.sh`**
- [ ] Verificar en producción (https://inmovaapp.com)
- [ ] Test de Sentry
- [ ] Test de Crisp
- [ ] Test de Status Page

---

## 🚀 ¡Listo para Configurar!

**Ejecuta ahora:**
```bash
ssh root@157.180.119.236
/opt/inmova-app/configurar-triada.sh
```

O consulta [`SENSCRIPT-EN-SERVIDOR-LISTO.md`](./SENSCRIPT-EN-SERVIDOR-LISTO.md) para instrucciones detalladas paso a paso.

---

**Tiempo total estimado: 15-20 minutos** ⏱️

**¿Listo para dormir tranquilo?** 😴🛡️
