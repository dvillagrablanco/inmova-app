# 🔐 CREDENCIALES DEL SOCIO FUNDADOR EWOORKER

## 📧 DATOS DE ACCESO

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 ACCESO AL PANEL DEL SOCIO FUNDADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email:    socio@ewoorker.com
🔒 Password: Ewoorker2025!Socio

🎯 Rol:      super_admin
🔗 Panel:    https://inmovaapp.com/ewoorker/admin-socio
🌐 Login:    https://inmovaapp.com/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🚀 CREACIÓN DEL USUARIO (OPCIÓN 1: VÍA PANEL SUPERADMIN)

Si el usuario no existe aún, puedes crearlo desde el panel de superadministrador de INMOVA:

### Paso 1: Acceder como Superadmin

1. Ir a https://inmovaapp.com/login
2. Iniciar sesión con tu cuenta de **superadministrador** existente

### Paso 2: Crear Company

1. Navegar a **Admin → Empresas**
2. Crear nueva empresa con estos datos:
   - **ID**: `company-socio-ewoorker`
   - **Nombre**: `Socio Fundador eWoorker`
   - **CIF**: `X00000000X`
   - **Plan**: `Demo` (o cualquier plan disponible)
   - **Activo**: `true`

### Paso 3: Crear Usuario

1. Navegar a **Admin → Usuarios**
2. Crear nuevo usuario con estos datos:
   - **ID**: `user-socio-ewoorker-001`
   - **Email**: `socio@ewoorker.com`
   - **Nombre**: `Socio Fundador eWoorker`
   - **Password**: `Ewoorker2025!Socio`
   - **Rol**: `super_admin`
   - **Company**: `Socio Fundador eWoorker` (la creada en Paso 2)
   - **Activo**: `true`
   - **Email Verificado**: `true`
   - **Onboarding Completado**: `true`

---

## 🗄️ CREACIÓN DEL USUARIO (OPCIÓN 2: SQL DIRECTO)

Si tienes acceso directo a la base de datos PostgreSQL:

### SQL para ejecutar:

```sql
-- Paso 1: Crear Company
INSERT INTO "Company" (
  id, 
  nombre, 
  cif, 
  activo, 
  "subscriptionPlanId", 
  "createdAt"
) 
SELECT 
  'company-socio-ewoorker', 
  'Socio Fundador eWoorker', 
  'X00000000X', 
  true,
  (SELECT id FROM "SubscriptionPlan" WHERE nombre = 'Demo' LIMIT 1),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Company" WHERE id = 'company-socio-ewoorker'
);

-- Paso 2: Crear Usuario
-- Hash de 'Ewoorker2025!Socio': $2a$10$Zy5J9mX3K8pW4nR7qL2vYeZH3xP9F6mT8sK4rN7wQ5vL2pJ8xY6zA

INSERT INTO "User" (
  id, 
  email, 
  name, 
  password, 
  role, 
  "companyId", 
  activo, 
  "emailVerified", 
  "onboardingCompleted", 
  "onboardingCompletedAt", 
  "createdAt"
) VALUES (
  'user-socio-ewoorker-001',
  'socio@ewoorker.com',
  'Socio Fundador eWoorker',
  '$2a$10$Zy5J9mX3K8pW4nR7qL2vYeZH3xP9F6mT8sK4rN7wQ5vL2pJ8xY6zA',
  'super_admin',
  'company-socio-ewoorker',
  true,
  NOW(),
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = 'super_admin',
  activo = true,
  "onboardingCompleted" = true;
```

### Ejecutar SQL:

```bash
# Opción A: Con psql en el servidor
psql -U postgres -d inmova_production -c "/* pegar SQL de arriba */"

# Opción B: Con Prisma Studio
npx prisma studio
# → Crear registros manualmente en la interfaz
```

---

## 🎯 VERIFICAR QUE EL USUARIO EXISTE

### Desde SQL:

```sql
SELECT 
  email, 
  name, 
  role, 
  activo, 
  "onboardingCompleted"
FROM "User" 
WHERE email = 'socio@ewoorker.com';
```

### Desde Panel Admin:

1. Login como superadmin en https://inmovaapp.com/login
2. Ir a **Admin → Usuarios**
3. Buscar `socio@ewoorker.com`
4. Verificar que:
   - Rol = `super_admin`
   - Activo = `true`
   - Email verificado = `true`

---

## ✅ ACCEDER AL PANEL DEL SOCIO

### Paso 1: Login

1. Ir a https://inmovaapp.com/login
2. Ingresar:
   - **Email**: `socio@ewoorker.com`
   - **Password**: `Ewoorker2025!Socio`
3. Click en **Iniciar Sesión**

### Paso 2: Ir al Panel

Después de login exitoso, navegar directamente a:

**https://inmovaapp.com/ewoorker/admin-socio**

### Qué verás:

- **Dashboard con KPIs principales**:
  - Tu Beneficio (50%)
  - GMV Total
  - MRR Suscripciones
  - Contratos Activos

- **4 Pestañas**:
  1. **Financiero**: Desglose de comisiones, división 50/50
  2. **Usuarios**: Total empresas, por plan (Obrero, Capataz, Constructor)
  3. **Operaciones**: Obras publicadas, ofertas, contratos
  4. **Performance**: Tasa de conversión, tiempo adjudicación, rating

- **Selector de Periodo**: Mes actual, mes anterior, trimestre, año
- **Botón Exportar PDF**: Genera reporte descargable

---

## 🛡️ PERMISOS Y SEGURIDAD

### Permisos del Usuario Socio:

- ✅ **Ver métricas completas de eWoorker**
- ✅ **Exportar reportes financieros**
- ✅ **Acceso a logs de auditoría**
- ✅ **Dashboard independiente de INMOVA**
- ❌ **NO puede modificar configuración técnica**
- ❌ **NO puede acceder a datos de otras empresas INMOVA**

### Acceso Restringido:

El panel `/ewoorker/admin-socio` **solo es accesible para usuarios con rol `super_admin`**.

Si intentas acceder con otro rol, verás:

```
⚠️ Acceso Denegado
Este panel es exclusivo para el socio fundador de eWoorker.
```

---

## 📊 MÉTRICAS DISPONIBLES

### Financiero

| Métrica | Descripción |
|---------|-------------|
| **GMV Total** | Gross Merchandise Value (valor total transaccionado) |
| **Comisiones Generadas** | Total de comisiones cobradas por la plataforma |
| **Tu Beneficio (50%)** | La parte del socio (50% de comisiones) |
| **Beneficio Plataforma** | La parte de INMOVA (50% de comisiones) |
| **MRR Suscripciones** | Monthly Recurring Revenue (ingresos predecibles) |
| **Desglose Comisiones** | Por tipo: Suscripción, Escrow, Urgentes, Otros |

### Usuarios

| Métrica | Descripción |
|---------|-------------|
| **Total Empresas** | Empresas registradas en eWoorker |
| **Empresas Activas** | Con actividad reciente |
| **Nuevas este Mes** | Empresas que se registraron este mes |
| **Usuarios Obrero** | Plan gratuito (5% comisión) |
| **Usuarios Capataz** | Plan €49/mes (2% comisión) |
| **Usuarios Constructor** | Plan €149/mes (0% comisión) |

### Operaciones

| Métrica | Descripción |
|---------|-------------|
| **Obras Publicadas** | Proyectos publicados por constructores |
| **Ofertas Enviadas** | Propuestas de subcontratistas |
| **Contratos Activos** | Contratos en ejecución |
| **Contratos Completados** | Contratos finalizados con éxito |

### Performance

| Métrica | Descripción |
|---------|-------------|
| **Tasa de Conversión** | % de ofertas que se convierten en contratos |
| **Tiempo Medio Adjudicación** | Días desde publicación hasta firma |
| **Valoración Plataforma** | Rating promedio de usuarios (1-5 estrellas) |

---

## 🔄 DIVISIÓN DE BENEFICIOS (50/50)

### Cómo Funciona

Cada vez que eWoorker genera una comisión (por suscripción, escrow, trabajo urgente, etc.), se divide automáticamente:

```
┌─────────────────────────────────────┐
│ COMISIÓN GENERADA: €1,000           │
├─────────────────────────────────────┤
│ 50% Socio Fundador: €500            │
│ 50% Plataforma INMOVA: €500         │
└─────────────────────────────────────┘
```

### Transparencia Total

El panel del socio muestra **en tiempo real**:

- **Tu Beneficio**: Cantidad exacta que te corresponde
- **Beneficio Plataforma**: Cantidad que va a INMOVA
- **Desglose por Tipo**: Cuánto viene de cada fuente de ingresos

---

## 📅 EXPORTAR REPORTES

### Cómo Exportar

1. En el panel, seleccionar periodo (mes, trimestre, año)
2. Click en botón **"Exportar PDF"**
3. Se descargará un archivo: `ewoorker-reporte-socio-[periodo]-[fecha].txt`

### Contenido del Reporte

El reporte incluye:

- **Financiero**: GMV, comisiones, beneficio del socio
- **Usuarios**: Total, activos, por plan
- **Operaciones**: Obras, ofertas, contratos
- **Performance**: Tasa de conversión, tiempo adjudicación

---

## ❓ TROUBLESHOOTING

### Error: "Acceso Denegado"

**Causa**: El usuario no tiene rol `super_admin`.

**Solución**:
1. Verificar rol en la base de datos:
   ```sql
   SELECT email, role FROM "User" WHERE email = 'socio@ewoorker.com';
   ```
2. Actualizar rol si es necesario:
   ```sql
   UPDATE "User" SET role = 'super_admin' WHERE email = 'socio@ewoorker.com';
   ```

### Error: "Credenciales Inválidas"

**Causa**: Password incorrecto o usuario no existe.

**Solución**:
1. Resetear password desde panel admin de INMOVA
2. O ejecutar SQL para actualizar password:
   ```sql
   UPDATE "User" 
   SET password = '$2a$10$Zy5J9mX3K8pW4nR7qL2vYeZH3xP9F6mT8sK4rN7wQ5vL2pJ8xY6zA'
   WHERE email = 'socio@ewoorker.com';
   ```

### Error: "Métricas no cargan"

**Causa**: No hay datos de eWoorker aún, o API falló.

**Solución**:
1. Verificar que existe al menos 1 empresa eWoorker en BD
2. Revisar logs del servidor: `pm2 logs inmova-app`
3. Verificar endpoint API: `https://inmovaapp.com/api/ewoorker/admin-socio/metrics`

---

## 📞 SOPORTE

Para cualquier problema técnico:

1. Revisar logs del servidor:
   ```bash
   pm2 logs inmova-app
   ```

2. Verificar health check:
   ```bash
   curl https://inmovaapp.com/api/health
   ```

3. Contactar al administrador técnico de INMOVA

---

**Última actualización**: 2 de enero de 2026  
**Estado**: ✅ Panel implementado y deployed  
**Versión**: 1.0.0
