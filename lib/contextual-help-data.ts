// Definiciones de ayuda contextual para cada módulo

export const helpData = {
  dashboard: {
    module: 'Dashboard',
    title: 'Panel de Control',
    description: 'Vista general de tu negocio inmobiliario con métricas clave y accesos rápidos.',
    sections: [
      {
        title: '¿Qué puedo ver aquí?',
        content:
          'El dashboard te muestra las métricas más importantes de tu negocio: edificios gestionados, inquilinos activos, ingresos mensuales, y tareas pendientes.',
        tips: [
          'Las tarjetas KPI muestran cambios respecto al mes anterior',
          'Los gráficos son interactivos: haz clic para más detalles',
          'Puedes exportar cualquier gráfico como imagen',
        ],
      },
      {
        title: 'Personalización',
        content: 'Puedes personalizar qué métricas ver y cómo se organizan en tu dashboard.',
        tips: [
          'Arrastra las tarjetas para reordenarlas',
          'Haz clic en el icono de ojo para ocultar/mostrar secciones',
          'Tus preferencias se guardan automáticamente',
        ],
      },
    ],
  },

  edificios: {
    module: 'Edificios',
    title: 'Gestión de Edificios',
    description: 'Administra todas tus propiedades y edificios desde un solo lugar.',
    sections: [
      {
        title: 'Crear un nuevo edificio',
        content:
          'Haz clic en "Nuevo Edificio" para registrar una nueva propiedad. Necesitarás la dirección completa, número de unidades, y datos del propietario.',
        tips: [
          'Puedes agregar fotos del edificio durante o después de la creación',
          'Los campos marcados con * son obligatorios',
          'Guarda borradores para completar la información más tarde',
        ],
      },
      {
        title: 'Ver y editar edificios',
        content:
          'Haz clic en cualquier edificio para ver sus detalles completos, unidades, inquilinos, y documentos asociados.',
        tips: [
          'Usa los filtros para encontrar edificios rápidamente',
          'Exporta la lista de edificios a Excel o PDF',
          'Configura alertas para mantenimientos programados',
        ],
      },
      {
        title: 'Unidades por edificio',
        content:
          'Cada edificio puede tener múltiples unidades (apartamentos, locales, etc.). Gestiona el estado de ocupación de cada una.',
        tips: [
          'Marca unidades como disponibles, ocupadas, o en mantenimiento',
          'Asigna inquilinos directamente desde la vista de unidades',
          'Configura precios de alquiler diferentes por unidad',
        ],
      },
    ],
  },

  inquilinos: {
    module: 'Inquilinos',
    title: 'Gestión de Inquilinos',
    description: 'Administra toda la información de tus inquilinos y sus contratos.',
    sections: [
      {
        title: 'Registrar inquilino',
        content:
          'Crea un perfil completo del inquilino con sus datos personales, información de contacto, y referencias.',
        tips: [
          'Sube documentos como DNI, nóminas, o aval bancario',
          'El scoring automático evalúa la solvencia',
          'Puedes vincular múltiples inquilinos a un mismo contrato',
        ],
      },
      {
        title: 'Verificación y screening',
        content:
          'INMOVA incluye herramientas de verificación para evaluar la idoneidad de los candidatos.',
        tips: [
          'Revisa el historial de pagos de inquilinos anteriores',
          'Solicita referencias automáticamente por email',
          'Accede a informes de solvencia integrados',
        ],
      },
      {
        title: 'Comunicación',
        content:
          'Mantén comunicación fluida con tus inquilinos a través del chat integrado y notificaciones.',
        tips: [
          'Envía recordatorios de pago automáticos',
          'Los inquilinos pueden reportar incidencias desde su portal',
          'Configura plantillas de mensajes frecuentes',
        ],
      },
    ],
  },

  contratos: {
    module: 'Contratos',
    title: 'Gestión de Contratos',
    description: 'Crea, firma y gestiona contratos de alquiler de forma digital.',
    sections: [
      {
        title: 'Crear contrato',
        content:
          'Genera contratos profesionales usando plantillas personalizables. Incluye todas las cláusulas necesarias y personalizaciones.',
        tips: [
          'Usa plantillas predefinidas para ahorrar tiempo',
          'Todas las plantillas cumplen con la legislación vigente',
          'Personaliza cláusulas según tus necesidades',
        ],
      },
      {
        title: 'Firma digital',
        content:
          'Los contratos pueden firmarse digitalmente por todas las partes, con validez legal completa.',
        tips: [
          'Las firmas digitales tienen la misma validez que las manuscritas',
          'Recibe notificaciones cuando todas las partes firmen',
          'Descarga el contrato firmado en PDF',
        ],
      },
      {
        title: 'Seguimiento y renovación',
        content:
          'Recibe alertas automáticas sobre fechas de vencimiento y gestiona renovaciones fácilmente.',
        tips: [
          'Configura cuándo recibir alertas de vencimiento (30, 60, 90 días)',
          'Renueva contratos con un solo clic',
          'Actualiza precios automáticamente según IPC',
        ],
      },
    ],
  },

  pagos: {
    module: 'Pagos',
    title: 'Gestión de Pagos',
    description: 'Controla ingresos, pagos pendientes y genera recordatorios automáticos.',
    sections: [
      {
        title: 'Registrar pagos',
        content:
          'Registra pagos manualmente o configura pagos recurrentes automáticos para alquileres mensuales.',
        tips: [
          'Vincula pagos a contratos específicos',
          'Soporta múltiples métodos de pago',
          'Genera recibos automáticamente',
        ],
      },
      {
        title: 'Pagos pendientes',
        content: 'Vista clara de todos los pagos pendientes con fechas de vencimiento y montos.',
        tips: [
          'Filtra por inquilino, edificio o rango de fechas',
          'Envía recordatorios automáticos antes del vencimiento',
          'Marca pagos como parciales si es necesario',
        ],
      },
      {
        title: 'Morosidad',
        content: 'Sistema de gestión de morosidad con alertas tempranas y predicciones de riesgo.',
        tips: [
          'El sistema predice qué inquilinos tienen riesgo de morosidad',
          'Configura acciones automáticas para pagos atrasados',
          'Genera reportes de morosidad para análisis',
        ],
      },
    ],
  },

  mantenimiento: {
    module: 'Mantenimiento',
    title: 'Gestión de Mantenimiento',
    description: 'Gestiona incidencias, mantenimiento preventivo y órdenes de trabajo.',
    sections: [
      {
        title: 'Reportar incidencia',
        content: 'Crea tickets de mantenimiento con descripción, fotos, prioridad y asignación.',
        tips: [
          'Inquilinos pueden reportar incidencias desde su portal',
          'Asigna prioridades: urgente, alta, media, baja',
          'Adjunta fotos para mejor comprensión del problema',
        ],
      },
      {
        title: 'Asignar a proveedores',
        content: 'Asigna trabajos a tu red de proveedores de mantenimiento y da seguimiento.',
        tips: [
          'Mantén una base de datos de proveedores de confianza',
          'Los proveedores reciben notificaciones automáticas',
          'Ellos pueden actualizar el estado desde su portal',
        ],
      },
      {
        title: 'Mantenimiento preventivo',
        content: 'Programa mantenimientos recurrentes para evitar problemas mayores.',
        tips: [
          'Programa revisiones anuales de calderas, ascensores, etc.',
          'Recibe recordatorios automáticos',
          'Lleva historial completo de todos los mantenimientos',
        ],
      },
    ],
  },

  documentos: {
    module: 'Documentos',
    title: 'Gestión Documental',
    description: 'Almacena, organiza y comparte documentos de forma segura.',
    sections: [
      {
        title: 'Subir documentos',
        content:
          'Sube cualquier tipo de documento relacionado con edificios, inquilinos o contratos.',
        tips: [
          'Soporta PDF, imágenes, Word, Excel y más',
          'Organiza en carpetas por categoría',
          'Agrega etiquetas para búsqueda rápida',
        ],
      },
      {
        title: 'Compartir documentos',
        content: 'Comparte documentos específicos con inquilinos, propietarios o proveedores.',
        tips: [
          'Controla quién puede ver o descargar cada documento',
          'Los documentos compartidos aparecen en sus portales',
          'Recibe notificaciones cuando se visualicen',
        ],
      },
      {
        title: 'Firma digital',
        content: 'Envía documentos para firma digital con validez legal.',
        tips: [
          'Válido para contratos, acuerdos y documentos oficiales',
          'Seguimiento del estado de firma en tiempo real',
          'Certificados de firma con timestamp',
        ],
      },
    ],
  },

  reportes: {
    module: 'Reportes',
    title: 'Reportes y Analítica',
    description: 'Genera reportes detallados y visualiza estadísticas de tu negocio.',
    sections: [
      {
        title: 'Reportes predefinidos',
        content:
          'Accede a una variedad de reportes listos para usar: ocupación, ingresos, morosidad, etc.',
        tips: [
          'Exporta reportes en Excel, PDF o CSV',
          'Filtra por rangos de fecha personalizados',
          'Programa envío automático por email',
        ],
      },
      {
        title: 'Reportes personalizados',
        content: 'Crea tus propios reportes con las métricas y filtros que necesites.',
        tips: [
          'Arrastra y suelta campos para crear tu reporte',
          'Guarda plantillas para reutilizar',
          'Comparte reportes con tu equipo',
        ],
      },
      {
        title: 'Programación de reportes',
        content:
          'Configura el envío automático de reportes por email en los intervalos que necesites.',
        tips: [
          'Elige frecuencia: diaria, semanal, mensual o personalizada',
          'Define múltiples destinatarios para cada reporte',
          'Los reportes se generan y envían automáticamente en segundo plano',
          'Incluye gráficos y visualizaciones en formato PDF',
        ],
      },
      {
        title: 'Análisis comparativo',
        content: 'Compara métricas entre diferentes períodos para identificar tendencias.',
        tips: [
          'Compara mes actual vs mes anterior automáticamente',
          'Visualiza crecimiento o decrecimiento con indicadores claros',
          'Identifica patrones estacionales en tu negocio',
          'Exporta análisis comparativos para presentaciones',
        ],
      },
    ],
  },

  bi: {
    module: 'Business Intelligence',
    title: 'Inteligencia de Negocio',
    description:
      'Herramientas avanzadas de análisis y visualización de datos para tomar decisiones estratégicas.',
    sections: [
      {
        title: '¿Qué es Business Intelligence?',
        content:
          'BI transforma tus datos operativos en información estratégica mediante dashboards interactivos, análisis predictivo y visualizaciones avanzadas.',
        tips: [
          'Accede a métricas clave como ROI, cash flow, y ocupación',
          'Visualiza tendencias históricas y proyecciones futuras',
          'Identifica oportunidades de optimización en tu negocio',
          'Toma decisiones basadas en datos reales, no intuiciones',
        ],
      },
      {
        title: 'Dashboard ejecutivo',
        content: 'Vista consolidada de los KPIs más importantes de tu negocio inmobiliario.',
        tips: [
          'Métricas financieras: ingresos totales, gastos, margen neto',
          'Métricas operativas: tasa de ocupación, tiempo medio de alquiler',
          'Métricas de cliente: satisfacción, retención, NPS',
          'Alertas inteligentes sobre desviaciones importantes',
        ],
      },
      {
        title: 'Análisis predictivo',
        content:
          'Utiliza inteligencia artificial para predecir comportamientos futuros y anticiparte a problemas.',
        tips: [
          'Predicción de morosidad: identifica inquilinos con riesgo de impago',
          'Forecast de ingresos: proyecta tus ingresos futuros con precisión',
          'Análisis de rotación: predice cuándo es probable que un inquilino se vaya',
          'Optimización de precios: sugerencias de ajuste de rentas según mercado',
        ],
      },
      {
        title: 'Segmentación de portafolio',
        content: 'Analiza tu cartera de propiedades segmentada por diferentes criterios.',
        tips: [
          'Agrupa por rentabilidad, ubicación, tipo de propiedad',
          'Identifica las propiedades más y menos rentables',
          'Compara performance entre diferentes segmentos',
          'Toma decisiones de inversión basadas en datos históricos',
        ],
      },
      {
        title: 'Benchmarking de mercado',
        content: 'Compara tu performance con el mercado inmobiliario de tu zona.',
        tips: [
          'Precios de alquiler vs competencia local',
          'Tiempo de vacancia comparado con el promedio del mercado',
          'Rentabilidad vs estándares del sector',
          'Identifica oportunidades de mejora competitiva',
        ],
      },
      {
        title: 'Visualizaciones interactivas',
        content: 'Gráficos y dashboards que puedes explorar y personalizar según tus necesidades.',
        tips: [
          'Haz clic en cualquier elemento para profundizar (drill-down)',
          'Aplica filtros dinámicos para analizar segmentos específicos',
          'Cambia entre diferentes tipos de visualización (barras, líneas, mapas)',
          'Exporta visualizaciones para presentaciones o reportes',
        ],
      },
      {
        title: 'Alertas inteligentes',
        content: 'Recibe notificaciones automáticas sobre eventos importantes en tus métricas.',
        tips: [
          'Configura umbrales personalizados para cada KPI',
          'Recibe alertas cuando se detecten anomalías o tendencias preocupantes',
          'Notificaciones por email, SMS o push en la app',
          'Prioriza alertas críticas vs informativas',
        ],
      },
      {
        title: 'Exportación y compartición',
        content: 'Comparte insights con tu equipo o stakeholders de manera sencilla.',
        tips: [
          'Exporta dashboards completos en PDF de alta calidad',
          'Genera links compartibles con acceso temporal',
          'Programa envíos automáticos de reportes BI',
          'Presenta datos en reuniones con modo presentación',
        ],
      },
    ],
  },
  calendario: {
    module: 'Calendario Unificado',
    title: '¿Cómo usar el Calendario Unificado?',
    description:
      'Gestiona todos tus eventos, visitas, inspecciones y reuniones en un solo lugar centralizado.',
    sections: [
      {
        title: 'Sincronización automática',
        content:
          'El calendario se sincroniza automáticamente con eventos de todos los módulos del sistema.',
        tips: [
          'Los pagos pendientes se muestran automáticamente',
          'Los vencimientos de contratos aparecen como eventos',
          'El mantenimiento programado se integra en el calendario',
          'Las visitas de candidatos se añaden automáticamente',
        ],
      },
      {
        title: 'Crear eventos personalizados',
        content: 'Añade reuniones, inspecciones, visitas y recordatorios personalizados.',
        tips: [
          'Asigna eventos a edificios y unidades específicas',
          'Configura recordatorios para eventos importantes',
          'Marca eventos como completados o cancelados',
          'Añade notas y detalles relevantes a cada evento',
        ],
      },
      {
        title: 'Vistas y filtros',
        content: 'Visualiza tu agenda en diferentes formatos y filtra por tipo de evento.',
        tips: [
          'Cambia entre vista mensual, semanal, diaria o agenda',
          'Filtra por tipo de evento (pagos, contratos, mantenimiento)',
          'Exporta tu calendario para compartir con el equipo',
          'Sincroniza con calendarios externos (próximamente)',
        ],
      },
    ],
  },
  'room-rental': {
    module: 'Alquiler por Habitaciones',
    title: '¿Cómo gestionar el Alquiler por Habitaciones?',
    description:
      'Administra habitaciones individuales con contratos independientes, prorrateo de gastos y convivencia.',
    sections: [
      {
        title: 'Crear y gestionar habitaciones',
        content: 'Configura habitaciones dentro de unidades para alquileres compartidos.',
        tips: [
          'Divide unidades en múltiples habitaciones alquilables',
          'Asigna características únicas a cada habitación',
          'Controla disponibilidad y precios por habitación',
          'Gestiona contratos independientes por habitación',
        ],
      },
      {
        title: 'Prorrateo automático de gastos',
        content: 'Distribuye gastos comunes entre inquilinos de forma justa y automatizada.',
        tips: [
          'Configura métodos de prorrateo (por partes iguales, por uso, por m²)',
          'Previsualiza cálculos antes de aplicarlos',
          'Genera pagos automáticos de servicios prorrateados',
          'Mantén un registro claro y transparente de costos',
        ],
      },
      {
        title: 'Calendarios de limpieza',
        content: 'Organiza turnos rotativos de limpieza para espacios compartidos.',
        tips: [
          'Crea calendarios automáticos de limpieza',
          'Notifica a inquilinos sobre sus turnos asignados',
          'Registra cumplimiento de tareas de limpieza',
          'Personaliza frecuencia y áreas a limpiar',
        ],
      },
      {
        title: 'Reglas de convivencia',
        content: 'Establece y comunica normas claras para la convivencia compartida.',
        tips: [
          'Define horarios de silencio y uso de espacios comunes',
          'Establece políticas de visitas y mascotas',
          'Comunica reglas al firmar contratos',
          'Gestiona infracciones y resolución de conflictos',
        ],
      },
    ],
  },
  marketplace: {
    module: 'Marketplace de Servicios',
    title: '¿Cómo usar el Marketplace de Servicios?',
    description: 'Conecta a tus inquilinos con servicios adicionales y proveedores verificados.',
    sections: [
      {
        title: 'Gestionar cotizaciones',
        content: 'Recibe, procesa y responde a solicitudes de cotización de servicios.',
        tips: [
          'Revisa solicitudes de inquilinos en tiempo real',
          'Asigna proveedores adecuados para cada servicio',
          'Envía cotizaciones detalladas y profesionales',
          'Haz seguimiento del estado de cada solicitud',
        ],
      },
      {
        title: 'Administrar trabajos',
        content: 'Coordina la ejecución de servicios contratados por inquilinos.',
        tips: [
          'Programa fechas de servicio con proveedores',
          'Monitorea el progreso de trabajos activos',
          'Confirma finalización y calidad del servicio',
          'Procesa pagos y comisiones automáticamente',
        ],
      },
      {
        title: 'Sistema de reseñas',
        content: 'Gestiona la reputación de proveedores mediante valoraciones de inquilinos.',
        tips: [
          'Solicita reseñas a inquilinos tras cada servicio',
          'Modera comentarios para mantener calidad',
          'Identifica proveedores top por sus valoraciones',
          'Usa feedback para mejorar la red de servicios',
        ],
      },
      {
        title: 'Programa de fidelización',
        content: 'Recompensa a inquilinos frecuentes con descuentos y beneficios.',
        tips: [
          'Configura niveles de fidelidad (bronce, plata, oro)',
          'Otorga descuentos progresivos por uso',
          'Ofrece cashback en servicios premium',
          'Genera lealtad y satisfacción de inquilinos',
        ],
      },
    ],
  },
  crm: {
    module: 'CRM y Ventas',
    title: '¿Cómo usar el CRM de INMOVA?',
    description:
      'Gestiona tu pipeline de ventas y convierte leads en clientes con un sistema CRM integrado.',
    sections: [
      {
        title: 'Pipeline visual Kanban',
        content: 'Visualiza y gestiona el proceso de ventas de forma intuitiva.',
        tips: [
          'Arrastra leads entre etapas del pipeline',
          'Prioriza por scoring y probabilidad de cierre',
          'Identifica cuellos de botella en el proceso',
          'Mide conversión por cada etapa del embudo',
        ],
      },
      {
        title: 'Scoring automático',
        content: 'El sistema calcula automáticamente la calidad de cada lead.',
        tips: [
          'Factores: presupuesto, urgencia, fit con servicios',
          'Prioriza leads de alto valor',
          'Identifica oportunidades más prometedoras',
          'Optimiza el tiempo de tu equipo comercial',
        ],
      },
      {
        title: 'Gestión de leads',
        content: 'Captura, califica y nutre leads de múltiples fuentes.',
        tips: [
          'Importa leads desde landing page o formularios',
          'Asigna leads automáticamente a comerciales',
          'Programa seguimientos y recordatorios',
          'Registra todas las interacciones con el lead',
        ],
      },
      {
        title: 'Análisis y reportes',
        content: 'Mide el rendimiento de tu equipo y del proceso de ventas.',
        tips: [
          'Analiza tasas de conversión por etapa',
          'Calcula valor promedio del pipeline',
          'Identifica comerciales top performers',
          'Genera informes para la dirección comercial',
        ],
      },
    ],
  },
};
