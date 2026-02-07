# 🔐 Credenciales de Superadministrador - Inmova App

**Fecha de Consulta**: 30 de diciembre de 2025  
**Servidor**: inmovaapp.com (157.180.119.236)

---

## 🎯 Credenciales de Acceso

### 👤 Cuenta Principal - Superadministrador

```
╔═══════════════════════════════════════════╗
║  SUPERADMINISTRADOR #1                    ║
╠═══════════════════════════════════════════╣
║  Email:    admin@inmova.app               ║
║  Password: Admin123!                      ║
║  Role:     super_admin                    ║
║  Status:   ✅ Activo                      ║
╚═══════════════════════════════════════════╝
```

**URL de Login**: https://inmovaapp.com/login

---

### 👤 Cuenta Secundaria - Test

```
╔═══════════════════════════════════════════╗
║  SUPERADMINISTRADOR #2 (Test)             ║
╠═══════════════════════════════════════════╣
║  Email:    test@inmova.app                ║
║  Password: Test123456!                    ║
║  Role:     super_admin                    ║
║  Status:   ✅ Activo                      ║
╚═══════════════════════════════════════════╝
```

**URL de Login**: https://inmovaapp.com/login

---

## 🔑 Instrucciones de Uso

### Paso a Paso para Login

1. **Abrir navegador**
   ```
   URL: https://inmovaapp.com/login
   ```

2. **Introducir credenciales**
   ```
   Email:    admin@inmova.app
   Password: Admin123!
   ```

3. **Click en "Iniciar Sesión"**

4. **Será redirigido a**:
   - `/admin` (Panel de administración)
   - o `/dashboard` (Dashboard general)

---

## 📋 Características del Superadmin

### Permisos Completos ✅

```
✅ Acceso total a todas las funcionalidades
✅ Gestión de usuarios
✅ Configuración del sistema
✅ Administración de empresas
✅ Reportes y analytics
✅ Gestión de propiedades
✅ Control de roles y permisos
✅ Configuración de integraciones
✅ Logs y auditoría
```

---

## 🔒 Seguridad

### Información Técnica

- **Hash**: bcrypt con 10 rounds
- **Algoritmo**: NextAuth.js CredentialsProvider
- **Session**: JWT (httpOnly cookies)
- **2FA**: No configurado (opcional)

### Base de Datos

```sql
SELECT email, name, role, activo, companyId 
FROM "User" 
WHERE email = 'admin@inmova.app';
```

**Resultado Esperado**:
```
email: admin@inmova.app
name: Admin
role: super_admin
activo: true
companyId: [CUID de company]
```

---

## 🛠️ Solución de Problemas

### Si no puedes iniciar sesión:

#### 1. Verificar Credenciales
```
✅ Email: admin@inmova.app (sin espacios)
✅ Password: Admin123! (sensible a mayúsculas)
```

#### 2. Limpiar Cache del Navegador
```
Ctrl + Shift + R (hard refresh)
o probar en modo incógnito
```

#### 3. Verificar Estado del Usuario en BD

Ejecutar en servidor:
```bash
cd /opt/inmova-app
export DATABASE_URL='postgresql://inmova_user:InmovaSecure2025@localhost:5432/inmova_production'
psql "$DATABASE_URL" -c "SELECT email, activo, role FROM \"User\" WHERE email = 'admin@inmova.app';"
```

#### 4. Recrear Usuario

Si es necesario, ejecutar en servidor:
```bash
cd /opt/inmova-app
npx tsx scripts/fix-auth-complete.ts
```

---

## 🔄 Cambiar Password (Opcional)

### Desde Interfaz Web
```
1. Login como superadmin
2. Ir a Configuración → Mi Perfil
3. Cambiar contraseña
```

### Desde Script

Crear `/opt/inmova-app/scripts/change-admin-password.ts`:
```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function changePassword() {
  const newPassword = 'TuNuevaPassword123!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { email: 'admin@inmova.app' },
    data: { password: hashedPassword },
  });
  
  console.log('✅ Password actualizado');
}

changePassword();
```

Ejecutar:
```bash
npx tsx scripts/change-admin-password.ts
```

---

## 📊 Otras Cuentas (Si existen)

### Buscar Todos los Superadmins

Query SQL:
```sql
SELECT email, name, role, activo 
FROM "User" 
WHERE role IN ('super_admin', 'SUPERADMIN', 'ADMIN')
ORDER BY createdAt DESC;
```

---

## 🎯 Resumen Rápido

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 URL:      https://inmovaapp.com/login
📧 Email:    admin@inmova.app
🔑 Password: Admin123!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🚨 Nota de Seguridad

⚠️ **IMPORTANTE**: 

1. **No compartir estas credenciales públicamente**
2. **Cambiar password después del primer login**
3. **Habilitar 2FA si es posible**
4. **Usar gestor de contraseñas**
5. **No usar esta contraseña en otros servicios**

---

## 📝 Historial de Scripts

Los usuarios fueron creados/actualizados con:

```
1. scripts/fix-auth-complete.ts (último usado)
2. scripts/create-test-user.ts
3. scripts/create-admin-user.ts
```

**Última actualización**: Durante el deployment a producción

---

## 🔗 Links Relacionados

- **Login**: https://inmovaapp.com/login
- **Dashboard**: https://inmovaapp.com/dashboard
- **Admin Panel**: https://inmovaapp.com/admin
- **API Docs**: https://inmovaapp.com/api-docs

---

**Fuente**: Scripts de /opt/inmova-app/scripts/  
**Verificado**: 2025-12-30 12:35 UTC  
**Status**: ✅ Credenciales Activas
