import { prisma } from './db';
import Papa from 'papaparse';

// Tipos de datos que se pueden importar
export type ImportableEntity = 
  | 'buildings'
  | 'units'
  | 'tenants'
  | 'contracts'
  | 'payments'
  | 'providers'
  | 'expenses';

// Mapeo de campos para diferentes sistemas
export const SYSTEM_MAPPINGS = {
  homming: {
    buildings: {
      nombre: ['nombre', 'name', 'building_name'],
      direccion: ['direccion', 'address', 'direccion_completa'],
      ciudad: ['ciudad', 'city'],
      codigoPostal: ['codigo_postal', 'cp', 'zip_code'],
      numeroUnidades: ['num_unidades', 'units', 'numero_viviendas'],
      anosConstruccion: ['ano_construccion', 'year_built', 'construccion']
    },
    units: {
      numero: ['numero', 'number', 'unit_number', 'portal_piso_puerta'],
      tipo: ['tipo', 'type', 'property_type'],
      superficie: ['superficie', 'area', 'm2', 'square_meters'],
      habitaciones: ['habitaciones', 'rooms', 'bedrooms', 'dormitorios'],
      banos: ['banos', 'bathrooms', 'aseos'],
      rentaMensual: ['renta', 'rent', 'precio', 'monthly_rent'],
      estado: ['estado', 'status', 'availability']
    },
    tenants: {
      nombre: ['nombre', 'name', 'full_name', 'tenant_name'],
      apellidos: ['apellidos', 'surname', 'last_name'],
      email: ['email', 'correo', 'e-mail'],
      telefono: ['telefono', 'phone', 'mobile', 'tel'],
      dni: ['dni', 'nif', 'id', 'document_id'],
      fechaNacimiento: ['fecha_nacimiento', 'birth_date', 'dob']
    },
    contracts: {
      fechaInicio: ['fecha_inicio', 'start_date', 'fecha_alta'],
      fechaFin: ['fecha_fin', 'end_date', 'fecha_baja'],
      rentaMensual: ['renta_mensual', 'monthly_rent', 'renta'],
      diaPago: ['dia_pago', 'payment_day', 'dia_cobro'],
      deposito: ['deposito', 'deposit', 'fianza'],
      duracionMeses: ['duracion', 'duration_months', 'plazo']
    },
    payments: {
      fechaVencimiento: ['fecha_vencimiento', 'due_date', 'vencimiento'],
      monto: ['monto', 'amount', 'importe'],
      estado: ['estado', 'status', 'payment_status'],
      concepto: ['concepto', 'description', 'concept'],
      mes: ['mes', 'month', 'periodo']
    }
  },
  rentger: {
    buildings: {
      nombre: ['denominacion', 'edificio', 'inmueble'],
      direccion: ['direccion_fiscal', 'domicilio'],
      ciudad: ['poblacion', 'municipio'],
      codigoPostal: ['cp', 'codigo_postal'],
      numeroUnidades: ['numero_viviendas', 'total_pisos']
    },
    units: {
      numero: ['referencia', 'identificador', 'num_vivienda'],
      tipo: ['tipologia', 'categoria'],
      superficie: ['metros_cuadrados', 'superficie_util'],
      rentaMensual: ['alquiler_mensual', 'cuota']
    },
    tenants: {
      nombre: ['nombre_completo', 'inquilino'],
      email: ['correo_electronico', 'email'],
      telefono: ['telefono_movil', 'contacto'],
      dni: ['documento', 'nif_nie']
    }
  },
  nester: {
    buildings: {
      nombre: ['property_name', 'building'],
      direccion: ['full_address', 'street_address'],
      numeroUnidades: ['total_units', 'num_apartments']
    },
    units: {
      numero: ['apt_number', 'unit_ref'],
      superficie: ['sqm', 'size'],
      rentaMensual: ['rent_amount', 'monthly_price']
    },
    tenants: {
      nombre: ['tenant_name', 'resident_name'],
      email: ['contact_email'],
      telefono: ['phone_number']
    }
  },
  buildium: {
    buildings: {
      nombre: ['PropertyName', 'BuildingName'],
      direccion: ['StreetAddress'],
      ciudad: ['City'],
      codigoPostal: ['PostalCode'],
      numeroUnidades: ['NumberOfUnits']
    },
    units: {
      numero: ['UnitNumber', 'UnitAddress'],
      tipo: ['PropertyType'],
      superficie: ['SquareFeet'],
      rentaMensual: ['MarketRent', 'ActualRent']
    },
    tenants: {
      nombre: ['TenantName', 'FirstName LastName'],
      email: ['EmailAddress'],
      telefono: ['PhoneNumber'],
      fechaNacimiento: ['DateOfBirth']
    },
    contracts: {
      fechaInicio: ['LeaseStartDate'],
      fechaFin: ['LeaseEndDate'],
      rentaMensual: ['MonthlyRent'],
      deposito: ['SecurityDeposit']
    }
  },
  appfolio: {
    buildings: {
      nombre: ['Property'],
      direccion: ['Address'],
      numeroUnidades: ['Unit Count']
    },
    units: {
      numero: ['Unit'],
      rentaMensual: ['Market Rent']
    },
    tenants: {
      nombre: ['Tenant'],
      email: ['Email'],
      telefono: ['Phone']
    }
  },
  generic_csv: {
    buildings: {
      nombre: ['nombre', 'name', 'edificio', 'building', 'inmueble', 'property'],
      direccion: ['direccion', 'address', 'calle', 'street'],
      ciudad: ['ciudad', 'city', 'municipio', 'town'],
      codigoPostal: ['codigo_postal', 'cp', 'zip', 'postal_code'],
      numeroUnidades: ['unidades', 'units', 'viviendas', 'apartments']
    },
    units: {
      numero: ['numero', 'number', 'unit', 'vivienda', 'apartment'],
      tipo: ['tipo', 'type', 'category', 'categoria'],
      superficie: ['superficie', 'area', 'm2', 'sqm', 'size'],
      rentaMensual: ['renta', 'rent', 'precio', 'price', 'alquiler']
    },
    tenants: {
      nombre: ['nombre', 'name', 'inquilino', 'tenant'],
      email: ['email', 'correo', 'mail'],
      telefono: ['telefono', 'phone', 'tel', 'movil'],
      dni: ['dni', 'nif', 'id', 'documento']
    }
  }
};

// Mapeo de valores de estado
const STATUS_MAPPINGS: Record<string, Record<string, string>> = {
  unit: {
    'disponible': 'disponible',
    'available': 'disponible',
    'vacant': 'disponible',
    'libre': 'disponible',
    'ocupada': 'ocupada',
    'occupied': 'ocupada',
    'rented': 'ocupada',
    'alquilada': 'ocupada',
    'mantenimiento': 'mantenimiento',
    'maintenance': 'mantenimiento',
    'reform': 'mantenimiento'
  },
  contract: {
    'activo': 'activo',
    'active': 'activo',
    'vigente': 'activo',
    'finalizado': 'finalizado',
    'ended': 'finalizado',
    'expired': 'finalizado',
    'cancelado': 'cancelado',
    'cancelled': 'cancelado',
    'terminated': 'cancelado'
  },
  payment: {
    'pagado': 'pagado',
    'paid': 'pagado',
    'completed': 'pagado',
    'pendiente': 'pendiente',
    'pending': 'pendiente',
    'unpaid': 'pendiente',
    'vencido': 'vencido',
    'overdue': 'vencido',
    'late': 'vencido'
  }
};

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: ImportError[];
  warnings: string[];
  importedIds: string[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ImportError[];
  warnings: string[];
  preview: any[];
}

/**
 * Parsea un archivo CSV y devuelve los datos
 */
export async function parseCSV(fileContent: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`Error parsing CSV: ${results.errors[0].message}`));
        } else {
          resolve(results.data);
        }
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

/**
 * Mapea los campos de un registro según el sistema de origen
 */
export function mapFields(
  record: any,
  entityType: ImportableEntity,
  sourceSystem: keyof typeof SYSTEM_MAPPINGS
): any {
  const systemMapping = SYSTEM_MAPPINGS[sourceSystem] as any;
  if (!systemMapping) {
    return record;
  }

  const entityMapping = systemMapping[entityType];
  if (!entityMapping) {
    return record; // Si no hay mapeo, devolver el registro original
  }

  const mapped: any = {};
  const recordKeys = Object.keys(record).map(k => k.toLowerCase().trim());

  for (const [targetField, possibleSourceFields] of Object.entries(entityMapping)) {
    // Buscar el primer campo que coincida
    if (Array.isArray(possibleSourceFields)) {
      for (const sourceField of possibleSourceFields) {
        const sourceFieldLower = sourceField.toLowerCase();
        const foundKey = recordKeys.find(key => key === sourceFieldLower);
        
        if (foundKey) {
          const originalKey = Object.keys(record).find(k => k.toLowerCase().trim() === foundKey);
          if (originalKey) {
            mapped[targetField] = record[originalKey];
            break;
          }
        }
      }
    }
  }

  return mapped;
}

/**
 * Normaliza un valor de estado según el tipo de entidad
 */
function normalizeStatus(value: string | undefined, entityType: string): string | undefined {
  if (!value) return undefined;
  
  const normalized = value.toLowerCase().trim();
  const mapping = STATUS_MAPPINGS[entityType];
  
  if (mapping && mapping[normalized]) {
    return mapping[normalized];
  }
  
  return value;
}

/**
 * Valida los datos antes de importar
 */
export async function validateImportData(
  data: any[],
  entityType: ImportableEntity,
  sourceSystem: keyof typeof SYSTEM_MAPPINGS,
  companyId: string
): Promise<ValidationResult> {
  const errors: ImportError[] = [];
  const warnings: string[] = [];
  const preview: any[] = [];

  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const record = data[i];
    const mapped = mapFields(record, entityType, sourceSystem);
    
    // Validaciones específicas por tipo de entidad
    switch (entityType) {
      case 'buildings':
        if (!mapped.nombre) {
          errors.push({ row: i + 1, field: 'nombre', message: 'El nombre del edificio es obligatorio' });
        }
        if (!mapped.direccion) {
          errors.push({ row: i + 1, field: 'direccion', message: 'La dirección es obligatoria' });
        }
        break;
        
      case 'units':
        if (!mapped.numero) {
          errors.push({ row: i + 1, field: 'numero', message: 'El número de unidad es obligatorio' });
        }
        if (mapped.superficie && isNaN(parseFloat(mapped.superficie))) {
          errors.push({ row: i + 1, field: 'superficie', message: 'La superficie debe ser un número' });
        }
        if (mapped.rentaMensual && isNaN(parseFloat(mapped.rentaMensual))) {
          errors.push({ row: i + 1, field: 'rentaMensual', message: 'La renta mensual debe ser un número' });
        }
        break;
        
      case 'tenants':
        if (!mapped.nombre && !mapped.apellidos) {
          errors.push({ row: i + 1, field: 'nombre', message: 'El nombre del inquilino es obligatorio' });
        }
        if (mapped.email && !mapped.email.includes('@')) {
          errors.push({ row: i + 1, field: 'email', message: 'El email no es válido' });
        }
        break;
        
      case 'contracts':
        if (!mapped.fechaInicio) {
          errors.push({ row: i + 1, field: 'fechaInicio', message: 'La fecha de inicio es obligatoria' });
        }
        if (!mapped.rentaMensual || isNaN(parseFloat(mapped.rentaMensual))) {
          errors.push({ row: i + 1, field: 'rentaMensual', message: 'La renta mensual es obligatoria y debe ser un número' });
        }
        break;
    }
    
    preview.push(mapped);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    preview
  };
}

/**
 * Importa edificios
 */
async function importBuildings(
  data: any[],
  companyId: string,
  sourceSystem: keyof typeof SYSTEM_MAPPINGS
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    totalRows: data.length,
    successfulImports: 0,
    failedImports: 0,
    errors: [],
    warnings: [],
    importedIds: []
  };

  for (let i = 0; i < data.length; i++) {
    try {
      const record = mapFields(data[i], 'buildings', sourceSystem);
      
      // Validar campos obligatorios
      if (!record.nombre || !record.direccion) {
        result.errors.push({
          row: i + 1,
          message: 'Nombre y dirección son obligatorios',
          data: record
        });
        result.failedImports++;
        continue;
      }

      // Verificar si ya existe un edificio con el mismo nombre y dirección
      const existingBuilding = await prisma.building.findFirst({
        where: {
          companyId,
          nombre: record.nombre,
          direccion: record.direccion
        }
      });

      if (existingBuilding) {
        result.warnings.push(`Fila ${i + 1}: Edificio "${record.nombre}" ya existe, se omitirá`);
        result.failedImports++;
        continue;
      }

      // Construir dirección completa
      const direccionCompleta = [
        record.direccion,
        record.ciudad,
        record.codigoPostal,
        record.pais || 'España'
      ].filter(Boolean).join(', ');

      // Crear el edificio
      const building = await prisma.building.create({
        data: {
          companyId,
          nombre: record.nombre,
          direccion: direccionCompleta,
          tipo: 'residencial',
          numeroUnidades: parseInt(record.numeroUnidades) || 0,
          anoConstructor: record.anosConstruccion ? parseInt(record.anosConstruccion) : new Date().getFullYear()
        }
      });

      result.successfulImports++;
      result.importedIds.push(building.id);
    } catch (error) {
      result.errors.push({
        row: i + 1,
        message: error instanceof Error ? error.message : String(error) || 'Error desconocido',
        data: data[i]
      });
      result.failedImports++;
    }
  }

  result.success = result.successfulImports > 0;
  return result;
}

/**
 * Importa unidades
 */
async function importUnits(
  data: any[],
  companyId: string,
  sourceSystem: keyof typeof SYSTEM_MAPPINGS,
  buildingId?: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    totalRows: data.length,
    successfulImports: 0,
    failedImports: 0,
    errors: [],
    warnings: [],
    importedIds: []
  };

  for (let i = 0; i < data.length; i++) {
    try {
      const record = mapFields(data[i], 'units', sourceSystem);
      
      // Validar campos obligatorios
      if (!record.numero) {
        result.errors.push({
          row: i + 1,
          field: 'numero',
          message: 'El número de unidad es obligatorio',
          data: record
        });
        result.failedImports++;
        continue;
      }

      // Determinar el edificio
      let targetBuildingId = buildingId;
      
      if (!targetBuildingId && record.edificio) {
        // Buscar el edificio por nombre
        const building = await prisma.building.findFirst({
          where: {
            companyId,
            nombre: { contains: record.edificio, mode: 'insensitive' }
          }
        });
        
        if (building) {
          targetBuildingId = building.id;
        }
      }

      if (!targetBuildingId) {
        result.errors.push({
          row: i + 1,
          message: 'No se pudo determinar el edificio para esta unidad',
          data: record
        });
        result.failedImports++;
        continue;
      }

      // Verificar si ya existe
      const existingUnit = await prisma.unit.findFirst({
        where: {
          buildingId: targetBuildingId,
          numero: record.numero
        }
      });

      if (existingUnit) {
        result.warnings.push(`Fila ${i + 1}: Unidad "${record.numero}" ya existe en este edificio`);
        result.failedImports++;
        continue;
      }

      // Normalizar el estado
      const estado = normalizeStatus(record.estado, 'unit') as any || 'disponible';

      // Crear la unidad
      const unit = await prisma.unit.create({
        data: {
          buildingId: targetBuildingId,
          numero: record.numero,
          tipo: record.tipo || 'vivienda',
          superficie: record.superficie ? parseFloat(record.superficie) : 50,
          habitaciones: record.habitaciones ? parseInt(record.habitaciones) : undefined,
          banos: record.banos ? parseInt(record.banos) : undefined,
          rentaMensual: record.rentaMensual ? parseFloat(record.rentaMensual) : 0,
          estado: estado
        }
      });

      result.successfulImports++;
      result.importedIds.push(unit.id);
    } catch (error) {
      result.errors.push({
        row: i + 1,
        message: error instanceof Error ? error.message : String(error) || 'Error desconocido',
        data: data[i]
      });
      result.failedImports++;
    }
  }

  result.success = result.successfulImports > 0;
  return result;
}

/**
 * Importa inquilinos
 */
async function importTenants(
  data: any[],
  companyId: string,
  sourceSystem: keyof typeof SYSTEM_MAPPINGS
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    totalRows: data.length,
    successfulImports: 0,
    failedImports: 0,
    errors: [],
    warnings: [],
    importedIds: []
  };

  for (let i = 0; i < data.length; i++) {
    try {
      const record = mapFields(data[i], 'tenants', sourceSystem);
      
      // Validar campos obligatorios
      if (!record.nombre && !record.apellidos) {
        result.errors.push({
          row: i + 1,
          field: 'nombre',
          message: 'El nombre del inquilino es obligatorio',
          data: record
        });
        result.failedImports++;
        continue;
      }

      // Verificar si ya existe por email o DNI
      if (record.email) {
        const existingTenant = await prisma.tenant.findFirst({
          where: {
            companyId,
            email: record.email
          }
        });

        if (existingTenant) {
          result.warnings.push(`Fila ${i + 1}: Inquilino con email "${record.email}" ya existe`);
          result.failedImports++;
          continue;
        }
      }

      // Crear el inquilino
      const nombreCompleto = [record.nombre, record.apellidos].filter(Boolean).join(' ') || 'Sin nombre';
      const tenant = await prisma.tenant.create({
        data: {
          companyId,
          nombreCompleto,
          email: record.email || `tenant_${Date.now()}@example.com`,
          telefono: record.telefono || '000000000',
          dni: record.dni || `DNI_${Date.now()}`,
          fechaNacimiento: record.fechaNacimiento ? new Date(record.fechaNacimiento) : new Date('1990-01-01'),
          direccionActual: record.direccionAnterior,
          empresa: record.empresaTrabajo,
          ingresosMensuales: record.ingresosMensuales ? parseFloat(record.ingresosMensuales) : undefined,
          notas: record.ocupacion || ''
        }
      });

      result.successfulImports++;
      result.importedIds.push(tenant.id);
    } catch (error) {
      result.errors.push({
        row: i + 1,
        message: error instanceof Error ? error.message : String(error) || 'Error desconocido',
        data: data[i]
      });
      result.failedImports++;
    }
  }

  result.success = result.successfulImports > 0;
  return result;
}

/**
 * Función principal de importación
 */
export async function importData(
  data: any[],
  entityType: ImportableEntity,
  companyId: string,
  sourceSystem: keyof typeof SYSTEM_MAPPINGS = 'generic_csv',
  options: { buildingId?: string } = {}
): Promise<ImportResult> {
  switch (entityType) {
    case 'buildings':
      return await importBuildings(data, companyId, sourceSystem);
    
    case 'units':
      return await importUnits(data, companyId, sourceSystem, options.buildingId);
    
    case 'tenants':
      return await importTenants(data, companyId, sourceSystem);
    
    default:
      throw new Error(`Tipo de entidad no soportado: ${entityType}`);
  }
}

/**
 * Genera una plantilla CSV para un tipo de entidad
 */
export function generateCSVTemplate(entityType: ImportableEntity): string {
  const headers: Record<ImportableEntity, string[]> = {
    buildings: ['nombre', 'direccion', 'ciudad', 'codigoPostal', 'numeroUnidades', 'anosConstruccion'],
    units: ['numero', 'edificio', 'tipo', 'superficie', 'habitaciones', 'banos', 'rentaMensual', 'estado'],
    tenants: ['nombre', 'apellidos', 'email', 'telefono', 'dni', 'fechaNacimiento', 'ingresosMensuales'],
    contracts: ['tenantEmail', 'unitNumero', 'edificio', 'fechaInicio', 'fechaFin', 'rentaMensual', 'diaPago', 'deposito'],
    payments: ['contratoId', 'mes', 'monto', 'fechaVencimiento', 'estado', 'concepto'],
    providers: ['nombre', 'tipo', 'email', 'telefono', 'cif', 'servicios'],
    expenses: ['concepto', 'categoria', 'monto', 'fecha', 'edificio', 'notas']
  };

  return headers[entityType].join(',') + '\n';
}
