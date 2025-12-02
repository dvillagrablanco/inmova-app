// Definiciones de ayuda contextual para cada módulo

export const helpData = {
  dashboard: {
    module: 'Dashboard',
    title: 'Panel de Control',
    description: 'Vista general de tu negocio inmobiliario con métricas clave y accesos rápidos.',
    sections: [
      {
        title: '¿Qué puedo ver aquí?',
        content: 'El dashboard te muestra las métricas más importantes de tu negocio: edificios gestionados, inquilinos activos, ingresos mensuales, y tareas pendientes.',
        tips: [
          'Las tarjetas KPI muestran cambios respecto al mes anterior',
          'Los gráficos son interactivos: haz clic para más detalles',
          'Puedes exportar cualquier gráfico como imagen'
        ]
      },
      {
        title: 'Personalización',
        content: 'Puedes personalizar qué métricas ver y cómo se organizan en tu dashboard.',
        tips: [
          'Arrastra las tarjetas para reordenarlas',
          'Haz clic en el icono de ojo para ocultar/mostrar secciones',
          'Tus preferencias se guardan automáticamente'
        ]
      }
    ]
  },
  
  edificios: {
    module: 'Edificios',
    title: 'Gestión de Edificios',
    description: 'Administra todas tus propiedades y edificios desde un solo lugar.',
    sections: [
      {
        title: 'Crear un nuevo edificio',
        content: 'Haz clic en "Nuevo Edificio" para registrar una nueva propiedad. Necesitarás la dirección completa, número de unidades, y datos del propietario.',
        tips: [
          'Puedes agregar fotos del edificio durante o después de la creación',
          'Los campos marcados con * son obligatorios',
          'Guarda borradores para completar la información más tarde'
        ]
      },
      {
        title: 'Ver y editar edificios',
        content: 'Haz clic en cualquier edificio para ver sus detalles completos, unidades, inquilinos, y documentos asociados.',
        tips: [
          'Usa los filtros para encontrar edificios rápidamente',
          'Exporta la lista de edificios a Excel o PDF',
          'Configura alertas para mantenimientos programados'
        ]
      },
      {
        title: 'Unidades por edificio',
        content: 'Cada edificio puede tener múltiples unidades (apartamentos, locales, etc.). Gestiona el estado de ocupación de cada una.',
        tips: [
          'Marca unidades como disponibles, ocupadas, o en mantenimiento',
          'Asigna inquilinos directamente desde la vista de unidades',
          'Configura precios de alquiler diferentes por unidad'
        ]
      }
    ]
  },
  
  inquilinos: {
    module: 'Inquilinos',
    title: 'Gestión de Inquilinos',
    description: 'Administra toda la información de tus inquilinos y sus contratos.',
    sections: [
      {
        title: 'Registrar inquilino',
        content: 'Crea un perfil completo del inquilino con sus datos personales, información de contacto, y referencias.',
        tips: [
          'Sube documentos como DNI, nóminas, o aval bancario',
          'El scoring automático evalúa la solvencia',
          'Puedes vincular múltiples inquilinos a un mismo contrato'
        ]
      },
      {
        title: 'Verificación y screening',
        content: 'INMOVA incluye herramientas de verificación para evaluar la idoneidad de los candidatos.',
        tips: [
          'Revisa el historial de pagos de inquilinos anteriores',
          'Solicita referencias automáticamente por email',
          'Accede a informes de solvencia integrados'
        ]
      },
      {
        title: 'Comunicación',
        content: 'Mantén comunicación fluida con tus inquilinos a través del chat integrado y notificaciones.',
        tips: [
          'Envía recordatorios de pago automáticos',
          'Los inquilinos pueden reportar incidencias desde su portal',
          'Configura plantillas de mensajes frecuentes'
        ]
      }
    ]
  },
  
  contratos: {
    module: 'Contratos',
    title: 'Gestión de Contratos',
    description: 'Crea, firma y gestiona contratos de alquiler de forma digital.',
    sections: [
      {
        title: 'Crear contrato',
        content: 'Genera contratos profesionales usando plantillas personalizables. Incluye todas las cláusulas necesarias y personalizaciones.',
        tips: [
          'Usa plantillas predefinidas para ahorrar tiempo',
          'Todas las plantillas cumplen con la legislación vigente',
          'Personaliza cláusulas según tus necesidades'
        ]
      },
      {
        title: 'Firma digital',
        content: 'Los contratos pueden firmarse digitalmente por todas las partes, con validez legal completa.',
        tips: [
          'Las firmas digitales tienen la misma validez que las manuscritas',
          'Recibe notificaciones cuando todas las partes firmen',
          'Descarga el contrato firmado en PDF'
        ]
      },
      {
        title: 'Seguimiento y renovación',
        content: 'Recibe alertas automáticas sobre fechas de vencimiento y gestiona renovaciones fácilmente.',
        tips: [
          'Configura cuándo recibir alertas de vencimiento (30, 60, 90 días)',
          'Renueva contratos con un solo clic',
          'Actualiza precios automáticamente según IPC'
        ]
      }
    ]
  },
  
  pagos: {
    module: 'Pagos',
    title: 'Gestión de Pagos',
    description: 'Controla ingresos, pagos pendientes y genera recordatorios automáticos.',
    sections: [
      {
        title: 'Registrar pagos',
        content: 'Registra pagos manualmente o configura pagos recurrentes automáticos para alquileres mensuales.',
        tips: [
          'Vincula pagos a contratos específicos',
          'Soporta múltiples métodos de pago',
          'Genera recibos automáticamente'
        ]
      },
      {
        title: 'Pagos pendientes',
        content: 'Vista clara de todos los pagos pendientes con fechas de vencimiento y montos.',
        tips: [
          'Filtra por inquilino, edificio o rango de fechas',
          'Envía recordatorios automáticos antes del vencimiento',
          'Marca pagos como parciales si es necesario'
        ]
      },
      {
        title: 'Morosidad',
        content: 'Sistema de gestión de morosidad con alertas tempranas y predicciones de riesgo.',
        tips: [
          'El sistema predice qué inquilinos tienen riesgo de morosidad',
          'Configura acciones automáticas para pagos atrasados',
          'Genera reportes de morosidad para análisis'
        ]
      }
    ]
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
          'Adjunta fotos para mejor comprensión del problema'
        ]
      },
      {
        title: 'Asignar a proveedores',
        content: 'Asigna trabajos a tu red de proveedores de mantenimiento y da seguimiento.',
        tips: [
          'Mantén una base de datos de proveedores de confianza',
          'Los proveedores reciben notificaciones automáticas',
          'Ellos pueden actualizar el estado desde su portal'
        ]
      },
      {
        title: 'Mantenimiento preventivo',
        content: 'Programa mantenimientos recurrentes para evitar problemas mayores.',
        tips: [
          'Programa revisiones anuales de calderas, ascensores, etc.',
          'Recibe recordatorios automáticos',
          'Lleva historial completo de todos los mantenimientos'
        ]
      }
    ]
  },
  
  documentos: {
    module: 'Documentos',
    title: 'Gestión Documental',
    description: 'Almacena, organiza y comparte documentos de forma segura.',
    sections: [
      {
        title: 'Subir documentos',
        content: 'Sube cualquier tipo de documento relacionado con edificios, inquilinos o contratos.',
        tips: [
          'Soporta PDF, imágenes, Word, Excel y más',
          'Organiza en carpetas por categoría',
          'Agrega etiquetas para búsqueda rápida'
        ]
      },
      {
        title: 'Compartir documentos',
        content: 'Comparte documentos específicos con inquilinos, propietarios o proveedores.',
        tips: [
          'Controla quién puede ver o descargar cada documento',
          'Los documentos compartidos aparecen en sus portales',
          'Recibe notificaciones cuando se visualicen'
        ]
      },
      {
        title: 'Firma digital',
        content: 'Envía documentos para firma digital con validez legal.',
        tips: [
          'Válido para contratos, acuerdos y documentos oficiales',
          'Seguimiento del estado de firma en tiempo real',
          'Certificados de firma con timestamp'
        ]
      }
    ]
  },
  
  reportes: {
    module: 'Reportes',
    title: 'Reportes y Analítica',
    description: 'Genera reportes detallados y visualiza estadísticas de tu negocio.',
    sections: [
      {
        title: 'Reportes predefinidos',
        content: 'Accede a una variedad de reportes listos para usar: ocupación, ingresos, morosidad, etc.',
        tips: [
          'Exporta reportes en Excel, PDF o CSV',
          'Filtra por rangos de fecha personalizados',
          'Programa envío automático por email'
        ]
      },
      {
        title: 'Reportes personalizados',
        content: 'Crea tus propios reportes con las métricas y filtros que necesites.',
        tips: [
          'Arrastra y suelta campos para crear tu reporte',
          'Guarda plantillas para reutilizar',
          'Comparte reportes con tu equipo'
        ]
      }
    ]
  }
};
