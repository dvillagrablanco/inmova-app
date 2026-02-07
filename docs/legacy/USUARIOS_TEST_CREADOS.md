# ✅ USUARIOS DE PRUEBA - LISTOS PARA CREAR

## 🎯 Estado Actual

He preparado todo lo necesario para crear usuarios de prueba para **todos los perfiles de onboarding**:

✅ Sistema de adaptación por rol creado (`lib/onboarding-role-adapter.ts`)  
✅ Sistema de onboarding actualizado (`lib/onboarding-service.ts`)  
✅ API actualizada para aceptar role/experience (`app/api/onboarding/initialize/route.ts`)  
✅ Script SQL listo con hash bcrypt válido (`scripts/create-test-users-simple.sql`)  
✅ Documentación completa (`scripts/create-users-readme.md`)

## 🚀 SIGUIENTE PASO: Ejecutar el Script SQL

### Opción 1: Desde tu Cliente de Base de Datos (Recomendado)

1. **Abre tu cliente de PostgreSQL** (DBeaver, pgAdmin, TablePlus, etc.)
2. **Conecta a tu base de datos** de desarrollo/staging
3. **Copia y pega** el contenido de `scripts/create-test-users-simple.sql`
4. **Ejecuta el script**
5. **Verifica** que los usuarios se crearon correctamente

### Opción 2: Desde Terminal con psql

```bash
# Si tienes acceso a la base de datos localmente
psql -U tu_usuario -d tu_base_de_datos -f scripts/create-test-users-simple.sql

# O si usas Railway/Supabase/otro servicio
psql "postgresql://usuario:password@host:puerto/database" -f scripts/create-test-users-simple.sql
```

### Opción 3: Desde Prisma Studio

```bash
# Abrir Prisma Studio
npx prisma studio

# Luego ejecuta el SQL desde la pestaña "SQL Query"
```

### Opción 4: Desde un API Route Temporal (Desarrollo)

Puedes crear un endpoint temporal para ejecutar el script:

```typescript
// app/api/dev/create-test-users/route.ts
import { getPrismaClient } from '@/lib/db';
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const prisma = getPrismaClient();
  const sqlPath = path.join(process.cwd(), 'scripts/create-test-users-simple.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  // Ejecutar SQL
  await prisma.$executeRawUnsafe(sql);
  
  return NextResponse.json({ success: true, message: 'Users created' });
}
```

Luego ejecuta: `curl -X POST http://localhost:3000/api/dev/create-test-users`

## 📊 Usuarios que se Crearán

### 🔐 Credenciales Comunes
**Password para TODOS los usuarios**: `Test123456!`  
**Hash bcrypt**: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`

### 👥 Lista Completa (19 usuarios)

#### Super Admin (1)
- ✉️ `superadmin@inmova.app` | 🛡️ super_admin | mixto | avanzado

#### Administradores (6)
- ✉️ `admin.alquiler@inmova.app` | 👔 administrador | alquiler_tradicional | intermedio
- ✉️ `admin.str@inmova.app` | 👔 administrador | str_vacacional | avanzado
- ✉️ `admin.coliving@inmova.app` | 👔 administrador | coliving | intermedio
- ✉️ `admin.construccion@inmova.app` | 👔 administrador | construccion | avanzado
- ✉️ `admin.flipping@inmova.app` | 👔 administrador | flipping | avanzado
- ✉️ `admin.servicios@inmova.app` | 👔 administrador | servicios_profesionales | avanzado

#### Gestores (6)
- ✉️ `gestor.principiante@inmova.app` | 🏢 gestor | alquiler_tradicional | **principiante** ⭐
- ✉️ `gestor.intermedio@inmova.app` | 🏢 gestor | alquiler_tradicional | **intermedio** ⭐
- ✉️ `gestor.avanzado@inmova.app` | 🏢 gestor | alquiler_tradicional | **avanzado** ⭐
- ✉️ `gestor.str@inmova.app` | 🏢 gestor | str_vacacional | intermedio
- ✉️ `gestor.coliving@inmova.app` | 🏢 gestor | coliving | intermedio
- ✉️ `gestor.mixto@inmova.app` | 🏢 gestor | mixto | avanzado

#### Operadores (2)
- ✉️ `operador.mantenimiento@inmova.app` | 🛠️ operador | alquiler_tradicional | principiante
- ✉️ `operador.inspecciones@inmova.app` | 🛠️ operador | str_vacacional | intermedio

#### Soporte (2)
- ✉️ `soporte.atencion@inmova.app` | 💬 soporte | alquiler_tradicional | principiante
- ✉️ `soporte.tickets@inmova.app` | 💬 soporte | coliving | intermedio

#### Community Managers (2)
- ✉️ `cm.comunidades@inmova.app` | 👥 community_manager | comunidades | intermedio
- ✉️ `cm.juntas@inmova.app` | 👥 community_manager | comunidades | avanzado

## 🧪 Casos de Prueba Recomendados

### ⭐ Caso 1: Gestor Principiante (Máxima Asistencia)
```
Email: gestor.principiante@inmova.app
Password: Test123456!

Expectativa:
- Tiempo estimado x1.5 (50% más)
- Videos tutoriales: ✅ Sí
- Tooltips: ✅ Sí
- Chatbot: 🟢 Proactivo (aparece automáticamente)
- Wizards interactivos: ✅ Sí
- Artículos de ayuda: ✅ Sí
```

### ⭐ Caso 2: Gestor Avanzado (Mínima Asistencia)
```
Email: gestor.avanzado@inmova.app
Password: Test123456!

Expectativa:
- Tiempo estimado x0.6 (40% menos)
- Videos tutoriales: ❌ No
- Tooltips: ❌ No
- Chatbot: ⚪ Desactivado
- Wizards interactivos: ❌ No (acceso directo)
- Auto-completar tareas triviales: ✅ Sí (welcome, explore_dashboard)
```

### ⭐ Caso 3: Super Admin (Tareas Específicas)
```
Email: superadmin@inmova.app
Password: Test123456!

Expectativa:
- Tareas de multi-tenant y seguridad
- Tiempo x0.5 (mitad del tiempo)
- Sin videos ni tooltips
- Solo tareas mandatorias
```

### ⭐ Caso 4: Operador (Tareas Filtradas)
```
Email: operador.mantenimiento@inmova.app
Password: Test123456!

Expectativa:
- Solo tareas de mantenimiento e inspecciones
- Sin acceso a tareas de gestión de propiedades
- Enfoque operativo
```

### ⭐ Caso 5: Admin STR (Vertical Específico)
```
Email: admin.str@inmova.app
Password: Test123456!

Expectativa:
- Onboarding de Channel Manager STR
- Tareas: conectar canales, pricing dinámico
- Métricas STR (RevPAR, ADR, ocupación)
```

## 📋 Verificación Post-Creación

Una vez ejecutado el script, verifica:

### 1. Contar usuarios creados
```sql
SELECT COUNT(*) as total_usuarios
FROM "User"
WHERE email LIKE '%@inmova.app';
-- Debe retornar: 19
```

### 2. Ver todos los usuarios con detalles
```sql
SELECT 
  email,
  name,
  role,
  (preferences->>'experienceLevel') as experiencia,
  (preferences->>'vertical') as vertical,
  activo,
  "onboardingCompleted"
FROM "User"
WHERE email LIKE '%@inmova.app'
ORDER BY role, email;
```

### 3. Verificar empresas creadas
```sql
SELECT 
  name,
  "businessVertical",
  activo,
  "onboardingCompleted"
FROM "Company"
WHERE name LIKE '%Test%' OR name LIKE '%Inmova%' OR name LIKE '%Gestora%'
ORDER BY "businessVertical";
-- Debe retornar: 15 empresas
```

### 4. Verificar que NO hay tareas de onboarding previas
```sql
SELECT 
  u.email,
  COUNT(ot.id) as tareas_onboarding
FROM "User" u
LEFT JOIN "OnboardingTask" ot ON u.id = ot."userId"
WHERE u.email LIKE '%@inmova.app'
GROUP BY u.email
HAVING COUNT(ot.id) > 0;
-- Debe retornar: 0 filas (ningún usuario debe tener tareas previas)
```

## 🎮 Cómo Probar el Onboarding

### Paso 1: Login
1. Ir a `http://localhost:3000/login` (o tu URL)
2. Email: `gestor.principiante@inmova.app`
3. Password: `Test123456!`

### Paso 2: Inicializar Onboarding
El onboarding debe inicializarse automáticamente al detectar `onboardingCompleted = false`.

Si no se inicializa automáticamente, llamar manualmente:

```bash
curl -X POST http://localhost:3000/api/onboarding/initialize \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "vertical": "alquiler_tradicional",
    "role": "gestor",
    "experience": "principiante"
  }'
```

### Paso 3: Observar Adaptaciones

**Para Principiante:**
- Debes ver videos tutoriales
- Tooltips en cada paso
- Chatbot aparece proactivamente
- Tiempo estimado mayor (ej: 3 minutos en lugar de 2)

**Para Avanzado:**
- Sin videos
- Sin tooltips
- Acceso directo a funcionalidades
- Tareas triviales ya completadas
- Tiempo estimado menor (ej: 1.2 minutos en lugar de 2)

**Para Operador:**
- Solo verás tareas de mantenimiento
- No verás tareas de gestión de propiedades o contratos

## 🐛 Troubleshooting

### Error: "Duplicate key value violates unique constraint"
✅ Normal si ejecutas el script múltiples veces. El script usa `ON CONFLICT DO UPDATE`.

### Error: "Invalid credentials" al hacer login
🔍 Verificar:
1. Password es exactamente `Test123456!` (con mayúsculas y signo de exclamación)
2. Hash en BD es `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
3. Usuario tiene `activo = true`

### Onboarding no se inicializa automáticamente
🔍 Verificar:
1. `onboardingCompleted = false` en User
2. No hay OnboardingTasks previas para ese usuario
3. Frontend está llamando a `/api/onboarding/initialize`

### Onboarding no se adapta por rol/experiencia
🔍 Verificar:
1. `preferences` en User contiene `experienceLevel` y `vertical`
2. Llamada a API incluye `role` y `experience`
3. Revisar logs del backend para ver qué parámetros recibe

## 📞 Archivos Relacionados

```
/workspace
├── lib/
│   ├── onboarding-role-adapter.ts ✨ NUEVO - Adaptador por rol y experiencia
│   └── onboarding-service.ts      ✅ ACTUALIZADO - Integra adaptador
├── app/api/onboarding/
│   └── initialize/route.ts        ✅ ACTUALIZADO - Acepta role/experience
├── scripts/
│   ├── create-test-users-simple.sql       ✅ Script SQL principal
│   ├── create-test-users-profiles.ts      📝 Script TypeScript alternativo
│   ├── create-users-readme.md             📚 Documentación completa
│   ├── generate-bcrypt-hash.js            🔐 Generador de hash
│   └── execute-sql-script.ts              🚀 Ejecutor SQL (requiere deps)
└── USUARIOS_TEST_CREADOS.md               📄 Este archivo
```

## ✅ Resumen

**Estado**: ✅ TODO LISTO PARA EJECUTAR

**Acción requerida**: Ejecutar `scripts/create-test-users-simple.sql` en tu base de datos

**Resultado esperado**: 19 usuarios creados con diferentes perfiles para probar onboarding adaptado

**Próximo paso**: Hacer login con cualquier usuario y observar el onboarding personalizado

---

**Última actualización**: 1 de enero de 2026  
**Versión**: 1.0.0  
**Autor**: Cursor Agent
