# Configuración de Mantenimiento Automático - INMOVA

## 📋 Resumen

Este documento explica cómo configurar el script de mantenimiento semanal para que se ejecute automáticamente usando cron.

## 🔧 Script de Mantenimiento

**Ubicación**: `./scripts/weekly-maintenance.sh`

**Tareas que realiza**:
1. ✅ Limpieza de memoria y cachés (usando cleanup-memory.sh)
2. ✅ Análisis de código TypeScript 
3. ✅ Verificación de espacio en disco
4. ✅ Optimización de PostgreSQL (VACUUM ANALYZE)
5. ✅ Limpieza de logs y reportes antiguos (+30 días)

## ⚙️ Configuración del Cron Job

### Opción 1: Ejecutar cada domingo a las 00:00

```bash
# Editar crontab
crontab -e

# Agregar esta línea:
0 0 * * 0 /home/ubuntu/homming_vidaro/nextjs_space/scripts/weekly-maintenance.sh
```

### Opción 2: Ejecutar cada lunes a las 03:00 AM

```bash
# Editar crontab
crontab -e

# Agregar esta línea:
0 3 * * 1 /home/ubuntu/homming_vidaro/nextjs_space/scripts/weekly-maintenance.sh
```

### Verificar que el cron está configurado

```bash
crontab -l
```

## 📊 Monitoreo

### Ver logs de mantenimiento

```bash
# Ver el log más reciente
ls -lt /home/ubuntu/homming_vidaro/nextjs_space/logs/maintenance/ | head -5

# Leer el log más reciente
tail -100 /home/ubuntu/homming_vidaro/nextjs_space/logs/maintenance/maintenance-*.log | tail
```

### Ver reportes semanales

```bash
# Listar reportes
ls -lt /home/ubuntu/homming_vidaro/nextjs_space/weekly-report-*.txt

# Ver el reporte más reciente
cat /home/ubuntu/homming_vidaro/nextjs_space/weekly-report-$(date +%Y%m%d).txt
```

## 🔍 Ejecución Manual

Si necesitas ejecutar el mantenimiento manualmente:

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
./scripts/weekly-maintenance.sh
```

## 📧 Notificaciones por Email (Opcional)

Para recibir notificaciones por email cuando se complete el mantenimiento:

1. Instalar mailutils:
```bash
sudo apt-get install mailutils
```

2. Descomentar la línea en `weekly-maintenance.sh`:
```bash
# Cambiar:
# mail -s "Mantenimiento Semanal INMOVA Completado" admin@inmova.com < "$LOG_FILE"

# Por:
mail -s "Mantenimiento Semanal INMOVA Completado" admin@inmova.com < "$LOG_FILE"
```

3. Configurar tu email en lugar de `admin@inmova.com`

## 🎯 Métricas Esperadas

### Antes del mantenimiento (primera ejecución)
- 💾 Espacio .build/: ~2.3 GB
- 💾 Espacio .next/: ~70 MB
- 🗄️ Base de datos: Fragmentada

### Después del mantenimiento
- 💾 Espacio .build/: ~70-100 MB
- 💾 Espacio .next/: ~70 MB  
- 🗄️ Base de datos: Optimizada
- 📉 Ahorro total: ~2.2 GB

## ⚠️ Troubleshooting

### El cron no se ejecuta

1. Verificar que el script tiene permisos de ejecución:
```bash
chmod +x /home/ubuntu/homming_vidaro/nextjs_space/scripts/weekly-maintenance.sh
```

2. Verificar logs del sistema:
```bash
grep CRON /var/log/syslog | tail -20
```

3. Verificar que cron está corriendo:
```bash
sudo service cron status
```

### Error de permisos

Asegúrate de que el usuario que ejecuta el cron tiene permisos:
```bash
ls -la /home/ubuntu/homming_vidaro/nextjs_space/scripts/weekly-maintenance.sh
```

### Database connection error

Verifica que el archivo `.env` existe y tiene `DATABASE_URL` configurado:
```bash
grep DATABASE_URL /home/ubuntu/homming_vidaro/nextjs_space/.env
```

## 📅 Próximos Pasos

✅ Script de mantenimiento configurado  
⏳ Configurar cron job (manual)  
⏳ Configurar notificaciones email (opcional)  
⏳ Monitorear primera ejecución  

---

**Última actualización**: 10 de Diciembre, 2025  
**Versión**: 1.0
