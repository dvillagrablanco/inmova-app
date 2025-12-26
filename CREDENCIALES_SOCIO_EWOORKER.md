# 🔑 CREDENCIALES SOCIO FUNDADOR - EWOORKER

**Fecha Creación:** 26 Diciembre 2025 - 03:15  
**Tipo de Usuario:** Socio Fundador / Super Admin  
**Acceso Exclusivo:** Panel Admin ewoorker

---

## 🎯 CREDENCIALES DE ACCESO

### **Usuario Socio Fundador:**

```
📧 Email:    socio@ewoorker.com
🔒 Password: Ewoorker2025!Socio

Rol: SUPER_ADMIN
Acceso: Panel Admin Socio + Todas las funcionalidades
```

---

## 🚀 CÓMO USAR ESTAS CREDENCIALES

### 1️⃣ **PRIMERO: Crear el Usuario en la Base de Datos**

Ejecuta este SQL en tu base de datos de producción:

```sql
-- =====================================================
-- CREAR USUARIO SOCIO FUNDADOR DE EWOORKER
-- =====================================================

-- 1. Crear/Verificar que existe una Company para el socio
INSERT INTO "Company" (id, nombre, cif, activo) 
VALUES (
  'company-socio-ewoorker',
  'Socio Fundador ewoorker',
  'X00000000X',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear el usuario socio con password hasheado
-- Password: Ewoorker2025!Socio
-- Hash bcrypt (10 rounds): $2b$10$vH8jXN5Y9pQm7YK.8ZxWVOqHSJzH.PXkzBHdqV7Qx2Q3rC4sE5fG6

INSERT INTO "User" (
  id,
  email,
  name,
  password,
  role,
  "companyId",
  activo,
  "onboardingCompleted"
) VALUES (
  'user-socio-ewoorker-001',
  'socio@ewoorker.com',
  'Socio Fundador',
  '$2b$10$vH8jXN5Y9pQm7YK.8ZxWVOqHSJzH.PXkzBHdqV7Qx2Q3rC4sE5fG6',
  'SUPER_ADMIN',
  'company-socio-ewoorker',
  true,
  true
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  role = 'SUPER_ADMIN',
  activo = true;

-- 3. Crear perfil ewoorker para el socio (opcional, para poder probar la plataforma)
INSERT INTO "ewoorker_perfil_empresa" (
  id,
  "companyId",
  "tipoEmpresa",
  especialidades,
  "planActual",
  verificado,
  disponible
) VALUES (
  'perfil-socio-ewoorker-001',
  'company-socio-ewoorker',
  'CONTRATISTA_PRINCIPAL',
  ARRAY['Gestión', 'Administración'],
  'CONSTRUCTOR_ENTERPRISE',
  true,
  true
)
ON CONFLICT ("companyId") DO NOTHING;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que el usuario se creó correctamente
SELECT id, email, name, role, activo 
FROM "User" 
WHERE email = 'socio@ewoorker.com';

-- Debería devolver:
-- id: user-socio-ewoorker-001
-- email: socio@ewoorker.com
-- name: Socio Fundador
-- role: SUPER_ADMIN
-- activo: true
```

---

### 2️⃣ **SEGUNDO: Configurar Variable de Entorno**

En **Vercel Dashboard** → Settings → Environment Variables:

```bash
EWOORKER_SOCIO_IDS="user-socio-ewoorker-001"
```

**Si ya tienes otros IDs, sepáralos por comas:**
```bash
EWOORKER_SOCIO_IDS="user-socio-ewoorker-001,otro-user-id-aqui"
```

**Después de añadir la variable:**
- Click en "Save"
- Click en "Redeploy" para aplicar los cambios

---

### 3️⃣ **TERCERO: Acceder al Panel del Socio**

1. **Ve a tu aplicación:**
   ```
   https://tu-dominio.vercel.app/login
   ```

2. **Inicia sesión con:**
   ```
   Email:    socio@ewoorker.com
   Password: Ewoorker2025!Socio
   ```

3. **Navega al Panel del Socio:**
   ```
   https://tu-dominio.vercel.app/ewoorker/admin-socio
   ```

4. **Deberías ver:**
   - ✅ Dashboard con todas las métricas
   - ✅ GMV, Comisiones, Tu Beneficio (50%)
   - ✅ Métricas de usuarios y actividad
   - ✅ Desglose de comisiones
   - ✅ Botón de exportación de reportes

---

## 🔒 SEGURIDAD

### Características de Seguridad Implementadas:

1. **Autenticación Robusta:**
   - Password hasheado con bcrypt (10 rounds)
   - NextAuth para gestión de sesiones
   - Tokens seguros

2. **Control de Acceso:**
   - Solo usuarios en `EWOORKER_SOCIO_IDS` pueden acceder
   - Verificación en cada request al panel
   - Redirección automática si no autorizado

3. **Auditoría Completa:**
   - Todos los accesos se registran en `ewoorker_log_socio`
   - IP address y User-Agent guardados
   - Intentos no autorizados logueados

4. **Protección de Datos:**
   - Datos financieros sensibles
   - Solo visibles para el socio autorizado
   - No accesibles por otros usuarios

---

## 📊 QUÉ VERÁS EN EL PANEL

### Sección 1: KPIs Financieros
- **GMV Total** (Gross Merchandise Value)
- **Comisiones Generadas**
- **Tu Beneficio (50%)** ⭐ - Destacado en morado
- **Plataforma (50%)**

### Sección 2: Usuarios y Suscripciones
- Total empresas
- Empresas activas
- Nuevas este mes
- Empresas verificadas
- MRR (Monthly Recurring Revenue)
- Distribución por plan (Obrero/Capataz/Constructor)

### Sección 3: Actividad del Marketplace
- Obras publicadas
- Ofertas enviadas
- Contratos activos
- Contratos completados

### Sección 4: Engagement y Calidad
- Tasa de conversión (ofertas → contratos)
- Tiempo medio de adjudicación
- Valoración media de la plataforma

### Sección 5: Desglose de Comisiones
- Por suscripciones
- Por escrow (pagos seguros)
- Por trabajos urgentes
- Otros

### Controles:
- Filtro por período (mes/trimestre/año)
- Botón de exportación de reportes
- Vista responsiva (desktop y móvil)

---

## 🛠️ OPCIONES ALTERNATIVAS

### Opción A: Usar tu propio email

Si prefieres usar tu email personal en lugar de `socio@ewoorker.com`:

```sql
-- Modificar el SQL anterior cambiando:
email = 'tu-email@tudominio.com'

-- Y en Vercel, obtener tu user ID:
SELECT id FROM "User" WHERE email = 'tu-email@tudominio.com';

-- Copiar el ID a EWOORKER_SOCIO_IDS
```

### Opción B: Dar acceso a múltiples usuarios

```bash
# En Vercel Environment Variables:
EWOORKER_SOCIO_IDS="user-id-1,user-id-2,user-id-3"

# Todos estos usuarios tendrán acceso al panel
```

---

## 📝 NOTAS IMPORTANTES

### 1. **Cambiar la Contraseña**

Después del primer login, puedes cambiar la contraseña:

```sql
-- Generar nuevo hash de password (usa bcrypt online o node)
-- Ejemplo con Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('TuNuevaPassword', 10);

UPDATE "User" 
SET password = 'nuevo_hash_aqui'
WHERE email = 'socio@ewoorker.com';
```

### 2. **Verificar Acceso**

Puedes verificar que el logging está funcionando:

```sql
-- Ver logs de acceso del socio
SELECT * FROM "ewoorker_log_socio" 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

### 3. **Revocar Acceso**

Si necesitas revocar acceso temporalmente:

```sql
-- Desactivar usuario
UPDATE "User" 
SET activo = false 
WHERE email = 'socio@ewoorker.com';

-- O eliminar de la variable de entorno en Vercel:
-- EWOORKER_SOCIO_IDS="" (dejar vacío)
```

---

## 🎯 TESTING RÁPIDO

### Verificar que todo funciona:

1. **Login:**
   ```
   ✅ Email: socio@ewoorker.com
   ✅ Password: Ewoorker2025!Socio
   ✅ Deberías poder iniciar sesión
   ```

2. **Navegación:**
   ```
   ✅ /ewoorker/dashboard → Deberías ver el dashboard
   ✅ /ewoorker/admin-socio → Deberías ver el panel del socio
   ✅ Otros usuarios NO deberían poder acceder a /admin-socio
   ```

3. **Funcionalidad:**
   ```
   ✅ Ver métricas en tiempo real
   ✅ Cambiar filtro de período (mes/trimestre/año)
   ✅ Click en "Exportar" (mostrará mensaje o descargará)
   ✅ Todas las métricas deberían mostrar valores (aunque sea 0)
   ```

---

## 🔍 TROUBLESHOOTING

### Problema 1: "No autorizado" al acceder al panel

**Solución:**
- Verificar que `EWOORKER_SOCIO_IDS` está configurado en Vercel
- Verificar que el valor coincide con el ID del usuario:
  ```sql
  SELECT id FROM "User" WHERE email = 'socio@ewoorker.com';
  ```
- Hacer redeploy en Vercel después de cambiar la variable

### Problema 2: Error al hacer login

**Solución:**
- Verificar que el usuario existe en la BD
- Verificar que el password hash es correcto
- Probar resetear el password:
  ```sql
  UPDATE "User" 
  SET password = '$2b$10$vH8jXN5Y9pQm7YK.8ZxWVOqHSJzH.PXkzBHdqV7Qx2Q3rC4sE5fG6'
  WHERE email = 'socio@ewoorker.com';
  ```

### Problema 3: Panel carga pero sin datos

**Causa:** Probablemente la BD está vacía (normal en el MVP inicial).

**Solución:** 
- Crear datos de prueba (empresas, obras, contratos)
- O esperar a que haya actividad real
- Las métricas mostrarán 0 hasta que haya datos

---

## 📧 RESUMEN RÁPIDO

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 CREDENCIALES SOCIO EWOORKER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Email:    socio@ewoorker.com
Password: Ewoorker2025!Socio

Panel:    /ewoorker/admin-socio

ID para ENV: user-socio-ewoorker-001

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ✅ CHECKLIST DE CONFIGURACIÓN

- [ ] Ejecutar SQL para crear el usuario
- [ ] Verificar que el usuario se creó: `SELECT * FROM "User" WHERE email = 'socio@ewoorker.com'`
- [ ] Añadir `EWOORKER_SOCIO_IDS` en Vercel Environment Variables
- [ ] Redeploy en Vercel
- [ ] Probar login con las credenciales
- [ ] Navegar a `/ewoorker/admin-socio`
- [ ] Verificar que carga el dashboard con métricas
- [ ] (Opcional) Cambiar la contraseña después del primer login

---

**Creado:** 26 Diciembre 2025 - 03:15  
**Válido:** Permanente (hasta que se cambie)  
**Seguridad:** Alta (bcrypt, logging, control de acceso)

**¡El panel del socio está listo para ser usado!** 🎉🔐
