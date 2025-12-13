# Documentación de Base de Datos - INMOVA

## 📋 Índice

1. [Información General](#información-general)
2. [Migraciones](#migraciones)
3. [Backups](#backups)
4. [Optimización](#optimización)
5. [Integridad de Datos](#integridad-de-datos)
6. [Configuración del Pool de Conexiones](#configuración-del-pool-de-conexiones)
7. [Comandos Útiles](#comandos-útiles)

---

## 📊 Información General

### Base de Datos
- **Motor**: PostgreSQL
- **Versión**: Compatible con PostgreSQL 12+
- **ORM**: Prisma
- **Entorno**: Producción compartida (dev + prod usan la misma BD)

### ⚠️ ADVERTENCIAS IMPORTANTES

1. **Base de datos compartida**: Los entornos de desarrollo y producción comparten la misma base de datos.
2. **Cuidado con los datos**: NUNCA elimines, sobrescribas o modifiques registros a menos que sea esencial o lo solicite el cliente.
3. **Migraciones**: Todas las migraciones de esquema deben ser compatibles con el esquema existente para evitar pérdida de datos.

---

## 🔄 Migraciones

### Estado Actual

Todas las migraciones están aplicadas y el esquema está actualizado.

```bash
# Verificar estado de migraciones
yarn prisma migrate status
```

### Crear Nueva Migración

```bash
# 1. Modificar schema.prisma
# 2. Crear migración
yarn prisma migrate dev --name nombre_descriptivo

# 3. Aplicar en producción
yarn prisma migrate deploy
```

### Migraciones Existentes

1. `20251207165616_init` - Migración inicial del esquema
2. `20241208_add_setup_progress_field` - Añade campo de progreso de setup
3. `20241208_add_performance_indexes` - Optimización de índices

---

## 💾 Backups

### Sistema de Backup Automático

Se ha implementado un sistema de backups automáticos con los siguientes scripts:

#### Realizar Backup Manual

```bash
yarn tsx scripts/db-backup.ts
```

Características:
- Crea un archivo SQL con timestamp
- Almacena en el directorio `backups/`
- Mantiene automáticamente los últimos 30 backups
- Muestra tamaño del backup generado

#### Restaurar desde Backup

```bash
yarn tsx scripts/db-restore.ts backups/backup-YYYY-MM-DDTHH-mm-ss.sql
```

⚠️ **ADVERTENCIA**: La restauración sobrescribirá TODOS los datos actuales.

#### Configurar Backup Automático (Cron)

Para backups diarios a las 3:00 AM:

```bash
# Editar crontab
crontab -e

# Añadir esta línea
0 3 * * * cd /ruta/a/proyecto/nextjs_space && yarn tsx scripts/db-backup.ts >> /var/log/db-backup.log 2>&1
```

#### Política de Retención

- **Backups diarios**: Se mantienen 30 días
- **Ubicación**: `backups/` en la raíz del proyecto
- **Formato**: SQL plano comprimible

---

## ⚡ Optimización

### Índices Implementados

Los índices están optimizados para las consultas más frecuentes:

#### Tabla `users`
```sql
@@index([email])
@@index([companyId])
@@index([role, companyId])
@@index([activo])
@@index([createdAt])
```

#### Tabla `buildings`
```sql
@@index([companyId])
@@index([tipo, companyId])
@@index([companyId, createdAt])
@@index([companyId, tipo, anoConstructor])
```

#### Tabla `units`
```sql
@@index([buildingId, estado])
@@index([estado])
@@index([tenantId])
@@index([tipo, estado])
@@index([buildingId, tipo, estado])
@@index([rentaMensual, estado])
```

#### Tabla `contracts`
```sql
@@index([tenantId, estado])
@@index([unitId, estado])
@@index([estado])
@@index([fechaInicio, fechaFin])
@@index([tenantId, fechaInicio])
@@index([estado, fechaFin])
@@index([unitId, fechaInicio, fechaFin])
```

#### Tabla `payments`
```sql
@@index([contractId, estado])
@@index([estado])
@@index([fechaVencimiento])
@@index([fechaPago])
@@index([contractId, fechaVencimiento])
@@index([estado, fechaVencimiento])
@@index([nivelRiesgo, estado])
```

#### Tabla `tenants`
```sql
@@index([companyId])
@@index([email])
@@index([dni])
@@index([companyId, scoring])
@@index([companyId, createdAt])
```

#### Tabla `notifications`
```sql
@@index([userId])
@@index([leida])
@@index([userId, leida])
@@index([companyId, leida])
@@index([companyId, createdAt])
@@index([tipo])
@@index([createdAt])
```

### Consultas Optimizadas

Gracias a los índices, las siguientes consultas son muy eficientes:

1. **Búsqueda de usuarios por email y compañía**
2. **Filtrado de edificios por tipo y año**
3. **Búsqueda de unidades disponibles por edificio**
4. **Historial de contratos por inquilino**
5. **Pagos pendientes ordenados por fecha**
6. **Análisis de riesgo de morosidad**
7. **Contratos próximos a vencer**

---

## 🔐 Integridad de Datos

### Foreign Keys

Todas las relaciones tienen Foreign Keys con políticas adecuadas:

- **CASCADE**: Se propaga la eliminación (ej: eliminar usuario elimina sus notificaciones)
- **SET NULL**: Se establece a NULL (ej: eliminar proveedor mantiene el mantenimiento)
- **RESTRICT** (por defecto): Previene eliminación si hay registros relacionados

### Constraints a Nivel de BD

#### Unique Constraints
```prisma
// Usuarios
@@unique([email])

// Inquilinos
@@unique([dni])
@@unique([email])

// Unidades
@@unique([buildingId, numero])
```

#### Required Fields
Todos los campos obligatorios están definidos en el schema sin el modificador `?`.

#### Enum Validations
Se usan ENUMs de PostgreSQL para campos con valores limitados:
- UserRole
- BuildingType
- UnitStatus
- ContractStatus
- PaymentStatus
- etc.

---

## 🔌 Configuración del Pool de Conexiones

### Configuración Actual

Prisma gestiona automáticamente el pool de conexiones con valores predeterminados seguros.

### Configuración Recomendada

Para entornos de producción con alto tráfico, añade a tu `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

Parámetros:
- `connection_limit`: Máximo de conexiones (default: depende del entorno)
- `pool_timeout`: Timeout en segundos para obtener conexión (default: 10)

### Monitoreo de Conexiones

```typescript
// En tu aplicación
import { prisma } from '@/lib/prisma';

// Ver métricas de conexión
const metrics = await prisma.$metrics.json();
console.log(metrics);
```

### Límites del Servidor

PostgreSQL por defecto permite:
- **Conexiones máximas**: 100 (puede variar según el plan)
- **Recomendación**: Usar máximo 10-20 conexiones por instancia de la aplicación

---

## 🛠️ Comandos Útiles

### Prisma

```bash
# Ver estado de migraciones
yarn prisma migrate status

# Generar cliente Prisma
yarn prisma generate

# Aplicar migraciones pendientes
yarn prisma migrate deploy

# Abrir Prisma Studio (GUI)
yarn prisma studio

# Validar schema
yarn prisma validate

# Formatear schema
yarn prisma format
```

### Base de Datos

```bash
# Ejecutar seed
yarn prisma db seed

# Push schema sin crear migración (solo desarrollo)
yarn prisma db push

# Ver SQL de migración sin aplicar
yarn prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma
```

### Backups

```bash
# Backup manual
yarn tsx scripts/db-backup.ts

# Restaurar backup
yarn tsx scripts/db-restore.ts backups/backup-YYYY-MM-DDTHH-mm-ss.sql

# Ver backups disponibles
ls -lh backups/
```

---

## 📚 Referencias

- [Documentación de Prisma](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Connection Pool](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-pool)
- [Database Indexing Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)

---

## 🔧 Troubleshooting

### Problema: Migraciones pendientes
```bash
yarn prisma migrate deploy
```

### Problema: Cliente Prisma desactualizado
```bash
yarn prisma generate
```

### Problema: Demasiadas conexiones
```bash
# Reducir connection_limit en DATABASE_URL
# Verificar que se cierran correctamente las conexiones
```

### Problema: Consultas lentas
```bash
# Analizar con EXPLAIN
# Verificar índices en schema.prisma
# Considerar añadir índices adicionales
```

---

## 📞 Soporte

Para problemas relacionados con la base de datos:

1. Verificar logs de la aplicación
2. Revisar estado de migraciones
3. Verificar conexión a base de datos
4. Consultar esta documentación
5. Contactar al equipo de desarrollo

---

**Última actualización**: Diciembre 2024
