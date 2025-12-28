# 🔐 Resumen de Logins y Perfiles - INMOVA

## ✅ Configuración Completada

### Perfiles Disponibles en el Sistema

Según el schema de Prisma, el sistema tiene 6 roles:

```typescript
enum UserRole {
  super_admin          // Super Administrador
  administrador        // Administrador de empresa
  gestor              // Gestor de propiedades
  operador            // Operador diario
  soporte             // Soporte técnico
  community_manager   // Community Manager
}
```

---

## 🔑 Credenciales de Acceso

### Usuario Existente

| Rol | Email | Contraseña | Estado |
|-----|-------|------------|--------|
| **Super Admin** | admin@inmova.app | Admin2025! | ✅ Activo |

---

## 📊 Tests Creados

### Archivo: `e2e/login-all-profiles.spec.ts`

Tests implementados:
1. ✅ Login correcto para cada perfil
2. ✅ Verificación de información de usuario autenticado
3. ✅ Navegación en el sistema post-login
4. ✅ Rechazo de credenciales inválidas
5. ✅ Validación de campos del formulario
6. ✅ Verificación de acceso por rol (Super Admin)

---

## 🎯 Funcionalidad de Cada Rol

### 1. Super Admin
**Acceso**: ✅ admin@inmova.app / Admin2025!

**Permisos**:
- Acceso completo al sistema
- Gestión de todas las empresas
- Creación y eliminación de usuarios
- Configuración global del sistema
- Acceso a panel de super administración
- Gestión de suscripciones B2B
- Auditoría y logs del sistema

**Dashboards esperados**:
- Panel de administración global
- Estadísticas de todas las empresas
- Gestión de partners
- Configuración del sistema

---

### 2. Administrador
**Acceso**: Por crear (admin@test.com / Test1234!)

**Permisos**:
- Gestión de su empresa
- Creación de usuarios de su empresa
- Acceso a dashboards y reportes
- Configuración de su empresa
- Gestión de suscripciones
- Reportes financieros

**Dashboards esperados**:
- Dashboard principal de la empresa
- Gestión de usuarios
- Reportes y analytics
- Configuración de empresa

---

### 3. Gestor
**Acceso**: Por crear (gestor@test.com / Test1234!)

**Permisos**:
- Gestión de propiedades asignadas
- Gestión de contratos e inquilinos
- Reportes de su cartera
- Comunicación con inquilinos
- Gestión de incidencias

**Dashboards esperados**:
- Dashboard de propiedades
- Lista de inquilinos
- Contratos activos
- Incidencias pendientes

---

### 4. Operador
**Acceso**: Por crear (operador@test.com / Test1234!)

**Permisos**:
- Operaciones diarias
- Gestión de incidencias asignadas
- Gestión de mantenimiento
- Tareas específicas
- Comunicación con inquilinos

**Dashboards esperados**:
- Dashboard de tareas
- Incidencias asignadas
- Calendario de mantenimiento
- Checklist diario

---

### 5. Soporte
**Acceso**: Por crear (soporte@test.com / Test1234!)

**Permisos**:
- Atención al cliente
- Gestión de tickets de soporte
- Chat y comunicaciones
- Base de conocimiento
- FAQ y documentación

**Dashboards esperados**:
- Dashboard de tickets
- Chat en vivo
- Base de conocimiento
- Estadísticas de soporte

---

### 6. Community Manager
**Acceso**: Por crear (community@test.com / Test1234!)

**Permisos**:
- Gestión de contenido
- Publicaciones y eventos
- Comunicaciones con residentes
- Redes sociales
- Calendario de eventos

**Dashboards esperados**:
- Dashboard de contenido
- Calendario de eventos
- Métricas de engagement
- Publicaciones programadas

---

## 🧪 Cómo Ejecutar los Tests

### Tests Completos de Login
```bash
npm run test:e2e -- e2e/login-all-profiles.spec.ts
```

### Test Específico de un Rol
```bash
npx playwright test e2e/login-all-profiles.spec.ts --grep "Super Admin"
```

### Con Interfaz Visual
```bash
npx playwright test e2e/login-all-profiles.spec.ts --ui
```

### Generar Screenshots
```bash
npx playwright test e2e/login-all-profiles.spec.ts --screenshot=on
```

---

## 📸 Screenshots Generados

Cuando se ejecutan los tests, se generan screenshots en:

```
test-results/
├── login-super-admin-before.png        # Formulario de login
├── login-super-admin-dashboard.png     # Dashboard post-login
├── login-super-admin-navigation.png    # Navegación disponible
├── login-administrador-before.png
├── login-administrador-dashboard.png
└── ... (para cada rol)
```

---

## 🔐 Crear Usuarios para Otros Roles

Para crear usuarios de prueba para los demás roles:

### Opción 1: Via Script en el Servidor
```bash
ssh root@157.180.119.236
docker exec -it inmova npm run seed
```

### Opción 2: Via API (si disponible)
```bash
POST /api/users
{
  "email": "gestor@test.com",
  "name": "Gestor de Prueba",
  "password": "Test1234!",
  "role": "gestor"
}
```

### Opción 3: Via Panel de Super Admin
1. Login como admin@inmova.app
2. Ir a Gestión de Usuarios
3. Crear nuevo usuario
4. Seleccionar rol correspondiente

---

## ✅ Estado Actual

```
✅ Schema de roles definido
✅ Super Admin existente y verificado
✅ Tests de login creados
✅ Documentación completa
✅ Sistema de autenticación funcionando
⏳ Usuarios de prueba para otros roles (por crear)
```

---

## 📋 Próximos Pasos Recomendados

1. **Crear usuarios de prueba** para cada rol:
   ```bash
   # En el servidor
   docker exec inmova npm run seed-test-users
   ```

2. **Ejecutar suite completa de tests**:
   ```bash
   npm run domain:test
   npm run test:e2e
   ```

3. **Verificar permisos** de cada rol:
   - Login con cada usuario
   - Verificar acceso a secciones correspondientes
   - Validar restricciones de permisos

4. **Documentar flujos** específicos por rol:
   - Flujo de trabajo del gestor
   - Tareas del operador
   - Proceso de soporte
   - etc.

---

## 🌐 URLs de Acceso

- **Login**: https://inmovaapp.com/auth/signin
- **Dashboard**: https://inmovaapp.com/dashboard
- **Admin Panel**: https://inmovaapp.com/admin (solo Super Admin)

---

## 📞 Comandos Útiles

```bash
# Verificar usuario en base de datos
docker exec inmova-postgres psql -U inmova_user -d inmova -c "SELECT email, name, role FROM users;"

# Resetear contraseña de usuario
# (via script o panel admin)

# Ver logs de autenticación
docker logs inmova | grep auth

# Ejecutar tests de login
npm run test:e2e -- e2e/login-all-profiles.spec.ts
```

---

## ✨ Resumen

**Estado**: ✅ Sistema de autenticación configurado y funcionando

**Usuario Activo**: 
- Email: admin@inmova.app
- Password: Admin2025!
- Rol: super_admin

**Tests Creados**: 6 suites de tests para verificar login y acceso

**Documentación**: Completa para todos los 6 roles del sistema

---

**El sistema está listo para crear usuarios adicionales y realizar pruebas completas de cada perfil** 🚀
