# 👤 Perfil Creado: Socio eWorker

## ✅ Usuario Creado

He agregado un perfil específico para tu socio de eWorker al script SQL.

### 📋 Datos del Usuario

| Campo | Valor |
|-------|-------|
| **Email** | `socio@eworker.es` |
| **Password** | `Test123456!` (mismo que todos los de prueba) |
| **Nombre** | Socio eWorker |
| **Rol** | `administrador` |
| **Empresa** | eWorker Coworking & Coliving |
| **Vertical** | `coliving` |
| **Experiencia** | `avanzado` |
| **Estado** | Activo ✅ |

### 🎯 Características del Perfil

#### Rol: Administrador
Como **socio**, tiene acceso completo a:
- ✅ Gestión de equipo
- ✅ Configuración de empresa
- ✅ Facturación y pagos
- ✅ Reportes financieros
- ✅ Integraciones
- ✅ Todos los módulos de la plataforma

#### Vertical: Coliving
El onboarding se enfocará en:
- 🏠 Creación de espacios compartidos (coworking/coliving)
- 🚪 Gestión de habitaciones/escritorios
- 🧠 Prorrateo automático de gastos comunes
- 📋 Normas de convivencia
- 👥 Gestión de residentes/coworkers
- 📊 Ocupación y disponibilidad en tiempo real

#### Experiencia: Avanzada
Al ser **avanzado**, el onboarding será:
- ⚡ **Rápido**: Tiempo estimado 40% menor (1.2 min en lugar de 2 min)
- 🎥 **Sin videos**: Acceso directo sin tutoriales
- 💡 **Sin tooltips**: Interfaz limpia
- 🤖 **Chatbot desactivado**: No aparece automáticamente
- ✅ **Auto-completado**: Tareas triviales ya completadas (welcome, explore_dashboard)
- 🔓 **Acceso directo**: Sin wizards, formularios directos

### 🏢 Empresa: eWorker Coworking & Coliving

Se ha creado una empresa específica:
- **Nombre**: eWorker Coworking & Coliving
- **ID**: `company_eworker`
- **Vertical**: coliving
- **Estado**: Activa
- **Onboarding**: Pendiente (se completará al login)

## 🚀 Cómo Usar

### 1. Ejecutar el Script SQL Actualizado

```bash
# Opción 1: Desde terminal
psql -U tu_usuario -d tu_database -f scripts/create-test-users-simple.sql

# Opción 2: Desde tu cliente SQL
# Copia y pega el contenido actualizado de scripts/create-test-users-simple.sql
```

### 2. Login del Socio

```
URL: https://inmovaapp.com/login
Email: socio@eworker.es
Password: Test123456!
```

### 3. Onboarding Personalizado

Al hacer login, verá un onboarding adaptado para:
- **Coliving/Coworking**: Gestión de espacios compartidos
- **Experiencia avanzada**: Proceso rápido y directo
- **Rol administrador**: Acceso completo

## 📋 Tareas de Onboarding que Verá

### Flujo Coliving para Administrador Avanzado

1. ✅ **Bienvenido a INMOVA** (auto-completado)
   - Tiempo: 0s (saltado por ser avanzado)

2. 📝 **Crear vivienda compartida**
   - Tiempo estimado: ~1 min (reducido de 2 min)
   - Sin wizard: Acceso directo al formulario
   - Define espacios: Habitaciones, escritorios, zonas comunes

3. 🚪 **Definir habitaciones/espacios**
   - Tiempo estimado: ~50s (reducido de 1.5 min)
   - Características de cada habitación
   - Precios individuales

4. 🧠 **Configurar prorrateo de gastos**
   - Tiempo estimado: ~1.5 min (reducido de 3 min)
   - Distribución de gastos comunes
   - Sin video tutorial (avanzado)

5. 📋 **Normas de convivencia** (opcional)
   - Tiempo estimado: ~40s
   - Puede saltarlo si quiere

6. ✅ **Dashboard listo** (auto-completado)
   - Acceso inmediato a todas las funcionalidades

**Tiempo total estimado**: ~4 minutos (vs 7 minutos para principiante)

## 🎨 Personalización Adicional (Opcional)

Si necesitas cambiar algún dato del perfil, puedes modificar directamente en el script SQL:

### Cambiar Email
```sql
-- Buscar esta línea y cambiar el email
('user_socio_eworker', 'tu-email@eworker.es', ...
```

### Cambiar Nivel de Experiencia
```sql
-- Cambiar de "avanzado" a "intermedio" o "principiante"
'{"experienceLevel": "intermedio", ...
```

### Cambiar Rol
```sql
-- Cambiar de "administrador" a "gestor" o "super_admin"
..., 'gestor', 'company_eworker', ...
```

## 📊 Diferencias según Experiencia

### Si fuera Principiante (no recomendado para socio)
- Tiempo: ~11 minutos (2x más lento)
- Videos tutoriales en cada paso
- Chatbot proactivo
- Tooltips explicativos
- Wizards paso a paso

### Como Intermedio (balance)
- Tiempo: ~7 minutos (estándar)
- Videos disponibles
- Chatbot on-demand
- Tooltips activados
- Wizards opcionales

### Como Avanzado (actual) ✅
- Tiempo: ~4 minutos (rápido)
- Sin videos
- Sin chatbot
- Sin tooltips
- Acceso directo

## 🔐 Seguridad

### Password Temporal
El password `Test123456!` es **solo para pruebas**. 

**Recomendación**: Al primer login, cambiar inmediatamente a un password seguro:
1. Login con `Test123456!`
2. Ir a Configuración → Seguridad
3. Cambiar password
4. Activar 2FA (opcional pero recomendado)

### Permisos de Administrador
Con rol `administrador`, el socio puede:
- ✅ Crear/editar/eliminar espacios
- ✅ Gestionar residentes/coworkers
- ✅ Configurar facturación
- ✅ Ver reportes financieros
- ✅ Invitar otros usuarios
- ✅ Configurar integraciones
- ❌ No puede: Gestionar otras empresas (solo super_admin)

## 📞 Siguientes Pasos

1. **Ejecutar script SQL** para crear el usuario
2. **Compartir credenciales** con tu socio:
   - Email: `socio@eworker.es`
   - Password: `Test123456!`
   - URL: Tu dominio de INMOVA
3. **Primer login**: El socio completará onboarding en ~4 minutos
4. **Configuración inicial**:
   - Cambiar password
   - Completar perfil
   - Crear primer espacio/habitación
   - Invitar al equipo

## 🎯 Extras para eWorker

### Módulos Recomendados para Coworking/Coliving
- 📅 **Calendario de reservas**: Gestionar escritorios/salas
- 💳 **Pagos recurrentes**: Membresías mensuales
- 📊 **Dashboard de ocupación**: Visualizar disponibilidad
- 👥 **Portal de residentes**: Self-service para inquilinos
- 🔔 **Notificaciones**: Eventos, avisos, vencimientos
- 📱 **App móvil**: Gestión desde cualquier lugar

### Integraciones Útiles
- 💰 Stripe: Pagos automáticos
- 📧 SendGrid: Emails transaccionales
- 📱 WhatsApp Business: Comunicación
- 📊 Google Analytics: Métricas de uso
- 🔐 2FA: Autenticación de dos factores

## ✅ Checklist de Validación

Después de ejecutar el script, verifica:

```sql
-- Verificar que el usuario se creó
SELECT email, name, role, activo 
FROM "User" 
WHERE email = 'socio@eworker.es';

-- Verificar que la empresa se creó
SELECT name, "businessVertical", activo 
FROM "Company" 
WHERE id = 'company_eworker';

-- Verificar preferencias
SELECT 
  email,
  (preferences->>'experienceLevel') as experiencia,
  (preferences->>'vertical') as vertical
FROM "User"
WHERE email = 'socio@eworker.es';
```

## 📋 Resumen

| ✅ Completado |
|---------------|
| Usuario creado: `socio@eworker.es` |
| Empresa creada: eWorker Coworking & Coliving |
| Rol: Administrador (acceso completo) |
| Vertical: Coliving (enfocado en espacios compartidos) |
| Experiencia: Avanzado (onboarding rápido) |
| Password: Test123456! (temporal) |
| Estado: Listo para usar |

---

**Próximo paso**: Ejecutar el script SQL actualizado y compartir credenciales con tu socio.
