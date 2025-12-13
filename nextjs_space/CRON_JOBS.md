# 🔄 Guía de Cron Jobs - Sincronización Automática STR

## 🎯 Descripción General

Los Cron Jobs permiten automatizar tareas repetitivas del sistema STR:

1. 📅 **Sincronización de Calendarios iCal** (cada 4 horas)
2. 🏠 **Sincronización de Disponibilidad** (cada 6 horas)
3. 🧹 **Creación de Tareas de Limpieza** (diario 6:00 AM)
4. ⭐ **Envío de Solicitudes de Reseñas** (diario 10:00 AM)
5. 📜 **Verificación de Cumplimiento Legal** (diario 9:00 AM)

---

## 🚀 Inicio Rápido

### Opción 1: Ejecución Manual desde UI

1. Ir a **Admin > Automatización > Cron Jobs**
2. Seleccionar el trabajo deseado
3. Clic en **Ejecutar Ahora**

### Opción 2: API Manual

```bash
# Ejecutar todos los trabajos
curl -X POST https://inmova.app/api/cron/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"all": true}'

# Ejecutar trabajo específico
curl -X POST https://inmova.app/api/cron/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"jobId": "sync-ical-feeds"}'
```

### Opción 3: Programación Automática

Ver sección **Configuración de Cron** más abajo.

---

## 📈 Trabajos Disponibles

### 1. Sincronizar Calendarios iCal

**ID**: `sync-ical-feeds`
**Frecuencia**: Cada 4 horas
**Horario**: 0:00, 4:00, 8:00, 12:00, 16:00, 20:00

**Descripción:**
Importa reservas desde calendarios iCal de Airbnb, Booking.com, VRBO, etc.

**Qué hace:**
1. Busca todos los canales con `iCalUrl` configurado
2. Descarga eventos del calendario
3. Crea/actualiza bookings en INMOVA
4. Previene duplicados
5. Actualiza timestamp de sincronización

**Logs:**
```
[CRON] Sincronizando 3 calendarios iCal...
  ✅ Airbnb (Piso Centro): 2 eventos
  ✅ Booking.com (Apto Playa): 1 eventos
  ❌ VRBO (Casa Rural): Error - URL inválida
[CRON] Sincronización completada en 1234ms
```

**Ejecución manual:**
```bash
curl -X POST https://inmova.app/api/cron/sync-ical \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

### 2. Sincronizar Disponibilidad a Canales

**ID**: `sync-availability`
**Frecuencia**: Cada 6 horas
**Horario**: 0:00, 6:00, 12:00, 18:00

**Descripción:**
Envía actualizaciones de disponibilidad y precios a canales externos (OTAs).

**Qué hace:**
1. Recoge todas las listings con canales activos
2. Calcula disponibilidad para próximos 365 días
3. Envía updates a APIs de canales
4. Registra errores de sincronización

**Logs:**
```
[CRON] Sincronizando disponibilidad de 5 listings...
  ✅ Piso Centro: Booking.com, Airbnb
  ✅ Apto Playa: Booking.com
  ❌ Casa Rural: Error - API timeout
[CRON] Sincronización completada en 3456ms
```

**Ejecución manual:**
```bash
curl -X POST https://inmova.app/api/cron/sync-availability \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

### 3. Crear Tareas de Limpieza Automáticas

**ID**: `create-cleaning-tasks`
**Frecuencia**: Diariamente
**Horario**: 6:00 AM

**Descripción:**
Crea tareas de limpieza para bookings que terminan hoy o mañana.

**Qué hace:**
1. Busca bookings con checkout hoy o mañana
2. Genera checklist de limpieza automática
3. Calcula tiempo estimado
4. Asigna prioridad (alta para checkout mismo día)
5. Previene duplicados

**Logs:**
```
[CRON] Creando tareas de limpieza para 3 checkouts...
  ✅ Tarea creada para Piso Centro (checkout 06/12/2025)
  ✅ Tarea creada para Apto Playa (checkout 07/12/2025)
  ⏭️  Tarea ya existe para Casa Rural
[CRON] Creación completada en 567ms
```

**Ejecución manual:**
```bash
curl -X POST https://inmova.app/api/cron/create-cleaning-tasks \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

### 4. Enviar Solicitudes de Reseñas

**ID**: `send-review-requests`
**Frecuencia**: Diariamente
**Horario**: 10:00 AM

**Descripción:**
Envía emails automáticos solicitando reseñas 2 días después del checkout.

**Qué hace:**
1. Busca bookings completados hace 2 días
2. Genera link personalizado de reseña
3. Envía email via SendGrid
4. Registra envío para evitar duplicados

**Logs:**
```
[CRON] Enviando solicitudes de reseña a 2 huéspedes...
  ✅ Solicitud enviada a john@example.com
  ✅ Solicitud enviada a maria@example.com
[CRON] Envío completado en 890ms
```

**Ejecución manual:**
```bash
curl -X POST https://inmova.app/api/cron/send-review-requests \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

### 5. Verificar Cumplimiento Legal

**ID**: `check-legal-compliance`
**Frecuencia**: Diariamente
**Horario**: 9:00 AM

**Descripción:**
Verifica licencias turísticas y cumplimiento normativo.

**Qué hace:**
1. Revisa todas las listings
2. Valida números de licencia
3. Comprueba fechas de caducidad
4. Alerta licencias próximas a vencer (30 días)
5. Identifica partes de entrada pendientes

**Logs:**
```
[CRON] Verificando cumplimiento legal de 5 listings...
  ✅ Piso Centro: Cumplimiento OK
  ⚠️  Apto Playa:
      - La licencia caduca en 25 días
  ⚠️  Casa Rural:
      - Número de licencia no registrado
[CRON] Verificación completada en 234ms
```

**Ejecución manual:**
```bash
curl -X POST https://inmova.app/api/cron/check-legal-compliance \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## ⚙️ Configuración de Cron

### Opción A: Cron Nativo (Linux/Mac)

**1. Editar crontab:**
```bash
crontab -e
```

**2. Agregar trabajos:**
```cron
# Sincronizar iCal cada 4 horas
0 */4 * * * curl -X POST https://inmova.app/api/cron/sync-ical -H "Authorization: Bearer CRON_SECRET_AQUI" >> /var/log/inmova-cron.log 2>&1

# Sincronizar disponibilidad cada 6 horas
0 */6 * * * curl -X POST https://inmova.app/api/cron/sync-availability -H "Authorization: Bearer CRON_SECRET_AQUI" >> /var/log/inmova-cron.log 2>&1

# Crear tareas de limpieza a las 6:00 AM
0 6 * * * curl -X POST https://inmova.app/api/cron/create-cleaning-tasks -H "Authorization: Bearer CRON_SECRET_AQUI" >> /var/log/inmova-cron.log 2>&1

# Enviar reseñas a las 10:00 AM
0 10 * * * curl -X POST https://inmova.app/api/cron/send-review-requests -H "Authorization: Bearer CRON_SECRET_AQUI" >> /var/log/inmova-cron.log 2>&1

# Verificar cumplimiento a las 9:00 AM
0 9 * * * curl -X POST https://inmova.app/api/cron/check-legal-compliance -H "Authorization: Bearer CRON_SECRET_AQUI" >> /var/log/inmova-cron.log 2>&1
```

**3. Verificar:**
```bash
# Listar trabajos
crontab -l

# Ver logs
tail -f /var/log/inmova-cron.log
```

---

### Opción B: Vercel Cron Jobs

**1. Crear `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-ical",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/cron/sync-availability",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/create-cleaning-tasks",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/send-review-requests",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/check-legal-compliance",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**2. Deploy:**
```bash
vercel --prod
```

**3. Monitorear:**
Ir a Vercel Dashboard > Cron Jobs

---

### Opción C: Servicios Externos

#### EasyCron (https://www.easycron.com/)

1. Crear cuenta gratuita
2. Agregar trabajos cron:
   - URL: `https://inmova.app/api/cron/execute`
   - Método: POST
   - Headers: `Authorization: Bearer YOUR_SECRET`
   - Body: `{"jobId": "sync-ical-feeds"}`
3. Configurar horarios

#### Cron-job.org (https://cron-job.org/)

Similar a EasyCron, interfaz más simple.

#### AWS EventBridge

```bash
# Crear regla de EventBridge
aws events put-rule \
  --name inmova-sync-ical \
  --schedule-expression "rate(4 hours)"

# Agregar target
aws events put-targets \
  --rule inmova-sync-ical \
  --targets "Id"="1","Arn"="arn:aws:lambda:..."
```

---

## 📊 Monitoreo y Logs

### Dashboard de Cron Jobs

Acceder a: **Admin > Automatización > Cron Jobs**

**Métricas Disponibles:**
- ✅ Total éxitos
- ❌ Total errores
- ⏱️ Última ejecución
- 📈 Items procesados
- ⌚ Duración promedio
- 📊 Historial de ejecuciones

### Logs en Tiempo Real

```bash
# Logs de servidor
tail -f /var/log/inmova-cron.log

# Logs de aplicación
tail -f logs/cron.log
```

### API de Logs

```bash
# Obtener logs recientes
curl https://inmova.app/api/logs/cron?limit=50

# Filtrar por trabajo
curl https://inmova.app/api/logs/cron?jobId=sync-ical-feeds

# Filtrar por estado
curl https://inmova.app/api/logs/cron?status=error
```

---

## 🐞 Troubleshooting

### Problema: "Cron job no se ejecuta"

**Diagnóstico:**
```bash
# Verificar crontab
crontab -l

# Test manual
curl -X POST https://inmova.app/api/cron/execute \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"jobId": "sync-ical-feeds"}'
```

**Soluciones:**
1. Verificar `CRON_ENABLED=true` en `.env`
2. Comprobar `CRON_SECRET`
3. Revisar permisos de crontab
4. Verificar conectividad de red

---

### Problema: "Error 401 Unauthorized"

**Causa:** `CRON_SECRET` incorrecto o ausente

**Solución:**
```bash
# Generar nuevo secreto
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Actualizar .env
CRON_SECRET=nuevo_secreto_aqui

# Actualizar crontab
crontab -e
```

---

### Problema: "Job tarda mucho tiempo"

**Diagnóstico:**
```bash
# Ver duración promedio
curl https://inmova.app/api/logs/cron?metrics=true
```

**Soluciones:**
1. Reducir número de items procesados
2. Aumentar timeout de API
3. Optimizar queries de base de datos
4. Dividir en sub-trabajos

---

### Problema: "Errores de sincronización iCal"

**Causa común:** URL iCal inválida o caducada

**Solución:**
1. Ir a **STR > Channel Manager**
2. Verificar URL iCal del canal
3. Regenerar URL en Airbnb/Booking
4. Actualizar en INMOVA
5. Test manual:
   ```bash
   curl https://url-ical-aqui
   ```

---

## 🔒 Seguridad

### Autenticación

Todos los endpoints `/api/cron/*` requieren:

```http
Authorization: Bearer YOUR_CRON_SECRET
```

### Generación de Secreto Seguro

```bash
# Opción 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: OpenSSL
openssl rand -hex 32

# Opción 3: PWGen
pwgen -s 64 1
```

### Rate Limiting

- Máx 10 requests por hora por IP
- Máx 100 requests por día por empresa

### IP Whitelist (Opcional)

```env
CRON_ALLOWED_IPS=123.456.789.0,987.654.321.0
```

---

## 📚 Recursos Adicionales

### Sintaxis de Cron

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Día de la semana (0-7, 0=Domingo)
│ │ │ └───── Mes (1-12)
│ │ └─────── Día del mes (1-31)
│ └───────── Hora (0-23)
└─────────── Minuto (0-59)
```

**Ejemplos:**
- `0 */4 * * *` - Cada 4 horas
- `0 6 * * *` - Diariamente a las 6:00 AM
- `0 9 * * 1` - Cada lunes a las 9:00 AM
- `*/30 * * * *` - Cada 30 minutos

### Herramientas Útiles

- [Crontab Guru](https://crontab.guru/) - Validador de sintaxis cron
- [Cron Expression Generator](https://www.freeformatter.com/cron-expression-generator-quartz.html)

### Soporte

- 📧 Email: support@inmova.app
- 📝 Documentación: https://docs.inmova.app/cron-jobs

---

**¡Automatización Completa! 🚀**

Última actualización: Diciembre 2025
