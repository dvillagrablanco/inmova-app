/**
 * Configuración de Wizards paso a paso para automatizar procesos
 */

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  fields: WizardField[];
  validation?: (data: any) => string | null;
  autoFill?: (previousData: any) => Partial<any>;
}

export interface WizardField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'email'
    | 'number'
    | 'select'
    | 'multiselect'
    | 'date'
    | 'textarea'
    | 'file'
    | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | null;
  helpText?: string;
  autoComplete?: boolean;
}

// Wizard para configuración inicial
export const initialSetupWizard: WizardStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a INMOVA!',
    description: 'Vamos a configurar tu cuenta en solo 3 minutos',
    fields: [
      {
        name: 'businessType',
        label: '¿Qué tipo de negocio inmobiliario tienes?',
        type: 'select',
        required: true,
        options: [
          { value: 'alquiler_tradicional', label: 'Alquiler tradicional de larga duración' },
          { value: 'str', label: 'Short-Term Rental (Airbnb, Booking, etc.)' },
          { value: 'alquiler_habitaciones', label: 'Alquiler por habitaciones / Coliving' },
          { value: 'gestion_comunidades', label: 'Gestión de comunidades' },
          { value: 'flipping', label: 'Compra-venta / Flipping' },
          { value: 'construccion', label: 'Construcción / Promoción' },
          { value: 'professional', label: 'Servicios profesionales' },
        ],
        helpText: 'Configuraremos los módulos específicos para tu negocio',
      },
      {
        name: 'companySize',
        label: '¿Cuántas propiedades gestionas actualmente?',
        type: 'select',
        required: true,
        options: [
          { value: '1-5', label: '1-5 propiedades' },
          { value: '6-20', label: '6-20 propiedades' },
          { value: '21-50', label: '21-50 propiedades' },
          { value: '51-200', label: '51-200 propiedades' },
          { value: '200+', label: 'Más de 200 propiedades' },
        ],
      },
    ],
  },
  {
    id: 'company_info',
    title: 'Información de tu empresa',
    description: 'Estos datos aparecerán en contratos y documentos oficiales',
    fields: [
      {
        name: 'companyName',
        label: 'Nombre de la empresa',
        type: 'text',
        required: true,
        placeholder: 'Ej: Inmobiliaria García S.L.',
      },
      {
        name: 'cif',
        label: 'CIF/NIF',
        type: 'text',
        required: true,
        placeholder: 'Ej: B12345678',
      },
      {
        name: 'address',
        label: 'Dirección fiscal',
        type: 'textarea',
        required: true,
        placeholder: 'Calle, número, ciudad, CP',
      },
      {
        name: 'phone',
        label: 'Teléfono de contacto',
        type: 'text',
        required: true,
        placeholder: '+34 600 000 000',
      },
      {
        name: 'email',
        label: 'Email de contacto',
        type: 'email',
        required: true,
        placeholder: 'contacto@empresa.com',
      },
    ],
  },
  {
    id: 'preferences',
    title: 'Preferencias',
    description: 'Personaliza tu experiencia en INMOVA',
    fields: [
      {
        name: 'currency',
        label: 'Moneda',
        type: 'select',
        required: true,
        options: [
          { value: 'EUR', label: '€ Euro (EUR)' },
          { value: 'USD', label: '$ Dólar (USD)' },
          { value: 'GBP', label: '£ Libra (GBP)' },
        ],
      },
      {
        name: 'language',
        label: 'Idioma preferido',
        type: 'select',
        required: true,
        options: [
          { value: 'es', label: 'Español' },
          { value: 'en', label: 'English' },
          { value: 'pt', label: 'Português' },
          { value: 'fr', label: 'Français' },
        ],
      },
      {
        name: 'notifications',
        label: 'Notificaciones',
        type: 'multiselect',
        options: [
          { value: 'email', label: 'Email' },
          { value: 'sms', label: 'SMS' },
          { value: 'push', label: 'Push' },
        ],
        helpText: 'Elige cómo quieres recibir notificaciones',
      },
      {
        name: 'demoData',
        label: 'Crear datos de demostración',
        type: 'checkbox',
        helpText: 'Te ayudaremos a entender la plataforma con ejemplos',
      },
    ],
  },
  {
    id: 'complete',
    title: '¡Todo listo!',
    description: 'Tu cuenta está configurada. ¿Qué quieres hacer ahora?',
    fields: [
      {
        name: 'nextAction',
        label: 'Siguiente paso',
        type: 'select',
        required: true,
        options: [
          { value: 'tour', label: 'Ver tour guiado de la plataforma' },
          { value: 'building', label: 'Crear mi primer edificio' },
          { value: 'tenant', label: 'Registrar mi primer inquilino' },
          { value: 'explore', label: 'Explorar por mi cuenta' },
        ],
      },
    ],
  },
];

// Wizard para crear edificio
export const createBuildingWizard: WizardStep[] = [
  {
    id: 'basic_info',
    title: 'Información básica',
    description: 'Datos esenciales del edificio',
    fields: [
      {
        name: 'name',
        label: 'Nombre del edificio',
        type: 'text',
        required: true,
        placeholder: 'Ej: Edificio Alameda',
      },
      {
        name: 'address',
        label: 'Dirección completa',
        type: 'textarea',
        required: true,
        placeholder: 'Calle, número, piso, ciudad, código postal',
      },
      {
        name: 'type',
        label: 'Tipo de propiedad',
        type: 'select',
        required: true,
        options: [
          { value: 'residential', label: 'Residencial' },
          { value: 'commercial', label: 'Comercial' },
          { value: 'mixed', label: 'Uso mixto' },
          { value: 'office', label: 'Oficina' },
        ],
      },
    ],
  },
  {
    id: 'units',
    title: 'Unidades',
    description: '¿Cuántas unidades tiene este edificio?',
    fields: [
      {
        name: 'totalUnits',
        label: 'Número total de unidades',
        type: 'number',
        required: true,
        placeholder: 'Ej: 12',
        helpText: 'Apartamentos, locales, oficinas, etc.',
      },
      {
        name: 'unitType',
        label: 'Tipo de unidades',
        type: 'select',
        required: true,
        options: [
          { value: 'apartment', label: 'Apartamentos' },
          { value: 'room', label: 'Habitaciones' },
          { value: 'local', label: 'Locales comerciales' },
          { value: 'office', label: 'Oficinas' },
          { value: 'mixed', label: 'Mixto' },
        ],
      },
      {
        name: 'autoCreateUnits',
        label: 'Crear unidades automáticamente',
        type: 'checkbox',
        helpText: 'Crearemos las unidades numeradas secuencialmente',
      },
    ],
  },
  {
    id: 'owner',
    title: 'Propietario',
    description: 'Información del propietario del edificio',
    fields: [
      {
        name: 'ownerType',
        label: 'Tipo de propietario',
        type: 'select',
        required: true,
        options: [
          { value: 'individual', label: 'Persona física' },
          { value: 'company', label: 'Empresa' },
        ],
      },
      {
        name: 'ownerName',
        label: 'Nombre del propietario',
        type: 'text',
        required: true,
        placeholder: 'Nombre completo o razón social',
      },
      {
        name: 'ownerEmail',
        label: 'Email del propietario',
        type: 'email',
        required: false,
        placeholder: 'propietario@email.com',
      },
      {
        name: 'ownerPhone',
        label: 'Teléfono del propietario',
        type: 'text',
        required: false,
        placeholder: '+34 600 000 000',
      },
    ],
  },
  {
    id: 'additional',
    title: 'Información adicional',
    description: 'Datos opcionales que pueden ser útiles',
    fields: [
      {
        name: 'yearBuilt',
        label: 'Año de construcción',
        type: 'number',
        placeholder: 'Ej: 2015',
      },
      {
        name: 'floors',
        label: 'Número de plantas',
        type: 'number',
        placeholder: 'Ej: 5',
      },
      {
        name: 'elevator',
        label: '¿Tiene ascensor?',
        type: 'checkbox',
      },
      {
        name: 'parking',
        label: '¿Tiene parking?',
        type: 'checkbox',
      },
    ],
  },
];

// Wizard para crear inquilino
export const createTenantWizard: WizardStep[] = [
  {
    id: 'personal_info',
    title: 'Datos personales',
    description: 'Información básica del inquilino',
    fields: [
      {
        name: 'firstName',
        label: 'Nombre',
        type: 'text',
        required: true,
        placeholder: 'Ej: Juan',
      },
      {
        name: 'lastName',
        label: 'Apellidos',
        type: 'text',
        required: true,
        placeholder: 'Ej: García López',
      },
      {
        name: 'dni',
        label: 'DNI/NIE',
        type: 'text',
        required: true,
        placeholder: 'Ej: 12345678A',
      },
      {
        name: 'birthDate',
        label: 'Fecha de nacimiento',
        type: 'date',
        required: true,
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contacto',
    description: 'Información de contacto del inquilino',
    fields: [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'inquilino@email.com',
      },
      {
        name: 'phone',
        label: 'Teléfono',
        type: 'text',
        required: true,
        placeholder: '+34 600 000 000',
      },
      {
        name: 'alternativePhone',
        label: 'Teléfono alternativo',
        type: 'text',
        placeholder: 'Opcional',
      },
    ],
  },
  {
    id: 'employment',
    title: 'Información laboral',
    description: 'Datos laborales y económicos',
    fields: [
      {
        name: 'employmentStatus',
        label: 'Situación laboral',
        type: 'select',
        required: true,
        options: [
          { value: 'employed', label: 'Empleado por cuenta ajena' },
          { value: 'self_employed', label: 'Autónomo' },
          { value: 'student', label: 'Estudiante' },
          { value: 'unemployed', label: 'Desempleado' },
          { value: 'retired', label: 'Jubilado' },
        ],
      },
      {
        name: 'monthlyIncome',
        label: 'Ingresos mensuales',
        type: 'number',
        required: true,
        placeholder: 'Ej: 2000',
        helpText: 'Nos ayuda a evaluar la solvencia',
      },
      {
        name: 'employer',
        label: 'Empresa donde trabaja',
        type: 'text',
        placeholder: 'Opcional',
      },
    ],
  },
  {
    id: 'documents',
    title: 'Documentación',
    description: 'Documentos necesarios para el proceso',
    fields: [
      {
        name: 'idDocument',
        label: 'DNI/NIE (ambas caras)',
        type: 'file',
        required: true,
        helpText: 'PDF o imagen (máx 5MB)',
      },
      {
        name: 'incomeProof',
        label: 'Justificante de ingresos',
        type: 'file',
        required: true,
        helpText: 'Nóminas, declaración de la renta, etc.',
      },
      {
        name: 'bankGuarantee',
        label: 'Aval bancario',
        type: 'file',
        required: false,
        helpText: 'Opcional',
      },
    ],
  },
];
