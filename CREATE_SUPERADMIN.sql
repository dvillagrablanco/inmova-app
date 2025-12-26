-- =============================================
-- SCRIPT: Crear Usuario Superadmin en Producción
-- Fecha: 26 Diciembre 2025
-- =============================================

-- Este script crea el usuario superadmin directamente en PostgreSQL
-- Credenciales: admin@inmova.app / Admin2025!

BEGIN;

-- 1. Crear empresa administradora (si no existe)
INSERT INTO "company" (
    id,
    nombre,
    cif,
    email,
    telefono,
    direccion,
    ciudad,
    "codigoPostal",
    pais,
    activo,
    "estadoCliente",
    "contactoPrincipal",
    "emailContacto",
    "telefonoContacto",
    "createdAt",
    "updatedAt"
)
VALUES (
    'clz_admin_company_inmova_001',
    'INMOVA Administración',
    'B12345678',
    'admin@inmova.app',
    '+34 900 000 000',
    'Calle Tecnología 1',
    'Madrid',
    '28001',
    'España',
    true,
    'activo',
    'Administrador',
    'admin@inmova.app',
    '+34 900 000 000',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    activo = true,
    "updatedAt" = NOW();

-- 2. Eliminar usuario admin anterior si existe (para resetear)
DELETE FROM "User" WHERE email = 'admin@inmova.app';

-- 3. Crear usuario superadmin con password hasheada
-- Password: Admin2025!
-- Hasheada con bcrypt (10 rounds): $2a$10$...
INSERT INTO "User" (
    id,
    email,
    name,
    password,
    role,
    "companyId",
    activo,
    "createdAt",
    "updatedAt"
)
VALUES (
    'clz_admin_user_inmova_superadmin',
    'admin@inmova.app',
    'Administrador INMOVA',
    '$2a$10$rZJ5DxWKE0gKXb.yP4/3EuE5mZjXxE9kF.f5QLfVq8J7K3nG5Wj4O',
    'super_admin',
    'clz_admin_company_inmova_001',
    true,
    NOW(),
    NOW()
);

COMMIT;

-- Verificar que el usuario fue creado
SELECT 
    id,
    email,
    name,
    role,
    activo,
    "createdAt"
FROM "User" 
WHERE email = 'admin@inmova.app';

-- =============================================
-- RESULTADO ESPERADO:
-- ✅ Usuario: admin@inmova.app
-- ✅ Password: Admin2025!
-- ✅ Rol: super_admin
-- ✅ Estado: activo
-- =============================================
