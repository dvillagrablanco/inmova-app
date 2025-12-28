# 🔑 Credenciales de Prueba - INMOVA

## Usuarios de Prueba por Perfil

Contraseña para todos: **Test1234!**

| Rol | Email | Contraseña | Estado |
|-----|-------|------------|--------|
| **Super Admin** | admin@inmova.app | Test1234! | ✅ Existente |
| **Administrador** | admin@test.com | Test1234! | ⏳ Por crear |
| **Gestor** | gestor@test.com | Test1234! | ⏳ Por crear |
| **Operador** | operador@test.com | Test1234! | ⏳ Por crear |
| **Soporte** | soporte@test.com | Test1234! | ⏳ Por crear |
| **Community Manager** | community@test.com | Test1234! | ⏳ Por crear |

## Roles Disponibles en el Sistema

Según el schema de Prisma:

```typescript
enum UserRole {
  super_admin
  administrador
  gestor
  operador
  soporte
  community_manager
}
```

## Descripción de Roles

### Super Admin
- Acceso completo al sistema
- Puede gestionar todas las empresas
- Puede crear y eliminar usuarios
- Acceso a configuración global

### Administrador
- Gestión de su empresa
- Puede crear usuarios de su empresa
- Acceso a dashboards y reportes
- Configuración de empresa

### Gestor
- Gestión de propiedades
- Gestión de contratos
- Gestión de inquilinos
- Reportes básicos

### Operador
- Operaciones diarias
- Gestión de incidencias
- Gestión de mantenimiento
- Tareas asignadas

### Soporte
- Atención al cliente
- Gestión de tickets
- Chat y comunicaciones
- Base de conocimiento

### Community Manager
- Gestión de contenido
- Publicaciones y eventos
- Comunicaciones con residentes
- Redes sociales

## Nota

Para pruebas completas, usaremos:
- **admin@inmova.app** con contraseña **Test1234!** (ya existe)
- Los tests verificarán el acceso y funcionalidad básica
