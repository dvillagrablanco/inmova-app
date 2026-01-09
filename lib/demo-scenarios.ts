/**
 * Escenarios de Demo Personalizados para Inmova
 * 
 * Cada escenario genera datos específicos según el tipo de cliente potencial
 * para hacer presentaciones más relevantes y convincentes.
 */

export type DemoScenario = 
  | 'gestor_residencial'      // Gestor de alquileres residenciales
  | 'propietario_particular'  // Propietario con pocas propiedades
  | 'agencia_inmobiliaria'    // Agencia con CRM y ventas
  | 'coliving'                // Operador de coliving
  | 'alquiler_turistico'      // Alquiler vacacional/turístico
  | 'comercial_oficinas'      // Locales y oficinas
  | 'comunidad_propietarios'  // Administrador de comunidades
  | 'inversor_inmobiliario'   // Inversor con portfolio
  | 'completo';               // Demo completa con todo

export interface DemoScenarioConfig {
  id: DemoScenario;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  modulosActivados: string[];
  datos: {
    edificios: EdificioDemo[];
    inquilinosBase: number;
    contratosActivos: number;
    incidenciasAbiertas: number;
    // Específicos por escenario
    leadsCRM?: number;
    reservasTuristicas?: number;
    eventosColiving?: number;
    votacionesComunidad?: number;
  };
}

interface EdificioDemo {
  nombre: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  tipoPropiedad: string;
  unidades: UnidadDemo[];
}

interface UnidadDemo {
  tipo: string;
  superficie: number;
  habitaciones: number;
  banos: number;
  precioAlquiler: number;
  caracteristicas?: string[];
}

// ============================================================
// ESCENARIOS DE DEMO
// ============================================================

export const DEMO_SCENARIOS: Record<DemoScenario, DemoScenarioConfig> = {
  // 1. GESTOR DE ALQUILERES RESIDENCIALES
  gestor_residencial: {
    id: 'gestor_residencial',
    nombre: 'Gestor de Alquileres',
    descripcion: 'Para gestores profesionales de propiedades residenciales. Incluye múltiples edificios, contratos, pagos e incidencias.',
    icono: 'Building2',
    color: 'blue',
    modulosActivados: ['edificios', 'inquilinos', 'contratos', 'pagos', 'mantenimiento', 'documentos'],
    datos: {
      edificios: [
        {
          nombre: 'Residencial Las Palmas',
          direccion: 'Calle de las Flores 25',
          ciudad: 'Madrid',
          codigoPostal: '28015',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'piso', superficie: 85, habitaciones: 3, banos: 2, precioAlquiler: 1200 },
            { tipo: 'piso', superficie: 65, habitaciones: 2, banos: 1, precioAlquiler: 950 },
            { tipo: 'piso', superficie: 90, habitaciones: 3, banos: 2, precioAlquiler: 1300 },
            { tipo: 'apartamento', superficie: 45, habitaciones: 1, banos: 1, precioAlquiler: 750 },
            { tipo: 'piso', superficie: 75, habitaciones: 2, banos: 1, precioAlquiler: 1050 },
            { tipo: 'atico', superficie: 110, habitaciones: 4, banos: 2, precioAlquiler: 1800 },
          ],
        },
        {
          nombre: 'Edificio Monterrey',
          direccion: 'Avenida Principal 142',
          ciudad: 'Madrid',
          codigoPostal: '28020',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'piso', superficie: 70, habitaciones: 2, banos: 1, precioAlquiler: 980 },
            { tipo: 'piso', superficie: 70, habitaciones: 2, banos: 1, precioAlquiler: 980 },
            { tipo: 'piso', superficie: 95, habitaciones: 3, banos: 2, precioAlquiler: 1250 },
            { tipo: 'estudio', superficie: 35, habitaciones: 0, banos: 1, precioAlquiler: 650 },
          ],
        },
        {
          nombre: 'Torres del Sol',
          direccion: 'Plaza Mayor 8',
          ciudad: 'Barcelona',
          codigoPostal: '08002',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'piso', superficie: 80, habitaciones: 3, banos: 1, precioAlquiler: 1400 },
            { tipo: 'piso', superficie: 60, habitaciones: 2, banos: 1, precioAlquiler: 1100 },
            { tipo: 'duplex', superficie: 120, habitaciones: 4, banos: 2, precioAlquiler: 2200 },
          ],
        },
      ],
      inquilinosBase: 10,
      contratosActivos: 8,
      incidenciasAbiertas: 3,
    },
  },

  // 2. PROPIETARIO PARTICULAR
  propietario_particular: {
    id: 'propietario_particular',
    nombre: 'Propietario Particular',
    descripcion: 'Para propietarios con 1-5 propiedades. Interfaz simplificada con lo esencial para gestionar alquileres.',
    icono: 'Home',
    color: 'green',
    modulosActivados: ['edificios', 'inquilinos', 'contratos', 'pagos'],
    datos: {
      edificios: [
        {
          nombre: 'Mi Piso Centro',
          direccion: 'Calle Gran Vía 50, 3ºA',
          ciudad: 'Madrid',
          codigoPostal: '28013',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'piso', superficie: 75, habitaciones: 2, banos: 1, precioAlquiler: 1100 },
          ],
        },
        {
          nombre: 'Apartamento Playa',
          direccion: 'Paseo Marítimo 22, 5ºB',
          ciudad: 'Valencia',
          codigoPostal: '46011',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'apartamento', superficie: 55, habitaciones: 1, banos: 1, precioAlquiler: 800 },
          ],
        },
      ],
      inquilinosBase: 2,
      contratosActivos: 2,
      incidenciasAbiertas: 1,
    },
  },

  // 3. AGENCIA INMOBILIARIA
  agencia_inmobiliaria: {
    id: 'agencia_inmobiliaria',
    nombre: 'Agencia Inmobiliaria',
    descripcion: 'Para agencias con CRM de ventas, captación de leads y gestión de cartera de propiedades.',
    icono: 'Briefcase',
    color: 'purple',
    modulosActivados: ['edificios', 'crm', 'leads', 'documentos', 'calendario', 'contratos'],
    datos: {
      edificios: [
        {
          nombre: 'Cartera Premium - Salamanca',
          direccion: 'Calle Serrano 45',
          ciudad: 'Madrid',
          codigoPostal: '28001',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'piso', superficie: 150, habitaciones: 4, banos: 3, precioAlquiler: 3500, caracteristicas: ['terraza', 'parking', 'trastero'] },
            { tipo: 'atico', superficie: 200, habitaciones: 5, banos: 3, precioAlquiler: 5000, caracteristicas: ['terraza', 'piscina privada'] },
          ],
        },
        {
          nombre: 'Cartera Inversión - Chamberí',
          direccion: 'Calle Ponzano 88',
          ciudad: 'Madrid',
          codigoPostal: '28003',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'estudio', superficie: 30, habitaciones: 0, banos: 1, precioAlquiler: 700 },
            { tipo: 'estudio', superficie: 32, habitaciones: 0, banos: 1, precioAlquiler: 720 },
            { tipo: 'apartamento', superficie: 45, habitaciones: 1, banos: 1, precioAlquiler: 900 },
          ],
        },
        {
          nombre: 'Exclusivas Costa',
          direccion: 'Paseo Marítimo 100',
          ciudad: 'Marbella',
          codigoPostal: '29602',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'villa', superficie: 350, habitaciones: 5, banos: 4, precioAlquiler: 8000, caracteristicas: ['piscina', 'jardín', 'vistas mar'] },
          ],
        },
      ],
      inquilinosBase: 5,
      contratosActivos: 3,
      incidenciasAbiertas: 0,
      leadsCRM: 25,
    },
  },

  // 4. COLIVING
  coliving: {
    id: 'coliving',
    nombre: 'Operador Coliving',
    descripcion: 'Para espacios de coliving con habitaciones, áreas comunes, eventos y gestión de comunidad.',
    icono: 'Users',
    color: 'pink',
    modulosActivados: ['edificios', 'coliving', 'inquilinos', 'contratos', 'eventos', 'comunidad'],
    datos: {
      edificios: [
        {
          nombre: 'Urban Coliving Madrid',
          direccion: 'Calle Malasaña 15',
          ciudad: 'Madrid',
          codigoPostal: '28004',
          tipoPropiedad: 'coliving',
          unidades: [
            { tipo: 'habitacion_individual', superficie: 12, habitaciones: 1, banos: 0, precioAlquiler: 650, caracteristicas: ['wifi', 'limpieza incluida'] },
            { tipo: 'habitacion_individual', superficie: 14, habitaciones: 1, banos: 0, precioAlquiler: 700, caracteristicas: ['wifi', 'limpieza incluida', 'balcón'] },
            { tipo: 'habitacion_individual', superficie: 12, habitaciones: 1, banos: 0, precioAlquiler: 650, caracteristicas: ['wifi', 'limpieza incluida'] },
            { tipo: 'habitacion_doble', superficie: 18, habitaciones: 1, banos: 0, precioAlquiler: 850, caracteristicas: ['wifi', 'limpieza incluida', 'baño privado'] },
            { tipo: 'habitacion_individual', superficie: 10, habitaciones: 1, banos: 0, precioAlquiler: 550, caracteristicas: ['wifi', 'limpieza incluida'] },
            { tipo: 'habitacion_suite', superficie: 25, habitaciones: 1, banos: 1, precioAlquiler: 950, caracteristicas: ['wifi', 'limpieza incluida', 'baño privado', 'minicocina'] },
            { tipo: 'habitacion_individual', superficie: 12, habitaciones: 1, banos: 0, precioAlquiler: 650, caracteristicas: ['wifi', 'limpieza incluida'] },
            { tipo: 'habitacion_individual', superficie: 13, habitaciones: 1, banos: 0, precioAlquiler: 680, caracteristicas: ['wifi', 'limpieza incluida'] },
          ],
        },
        {
          nombre: 'Tech Coliving Barcelona',
          direccion: 'Carrer de Pallars 200',
          ciudad: 'Barcelona',
          codigoPostal: '08005',
          tipoPropiedad: 'coliving',
          unidades: [
            { tipo: 'habitacion_individual', superficie: 14, habitaciones: 1, banos: 0, precioAlquiler: 750, caracteristicas: ['wifi fibra', 'coworking'] },
            { tipo: 'habitacion_individual', superficie: 14, habitaciones: 1, banos: 0, precioAlquiler: 750, caracteristicas: ['wifi fibra', 'coworking'] },
            { tipo: 'habitacion_suite', superficie: 22, habitaciones: 1, banos: 1, precioAlquiler: 1050, caracteristicas: ['wifi fibra', 'coworking', 'baño privado'] },
            { tipo: 'habitacion_individual', superficie: 12, habitaciones: 1, banos: 0, precioAlquiler: 680, caracteristicas: ['wifi fibra', 'coworking'] },
            { tipo: 'habitacion_individual', superficie: 15, habitaciones: 1, banos: 0, precioAlquiler: 780, caracteristicas: ['wifi fibra', 'coworking', 'terraza'] },
          ],
        },
      ],
      inquilinosBase: 12,
      contratosActivos: 10,
      incidenciasAbiertas: 2,
      eventosColiving: 5,
    },
  },

  // 5. ALQUILER TURÍSTICO
  alquiler_turistico: {
    id: 'alquiler_turistico',
    nombre: 'Alquiler Turístico',
    descripcion: 'Para apartamentos turísticos con gestión de reservas, check-in/out y limpieza.',
    icono: 'Plane',
    color: 'orange',
    modulosActivados: ['edificios', 'str', 'reservas', 'calendario', 'limpieza'],
    datos: {
      edificios: [
        {
          nombre: 'Apartamentos Sol y Playa',
          direccion: 'Avenida del Mar 45',
          ciudad: 'Málaga',
          codigoPostal: '29016',
          tipoPropiedad: 'turistico',
          unidades: [
            { tipo: 'apartamento_turistico', superficie: 50, habitaciones: 1, banos: 1, precioAlquiler: 90, caracteristicas: ['vistas mar', 'aire acondicionado', 'wifi'] },
            { tipo: 'apartamento_turistico', superficie: 65, habitaciones: 2, banos: 1, precioAlquiler: 120, caracteristicas: ['terraza', 'aire acondicionado', 'wifi'] },
            { tipo: 'apartamento_turistico', superficie: 45, habitaciones: 1, banos: 1, precioAlquiler: 80, caracteristicas: ['aire acondicionado', 'wifi'] },
            { tipo: 'apartamento_turistico', superficie: 80, habitaciones: 2, banos: 2, precioAlquiler: 150, caracteristicas: ['vistas mar', 'terraza', 'parking'] },
          ],
        },
        {
          nombre: 'Urban Flats Centro',
          direccion: 'Plaza Nueva 12',
          ciudad: 'Sevilla',
          codigoPostal: '41001',
          tipoPropiedad: 'turistico',
          unidades: [
            { tipo: 'loft_turistico', superficie: 40, habitaciones: 1, banos: 1, precioAlquiler: 85, caracteristicas: ['céntrico', 'wifi', 'smart tv'] },
            { tipo: 'apartamento_turistico', superficie: 55, habitaciones: 1, banos: 1, precioAlquiler: 95, caracteristicas: ['balcón', 'wifi', 'cocina equipada'] },
          ],
        },
      ],
      inquilinosBase: 0, // Los turísticos no tienen inquilinos fijos
      contratosActivos: 0,
      incidenciasAbiertas: 1,
      reservasTuristicas: 15,
    },
  },

  // 6. COMERCIAL Y OFICINAS
  comercial_oficinas: {
    id: 'comercial_oficinas',
    nombre: 'Locales y Oficinas',
    descripcion: 'Para gestión de espacios comerciales, oficinas y locales de negocio.',
    icono: 'Store',
    color: 'slate',
    modulosActivados: ['edificios', 'contratos', 'pagos', 'mantenimiento', 'documentos'],
    datos: {
      edificios: [
        {
          nombre: 'Centro Empresarial Castellana',
          direccion: 'Paseo de la Castellana 200',
          ciudad: 'Madrid',
          codigoPostal: '28046',
          tipoPropiedad: 'comercial',
          unidades: [
            { tipo: 'oficina', superficie: 150, habitaciones: 0, banos: 2, precioAlquiler: 3500, caracteristicas: ['diáfana', 'aire acondicionado central'] },
            { tipo: 'oficina', superficie: 80, habitaciones: 0, banos: 1, precioAlquiler: 1800, caracteristicas: ['2 despachos', 'sala reuniones'] },
            { tipo: 'oficina', superficie: 200, habitaciones: 0, banos: 3, precioAlquiler: 4500, caracteristicas: ['planta completa', 'recepción'] },
            { tipo: 'oficina', superficie: 50, habitaciones: 0, banos: 1, precioAlquiler: 1200, caracteristicas: ['coworking ready'] },
          ],
        },
        {
          nombre: 'Galería Comercial Centro',
          direccion: 'Calle Mayor 88',
          ciudad: 'Madrid',
          codigoPostal: '28013',
          tipoPropiedad: 'comercial',
          unidades: [
            { tipo: 'local', superficie: 120, habitaciones: 0, banos: 1, precioAlquiler: 2800, caracteristicas: ['esquina', 'escaparate doble'] },
            { tipo: 'local', superficie: 60, habitaciones: 0, banos: 1, precioAlquiler: 1500, caracteristicas: ['planta calle'] },
            { tipo: 'local', superficie: 45, habitaciones: 0, banos: 1, precioAlquiler: 1100, caracteristicas: ['ideal hostelería'] },
          ],
        },
      ],
      inquilinosBase: 6,
      contratosActivos: 5,
      incidenciasAbiertas: 2,
    },
  },

  // 7. COMUNIDAD DE PROPIETARIOS
  comunidad_propietarios: {
    id: 'comunidad_propietarios',
    nombre: 'Comunidad de Propietarios',
    descripcion: 'Para administradores de fincas con gestión de comunidades, votaciones y gastos comunes.',
    icono: 'Building',
    color: 'teal',
    modulosActivados: ['comunidades', 'votaciones', 'gastos', 'documentos', 'comunicaciones'],
    datos: {
      edificios: [
        {
          nombre: 'Comunidad Residencial El Parque',
          direccion: 'Calle del Parque 50',
          ciudad: 'Madrid',
          codigoPostal: '28035',
          tipoPropiedad: 'comunidad',
          unidades: [
            { tipo: 'vivienda', superficie: 90, habitaciones: 3, banos: 2, precioAlquiler: 0 },
            { tipo: 'vivienda', superficie: 90, habitaciones: 3, banos: 2, precioAlquiler: 0 },
            { tipo: 'vivienda', superficie: 75, habitaciones: 2, banos: 1, precioAlquiler: 0 },
            { tipo: 'vivienda', superficie: 75, habitaciones: 2, banos: 1, precioAlquiler: 0 },
            { tipo: 'vivienda', superficie: 110, habitaciones: 4, banos: 2, precioAlquiler: 0 },
            { tipo: 'vivienda', superficie: 110, habitaciones: 4, banos: 2, precioAlquiler: 0 },
            { tipo: 'local', superficie: 50, habitaciones: 0, banos: 1, precioAlquiler: 0 },
            { tipo: 'garaje', superficie: 12, habitaciones: 0, banos: 0, precioAlquiler: 0 },
            { tipo: 'garaje', superficie: 12, habitaciones: 0, banos: 0, precioAlquiler: 0 },
            { tipo: 'trastero', superficie: 8, habitaciones: 0, banos: 0, precioAlquiler: 0 },
          ],
        },
      ],
      inquilinosBase: 8, // Propietarios
      contratosActivos: 0,
      incidenciasAbiertas: 4,
      votacionesComunidad: 3,
    },
  },

  // 8. INVERSOR INMOBILIARIO
  inversor_inmobiliario: {
    id: 'inversor_inmobiliario',
    nombre: 'Inversor Inmobiliario',
    descripcion: 'Para inversores con portfolio diversificado. Incluye análisis de rentabilidad y reporting.',
    icono: 'TrendingUp',
    color: 'emerald',
    modulosActivados: ['edificios', 'contratos', 'pagos', 'analytics', 'documentos', 'reportes'],
    datos: {
      edificios: [
        {
          nombre: 'Portfolio Madrid Centro',
          direccion: 'Calle Atocha 100',
          ciudad: 'Madrid',
          codigoPostal: '28012',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'estudio', superficie: 28, habitaciones: 0, banos: 1, precioAlquiler: 750 },
            { tipo: 'estudio', superficie: 30, habitaciones: 0, banos: 1, precioAlquiler: 780 },
            { tipo: 'apartamento', superficie: 42, habitaciones: 1, banos: 1, precioAlquiler: 950 },
          ],
        },
        {
          nombre: 'Portfolio Barcelona Eixample',
          direccion: 'Carrer de València 250',
          ciudad: 'Barcelona',
          codigoPostal: '08007',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'piso', superficie: 65, habitaciones: 2, banos: 1, precioAlquiler: 1200 },
            { tipo: 'piso', superficie: 70, habitaciones: 2, banos: 1, precioAlquiler: 1250 },
          ],
        },
        {
          nombre: 'Local Comercial Retiro',
          direccion: 'Calle Narváez 30',
          ciudad: 'Madrid',
          codigoPostal: '28009',
          tipoPropiedad: 'comercial',
          unidades: [
            { tipo: 'local', superficie: 80, habitaciones: 0, banos: 1, precioAlquiler: 2200 },
          ],
        },
        {
          nombre: 'Apartamento Costa Blanca',
          direccion: 'Paseo de la Explanada 10',
          ciudad: 'Alicante',
          codigoPostal: '03001',
          tipoPropiedad: 'turistico',
          unidades: [
            { tipo: 'apartamento', superficie: 55, habitaciones: 1, banos: 1, precioAlquiler: 85, caracteristicas: ['turístico', 'vistas mar'] },
          ],
        },
      ],
      inquilinosBase: 7,
      contratosActivos: 6,
      incidenciasAbiertas: 1,
    },
  },

  // 9. DEMO COMPLETA
  completo: {
    id: 'completo',
    nombre: 'Demo Completa',
    descripcion: 'Demostración completa con todos los módulos y tipos de propiedades para presentaciones generales.',
    icono: 'Sparkles',
    color: 'indigo',
    modulosActivados: ['edificios', 'inquilinos', 'contratos', 'pagos', 'mantenimiento', 'crm', 'coliving', 'str', 'comunidades', 'documentos', 'calendario', 'analytics'],
    datos: {
      edificios: [
        {
          nombre: 'Residencial Premium',
          direccion: 'Calle Serrano 100',
          ciudad: 'Madrid',
          codigoPostal: '28006',
          tipoPropiedad: 'residencial',
          unidades: [
            { tipo: 'piso', superficie: 120, habitaciones: 4, banos: 2, precioAlquiler: 2500 },
            { tipo: 'piso', superficie: 85, habitaciones: 3, banos: 2, precioAlquiler: 1800 },
            { tipo: 'apartamento', superficie: 55, habitaciones: 1, banos: 1, precioAlquiler: 1100 },
          ],
        },
        {
          nombre: 'Coliving Innovation Hub',
          direccion: 'Calle Innovación 25',
          ciudad: 'Barcelona',
          codigoPostal: '08018',
          tipoPropiedad: 'coliving',
          unidades: [
            { tipo: 'habitacion_individual', superficie: 14, habitaciones: 1, banos: 0, precioAlquiler: 750 },
            { tipo: 'habitacion_individual', superficie: 14, habitaciones: 1, banos: 0, precioAlquiler: 750 },
            { tipo: 'habitacion_suite', superficie: 22, habitaciones: 1, banos: 1, precioAlquiler: 950 },
          ],
        },
        {
          nombre: 'Oficinas Tech Center',
          direccion: 'Avenida Diagonal 500',
          ciudad: 'Barcelona',
          codigoPostal: '08006',
          tipoPropiedad: 'comercial',
          unidades: [
            { tipo: 'oficina', superficie: 100, habitaciones: 0, banos: 2, precioAlquiler: 2500 },
            { tipo: 'oficina', superficie: 50, habitaciones: 0, banos: 1, precioAlquiler: 1300 },
          ],
        },
        {
          nombre: 'Apartamentos Costa del Sol',
          direccion: 'Paseo Marítimo 200',
          ciudad: 'Marbella',
          codigoPostal: '29602',
          tipoPropiedad: 'turistico',
          unidades: [
            { tipo: 'apartamento_turistico', superficie: 60, habitaciones: 1, banos: 1, precioAlquiler: 100 },
            { tipo: 'apartamento_turistico', superficie: 80, habitaciones: 2, banos: 1, precioAlquiler: 140 },
          ],
        },
      ],
      inquilinosBase: 12,
      contratosActivos: 8,
      incidenciasAbiertas: 4,
      leadsCRM: 15,
      eventosColiving: 3,
      reservasTuristicas: 8,
    },
  },
};

// Nombres de inquilinos para generar datos
export const DEMO_TENANT_NAMES = [
  { nombre: 'María García López', email: 'maria.garcia', dni: '12345678A' },
  { nombre: 'Carlos Rodríguez Pérez', email: 'carlos.rodriguez', dni: '23456789B' },
  { nombre: 'Ana Martínez Sánchez', email: 'ana.martinez', dni: '34567890C' },
  { nombre: 'Pedro López Fernández', email: 'pedro.lopez', dni: '45678901D' },
  { nombre: 'Laura González Díaz', email: 'laura.gonzalez', dni: '56789012E' },
  { nombre: 'Javier Hernández Ruiz', email: 'javier.hernandez', dni: '67890123F' },
  { nombre: 'Carmen Sánchez Torres', email: 'carmen.sanchez', dni: '78901234G' },
  { nombre: 'Miguel Fernández García', email: 'miguel.fernandez', dni: '89012345H' },
  { nombre: 'Isabel Martín López', email: 'isabel.martin', dni: '90123456I' },
  { nombre: 'Antonio Ruiz Hernández', email: 'antonio.ruiz', dni: '01234567J' },
  { nombre: 'Lucía Díaz Martínez', email: 'lucia.diaz', dni: '11234567K' },
  { nombre: 'David Torres Sánchez', email: 'david.torres', dni: '21234567L' },
  { nombre: 'Elena López García', email: 'elena.lopez', dni: '31234567M' },
  { nombre: 'Francisco García Rodríguez', email: 'francisco.garcia', dni: '41234567N' },
  { nombre: 'Patricia Hernández López', email: 'patricia.hernandez', dni: '51234567O' },
];

// Tipos de incidencias comunes
export const DEMO_INCIDENCIAS = [
  { titulo: 'Fuga en baño', descripcion: 'Hay una pequeña fuga en el grifo del lavabo del baño principal.', categoria: 'fontaneria', prioridad: 'media' },
  { titulo: 'Caldera no funciona', descripcion: 'La caldera no enciende, no hay agua caliente.', categoria: 'fontaneria', prioridad: 'alta' },
  { titulo: 'Puerta atascada', descripcion: 'La puerta de entrada se atasca al cerrar.', categoria: 'cerrajeria', prioridad: 'baja' },
  { titulo: 'Humedad en techo', descripcion: 'Ha aparecido una mancha de humedad en el techo del dormitorio.', categoria: 'albañileria', prioridad: 'media' },
  { titulo: 'Enchufe no funciona', descripcion: 'El enchufe del salón ha dejado de funcionar.', categoria: 'electricidad', prioridad: 'media' },
  { titulo: 'Aire acondicionado averiado', descripcion: 'El aire acondicionado hace ruido pero no enfría.', categoria: 'climatizacion', prioridad: 'alta' },
  { titulo: 'Persiana rota', descripcion: 'La persiana del dormitorio principal se ha roto y no sube.', categoria: 'persianas', prioridad: 'baja' },
  { titulo: 'Lavadora no desagua', descripcion: 'La lavadora termina el ciclo pero no vacía el agua.', categoria: 'electrodomesticos', prioridad: 'media' },
];

// Helper para obtener lista de escenarios para el selector
export function getDemoScenarioOptions() {
  return Object.values(DEMO_SCENARIOS).map(scenario => ({
    value: scenario.id,
    label: scenario.nombre,
    description: scenario.descripcion,
    icon: scenario.icono,
    color: scenario.color,
  }));
}
