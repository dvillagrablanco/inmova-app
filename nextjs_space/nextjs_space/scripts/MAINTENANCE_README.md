# 🛠️ Sistema de Mantenimiento Automático INMOVA

## 📝 Descripción

Este sistema ejecuta tareas de mantenimiento automático cada semana para optimizar el rendimiento de la aplicación INMOVA.

## ⚙️ Tareas Ejecutadas

### 1. 🧹 Limpieza del directorio `.build`
- **Frecuencia**: Semanal
- **Objetivo**: Eliminar archivos temporales de compilación de Next.js
- **Impacto**: Libera espacio en disco y previene conflictos de cache

### 2. 📊 Optimización de PostgreSQL (VACUUM ANALYZE)
- **Frecuencia**: Semanal
- **Objetivo**: 
  - Recuperar espacio de almacenamiento
  - Actualizar estadísticas de las tablas
  - Mejorar el rendimiento de las consultas
- **Impacto**: 
  - Mantiene la base de datos eficiente
  - Optimiza los planes de ejecución de queries
  - Previene fragmentación de datos

### 3. 🗂️ Limpieza de Logs Antiguos
- **Frecuencia**: Semanal
- **Retención**: 30 días
- **Objetivo**: Mantener el tamaño de los logs bajo control

## 📅 Programación

**Horario**: Domingos a las 3:00 AM
**Razón**: Horario de menor carga del sistema

```bash
# Entrada cron
0 3 * * 0 /home/ubuntu/homming_vidaro/nextjs_space/scripts/weekly-maintenance.sh
```

## 📊 Monitorización
### Logs de Ejecución
- **Ubicación**: `/home/ubuntu/homming_vidaro/nextjs_space/logs/maintenance/`
- **Formato**: `maintenance-YYYYMMDD-HHMMSS.log`
- **Log de Cron**: `cron.log`

### Ver Último Log
```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
cat logs/maintenance/$(ls -t logs/maintenance/maintenance-*.log | head -1)
```

### Ver Log de Cron
```bash
cat /home/ubuntu/homming_vidaro/nextjs_space/logs/maintenance/cron.log
```

## ▶️ Ejecución Manual

Si necesitas ejecutar el mantenimiento manualmente:

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
./scripts/weekly-maintenance.sh
```

## 🔧 Configuración
### Modificar la Frecuencia

Para cambiar la frecuencia de ejecución:

```bash
# Editar crontab
crontab -e

# Ejemplos de frecuencias:
# Diario a las 3 AM:    0 3 * * *
# Cada 3 días a las 2 AM: 0 2 */3 * *
# Mensual (día 1 a las 3 AM): 0 3 1 * *
```

### Modificar las Tareas

Edita el script principal:

```bash
nano /home/ubuntu/homming_vidaro/nextjs_space/scripts/weekly-maintenance.sh
```

## 🚨 Troubleshooting

### El mantenimiento no se ejecuta

1. **Verificar que cron esté activo**:
```bash
sudo service cron status
```

2. **Verificar las tareas programadas**:
```bash
crontab -l
```

3. **Revisar logs de cron del sistema**:
```bash
sudo grep CRON /var/log/syslog | tail -20
```

### Errores de permisos

```bash
# Asegurar permisos correctos
chmod +x /home/ubuntu/homming_vidaro/nextjs_space/scripts/weekly-maintenance.sh
chown ubuntu:ubuntu /home/ubuntu/homming_vidaro/nextjs_space/scripts/weekly-maintenance.sh
```

### Error de conexión a la base de datos

1. Verificar que `.env` contenga `DATABASE_URL`
2. Probar conexión manualmente:
```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

## 📊 Métricas y Resultados

Cada ejecución del mantenimiento registra:
- ✅ Tamaño del directorio `.build` después de la limpieza
- ✅ Tamaño actual de la base de datos
- ✅ Número de logs eliminados
- ✅ Tiempo total de ejecución

## 📝 Historial de Cambios

### 2024-12-05
- ✅ Implementación inicial del sistema de mantenimiento
- ✅ Configuración de ejecución semanal
- ✅ Sistema de logging implementado

## 👨‍💻 Soporte

Para problemas o sugerencias relacionadas con el sistema de mantenimiento:
- **Email**: tech@inmova.com
- **Documentación**: `/scripts/MAINTENANCE_README.md`

## ⚠️ Notas Importantes

1. El mantenimiento se ejecuta durante horarios de baja actividad para minimizar el impacto
2. Los logs se conservan por 30 días para auditoría
3. El script es seguro para ejecutar en cualquier momento
4. No interrumpe el servicio de la aplicación
## 🔗 Referencias

- [PostgreSQL VACUUM Documentation](https://www.postgresql.org/docs/current/sql-vacuum.html)
- [Next.js Build Output](https://nextjs.org/docs/app/api-reference/next-config-js/distDir)
- [Cron Syntax](https://crontab.guru/)
