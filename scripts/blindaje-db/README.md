# 🛡️ Sistema de Blindaje de Base de Datos

## 📋 Descripción

Este sistema garantiza que la configuración de base de datos y usuarios **NUNCA** se pierda durante deploys o actualizaciones.

## 🎯 Problema que resuelve

**ANTES**: Cada deploy rompía la configuración:
- ❌ Se perdía el `.env.production`
- ❌ Se borraban usuarios
- ❌ Se desconectaba la base de datos
- ❌ Login dejaba de funcionar

**AHORA**: Sistema blindado con:
- ✅ Backups automáticos antes de cada cambio
- ✅ Protección de archivos críticos
- ✅ Restauración automática en caso de fallo
- ✅ Verificaciones de integridad continuas

## 📁 Archivos del sistema

```
scripts/blindaje-db/
├── 01-backup-automatico.sh       # Backup completo de BD y config
├── 02-verificar-integridad.sh    # Verifica que todo esté OK
├── 03-restaurar-config.sh        # Restaura desde backup
├── 04-deploy-seguro.sh           # Deploy protegido
└── README.md                      # Esta documentación
```

## 🚀 Uso

### Deploy seguro (RECOMENDADO)
```bash
bash /opt/inmova-app/scripts/blindaje-db/04-deploy-seguro.sh
```

Este comando:
1. Hace backup automático
2. Verifica integridad
3. Actualiza código (protegiendo archivos críticos)
4. Sincroniza BD (sin destruir datos)
5. Hace build
6. Verifica que todo funcione
7. Inicia la aplicación

### Verificar integridad del sistema
```bash
bash /opt/inmova-app/scripts/blindaje-db/02-verificar-integridad.sh
```

### Hacer backup manual
```bash
bash /opt/inmova-app/scripts/blindaje-db/01-backup-automatico.sh
```

### Restaurar configuración
```bash
bash /opt/inmova-app/scripts/blindaje-db/03-restaurar-config.sh
```

## 📦 Ubicación de Backups

Los backups se guardan en: `/opt/inmova-backups/`

Contienen:
- Base de datos completa (SQL)
- `.env.production`
- Configuración de PM2
- Scripts de inicio
- Lista de usuarios críticos

**Retención**: 
- Backups completos: 30 días
- Después de 7 días se comprimen automáticamente

## 🔒 Archivos protegidos (NUNCA se sobrescriben en deploy)

1. `.env.production` - Variables de entorno
2. `ecosystem.config.js` - Configuración de PM2
3. `create-superadmin.js` - Script de creación de usuarios
4. `start-with-env.sh` - Script de inicio

## ⚙️ Configuración de Cron (Backups automáticos)

```bash
# Backup diario a las 2 AM
0 2 * * * /opt/inmova-app/scripts/blindaje-db/01-backup-automatico.sh >> /var/log/inmova-backup.log 2>&1

# Verificación de integridad cada hora
0 * * * * /opt/inmova-app/scripts/blindaje-db/02-verificar-integridad.sh >> /var/log/inmova-integrity.log 2>&1
```

## 🆘 Recuperación ante desastres

Si algo falla gravemente:

```bash
# 1. Restaurar configuración
bash /opt/inmova-app/scripts/blindaje-db/03-restaurar-config.sh

# 2. Verificar que todo esté bien
bash /opt/inmova-app/scripts/blindaje-db/02-verificar-integridad.sh

# 3. Si hay errores, restaurar BD desde backup más reciente
cd /opt/inmova-backups
LATEST_BACKUP=$(ls -t db_*.sql | head -1)
PGPASSWORD='InmovaSecure2026DB' psql -h localhost -U inmova_user -d inmova_production < $LATEST_BACKUP

# 4. Reiniciar aplicación
pm2 restart inmova-app
```

## ✅ Checklist de seguridad

Antes de cada deploy, verifica:

- [ ] Existe backup reciente (< 24 horas)
- [ ] `.env.production` tiene todas las variables
- [ ] Usuario PostgreSQL puede conectar
- [ ] Usuarios críticos existen en BD
- [ ] PM2 está corriendo

## 🔐 Credenciales por defecto

**Base de datos:**
- Usuario: `inmova_user`
- Password: `InmovaSecure2026DB`
- Base de datos: `inmova_production`

**Aplicación:**
- Email: `superadmin@inmova.app`
- Password: `Admin123!`

## 📞 Soporte

Si encuentras problemas:

1. Revisa logs: `pm2 logs inmova-app --lines 50`
2. Verifica integridad: `bash 02-verificar-integridad.sh`
3. Restaura configuración: `bash 03-restaurar-config.sh`
4. Si persiste, contacta al equipo de desarrollo

## 🔄 Versionado

- **Versión**: 1.0.0
- **Última actualización**: 2 de enero de 2026
- **Autor**: Sistema de Blindaje Automático
