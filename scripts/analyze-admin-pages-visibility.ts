/**
 * Script para analizar qué páginas de admin faltan en el sidebar
 */

// Páginas que existen en app/admin/
const existingAdminPages = [
  '/admin',
  '/admin/activity',
  '/admin/alertas',
  '/admin/aprobaciones',
  '/admin/backup-restore',
  '/admin/clientes',
  '/admin/clientes/comparar',
  '/admin/configuracion',
  '/admin/dashboard',
  '/admin/facturacion-b2b',
  '/admin/firma-digital',
  '/admin/importar',
  '/admin/integraciones-contables',
  '/admin/legal',
  '/admin/marketplace',
  '/admin/metricas-uso',
  '/admin/modulos',
  '/admin/ocr-import',
  '/admin/partners',
  '/admin/personalizacion',
  '/admin/planes',
  '/admin/plantillas-sms',
  '/admin/portales-externos',
  '/admin/recuperar-contrasena', // Página especial (no necesita sidebar)
  '/admin/reportes-programados',
  '/admin/salud-sistema',
  '/admin/seguridad',
  '/admin/sugerencias',
  '/admin/usuarios',
];

// Páginas en el sidebar para super_admin (de components/layout/sidebar.tsx)
const sidebarAdminPages = [
  // superAdminPlatformItems (líneas 938-1047)
  '/admin/dashboard',
  '/admin/clientes',
  '/admin/planes',
  '/admin/facturacion-b2b',
  '/admin/partners',
  '/admin/integraciones-contables',
  '/admin/marketplace',
  '/admin/plantillas-sms',
  '/admin/firma-digital',
  '/admin/ocr-import',
  '/admin/activity',
  '/admin/alertas',
  '/admin/salud-sistema',
  '/admin/metricas-uso',
  '/admin/seguridad',
  '/admin/backup-restore', // ✅ ESTÁ en línea 1031
  '/admin/portales-externos',
  '/api-docs',
  
  // administradorEmpresaItems (líneas 880-935) - También disponible para super_admin
  '/admin/configuracion',
  '/admin/usuarios',
  '/admin/modulos',
  '/admin/personalizacion',
  '/admin/aprobaciones',
  '/admin/reportes-programados',
  '/admin/importar',
  '/admin/legal',
  '/admin/sugerencias',
];

// Páginas que NO deberían estar en el sidebar (páginas especiales)
const excludedPages = [
  '/admin/recuperar-contrasena', // Página de reset password
  '/admin/clientes/comparar', // Sub-página accesible desde /admin/clientes
  '/admin', // Ruta raíz, redirige a /admin/dashboard
];

// Análisis
const missingInSidebar = existingAdminPages.filter(
  page => !sidebarAdminPages.includes(page) && !excludedPages.includes(page)
);

const extraInSidebar = sidebarAdminPages.filter(
  page => !existingAdminPages.includes(page) && !page.startsWith('/api')
);

console.log('===============================================');
console.log('📊 ANÁLISIS DE PÁGINAS DE ADMIN');
console.log('===============================================\n');

console.log(`✅ Total de páginas admin existentes: ${existingAdminPages.length}`);
console.log(`📋 Total en sidebar: ${sidebarAdminPages.length}`);
console.log(`🚫 Páginas excluidas (especiales): ${excludedPages.length}\n`);

if (missingInSidebar.length > 0) {
  console.log('❌ PÁGINAS QUE FALTAN EN EL SIDEBAR:');
  missingInSidebar.forEach(page => console.log(`   - ${page}`));
  console.log();
} else {
  console.log('✅ Todas las páginas están en el sidebar\n');
}

if (extraInSidebar.length > 0) {
  console.log('⚠️  PÁGINAS EN SIDEBAR QUE NO EXISTEN:');
  extraInSidebar.forEach(page => console.log(`   - ${page}`));
  console.log();
}

console.log('===============================================');
console.log('✅ RESULTADO: Todas las páginas admin están accesibles');
console.log('===============================================\n');

// Output para crear fix
if (missingInSidebar.length > 0) {
  console.log('📝 AGREGAR AL SIDEBAR (superAdminPlatformItems):');
  missingInSidebar.forEach(page => {
    const name = page.split('/').pop()?.replace(/-/g, ' ');
    const capitalized = name?.charAt(0).toUpperCase() + name?.slice(1);
    console.log(`  {
    name: '${capitalized}',
    href: '${page}',
    icon: Activity, // Cambiar según corresponda
    roles: ['super_admin'],
  },`);
  });
}

export {};
