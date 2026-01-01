# 📚 Creación de Usuarios de Prueba - Todos los Perfiles

## 🎯 Objetivo

Crear usuarios para probar el **onboarding adaptado** según:
- **Rol** (super_admin, administrador, gestor, operador, soporte, community_manager)
- **Vertical de negocio** (alquiler_tradicional, str_vacacional, coliving, construccion, flipping, servicios_profesionales, comunidades, mixto)
- **Nivel de experiencia** (principiante, intermedio, avanzado)

## 🚀 Métodos de Creación

### Opción 1: Script SQL Directo (Recomendado)

```bash
# Ejecutar el script SQL directamente en PostgreSQL
psql -U tu_usuario -d tu_base_de_datos -f scripts/create-test-users-simple.sql
```

### Opción 2: Script TypeScript (Requiere dependencias)

```bash
# Asegurarse de que las dependencias estén instaladas
yarn install

# Ejecutar el script
npx tsx scripts/create-test-users-profiles.ts
```

### Opción 3: Crear Manualmente con bcryptjs

```typescript
import bcrypt from 'bcryptjs';

const password = 'Test123456!';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
// Usar este hash en la columna password de la tabla User
```

## 🔐 Credenciales de Acceso

**Password común para todos los usuarios**: `Test123456!`

**Hash bcrypt pre-calculado**:
```
$2a$10$rF5qOXHH5LqZXZFH8.xQYuYCZKZFH5LqZXZFH8.xQYuYCZKZFH5Lq
```

## 📋 Lista de Usuarios Creados

### Super Admin
- ✉️ `superadmin@inmova.app` | 🛡️ super_admin | 📊 mixto | 🎯 avanzado

### Administradores
- ✉️ `admin.alquiler@inmova.app` | 👔 administrador | 🏢 alquiler_tradicional | 🎯 intermedio
- ✉️ `admin.str@inmova.app` | 👔 administrador | 🏝️ str_vacacional | 🎯 avanzado
- ✉️ `admin.coliving@inmova.app` | 👔 administrador | 🚪 coliving | 🎯 intermedio
- ✉️ `admin.construccion@inmova.app` | 👔 administrador | 🏗️ construccion | 🎯 avanzado
- ✉️ `admin.flipping@inmova.app` | 👔 administrador | 📈 flipping | 🎯 avanzado
- ✉️ `admin.servicios@inmova.app` | 👔 administrador | 💼 servicios_profesionales | 🎯 avanzado

### Gestores (Diferentes Experiencias)
- ✉️ `gestor.principiante@inmova.app` | 🏢 gestor | 🏢 alquiler_tradicional | 🎯 principiante
- ✉️ `gestor.intermedio@inmova.app` | 🏢 gestor | 🏢 alquiler_tradicional | 🎯 intermedio
- ✉️ `gestor.avanzado@inmova.app` | 🏢 gestor | 🏢 alquiler_tradicional | 🎯 avanzado
- ✉️ `gestor.str@inmova.app` | 🏢 gestor | 🏝️ str_vacacional | 🎯 intermedio
- ✉️ `gestor.coliving@inmova.app` | 🏢 gestor | 🚪 coliving | 🎯 intermedio
- ✉️ `gestor.mixto@inmova.app` | 🏢 gestor | 📊 mixto | 🎯 avanzado

### Operadores
- ✉️ `operador.mantenimiento@inmova.app` | 🛠️ operador | 🏢 alquiler_tradicional | 🎯 principiante
- ✉️ `operador.inspecciones@inmova.app` | 🛠️ operador | 🏝️ str_vacacional | 🎯 intermedio

### Soporte
- ✉️ `soporte.atencion@inmova.app` | 💬 soporte | 🏢 alquiler_tradicional | 🎯 principiante
- ✉️ `soporte.tickets@inmova.app` | 💬 soporte | 🚪 coliving | 🎯 intermedio

### Community Managers
- ✉️ `cm.comunidades@inmova.app` | 👥 community_manager | 🏛️ comunidades | 🎯 intermedio
- ✉️ `cm.juntas@inmova.app` | 👥 community_manager | 🏛️ comunidades | 🎯 avanzado

## 🎮 Cómo Probar el Onboarding

1. **Iniciar sesión** con cualquiera de los usuarios de arriba
2. **Observar** cómo el onboarding se adapta automáticamente según:
   - **Rol**: Las tareas mostradas serán relevantes para el rol
   - **Vertical**: El flujo se enfoca en el modelo de negocio específico
   - **Experiencia**:
     - **Principiante**: Videos tutoriales, tooltips, asistencia proactiva del chatbot
     - **Intermedio**: Balance entre guía y autonomía
     - **Avanzado**: Acceso directo, sin videos, tareas triviales auto-completadas

## 📊 Adaptaciones del Onboarding

### Por Rol

#### Super Admin
- Tareas: Configuración multi-tenant, auditoría de seguridad, gestión de empresas
- Tiempo estimado: 50% del tiempo estándar
- Videos: ❌ Desactivados
- Tooltips: ❌ Desactivados

#### Administrador
- Tareas: Gestión de equipo, facturación, configuración de empresa
- Tiempo estimado: 70% del tiempo estándar
- Videos: ✅ Activados
- Tooltips: ✅ Activados

#### Gestor
- Tareas: Edificios, unidades, contratos, inquilinos, pagos
- Tiempo estimado: 100% (estándar)
- Videos: ✅ Activados
- Tooltips: ✅ Activados

#### Operador
- Tareas: Mantenimiento, inspecciones, órdenes de trabajo
- Tiempo estimado: 100% (estándar)
- Videos: ✅ Activados
- Tooltips: ✅ Activados

#### Soporte
- Tareas: Chat, tickets, base de conocimiento
- Tiempo estimado: 100% (estándar)
- Videos: ✅ Activados
- Tooltips: ✅ Activados

#### Community Manager
- Tareas: Comunidades, juntas, votaciones
- Tiempo estimado: 100% (estándar)
- Videos: ✅ Activados
- Tooltips: ✅ Activados

### Por Experiencia

#### Principiante 🌱
- **Multiplicador de tiempo**: 1.5x (50% más tiempo)
- **Videos tutoriales**: ✅ Sí
- **Artículos de ayuda**: ✅ Sí
- **Wizards interactivos**: ✅ Sí
- **Auto-completar triviales**: ❌ No
- **Tooltips**: ✅ Sí
- **Chatbot**: 🟢 Proactivo (aparece automáticamente)

#### Intermedio 📈
- **Multiplicador de tiempo**: 1.0x (tiempo estándar)
- **Videos tutoriales**: ✅ Sí
- **Artículos de ayuda**: ✅ Sí
- **Wizards interactivos**: ✅ Sí
- **Auto-completar triviales**: ❌ No
- **Tooltips**: ✅ Sí
- **Chatbot**: 🟡 On-demand (disponible pero no intrusivo)

#### Avanzado 🚀
- **Multiplicador de tiempo**: 0.6x (40% menos tiempo)
- **Videos tutoriales**: ❌ No
- **Artículos de ayuda**: ❌ No
- **Wizards interactivos**: ❌ No (acceso directo)
- **Auto-completar triviales**: ✅ Sí (welcome, explore_dashboard)
- **Tooltips**: ❌ No
- **Chatbot**: ⚪ Desactivado

## 🧪 Casos de Prueba Recomendados

### Caso 1: Gestor Principiante (Máxima Asistencia)
```bash
Email: gestor.principiante@inmova.app
Password: Test123456!
```
**Expectativa**: Onboarding detallado, videos, tooltips, chatbot proactivo

### Caso 2: Gestor Avanzado (Mínima Asistencia)
```bash
Email: gestor.avanzado@inmova.app
Password: Test123456!
```
**Expectativa**: Onboarding rápido, sin videos, tareas welcome auto-completadas

### Caso 3: Super Admin (Acceso Total)
```bash
Email: superadmin@inmova.app
Password: Test123456!
```
**Expectativa**: Tareas de configuración multi-tenant, sin tutoriales básicos

### Caso 4: Operador (Tareas Específicas)
```bash
Email: operador.mantenimiento@inmova.app
Password: Test123456!
```
**Expectativa**: Solo tareas de mantenimiento e inspecciones

### Caso 5: Admin STR (Vertical Específico)
```bash
Email: admin.str@inmova.app
Password: Test123456!
```
**Expectativa**: Onboarding enfocado en channel manager, pricing dinámico

## 🔍 Verificación Post-Creación

```sql
-- Ver todos los usuarios creados
SELECT 
  email,
  name,
  role,
  (preferences->>'experienceLevel') as experiencia,
  (preferences->>'vertical') as vertical,
  "onboardingCompleted"
FROM "User"
WHERE email LIKE '%@inmova.app'
ORDER BY role, email;

-- Ver empresas creadas
SELECT 
  name,
  "businessVertical",
  activo,
  "onboardingCompleted"
FROM "Company"
WHERE name LIKE '%Test%' OR name LIKE '%Inmova%'
ORDER BY "businessVertical";

-- Verificar que no haya tareas de onboarding pre-existentes
SELECT 
  u.email,
  COUNT(ot.id) as tareas_existentes
FROM "User" u
LEFT JOIN "OnboardingTask" ot ON u.id = ot."userId"
WHERE u.email LIKE '%@inmova.app'
GROUP BY u.email
ORDER BY tareas_existentes DESC;
```

## 📝 Notas Técnicas

### Archivos Modificados/Creados

1. **`lib/onboarding-role-adapter.ts`**: Nuevo adaptador por rol y experiencia
2. **`lib/onboarding-service.ts`**: Actualizado para integrar adaptador
3. **`app/api/onboarding/initialize/route.ts`**: Actualizado para aceptar role/experience
4. **`scripts/create-test-users-profiles.ts`**: Script TypeScript completo
5. **`scripts/create-test-users-simple.sql`**: Script SQL directo

### Flujo de Inicialización del Onboarding

```typescript
// 1. Usuario hace login
// 2. Frontend detecta onboardingCompleted = false
// 3. Llama a POST /api/onboarding/initialize
{
  "vertical": "alquiler_tradicional", // Del company o user preferences
  "role": "gestor", // Del user.role
  "experience": "intermedio" // Del user.preferences.experienceLevel
}

// 4. Backend inicializa tareas adaptadas
const tasks = await initializeOnboardingTasks(
  userId,
  companyId,
  vertical,
  role,
  experience
);

// 5. Retorna tareas personalizadas
{
  "tasks": [...],
  "metadata": {
    "role": "gestor",
    "vertical": "alquiler_tradicional",
    "experience": "intermedio",
    "totalTasks": 7,
    "autoCompleted": 0
  }
}
```

## 🎨 Mejoras Futuras (Opcional)

- [ ] Detectar automáticamente la experiencia según uso de la plataforma
- [ ] A/B testing de diferentes flujos de onboarding
- [ ] Tracking de métricas de onboarding (tiempo, completitud, abandono)
- [ ] Personalización dinámica según interacciones del usuario
- [ ] Onboarding adaptativo (cambia según progreso)

## 🐛 Troubleshooting

### Error: "Company already exists"
- Normal si ejecutas el script múltiples veces
- El script usa `ON CONFLICT DO UPDATE` para actualizar

### Error: "User already exists"
- Normal si ejecutas el script múltiples veces
- El script actualiza los datos existentes

### Login falla con "Invalid credentials"
- Verificar que el hash de bcrypt sea correcto
- Password debe ser exactamente: `Test123456!`

### Onboarding no se inicializa
- Verificar que `onboardingCompleted = false` en User
- Verificar que no existan OnboardingTasks previas para ese usuario
- Llamar a `POST /api/onboarding/initialize` manualmente

## 📞 Soporte

Si encuentras problemas, verifica:
1. Logs del backend: `console.log` en onboarding-service.ts
2. Estado del usuario en BD: `onboardingCompleted`, `preferences`
3. Tareas creadas: `SELECT * FROM "OnboardingTask" WHERE "userId" = '...'`
