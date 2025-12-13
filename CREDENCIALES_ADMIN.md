# 🔑 CREDENCIALES DE ADMINISTRADOR - INMOVA

## ✅ PROBLEMA RESUELTO

Se ha verificado y corregido el problema de acceso al perfil de administrador.

---

## 👥 USUARIOS ADMINISTRADORES ACTIVOS

### 1. **Admin Principal (Recomendado)**
```
Email:    admin@inmova.app
Password: Admin2025!
Rol:      super_admin
Empresa:  INMOVA Administración
```

### 2. **Admin INMOVA (admin@inmova.es)**
```
Email:    admin@inmova.es
Password: [Consultar con equipo técnico]
Rol:      super_admin
Empresa:  INMOVA
```

### 3. **Super Administrador (superadmin@inmova.com)**
```
Email:    superadmin@inmova.com
Password: [Consultar con equipo técnico]
Rol:      super_admin
Empresa:  INMOVA
```

### 4. **Admin INMOVA (admin@inmova.com)**
```
Email:    admin@inmova.com
Password: [Consultar con equipo técnico]
Rol:      super_admin
Empresa:  INMOVA
```

### 5. **Admin Vidaro (admin@vidaro.es)**
```
Email:    admin@vidaro.es
Password: [Consultar con equipo técnico]
Rol:      super_admin
Empresa:  Vidaro Inversiones S.L.
```

### 6. **Admin Rovida (admin@rovida.es)**
```
Email:    admin@rovida.es
Password: [Consultar con equipo técnico]
Rol:      super_admin
Empresa:  Rovida S.L.
```

### 7. **Admin Viroda (admin@viroda.es)**
```
Email:    admin@viroda.es
Password: [Consultar con equipo técnico]
Rol:      super_admin
Empresa:  VIRODA INVERSIONES S.L.U.
```

---

## 🛠️ ROLES Y PERMISOS

### Roles Disponibles:
```typescript
enum UserRole {
  super_admin     // Acceso total a todas las empresas y funcionalidades
  administrador   // Administrador de empresa individual
  gestor          // Gestor de propiedades
  operador        // Operador con permisos limitados
  soporte         // Equipo de soporte
}
```

### Permisos por Rol:

#### 👑 Super Admin
- Acceso a todas las empresas (multi-tenant)
- Gestión de usuarios y roles
- Configuración del sistema
- Acceso a auditoría y logs
- Gestión de planes y suscripciones

#### 👨‍💼 Administrador
- Gestión completa de su empresa
- Creación de usuarios
- Acceso a reportes financieros
- Configuración de módulos

#### 🏢 Gestor
- Gestión de propiedades asignadas
- Creación de contratos
- Gestión de inquilinos
- Mantenimiento

#### 👷 Operador
- Visualización de propiedades
- Gestión de tareas asignadas
- Acceso limitado a reportes

#### 🏛️ Soporte
- Visualización de tickets
- Gestión de incidencias
- Soporte a usuarios

---

## ⚠️ NOTAS DE SEGURIDAD

1. **Cambiar contraseñas por defecto** después del primer login
2. **Habilitar MFA (Multi-Factor Authentication)** para cuentas admin
3. **Auditar logs de acceso** regularmente
4. **Limitar IPs permitidas** para accesos administrativos (opcional)

---

## 🔄 Cómo Resetear Contraseña de Admin

Si necesitas resetear la contraseña de cualquier administrador:

```bash
cd /home/ubuntu/homming_vidaro/nextjs_space
yarn tsx --require dotenv/config scripts/seed.ts
```

Esto actualizará las credenciales del usuario `admin@inmova.app` a:
- **Email:** admin@inmova.app
- **Password:** Admin2025!

---

## 🐛 SOLUCIÓN AL ERROR DE LOGIN

### Problemas Comunes:

1. **Error: "Usuario no encontrado"**
   - Verificar que el email esté escrito correctamente
   - Ejecutar script de seed para crear usuario

2. **Error: "Contraseña incorrecta"**
   - Ejecutar script de seed para resetear contraseña
   - Verificar que no haya espacios al inicio/final

3. **Error: "Usuario inactivo"**
   - Verificar campo `activo` en base de datos
   - El script de seed automáticamente activa usuarios

4. **Error: "No tienes permisos"**
   - Verificar que el rol sea `super_admin` o `administrador`
   - El script de seed asigna correctamente el rol

---

**Fecha:** 5 de diciembre de 2025  
**Estado:** ✅ Verificado y funcional
