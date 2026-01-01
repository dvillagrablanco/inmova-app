-- =====================================================
-- SCRIPT SQL: Crear usuarios de prueba para todos los perfiles
-- Password para todos: Test123456!
-- Hash bcrypt: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- =====================================================

-- Primero, crear las empresas necesarias
INSERT INTO "Company" (id, name, "businessVertical", activo, "onboardingCompleted", "configuracionInicial", "createdAt", "updatedAt")
VALUES
  ('company_inmova_platform', 'INMOVA Platform', 'mixto', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_gestora_test', 'Gestora Inmobiliaria Test', 'alquiler_tradicional', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_vacational', 'Vacational Homes SL', 'str_vacacional', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_coliving_mad', 'Urban Coliving Madrid', 'coliving', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_constructora', 'Constructora Inmova SA', 'construccion', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_inversiones', 'Inversiones Inmobiliarias 360', 'flipping', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_primera_gestora', 'Mi Primera Gestora', 'alquiler_tradicional', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_profesional', 'Gestora Profesional SL', 'alquiler_tradicional', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_experta', 'Gestora Experta 360', 'alquiler_tradicional', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_str_pro', 'STR Management Pro', 'str_vacacional', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_coliving_bcn', 'Coliving Spaces BCN', 'coliving', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_admin_fincas', 'Administrador de Fincas Madrid', 'comunidades', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_fincas_total', 'Fincas Gestion Total', 'comunidades', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_360_integral', 'Gestora 360 Integral', 'mixto', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW()),
  ('company_arquitectura', 'Arquitectura & Asesoría', 'servicios_profesionales', true, false, '{"setupStep": "pending", "preferredModules": []}', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "businessVertical" = EXCLUDED."businessVertical",
  activo = EXCLUDED.activo,
  "updatedAt" = NOW();

-- Ahora crear los usuarios
-- Password hash para Test123456!: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO "User" (id, email, name, password, role, "companyId", activo, "emailVerified", "onboardingCompleted", preferences, "createdAt", "updatedAt")
VALUES
  -- SUPER ADMIN
  ('user_superadmin', 'superadmin@inmova.app', 'Super Admin Test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'super_admin', 'company_inmova_platform', true, NOW(), false, '{"experienceLevel": "avanzado", "vertical": "mixto", "theme": "light", "language": "es"}', NOW(), NOW()),
  
  -- ADMINISTRADORES
  ('user_admin_alquiler', 'admin.alquiler@inmova.app', 'Admin Alquiler Tradicional', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'administrador', 'company_gestora_test', true, NOW(), false, '{"experienceLevel": "intermedio", "vertical": "alquiler_tradicional", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_admin_str', 'admin.str@inmova.app', 'Admin STR Vacacional', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'administrador', 'company_vacational', true, NOW(), false, '{"experienceLevel": "avanzado", "vertical": "str_vacacional", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_admin_coliving', 'admin.coliving@inmova.app', 'Admin Coliving', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'administrador', 'company_coliving_mad', true, NOW(), false, '{"experienceLevel": "intermedio", "vertical": "coliving", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_admin_construccion', 'admin.construccion@inmova.app', 'Admin Construcción', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'administrador', 'company_constructora', true, NOW(), false, '{"experienceLevel": "avanzado", "vertical": "construccion", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_admin_flipping', 'admin.flipping@inmova.app', 'Admin House Flipping', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'administrador', 'company_inversiones', true, NOW(), false, '{"experienceLevel": "avanzado", "vertical": "flipping", "theme": "light", "language": "es"}', NOW(), NOW()),
  
  -- GESTORES (diferentes experiencias)
  ('user_gestor_principiante', 'gestor.principiante@inmova.app', 'Gestor Principiante', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'gestor', 'company_primera_gestora', true, NOW(), false, '{"experienceLevel": "principiante", "vertical": "alquiler_tradicional", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_gestor_intermedio', 'gestor.intermedio@inmova.app', 'Gestor Intermedio', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'gestor', 'company_profesional', true, NOW(), false, '{"experienceLevel": "intermedio", "vertical": "alquiler_tradicional", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_gestor_avanzado', 'gestor.avanzado@inmova.app', 'Gestor Avanzado', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'gestor', 'company_experta', true, NOW(), false, '{"experienceLevel": "avanzado", "vertical": "alquiler_tradicional", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_gestor_str', 'gestor.str@inmova.app', 'Gestor STR', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'gestor', 'company_str_pro', true, NOW(), false, '{"experienceLevel": "intermedio", "vertical": "str_vacacional", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_gestor_coliving', 'gestor.coliving@inmova.app', 'Gestor Coliving', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'gestor', 'company_coliving_bcn', true, NOW(), false, '{"experienceLevel": "intermedio", "vertical": "coliving", "theme": "light", "language": "es"}', NOW(), NOW()),
  
  -- OPERADORES
  ('user_operador_mant', 'operador.mantenimiento@inmova.app', 'Operador Mantenimiento', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'operador', 'company_profesional', true, NOW(), false, '{"experienceLevel": "principiante", "vertical": "alquiler_tradicional", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_operador_insp', 'operador.inspecciones@inmova.app', 'Operador Inspecciones', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'operador', 'company_str_pro', true, NOW(), false, '{"experienceLevel": "intermedio", "vertical": "str_vacacional", "theme": "light", "language": "es"}', NOW(), NOW()),
  
  -- SOPORTE
  ('user_soporte_atencion', 'soporte.atencion@inmova.app', 'Agente de Soporte', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'soporte', 'company_profesional', true, NOW(), false, '{"experienceLevel": "principiante", "vertical": "alquiler_tradicional", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_soporte_tickets', 'soporte.tickets@inmova.app', 'Soporte Tickets', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'soporte', 'company_coliving_bcn', true, NOW(), false, '{"experienceLevel": "intermedio", "vertical": "coliving", "theme": "light", "language": "es"}', NOW(), NOW()),
  
  -- COMMUNITY MANAGERS
  ('user_cm_comunidades', 'cm.comunidades@inmova.app', 'Community Manager', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'community_manager', 'company_admin_fincas', true, NOW(), false, '{"experienceLevel": "intermedio", "vertical": "comunidades", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_cm_juntas', 'cm.juntas@inmova.app', 'Gestor de Juntas', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'community_manager', 'company_fincas_total', true, NOW(), false, '{"experienceLevel": "avanzado", "vertical": "comunidades", "theme": "light", "language": "es"}', NOW(), NOW()),
  
  -- CASOS ESPECIALES
  ('user_gestor_mixto', 'gestor.mixto@inmova.app', 'Gestor Multi-Vertical', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'gestor', 'company_360_integral', true, NOW(), false, '{"experienceLevel": "avanzado", "vertical": "mixto", "theme": "light", "language": "es"}', NOW(), NOW()),
  ('user_admin_servicios', 'admin.servicios@inmova.app', 'Admin Servicios Profesionales', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'administrador', 'company_arquitectura', true, NOW(), false, '{"experienceLevel": "avanzado", "vertical": "servicios_profesionales", "theme": "light", "language": "es"}', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  "companyId" = EXCLUDED."companyId",
  activo = EXCLUDED.activo,
  "emailVerified" = EXCLUDED."emailVerified",
  "onboardingCompleted" = EXCLUDED."onboardingCompleted",
  preferences = EXCLUDED.preferences,
  "updatedAt" = NOW();

-- Mostrar resumen
SELECT 
  '✅ USUARIOS CREADOS' as status,
  COUNT(*) as total
FROM "User"
WHERE email LIKE '%@inmova.app';

SELECT
  email,
  name,
  role,
  (preferences->>'experienceLevel') as experiencia,
  (preferences->>'vertical') as vertical
FROM "User"
WHERE email LIKE '%@inmova.app'
ORDER BY role, email;
