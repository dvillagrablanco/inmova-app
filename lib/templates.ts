// Plantillas predefinidas para diferentes industrias y casos de uso

export interface Template {
  id: string;
  name: string;
  category: 'contract' | 'email' | 'document' | 'workflow' | 'report';
  industry?: string;
  description: string;
  content: string;
  variables: string[];
  tags: string[];
  popular: boolean;
}

export const templates: Template[] = [
  // CONTRATOS
  {
    id: 'contract-residential-standard',
    name: 'Contrato de Arrendamiento Residencial Estándar',
    category: 'contract',
    industry: 'residential',
    description: 'Contrato completo para alquiler de vivienda habitual según LAU.',
    content: `CONTRATO DE ARRENDAMIENTO DE VIVIENDA

En {{CITY}}, a {{DATE}}

REUNIDOS

DE UNA PARTE, {{LANDLORD_NAME}}, mayor de edad, con DNI {{LANDLORD_DNI}}, y domicilio en {{LANDLORD_ADDRESS}}, en adelante EL ARRENDADOR.

Y DE OTRA PARTE, {{TENANT_NAME}}, mayor de edad, con DNI {{TENANT_DNI}}, y domicilio en {{TENANT_ADDRESS}}, en adelante EL ARRENDATARIO.

EXPONEN

I. Que el ARRENDADOR es dueño de la vivienda sita en {{PROPERTY_ADDRESS}}, con referencia catastral {{CATASTRAL_REF}}.

II. Que el ARRENDATARIO está interesado en arrendar dicha vivienda para uso de vivienda habitual.

Y en su virtud, ambas partes ACUERDAN las siguientes:

ESTIPULACIONES

PRIMERA. OBJETO DEL CONTRATO
El ARRENDADOR arrienda al ARRENDATARIO la vivienda descrita, destinada exclusivamente a satisfacer la necesidad permanente de vivienda del arrendatario.

SEGUNDA. DURACIÓN
El presente contrato tendrá una duración de {{DURATION}} años, comenzando el {{START_DATE}} y finalizando el {{END_DATE}}.

TERCERA. RENTA
La renta mensual asciende a {{MONTHLY_RENT}} euros, pagaderos los primeros {{PAYMENT_DAY}} días de cada mes.

CUARTA. FIANZA
El arrendatario entrega en este acto la cantidad de {{DEPOSIT}} euros en concepto de fianza.

QUINTA. GASTOS
{{EXPENSES_CLAUSE}}

Y en prueba de conformidad, firman el presente contrato en el lugar y fecha indicados.


El Arrendador                    El Arrendatario

_________________              _________________`,
    variables: [
      'CITY',
      'DATE',
      'LANDLORD_NAME',
      'LANDLORD_DNI',
      'LANDLORD_ADDRESS',
      'TENANT_NAME',
      'TENANT_DNI',
      'TENANT_ADDRESS',
      'PROPERTY_ADDRESS',
      'CATASTRAL_REF',
      'DURATION',
      'START_DATE',
      'END_DATE',
      'MONTHLY_RENT',
      'PAYMENT_DAY',
      'DEPOSIT',
      'EXPENSES_CLAUSE',
    ],
    tags: ['vivienda', 'residencial', 'lau', 'estándar'],
    popular: true,
  },
  {
    id: 'contract-commercial',
    name: 'Contrato de Arrendamiento de Local Comercial',
    category: 'contract',
    industry: 'commercial',
    description: 'Contrato para arrendamiento de locales comerciales u oficinas.',
    content: `CONTRATO DE ARRENDAMIENTO DE LOCAL COMERCIAL

[Contenido completo del contrato comercial...]`,
    variables: ['LANDLORD_NAME', 'TENANT_NAME', 'BUSINESS_NAME', 'MONTHLY_RENT', 'DURATION'],
    tags: ['comercial', 'local', 'negocio'],
    popular: true,
  },
  {
    id: 'contract-room-coliving',
    name: 'Contrato de Arrendamiento por Habitación',
    category: 'contract',
    industry: 'coliving',
    description: 'Contrato específico para alquiler de habitaciones en pisos compartidos.',
    content: `CONTRATO DE ARRENDAMIENTO DE HABITACIÓN

[Contenido del contrato de habitación con cláusulas de convivencia...]`,
    variables: ['LANDLORD_NAME', 'TENANT_NAME', 'ROOM_NUMBER', 'MONTHLY_RENT', 'SHARED_EXPENSES'],
    tags: ['habitación', 'coliving', 'compartido'],
    popular: true,
  },

  // EMAILS
  {
    id: 'email-payment-reminder',
    name: 'Recordatorio de Pago',
    category: 'email',
    description: 'Email automático para recordar pagos próximos a vencer.',
    content: `Asunto: Recordatorio: Próximo vencimiento de pago

Estimado/a {{TENANT_NAME}},

Este es un recordatorio amistoso de que tu pago de alquiler correspondiente a {{MONTH}} vence el {{DUE_DATE}}.

Monto: {{AMOUNT}}€
Concepto: Alquiler de {{PROPERTY_ADDRESS}}

Puedes realizar el pago desde tu portal de inquilino: {{PORTAL_LINK}}

Si ya realizaste el pago, por favor ignora este mensaje.

¡Gracias por tu puntualidad!

Saludos,
{{COMPANY_NAME}}`,
    variables: [
      'TENANT_NAME',
      'MONTH',
      'DUE_DATE',
      'AMOUNT',
      'PROPERTY_ADDRESS',
      'PORTAL_LINK',
      'COMPANY_NAME',
    ],
    tags: ['pago', 'recordatorio', 'alquiler'],
    popular: true,
  },
  {
    id: 'email-welcome-tenant',
    name: 'Bienvenida a Nuevo Inquilino',
    category: 'email',
    description: 'Email de bienvenida con información útil para nuevos inquilinos.',
    content: `Asunto: ¡Bienvenido a tu nuevo hogar! 🏠

Estimado/a {{TENANT_NAME}},

¡Te damos la bienvenida!

Estamos encantados de tenerte como inquilino en {{PROPERTY_ADDRESS}}.

A continuación, información importante:

🔑 Fecha de entrada: {{MOVE_IN_DATE}}
💸 Renta mensual: {{MONTHLY_RENT}}€
📅 Día de pago: {{PAYMENT_DAY}} de cada mes
📱 Tu portal online: {{PORTAL_LINK}}

Desde tu portal podrás:
• Pagar tu alquiler
• Descargar recibos
• Reportar incidencias
• Contactarnos directamente

Si tienes alguna duda, no dudes en escribirnos.

¡Que disfrutes tu nuevo hogar!

Saludos,
{{COMPANY_NAME}}`,
    variables: [
      'TENANT_NAME',
      'PROPERTY_ADDRESS',
      'MOVE_IN_DATE',
      'MONTHLY_RENT',
      'PAYMENT_DAY',
      'PORTAL_LINK',
      'COMPANY_NAME',
    ],
    tags: ['bienvenida', 'onboarding', 'inquilino'],
    popular: true,
  },
  {
    id: 'email-contract-renewal',
    name: 'Aviso de Renovación de Contrato',
    category: 'email',
    description: 'Notificación de próximo vencimiento de contrato y opciones de renovación.',
    content: `Asunto: Próxima renovación de tu contrato

Estimado/a {{TENANT_NAME}},

Queremos informarte que tu contrato de arrendamiento de {{PROPERTY_ADDRESS}} vence el {{CONTRACT_END_DATE}}.

¿Quieres renovar?

Estaremos encantados de que continúes con nosotros. Las condiciones de renovación son:

• Duración: {{RENEWAL_DURATION}}
• Renta mensual: {{NEW_RENT}}€
• Actualización IPC: {{IPC_UPDATE}}%

Por favor, confírmanos tu decisión antes del {{DECISION_DATE}}.

Puedes renovar automáticamente desde tu portal: {{RENEWAL_LINK}}

Estamos a tu disposición para cualquier consulta.

Saludos,
{{COMPANY_NAME}}`,
    variables: [
      'TENANT_NAME',
      'PROPERTY_ADDRESS',
      'CONTRACT_END_DATE',
      'RENEWAL_DURATION',
      'NEW_RENT',
      'IPC_UPDATE',
      'DECISION_DATE',
      'RENEWAL_LINK',
      'COMPANY_NAME',
    ],
    tags: ['renovación', 'contrato', 'vencimiento'],
    popular: true,
  },

  // WORKFLOWS
  {
    id: 'workflow-new-tenant-onboarding',
    name: 'Proceso de Onboarding de Nuevo Inquilino',
    category: 'workflow',
    description: 'Workflow completo desde la aprobación hasta la entrada del inquilino.',
    content: JSON.stringify({
      steps: [
        { id: 1, name: 'Verificación de documentos', automated: true },
        { id: 2, name: 'Scoring de solvencia', automated: true },
        { id: 3, name: 'Generación de contrato', automated: true },
        { id: 4, name: 'Envío para firma digital', automated: true },
        { id: 5, name: 'Cobro de fianza y primer mes', automated: true },
        { id: 6, name: 'Envío de email de bienvenida', automated: true },
        { id: 7, name: 'Creación de acceso al portal', automated: true },
        { id: 8, name: 'Programación de pagos recurrentes', automated: true },
      ],
    }),
    variables: ['TENANT_ID', 'PROPERTY_ID', 'CONTRACT_ID'],
    tags: ['onboarding', 'inquilino', 'automatización'],
    popular: true,
  },
  {
    id: 'workflow-payment-default',
    name: 'Gestión de Morosidad',
    category: 'workflow',
    description: 'Proceso automatizado para gestionar impagos de forma escalonada.',
    content: JSON.stringify({
      steps: [
        { id: 1, name: 'Día 1: Recordatorio amistoso', automated: true },
        { id: 2, name: 'Día 3: Segundo recordatorio', automated: true },
        { id: 3, name: 'Día 7: Llamada telefónica', automated: false },
        { id: 4, name: 'Día 15: Burofax de requerimiento', automated: true },
        { id: 5, name: 'Día 30: Inicio proceso legal', automated: false },
      ],
    }),
    variables: ['TENANT_ID', 'OVERDUE_AMOUNT', 'OVERDUE_DAYS'],
    tags: ['morosidad', 'impago', 'cobro'],
    popular: true,
  },

  // REPORTES
  {
    id: 'report-monthly-summary',
    name: 'Resumen Mensual de Gestión',
    category: 'report',
    description: 'Reporte ejecutivo mensual con todas las métricas clave.',
    content: JSON.stringify({
      sections: [
        {
          name: 'Resumen Financiero',
          metrics: ['ingresos_totales', 'gastos_totales', 'beneficio_neto'],
        },
        {
          name: 'Ocupación',
          metrics: ['tasa_ocupacion', 'unidades_disponibles', 'nuevos_contratos'],
        },
        { name: 'Morosidad', metrics: ['tasa_morosidad', 'importe_pendiente', 'recuperado'] },
        {
          name: 'Mantenimiento',
          metrics: ['incidencias_abiertas', 'incidencias_resueltas', 'tiempo_respuesta'],
        },
      ],
    }),
    variables: ['MONTH', 'YEAR', 'COMPANY_NAME'],
    tags: ['reporte', 'mensual', 'ejecutivo'],
    popular: true,
  },
  {
    id: 'report-occupancy-forecast',
    name: 'Forecast de Ocupación',
    category: 'report',
    description: 'Proyección de ocupación y disponibilidad para los próximos meses.',
    content: JSON.stringify({
      sections: [
        { name: 'Ocupación Actual', metrics: ['ocupadas', 'disponibles', 'en_mantenimiento'] },
        {
          name: 'Vencimientos Próximos',
          metrics: ['proximos_30_dias', 'proximos_60_dias', 'proximos_90_dias'],
        },
        { name: 'Proyección', metrics: ['ocupacion_estimada', 'ingresos_proyectados'] },
      ],
    }),
    variables: ['FORECAST_MONTHS', 'COMPANY_NAME'],
    tags: ['forecast', 'ocupación', 'proyección'],
    popular: false,
  },
];

export function getTemplatesByCategory(category: Template['category']): Template[] {
  return templates.filter((t) => t.category === category);
}

export function getTemplatesByIndustry(industry: string): Template[] {
  return templates.filter((t) => t.industry === industry);
}

export function getPopularTemplates(): Template[] {
  return templates.filter((t) => t.popular);
}

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function searchTemplates(query: string): Template[] {
  const lowerQuery = query.toLowerCase();
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.includes(lowerQuery))
  );
}

export function interpolateTemplate(
  templateContent: string,
  variables: Record<string, string>
): string {
  let result = templateContent;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  });
  return result;
}
