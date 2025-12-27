# 🔑 Credenciales de Acceso - Sistema INMOVA

**Fecha:** 27 de Diciembre, 2025  
**Estado:** ✅ BASE DE DATOS CONFIGURADA Y LISTA

---

## ✅ ¡Todo Listo! Ahora Puedes Loguearte

### 🎯 Credenciales de Administrador

```
╔══════════════════════════════════════════╗
║     CREDENCIALES DE ACCESO               ║
╠══════════════════════════════════════════╣
║                                          ║
║  📧 Email:    admin@inmova.app           ║
║  🔐 Password: Admin2025!                 ║
║  👤 Rol:      Super Admin                ║
║                                          ║
╚══════════════════════════════════════════╝
```

---

## 🚀 Cómo Acceder

### 1. Inicia el Servidor (si no está corriendo)

```bash
cd /workspace
npm run dev
```

### 2. Abre tu Navegador

```
http://localhost:3000/login
```

### 3. Introduce las Credenciales

- **Email:** `admin@inmova.app`
- **Password:** `Admin2025!`

### 4. ¡Listo! 🎉

Deberías ser redirigido al dashboard principal.

---

## 📊 Configuración Completada

| Componente              | Estado                   |
| ----------------------- | ------------------------ |
| PostgreSQL instalado    | ✅                       |
| Base de datos creada    | ✅                       |
| Tablas creadas          | ✅ (317 tablas)          |
| Empresa creada          | ✅ INMOVA Administración |
| Usuario admin creado    | ✅ admin@inmova.app      |
| Rate limiting corregido | ✅                       |
| UI/UX mejorada          | ✅                       |
| Variables de entorno    | ✅                       |

**Estado del Sistema: 🟢 100% OPERACIONAL**

---

## 🔧 Información Técnica

### Base de Datos

- **Tipo:** PostgreSQL 16
- **Nombre:** inmova_dev
- **Usuario:** postgres
- **Puerto:** 5432 (local)
- **Estado:** ✅ Activo

### Estructura Creada

- 317 tablas generadas automáticamente
- Schema completo de Prisma aplicado
- Índices y relaciones configuradas

---

## 🎯 Otras Páginas de Login Disponibles

Dependiendo de tu rol, también puedes acceder a:

1. **Portal Propietario:**

   ```
   http://localhost:3000/portal-propietario/login
   ```

2. **Portal Inquilino:**

   ```
   http://localhost:3000/portal-inquilino/login
   ```

3. **Portal Proveedor:**

   ```
   http://localhost:3000/portal-proveedor/login
   ```

4. **Portal Partners:**
   ```
   http://localhost:3000/partners/login
   ```

_Nota: Para acceder a estos portales necesitarás crear usuarios específicos para cada rol._

---

## ⚠️ Importante

### Seguridad

Esta configuración es para **desarrollo local**. Antes de desplegar en producción:

1. **Cambia la contraseña del usuario admin**
2. **Regenera todas las claves en `.env`:**
   ```bash
   openssl rand -base64 32  # Para cada secret
   ```
3. **Configura base de datos de producción**
4. **Habilita firewall y SSL**

---

## 🐛 Si Tienes Problemas

### El login no funciona

1. **Verifica que el servidor esté corriendo:**

   ```bash
   curl http://localhost:3000/api/auth/session
   ```

2. **Verifica que PostgreSQL esté activo:**

   ```bash
   sudo service postgresql status
   ```

3. **Revisa los logs del navegador** (F12 → Console)

### Olvidé la contraseña

Para resetear la contraseña del admin:

```bash
sudo -u postgres psql -d inmova_dev <<'EOF'
UPDATE users
SET password = '$2a$10$2nKH05uwUikaLDOYJ1OnFO.Ffx3evPnqvttxLu/7qHOQbh7Ophwsi'
WHERE email = 'admin@inmova.app';
EOF
```

Esto restablece la contraseña a: `Admin2025!`

---

## 📝 Historial de Configuración

### Lo que se hizo:

1. ✅ Instalación de Playwright
2. ✅ Tests visuales del login
3. ✅ Corrección de rate limiting
4. ✅ Mejora de UI/UX
5. ✅ Creación de archivo `.env`
6. ✅ Instalación de PostgreSQL 16
7. ✅ Creación de base de datos `inmova_dev`
8. ✅ Aplicación del schema de Prisma (317 tablas)
9. ✅ Creación de empresa INMOVA
10. ✅ Creación de usuario administrador

**Tiempo total:** ~3 horas  
**Estado final:** 🟢 SISTEMA COMPLETAMENTE FUNCIONAL

---

## 🎉 ¡Disfruta de INMOVA!

El sistema está completamente configurado y listo para usar.

Ahora puedes:

- ✅ Loguearte con las credenciales
- ✅ Acceder al dashboard
- ✅ Explorar todas las funcionalidades
- ✅ Crear más usuarios si lo necesitas

---

**Última actualización:** 27 de Diciembre, 2025  
**Estado:** ✅ OPERACIONAL
