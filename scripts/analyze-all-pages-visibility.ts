/**
 * Análisis completo de visibilidad de páginas en sidebar
 */

// Todas las páginas existentes en /app (dashboard, admin, portales)
const existingPages = {
  // Dashboard principal y submódulos
  dashboard: [
    '/dashboard',
    '/dashboard/adaptive',
    '/dashboard/analytics',
    '/dashboard/budgets',
    '/dashboard/community',
    '/dashboard/contracts',
    '/dashboard/coupons',
    '/dashboard/documents',
    '/dashboard/integrations',
    '/dashboard/integrations/api-keys',
    '/dashboard/maintenance',
    '/dashboard/messages',
    '/dashboard/payments',
    '/dashboard/properties',
    '/dashboard/referrals',
    '/dashboard/tenants',
  ],

  // Dashboard protegido (con group)
  dashboardProtected: [
    '/dashboard/crm',
    '/dashboard/social-media',
  ],

  // Dashboard con parentesis (dashboard)
  dashboardParen: [
    '/admin-fincas',
    '/admin-fincas/comunidades',
    '/admin-fincas/facturas',
    '/admin-fincas/informes',
    '/admin-fincas/libro-caja',
    '/coliving',
    '/configuracion',
    '/dashboard-propietarios',
    '/documentos/buscar',
    '/mensajes',
    '/reportes/programados',
    '/traditional-rental',
    '/traditional-rental/communities',
    '/traditional-rental/compliance',
    '/traditional-rental/renewals',
    '/traditional-rental/treasury',
  ],
};

// Páginas en sidebar
const sidebarPages = {
  // De components/layout/sidebar.tsx
  alquilerResidencial: [
    '/edificios',
    '/unidades',
    '/garajes-trasteros',
    '/inquilinos',
    '/contratos',
    '/candidatos',
    '/screening',
    '/valoraciones',
    '/inspecciones',
    '/certificaciones',
    '/seguros',
  ],

  str: [
    '/str',
    '/str/listings',
    '/str/bookings',
    '/str/channels',
    '/str/pricing',
    '/str/reviews',
    '/str-housekeeping',
    '/str-advanced',
  ],

  coLiving: [
    '/room-rental',
    '/comunidad-social',
    '/reservas',
  ],

  finanzas: [
    '/pagos',
    '/gastos',
    '/facturacion',
    '/contabilidad',
    '/open-banking',
  ],

  analytics: [
    '/bi',
    '/analytics',
    '/reportes',
    '/asistente-ia',
  ],

  operaciones: [
    '/mantenimiento',
    '/mantenimiento-preventivo',
    '/tareas',
    '/incidencias',
    '/calendario',
    '/visitas',
  ],

  comunicaciones: [
    '/chat',
    '/notificaciones',
    '/sms',
    '/redes-sociales',
    '/publicaciones',
  ],

  documentos: [
    '/documentos',
    '/ocr',
    '/firma-digital',
    '/legal',
    '/seguridad-compliance',
    '/auditoria',
    '/plantillas',
  ],

  crm: [
    '/crm',
    '/portal-comercial',
    '/marketplace',
    '/galerias',
    '/tours-virtuales',
  ],

  adminFincas: [
    '/comunidades',
    '/anuncios',
    '/votaciones',
    '/reuniones',
    '/comunidades/cuotas',
    '/comunidades/fondos',
    '/comunidades/finanzas',
  ],
};

// Mapeo de rutas dashboard a rutas reales
const dashboardRouteMapping = {
  '/dashboard/properties': '/propiedades', // ¿Debería ser dashboard/properties?
  '/dashboard/tenants': '/inquilinos', // Ya está en sidebar como /inquilinos
  '/dashboard/contracts': '/contratos', // Ya está
  '/dashboard/payments': '/pagos', // Ya está
  '/dashboard/maintenance': '/mantenimiento', // Ya está
  '/dashboard/documents': '/documentos', // Ya está
  '/dashboard/analytics': '/analytics', // Ya está
  '/dashboard/messages': '/chat', // Ya está como /chat
  '/dashboard/community': '/comunidades', // Ya está
};

console.log('===============================================');
console.log('📊 ANÁLISIS COMPLETO DE PÁGINAS VISIBLES');
console.log('===============================================\n');

// Páginas de dashboard que necesitan verificación
const dashboardPagesToCheck = [
  ...existingPages.dashboard,
  ...existingPages.dashboardProtected,
  ...existingPages.dashboardParen,
];

console.log(`📋 Total de páginas dashboard: ${dashboardPagesToCheck.length}`);
console.log('\n🔍 PÁGINAS QUE PUEDEN NECESITAR LINKS EN SIDEBAR:\n');

const potentiallyMissing = [
  '/dashboard/adaptive',
  '/dashboard/budgets',
  '/dashboard/coupons',
  '/dashboard/integrations',
  '/dashboard/referrals',
  '/dashboard/crm',
  '/dashboard/social-media',
  '/admin-fincas', // Ya está
  '/coliving', // Ya está como /room-rental
  '/configuracion', // Ya está en admin
  '/dashboard-propietarios',
  '/mensajes', // Ya está como /chat
  '/reportes/programados', // Ya está en admin
  '/traditional-rental',
];

const actuallyMissing: string[] = [];

potentiallyMissing.forEach(page => {
  // Verificar si existe alguna variante en el sidebar
  const exists = Object.values(sidebarPages).some(section => 
    section.some(sidebarPage => 
      sidebarPage === page || 
      sidebarPage.includes(page.split('/').pop() || '')
    )
  );
  
  if (!exists && !page.includes('/admin')) {
    actuallyMissing.push(page);
  }
});

if (actuallyMissing.length > 0) {
  console.log('❌ PÁGINAS QUE FALTAN:');
  actuallyMissing.forEach(page => {
    console.log(`   - ${page}`);
  });
  console.log();
} else {
  console.log('✅ Todas las páginas importantes están accesibles\n');
}

console.log('===============================================');
console.log('📝 RECOMENDACIONES');
console.log('===============================================\n');

const recommendations = [
  {
    page: '/dashboard/adaptive',
    recommendation: 'Agregar en Dashboard Principal o Analytics',
    reason: 'Dashboard adaptativo podría ser útil',
  },
  {
    page: '/dashboard/budgets',
    recommendation: 'Agregar en sección Finanzas',
    reason: 'Presupuestos son parte de finanzas',
  },
  {
    page: '/dashboard/coupons',
    recommendation: 'Agregar en CRM/Marketing o como módulo específico',
    reason: 'Cupones para campañas de marketing',
  },
  {
    page: '/dashboard/integrations',
    recommendation: 'Agregar en Configuración Empresa o Super Admin',
    reason: 'Gestión de integraciones con terceros',
  },
  {
    page: '/dashboard/referrals',
    recommendation: 'Agregar en CRM/Marketing',
    reason: 'Programa de referidos',
  },
  {
    page: '/dashboard/crm',
    recommendation: '✅ Ya está en sidebar como /crm',
    reason: '',
  },
  {
    page: '/dashboard/social-media',
    recommendation: '✅ Ya está en sidebar como /redes-sociales',
    reason: '',
  },
  {
    page: '/dashboard-propietarios',
    recommendation: 'Verificar si es un portal independiente o necesita link',
    reason: 'Portal específico para propietarios',
  },
  {
    page: '/traditional-rental',
    recommendation: 'Agregar en Verticales (Alquiler Residencial)',
    reason: 'Vertical específico de alquiler tradicional',
  },
];

recommendations.forEach(({ page, recommendation, reason }) => {
  if (!recommendation.includes('✅')) {
    console.log(`📌 ${page}`);
    console.log(`   → ${recommendation}`);
    if (reason) console.log(`   💡 ${reason}`);
    console.log();
  }
});

console.log('===============================================\n');

export {};
