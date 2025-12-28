-- Script para crear usuario administrador
-- Password hash para "demo123": $2a$10$N9qo8uLOickgx2ZMRZoMye1J3vUUfj9aUgLXGq8nqRRLLhWKL.nLW

-- 1. Verificar si existe la empresa, si no crearla
INSERT INTO "Company" (id, nombre, email, telefono, activo, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Inmova Demo',
  'demo@inmova.app',
  '+34 900 000 000',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 2. Crear usuario admin (usando el ID de la empresa)
INSERT INTO "User" (id, email, name, password, role, "companyId", activo, "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  'admin@inmova.app',
  'Admin Demo',
  '$2a$10$N9qo8uLOickgx2ZMRZoMye1J3vUUfj9aUgLXGq8nqRRLLhWKL.nLW',
  'SUPERADMIN',
  c.id,
  true,
  NOW(),
  NOW()
FROM "Company" c
WHERE c.email = 'demo@inmova.app'
ON CONFLICT (email) DO NOTHING;

-- 3. Verificar que se creó
SELECT 'Usuario creado exitosamente:' as mensaje, email, name, role, activo
FROM "User"
WHERE email = 'admin@inmova.app';
