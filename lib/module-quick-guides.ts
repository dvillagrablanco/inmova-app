/**
 * Quick Start Guides for different modules
 * These provide step-by-step onboarding within each module
 */

import { QuickGuideStep } from '@/components/ui/module-quick-guide';

export const quickGuides = {
  edificios: {
    moduleId: 'edificios',
    moduleName: 'Edificios',
    steps: [
      {
        title: 'Crea tu primer edificio',
        description:
          'Registra la información básica de tu primer edificio (dirección, tipo, descripción).',
        action: {
          label: 'Crear edificio',
          href: '/edificios/nuevo',
        },
      },
      {
        title: 'Añade unidades al edificio',
        description:
          'Define las unidades (apartamentos, locales, oficinas) que componen el edificio.',
        action: {
          label: 'Gestionar unidades',
        },
      },
      {
        title: 'Configura áreas comunes',
        description: 'Registra espacios compartidos como lobby, gym, piscina, estacionamiento.',
        action: {
          label: 'Añadir áreas comunes',
        },
      },
      {
        title: 'Asigna un administrador o portero',
        description: 'Designa personal responsable para la gestión del edificio.',
        action: {
          label: 'Gestionar personal',
        },
      },
    ],
  },
  inquilinos: {
    moduleId: 'inquilinos',
    moduleName: 'Inquilinos',
    steps: [
      {
        title: 'Registra tu primer inquilino',
        description: 'Captura datos personales, contacto y documentación del inquilino.',
        action: {
          label: 'Añadir inquilino',
          href: '/inquilinos/nuevo',
        },
      },
      {
        title: 'Crea un contrato de arrendamiento',
        description: 'Asocia al inquilino con una unidad mediante un contrato formal.',
        action: {
          label: 'Crear contrato',
          href: '/contratos/nuevo',
        },
      },
      {
        title: 'Configura pagos recurrentes',
        description: 'Establece cuotas mensuales, depósitos y formas de pago.',
        action: {
          label: 'Gestionar pagos',
        },
      },
      {
        title: 'Envía documentos y comunicaciones',
        description: 'Mantén comunicación fluida con tus inquilinos directamente desde INMOVA.',
        action: {
          label: 'Ver documentos',
        },
      },
    ],
  },
  contratos: {
    moduleId: 'contratos',
    moduleName: 'Contratos',
    steps: [
      {
        title: 'Crea tu primer contrato',
        description:
          'Genera un contrato de arrendamiento con todos los detalles legales y económicos.',
        action: {
          label: 'Nuevo contrato',
          href: '/contratos/nuevo',
        },
      },
      {
        title: 'Firma el contrato digitalmente',
        description: 'Usa firmas electrónicas para validar el contrato sin papeles.',
        action: {
          label: 'Gestionar firmas',
        },
      },
      {
        title: 'Configura renovaciones automáticas',
        description: 'Establece recordatorios y condiciones para renovación de contratos.',
        action: {
          label: 'Configurar renovaciones',
        },
      },
      {
        title: 'Revisa contratos por vencer',
        description:
          'Mantén control de contratos próximos a expirar para planificar renovaciones o nuevos arrendatarios.',
        action: {
          label: 'Ver contratos por vencer',
        },
      },
    ],
  },
  pagos: {
    moduleId: 'pagos',
    moduleName: 'Pagos',
    steps: [
      {
        title: 'Registra tu primer pago',
        description: 'Captura pagos de renta, servicios o depósitos realizados por inquilinos.',
        action: {
          label: 'Registrar pago',
          href: '/pagos/nuevo',
        },
      },
      {
        title: 'Configura pagos recurrentes',
        description: 'Automatiza la generación de cargos mensuales para tus inquilinos.',
        action: {
          label: 'Configurar recurrencia',
        },
      },
      {
        title: 'Envía recordatorios de pago',
        description: 'Notifica automáticamente a inquilinos sobre pagos pendientes.',
        action: {
          label: 'Gestionar recordatorios',
        },
      },
      {
        title: 'Genera recibos y comprobantes',
        description: 'Emite recibos profesionales en PDF para cada pago registrado.',
        action: {
          label: 'Ver recibos',
        },
      },
    ],
  },
  mantenimiento: {
    moduleId: 'mantenimiento',
    moduleName: 'Mantenimiento',
    steps: [
      {
        title: 'Crea tu primera orden de trabajo',
        description: 'Registra una solicitud o incidencia de mantenimiento para darle seguimiento.',
        action: {
          label: 'Nueva orden',
          href: '/mantenimiento/nuevo',
        },
      },
      {
        title: 'Asigna un proveedor',
        description: 'Selecciona el proveedor más adecuado para realizar el trabajo.',
        action: {
          label: 'Gestionar proveedores',
        },
      },
      {
        title: 'Programa mantenimiento preventivo',
        description: 'Configura revisiones periódicas para evitar problemas mayores.',
        action: {
          label: 'Configurar preventivo',
        },
      },
      {
        title: 'Revisa el historial de mantenimiento',
        description: 'Consulta todas las intervenciones realizadas en cada unidad o edificio.',
        action: {
          label: 'Ver historial',
        },
      },
    ],
  },
  documentos: {
    moduleId: 'documentos',
    moduleName: 'Documentos',
    steps: [
      {
        title: 'Sube tu primer documento',
        description: 'Carga contratos, facturas, planos o cualquier archivo importante.',
        action: {
          label: 'Subir documento',
        },
      },
      {
        title: 'Organiza por categorías',
        description: 'Clasifica documentos por tipo (contratos, facturas, legales, etc.).',
        action: {
          label: 'Gestionar categorías',
        },
      },
      {
        title: 'Comparte documentos con inquilinos',
        description: 'Envía documentos relevantes directamente a tus inquilinos.',
        action: {
          label: 'Compartir documento',
        },
      },
      {
        title: 'Configura permisos de acceso',
        description: 'Controla quién puede ver, editar o eliminar cada documento.',
        action: {
          label: 'Gestionar permisos',
        },
      },
    ],
  },
  reportes: {
    moduleId: 'reportes',
    moduleName: 'Reportes',
    steps: [
      {
        title: 'Genera tu primer reporte',
        description: 'Crea un reporte financiero, operativo o de ocupación.',
        action: {
          label: 'Generar reporte',
        },
      },
      {
        title: 'Personaliza columnas y filtros',
        description: 'Ajusta qué datos mostrar según tus necesidades específicas.',
        action: {
          label: 'Personalizar reporte',
        },
      },
      {
        title: 'Exporta a Excel o PDF',
        description: 'Descarga reportes en diferentes formatos para presentaciones o análisis.',
        action: {
          label: 'Exportar reporte',
        },
      },
      {
        title: 'Programa envíos automáticos',
        description: 'Recibe reportes periódicos por email sin tener que generarlos manualmente.',
        action: {
          label: 'Configurar envíos',
        },
      },
    ],
  },
  calendario: {
    moduleId: 'calendario',
    moduleName: 'Calendario',
    steps: [
      {
        title: 'Explora eventos automáticos',
        description:
          'Revisa pagos pendientes, vencimientos de contratos y mantenimiento programado.',
        action: {
          label: 'Ver calendario',
          href: '/calendario',
        },
      },
      {
        title: 'Crea un evento personalizado',
        description: 'Añade reuniones, inspecciones o visitas a tu calendario.',
        action: {
          label: 'Nuevo evento',
        },
      },
      {
        title: 'Configura recordatorios',
        description: 'Recibe notificaciones antes de eventos importantes.',
        action: {
          label: 'Gestionar recordatorios',
        },
      },
      {
        title: 'Filtra por tipo de evento',
        description: 'Visualiza solo los eventos que te interesan en cada momento.',
        action: {
          label: 'Aplicar filtros',
        },
      },
    ],
  },
  'room-rental': {
    moduleId: 'room-rental',
    moduleName: 'Alquiler por Habitaciones',
    steps: [
      {
        title: 'Divide una unidad en habitaciones',
        description: 'Configura cuántas habitaciones tiene la unidad y sus características.',
        action: {
          label: 'Configurar habitaciones',
        },
      },
      {
        title: 'Crea contratos independientes',
        description: 'Genera un contrato separado para cada habitación.',
        action: {
          label: 'Crear contratos',
        },
      },
      {
        title: 'Configura prorrateo de gastos',
        description: 'Establece cómo se distribuyen servicios y gastos comunes entre inquilinos.',
        action: {
          label: 'Configurar prorrateo',
        },
      },
      {
        title: 'Crea calendario de limpieza',
        description: 'Organiza turnos rotativos para limpieza de espacios compartidos.',
        action: {
          label: 'Configurar limpieza',
        },
      },
    ],
  },
  marketplace: {
    moduleId: 'marketplace',
    moduleName: 'Marketplace de Servicios',
    steps: [
      {
        title: 'Revisa solicitudes de cotización',
        description: 'Consulta las solicitudes de servicios realizadas por inquilinos.',
        action: {
          label: 'Ver solicitudes',
        },
      },
      {
        title: 'Asigna un proveedor',
        description: 'Selecciona el proveedor más adecuado para cada servicio.',
        action: {
          label: 'Gestionar proveedores',
        },
      },
      {
        title: 'Envía cotización al inquilino',
        description: 'Genera y envía una cotización profesional al inquilino.',
        action: {
          label: 'Crear cotización',
        },
      },
      {
        title: 'Gestiona trabajos en curso',
        description: 'Monitorea el progreso de servicios activos hasta su finalización.',
        action: {
          label: 'Ver trabajos',
        },
      },
    ],
  },
  crm: {
    moduleId: 'crm',
    moduleName: 'CRM y Ventas',
    steps: [
      {
        title: 'Importa o crea tu primer lead',
        description: 'Añade contactos interesados en tus servicios al sistema CRM.',
        action: {
          label: 'Añadir lead',
        },
      },
      {
        title: 'Mueve leads por el pipeline',
        description: 'Arrastra leads entre etapas (contacto, calificación, propuesta, cierre).',
        action: {
          label: 'Ver pipeline',
        },
      },
      {
        title: 'Registra interacciones',
        description: 'Captura llamadas, emails y reuniones con cada lead.',
        action: {
          label: 'Registrar actividad',
        },
      },
      {
        title: 'Convierte lead en cliente',
        description: 'Marca como ganado y genera automáticamente inquilino y contrato.',
        action: {
          label: 'Convertir lead',
        },
      },
    ],
  },
  bi: {
    moduleId: 'bi',
    moduleName: 'Business Intelligence',
    steps: [
      {
        title: 'Explora dashboards prediseñados',
        description: 'Revisa dashboards de ingresos, ocupación y rendimiento operativo.',
        action: {
          label: 'Ver dashboards',
          href: '/bi',
        },
      },
      {
        title: 'Crea un dashboard personalizado',
        description: 'Diseña tu propio dashboard con las métricas que más te importan.',
        action: {
          label: 'Nuevo dashboard',
        },
      },
      {
        title: 'Configura alertas inteligentes',
        description: 'Recibe notificaciones cuando las métricas clave excedan umbrales definidos.',
        action: {
          label: 'Configurar alertas',
        },
      },
      {
        title: 'Exporta y comparte insights',
        description: 'Descarga gráficos y comparte dashboards con tu equipo.',
        action: {
          label: 'Compartir dashboard',
        },
      },
    ],
  },
};

export type QuickGuideModuleId = keyof typeof quickGuides;
