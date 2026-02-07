# ✅ Google Analytics 4 - Configurado Exitosamente

**Fecha**: 4 de enero de 2026, 11:08 UTC
**Measurement ID**: G-WX2LE41M4T
**Status**: ✅ ACTIVO

---

## 📊 Configuración Completada

### ✅ Servidor de Producción
- **Variable añadida**: `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-WX2LE41M4T`
- **Ubicación**: `/opt/inmova-app/.env.production`
- **PM2**: Reiniciado correctamente con `--update-env`
- **Workers**: 2 instancias online (cluster mode)

### ✅ Aplicación
- **URL**: https://inmovaapp.com
- **Estado**: Online
- **Tracking code**: Activo y cargando

---

## 🔍 Verificación

### Paso 1: Test en Tiempo Real

**Ahora mismo puedes verificar:**

1. **Ir a Google Analytics**:
   ```
   https://analytics.google.com/
   ```

2. **Seleccionar tu propiedad**:
   - "Inmova App Production"

3. **Reports → Realtime**:
   - Deberías ver "0 users" inicialmente

4. **Abrir la app en otro navegador**:
   ```
   https://inmovaapp.com
   ```
   
   **⚠️ IMPORTANTE**: 
   - Cuando aparezca el banner de cookies
   - Click en **"Configurar"**
   - Activar **"Cookies de Análisis"**
   - Click **"Guardar preferencias"**
   
   Sin este paso, GA4 NO trackeará (GDPR compliance)

5. **Volver a GA Real-time**:
   - En 10-15 segundos deberías ver: **"1 user"** ✅
   - Verás la página que estás visitando en tiempo real

### Paso 2: Verificar en DevTools (Opcional)

1. **Abrir https://inmovaapp.com**
2. **F12** (DevTools) → **Console**
3. Buscar línea similar a:
   ```
   gtag('config', 'G-WX2LE41M4T', {...})
   ```
4. Si aparece → ✅ GA4 cargando correctamente

### Paso 3: Verificar en Network Tab (Opcional)

1. **DevTools → Network tab**
2. Filtrar por: `google-analytics.com`
3. Deberías ver requests a:
   - `gtag/js?id=G-WX2LE41M4T`
   - `collect?v=2&...`
4. Si aparecen → ✅ Tracking funcionando

---

## ⚠️ Troubleshooting

### ❌ Problema: No aparecen visitas en Real-time

**Solución 1: Verificar consentimiento de cookies**
- El usuario DEBE aceptar cookies de "Análisis"
- Banner de cookies → Configurar → Activar "Cookies de Análisis"
- Sin consentimiento = No tracking (por GDPR)

**Solución 2: Desactivar Ad Blockers**
- Ad Blockers (uBlock Origin, AdBlock, etc.) bloquean GA4
- Desactivar temporalmente para testear
- O usar ventana de incógnito sin extensiones

**Solución 3: Esperar 1-2 minutos**
- A veces GA4 tarda un poco en aparecer la primera vez
- Actualizar la página de Real-time

**Solución 4: Verificar configuración en servidor**
```bash
ssh root@157.180.119.236
grep "NEXT_PUBLIC_GA_MEASUREMENT_ID" /opt/inmova-app/.env.production
# Debe mostrar: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-WX2LE41M4T

pm2 env inmova-app | grep GA_MEASUREMENT_ID
# Debe mostrar el Measurement ID
```

---

## 📝 Próximos Pasos (Recomendados)

### 1. Marcar Eventos como Conversiones

**En Google Analytics:**

1. **Admin → Events**
2. Cuando aparezcan estos eventos (después de que ocurran en la app):
   - `sign_up` → **Mark as conversion** ✅
   - `login` → **Mark as conversion** ✅
   - `purchase` → **Mark as conversion** ✅
   - `property_created` → **Mark as conversion** ✅

**¿Cuándo aparecerán?**
- Se crean automáticamente cuando un usuario realiza esas acciones
- Pueden tardar 24-48h en aparecer si no hay tráfico

### 2. Configurar Data Retention (GDPR)

**En Google Analytics:**

1. **Admin → Data Settings → Data Retention**
2. **Event data retention**: Cambiar a **14 months** ⬅️ Importante para GDPR
3. **Reset user data on new activity**: **ON**
4. Click **"Save"**

**Por qué 14 meses:**
- Recomendación de AEPD (Agencia Española de Protección de Datos)
- Balance entre analytics útil y privacidad

### 3. Crear Audiencias (Opcional)

**Para remarketing y análisis avanzado:**

1. **Admin → Audiences → New Audience**
2. Ejemplos útiles:
   - "Usuarios registrados hace < 7 días"
   - "Usuarios con > 3 propiedades"
   - "Usuarios que compraron"
   - "Usuarios inactivos > 30 días"

### 4. Configurar Dashboard Personalizado

**Para métricas diarias:**

1. **Reports → Library → Create report**
2. Añadir métricas:
   - Active users
   - New users
   - Sessions
   - Sign-ups (conversion)
   - Purchases (conversion)
   - Average engagement time

---

## 📊 Eventos Personalizados Implementados

Los siguientes eventos ya están integrados en el código y se enviarán automáticamente:

### Autenticación
- **`sign_up`**: Cuando un usuario se registra
  - Propiedades: `method: 'email'`, `user_type`
  
- **`login`**: Cuando un usuario hace login
  - Propiedades: `method: 'email'`

### Propiedades
- **`property_created`**: Cuando se crea una propiedad
  - Propiedades: `property_type`, `city`, `price`

### Pagos (si implementado)
- **`purchase`**: Cuando se completa un pago
  - Propiedades: `transaction_id`, `value`, `currency`, `items`

### Engagement
- **`page_view`**: Automático (GA4 default)
- **`scroll`**: Automático (Enhanced measurement)
- **`click`**: Automático (Enhanced measurement)

---

## 🔐 Privacidad y GDPR

### ✅ Cumplimiento Implementado

1. **Consent Mode**:
   - GA4 solo trackea si usuario acepta cookies de "Análisis"
   - Integrado con banner de consentimiento

2. **IP Anonymization**:
   - Configurado en código: `anonymize_ip: true`
   - GA4 no almacena IPs completas

3. **Data Retention**:
   - Configurar a 14 meses (ver Paso 2 arriba)

4. **User Rights**:
   - Usuarios pueden revocar consentimiento en cualquier momento
   - Configuración → Cookies → Desactivar "Análisis"

---

## 📈 Métricas Esperadas

### Día 1 (Hoy)
- 0-10 usuarios (testing)
- Verificar que Real-time funciona

### Semana 1 (Beta privada)
- 20-50 usuarios
- 2-5 sign-ups/día
- Engagement time: 5-10 min

### Mes 1 (Lanzamiento)
- 100-500 usuarios
- 10-30 sign-ups/día
- 2-5% conversion rate

---

## 📞 Soporte y Documentación

### Documentación Inmova
- **Guía rápida**: `/workspace/SETUP_GOOGLE_ANALYTICS_GUIA_RAPIDA.md`
- **Guía completa**: `/workspace/docs/CONFIG_GOOGLE_ANALYTICS.md`
- **Código tracking**: `/workspace/lib/analytics.ts`

### Google Analytics
- **Help Center**: https://support.google.com/analytics/
- **Community**: https://www.en.advertisercommunity.com/t5/Google-Analytics/bd-p/Google-Analytics
- **Status**: https://www.google.com/appsstatus/dashboard/

---

## ✅ Checklist Final

- [x] Propiedad GA4 creada
- [x] Web Stream configurado
- [x] Measurement ID obtenido: G-WX2LE41M4T
- [x] Variable añadida a .env.production
- [x] PM2 reiniciado con --update-env
- [x] Aplicación online y funcionando
- [ ] Test en Real-time verificado (hazlo ahora)
- [ ] Eventos marcados como conversiones (cuando aparezcan)
- [ ] Data retention configurado a 14 meses (recomendado)
- [ ] Dashboard personalizado creado (opcional)

---

## 🎉 ¡Listo!

**Google Analytics 4 está activo en producción.**

Ahora puedes:
- 📊 Ver en tiempo real quién visita tu app
- 📈 Analizar comportamiento de usuarios
- 💰 Trackear conversiones (registros, pagos)
- 🎯 Optimizar basado en datos reales

**Próxima acción**: 
Ve a https://analytics.google.com/ → Reports → Realtime y verifica que aparecen visitas cuando abres https://inmovaapp.com

**¡Éxito con el lanzamiento!** 🚀

---

**Configurado por**: Cursor Agent  
**Fecha**: 4 de enero de 2026  
**Commit**: Pendiente
