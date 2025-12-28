# 🔐 Credenciales y Logins - inmovaapp.com

## ✅ INFORMACIÓN COMPLETA DE ACCESO

---

## 🌐 URLs de Login Disponibles

### Login Principal (Staff/Administración)
**URL**: https://inmovaapp.com/login

**Usuarios del sistema**:
- Super Admin
- Administrador
- Gestor
- Operador
- Soporte
- Community Manager

### Login Portal Propietario
**URL**: https://inmovaapp.com/portal-propietario/login

**Acceso para**: Propietarios de inmuebles

### Login Portal Inquilino
**URL**: https://inmovaapp.com/portal-inquilino/login

**Acceso para**: Inquilinos/Residentes

### Login Portal Proveedor
**URL**: https://inmovaapp.com/portal-proveedor/login

**Acceso para**: Proveedores de servicios

### Login Partners (B2B)
**URL**: https://inmovaapp.com/partners/login

**Acceso para**: Partners del sistema B2B

---

## 🔑 CREDENCIALES DE ACCESO

### Usuario Activo - Super Admin

```
Email:    admin@inmova.app
Password: Admin2025!
URL:      https://inmovaapp.com/login
Rol:      super_admin
```

---

## 📊 Roles del Sistema

### 1. Super Admin ⭐
- **Email disponible**: admin@inmova.app
- **Contraseña**: Admin2025!
- **Permisos**: Acceso total al sistema
- **Dashboard**: Panel de super administración global

### 2. Administrador 👤
- **Email sugerido**: admin@test.com
- **Contraseña sugerida**: Test1234!
- **Permisos**: Gestión de su empresa
- **Dashboard**: Panel de administración de empresa

### 3. Gestor 🏢
- **Email sugerido**: gestor@test.com
- **Contraseña sugerida**: Test1234!
- **Permisos**: Gestión de propiedades asignadas
- **Dashboard**: Propiedades e inquilinos

### 4. Operador 🔧
- **Email sugerido**: operador@test.com
- **Contraseña sugerida**: Test1234!
- **Permisos**: Operaciones diarias
- **Dashboard**: Tareas e incidencias

### 5. Soporte 💬
- **Email sugerido**: soporte@test.com
- **Contraseña sugerida**: Test1234!
- **Permisos**: Atención al cliente
- **Dashboard**: Tickets de soporte

### 6. Community Manager 📱
- **Email sugerido**: community@test.com
- **Contraseña sugerida**: Test1234!
- **Permisos**: Gestión de contenido y eventos
- **Dashboard**: Publicaciones y eventos

---

## 🧪 Tests de Login Creados

### Archivo de Tests
`e2e/login-all-profiles.spec.ts`

### Tests Implementados

1. ✅ **Login correcto** para cada perfil
2. ✅ **Verificación** de información de usuario autenticado
3. ✅ **Navegación** en el sistema post-login
4. ✅ **Rechazo** de credenciales inválidas
5. ✅ **Validación** de campos del formulario
6. ✅ **Verificación** de acceso por rol

### Ejecutar Tests

```bash
# Tests completos
npm run test:e2e -- e2e/login-all-profiles.spec.ts

# Con interfaz visual
npx playwright test e2e/login-all-profiles.spec.ts --ui

# Solo un test específico
npx playwright test e2e/login-all-profiles.spec.ts --grep "Super Admin"
```

---

## 📸 Verificación Manual

### Paso a Paso - Login Super Admin

1. **Abrir navegador**: https://inmovaapp.com/login

2. **Ingresar credenciales**:
   - Email: `admin@inmova.app`
   - Password: `Admin2025!`

3. **Click en "Iniciar sesión"**

4. **Resultado esperado**:
   - Redirección a dashboard
   - Navegación visible
   - Información de usuario visible
   - Acceso a funcionalidades de administración

---

## 🔐 Seguridad

### Recomendaciones

1. ✅ **Contraseñas fuertes**: Mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos
2. ✅ **HTTPS**: Todo el tráfico encriptado
3. ✅ **CSRF Protection**: Tokens CSRF implementados
4. ✅ **Session Management**: Sesiones seguras con NextAuth
5. ✅ **MFA Available**: Autenticación multifactor disponible

### Headers de Seguridad Activos

```
✅ X-Frame-Options: DENY
✅ X-Content-Type-Options: nosniff
✅ X-DNS-Prefetch-Control: on
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Content-Security-Policy: Configurado
✅ CSRF Token: Activo
```

---

## 📋 Crear Usuarios Adicionales

### Via Base de Datos (SSH al Servidor)

```bash
# Conectar al servidor
ssh root@157.180.119.236

# Entrar al container de la app
docker exec -it inmova sh

# Ejecutar script de seed (si disponible)
npm run seed

# O ejecutar prisma studio
npx prisma studio
```

### Via Panel de Super Admin

1. Login como admin@inmova.app
2. Ir a sección "Usuarios" o "Gestión de Usuarios"
3. Click en "Nuevo Usuario"
4. Completar formulario:
   - Email
   - Nombre
   - Rol
   - Empresa (si aplica)
5. Usuario recibirá email con link para establecer contraseña

---

## 🎯 Funcionalidades por Rol

### Super Admin
- ✅ Gestión de todas las empresas
- ✅ Crear/editar/eliminar usuarios
- ✅ Configuración global del sistema
- ✅ Acceso a todos los módulos
- ✅ Auditoría y logs
- ✅ Gestión de suscripciones B2B

### Administrador
- ✅ Gestión de su empresa
- ✅ Crear usuarios de su empresa
- ✅ Dashboards y reportes
- ✅ Configuración de empresa
- ✅ Gestión financiera
- ✅ Reportes avanzados

### Gestor
- ✅ Gestión de propiedades
- ✅ Gestión de inquilinos
- ✅ Contratos y pagos
- ✅ Incidencias y mantenimiento
- ✅ Comunicación con inquilinos
- ✅ Reportes de su cartera

### Operador
- ✅ Tareas diarias asignadas
- ✅ Gestión de incidencias
- ✅ Mantenimiento
- ✅ Check-ins/Check-outs
- ✅ Calendario de tareas

### Soporte
- ✅ Tickets de soporte
- ✅ Chat en vivo
- ✅ Base de conocimiento
- ✅ FAQ management
- ✅ Métricas de soporte

### Community Manager
- ✅ Publicaciones y contenido
- ✅ Eventos y calendario
- ✅ Comunicación masiva
- ✅ Redes sociales
- ✅ Engagement metrics

---

## ✅ Estado Actual

```
✅ Dominio funcionando: https://inmovaapp.com
✅ SSL activo: Let's Encrypt
✅ Cloudflare CDN: Activo
✅ Login principal: /login
✅ Usuario Super Admin: Activo y verificado
✅ Tests de Playwright: Creados
✅ Documentación: Completa
```

---

## 📞 Comandos Útiles

```bash
# Ver usuarios en la base de datos
docker exec inmova-postgres psql -U inmova_user -d inmova -c "SELECT email, name, role FROM users;"

# Probar login manualmente
curl -X POST https://inmovaapp.com/api/auth/callback/credentials \
  -d "email=admin@inmova.app&password=Admin2025!"

# Verificar dominio
curl -I https://inmovaapp.com/login
```

---

## 📚 Documentación Adicional

- **CREDENCIALES_TEST.md** - Lista completa de credenciales
- **RESUMEN_LOGINS_PERFILES.md** - Documentación detallada de roles
- **e2e/login-all-profiles.spec.ts** - Tests automatizados
- **CONFIGURACION_EXITOSA_INMOVAAPP.md** - Config completa del servidor

---

## 🎊 Resumen Final

**Estado**: ✅ Sistema completamente funcional

**Acceso Disponible**:
- 🌐 URL: https://inmovaapp.com/login
- 👤 Usuario: admin@inmova.app
- 🔑 Password: Admin2025!

**Características**:
- ✅ 6 roles de usuario definidos
- ✅ 5 portales de login diferentes
- ✅ Autenticación segura con NextAuth
- ✅ MFA disponible
- ✅ Tests automatizados creados
- ✅ Documentación completa

---

**¡Sistema listo para usar!** 🚀
