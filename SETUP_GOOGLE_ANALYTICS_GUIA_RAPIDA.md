# 📊 Guía Rápida: Configurar Google Analytics 4

## ⏱️ Tiempo estimado: 10 minutos

---

## 📋 Paso 1: Crear Propiedad en Google Analytics

### 1.1. Acceder a Google Analytics

🔗 **URL**: https://analytics.google.com/

- Login con tu cuenta de Google (usa una corporativa si es posible)

### 1.2. Crear Cuenta (si no tienes)

Si es tu primera vez:
1. Click en **"Start measuring"** o **"Create Account"**
2. **Account name**: `Inmova App`
3. **Country**: Spain
4. **Data sharing settings**: (las que prefieras)
5. Click **"Next"**

### 1.3. Crear Propiedad GA4

1. **Property name**: `Inmova App Production`
2. **Reporting time zone**: `(GMT+01:00) Madrid`
3. **Currency**: `EUR - Euro`
4. Click **"Next"**

### 1.4. Detalles del Negocio

1. **Industry**: `Real Estate`
2. **Business size**: `Small` (si < 10 empleados) o el apropiado
3. **How you plan to use Google Analytics**: 
   - Marcar: **"Measure site and app activity"**
4. Click **"Create"**
5. **Aceptar** los términos de servicio

### 1.5. Crear Data Stream

1. En la pantalla "Start collecting data", click **"Web"**
2. **Website URL**: `https://inmovaapp.com`
3. **Stream name**: `Inmova Production Website`
4. **Enhanced measurement**: Dejar **ON** (recomendado)
   - Esto trackea automáticamente: scrolls, clicks, file downloads, video engagement
5. Click **"Create stream"**

### 1.6. ✅ COPIAR el Measurement ID

En la pantalla que aparece, verás:

```
┌─────────────────────────────────────┐
│ Web stream details                   │
│                                      │
│ Measurement ID                       │
│ G-ABC123XYZ9  [Copy]                 │  ← ¡COPIAR ESTO!
│                                      │
│ Stream URL: https://inmovaapp.com    │
└─────────────────────────────────────┘
```

**Copia el Measurement ID** (formato: `G-XXXXXXXXXX`)

---

## 📋 Paso 2: Configurar en Producción

### Opción A: Usar el Script Automático (RECOMENDADO)

Una vez tengas el Measurement ID:

```bash
cd /workspace
python3 scripts/configure-google-analytics.py G-ABC123XYZ9
#                                             ↑
#                                    Reemplazar con tu ID real
```

**El script hará automáticamente:**
- ✅ Backup de .env.production
- ✅ Añadir `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- ✅ Reiniciar PM2 con `--update-env`
- ✅ Verificar que la app corre correctamente
- ✅ Test de health check

### Opción B: Manual (si prefieres)

**En el servidor:**

```bash
ssh root@157.180.119.236
cd /opt/inmova-app

# Backup
cp .env.production .env.production.backup

# Editar
nano .env.production

# Añadir esta línea al final:
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-ABC123XYZ9
#                             ↑
#                     Tu Measurement ID real

# Guardar: Ctrl+O, Enter, Ctrl+X

# Reiniciar PM2
pm2 restart inmova-app --update-env
pm2 logs inmova-app --lines 50
```

---

## 📋 Paso 3: Verificar que Funciona

### 3.1. Test en Tiempo Real

1. **Ve a Google Analytics**:
   - https://analytics.google.com/
   - Selecciona tu propiedad "Inmova App Production"

2. **Reports → Realtime**:
   - Deberías ver "0 users" inicialmente

3. **Abre tu app**:
   - En otro navegador (o ventana incógnito)
   - Ve a: https://inmovaapp.com
   - **IMPORTANTE**: Acepta las cookies de "Análisis" en el banner

4. **Volver a GA Real-time**:
   - En 5-10 segundos deberías ver: **"1 user"** ✅
   - Verás la página que estás visitando

### 3.2. Troubleshooting

**❌ No aparecen visitas:**

1. **Verificar consentimiento de cookies**:
   - El banner de cookies debe estar configurado
   - Usuario DEBE aceptar cookies de "Análisis"
   - Sin consentimiento → No tracking (por GDPR)

2. **Desactivar Ad Blockers**:
   - Ad Blockers bloquean Google Analytics
   - Desactiva uBlock Origin, AdBlock, etc.

3. **Verificar Measurement ID**:
   ```bash
   # En el servidor
   ssh root@157.180.119.236
   grep "NEXT_PUBLIC_GA_MEASUREMENT_ID" /opt/inmova-app/.env.production
   # Debe mostrar: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...
   ```

4. **Verificar que PM2 cargó las variables**:
   ```bash
   pm2 env inmova-app | grep GA_MEASUREMENT_ID
   # Debe mostrar tu Measurement ID
   ```

5. **Verificar en el navegador**:
   - Abre DevTools (F12) → Console
   - Busca errores relacionados con `gtag` o `analytics`
   - Si ves `gtag('config', 'G-...')` → Está funcionando

### 3.3. Test con GA Debugger (Opcional)

1. **Instalar extensión**:
   - Chrome: [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)

2. **Activar extensión** (click en el icono)

3. **Abrir https://inmovaapp.com**

4. **DevTools → Console**:
   - Deberías ver logs de Google Analytics
   - Ejemplo: `Sending Google Analytics request...`

---

## 📋 Paso 4: Configurar Conversiones (Importante)

### 4.1. Marcar Eventos como Conversiones

En Google Analytics:

1. **Admin → Events**
2. Buscar estos eventos (se crearán cuando ocurran):
   - `sign_up` → **Mark as conversion** ✅
   - `purchase` → **Mark as conversion** ✅
   - `property_created` → **Mark as conversion** ✅
   - `login` → **Mark as conversion** ✅

### 4.2. Configurar Data Retention (GDPR)

1. **Admin → Data Settings → Data Retention**
2. **Event data retention**: Cambiar a **14 months**
3. **Reset user data on new activity**: **ON**
4. Click **"Save"**

---

## 📊 Paso 5: Crear Dashboard (Opcional pero Recomendado)

### 5.1. Reportes Útiles

1. **Reports → Acquisition → User acquisition**:
   - ¿De dónde vienen los usuarios? (Google, Direct, Social)

2. **Reports → Engagement → Pages and screens**:
   - ¿Qué páginas visitan más?

3. **Reports → Monetization → Overview** (si tienes pagos):
   - Revenue y transacciones

4. **Reports → Realtime → Overview**:
   - Usuarios activos ahora mismo

### 5.2. Crear Dashboard Personalizado

1. **Reports → Library → Create report**
2. Añadir métricas:
   - **Active users**
   - **New users**
   - **Sessions**
   - **Conversions** (sign_up, purchase)
   - **Revenue** (si aplica)

---

## ✅ Checklist Final

- [ ] Cuenta de Google Analytics creada
- [ ] Propiedad "Inmova App Production" creada
- [ ] Web Stream configurado para https://inmovaapp.com
- [ ] Measurement ID copiado (G-XXXXXXXXXX)
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` añadido a .env.production
- [ ] PM2 reiniciado con `--update-env`
- [ ] Test en Real-time → Aparecen visitas ✅
- [ ] Eventos marcados como conversiones
- [ ] Data retention configurado a 14 meses
- [ ] Dashboard personalizado creado

---

## 🎯 Métricas Clave a Monitorear

### Diariamente
- **Active users** (usuarios activos)
- **Sign-ups** (registros)
- **Conversions** (conversiones)

### Semanalmente
- **User engagement** (tiempo de permanencia)
- **Popular pages** (páginas más visitadas)
- **Traffic sources** (de dónde vienen los usuarios)

### Mensualmente
- **User retention** (retención de usuarios)
- **Conversion rate** (tasa de conversión)
- **Revenue** (ingresos, si aplica)

---

## 🆘 Soporte

### Documentación Oficial
- **GA4 Help Center**: https://support.google.com/analytics/
- **Migration Guide**: https://support.google.com/analytics/answer/9744165

### Documentación Inmova
- **Guía completa**: `/workspace/docs/CONFIG_GOOGLE_ANALYTICS.md`
- **Código de tracking**: `/workspace/lib/analytics.ts`

### Community
- **Google Analytics Community**: https://www.en.advertisercommunity.com/t5/Google-Analytics/bd-p/Google-Analytics

---

## 💡 Tips Pro

1. **Usa filtros en Real-time** para testear:
   - Filtra por tu IP para ver solo tus visitas

2. **Crea Audiencias personalizadas**:
   - "Usuarios registrados hace < 7 días"
   - "Usuarios que crearon propiedades"

3. **Integra con Google Ads** (si haces publicidad):
   - Admin → Google Ads Links

4. **Exporta a BigQuery** (para análisis avanzado):
   - Admin → BigQuery Links
   - ~$5-50/mes según volumen

5. **Instala Google Tag Manager** (opcional, avanzado):
   - Para trackear eventos custom sin código

---

## 🎉 ¡Listo!

Google Analytics 4 está configurado y funcionando. Ahora puedes:
- 📊 Ver en tiempo real quién visita tu app
- 📈 Analizar comportamiento de usuarios
- 💰 Trackear conversiones y revenue
- 🎯 Optimizar tu producto basado en datos

**¡Éxito con el lanzamiento!** 🚀
