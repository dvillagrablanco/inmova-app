import { prisma } from './db';
import { format as formatDate } from 'date-fns';

export interface BackupOptions {
  companyId: string;
  tipo: 'completo' | 'incremental' | 'manual';
  inicioPor: string;
  includeModels?: string[];
}

export interface ExportOptions {
  companyId: string;
  model: string;
  format: 'json' | 'csv' | 'xlsx';
  filters?: any;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Servicio de Backup - Genera respaldos de datos de la empresa
 */
export async function createBackup(options: BackupOptions) {
  try {
    const { companyId, tipo, inicioPor } = options;

    // Crear registro de backup
    const backup = await prisma.systemBackup.create({
      data: {
        companyId,
        tipo: tipo as any,
        estado: 'en_progreso' as any,
        inicioPor,
        registros: 0
      }
    });

    // Obtener todos los datos de la empresa
    const data: any = {};
    let totalRegistros = 0;

    // Edificios
    data.buildings = await prisma.building.findMany({
      where: { companyId },
      include: {
        units: {
          include: {
            contracts: true,
            documents: true
          }
        },
        expenses: true,
        documents: true
      }
    });
    totalRegistros += data.buildings.length;

    // Inquilinos
    data.tenants = await prisma.tenant.findMany({
      where: { companyId },
      include: {
        contracts: true,
        documents: true
      }
    });
    totalRegistros += data.tenants.length;

    // Contratos
    data.contracts = await prisma.contract.findMany({
      where: {
        unit: {
          building: { companyId }
        }
      },
      include: {
        payments: true
      }
    });
    totalRegistros += data.contracts.length;

    // Proveedores
    data.providers = await prisma.provider.findMany({
      where: { companyId }
    });
    totalRegistros += data.providers.length;

    // Usuarios
    data.users = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        activo: true,
        createdAt: true
      }
    });
    totalRegistros += data.users.length;

    // Calcular tamaño aproximado
    const jsonString = JSON.stringify(data);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

    // En producción, aquí subirías el backup a S3 o almacenamiento cloud
    const ubicacion = `/backups/${companyId}/${backup.id}_${formatDate(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;

    // Actualizar registro
    await prisma.systemBackup.update({
      where: { id: backup.id },
      data: {
        estado: 'completado' as any,
        registros: totalRegistros,
        tamano: `${sizeInMB} MB`,
        ubicacion,
        completedAt: new Date()
      }
    });

    return {
      success: true,
      backup: backup.id,
      registros: totalRegistros,
      tamano: sizeInMB,
      data // En producción, no retornar los datos, solo la ubicación
    };
  } catch (error: any) {
    console.error('Error creating backup:', error);
    throw new Error(`Error al crear backup: ${error.message}`);
  }
}

/**
 * Servicio de Exportación - Exporta datos específicos a diferentes formatos
 */
export async function exportData(options: ExportOptions) {
  try {
    const { companyId, model, format, filters = {}, startDate, endDate } = options;

    let data: any[] = [];

    // Filtros de fecha si aplican
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    } : {};

    // Obtener datos según el modelo
    switch (model) {
      case 'buildings':
        data = await prisma.building.findMany({
          where: { companyId, ...filters, ...dateFilter }
        });
        break;

      case 'units':
        data = await prisma.unit.findMany({
          where: {
            building: { companyId },
            ...filters,
            ...dateFilter
          },
          include: {
            building: { select: { nombre: true } }
          }
        });
        break;

      case 'tenants':
        data = await prisma.tenant.findMany({
          where: { companyId, ...filters, ...dateFilter }
        });
        break;

      case 'contracts':
        data = await prisma.contract.findMany({
          where: {
            unit: { building: { companyId } },
            ...filters,
            ...dateFilter
          },
          include: {
            tenant: { select: { nombreCompleto: true } },
            unit: {
              select: {
                numero: true,
                building: { select: { nombre: true } }
              }
            }
          }
        });
        break;

      case 'payments':
        data = await prisma.payment.findMany({
          where: {
            contract: {
              unit: { building: { companyId } }
            },
            ...filters,
            ...dateFilter
          },
          include: {
            contract: {
              select: {
                tenant: { select: { nombreCompleto: true } },
                unit: {
                  select: {
                    numero: true,
                    building: { select: { nombre: true } }
                  }
                }
              }
            }
          }
        });
        break;

      case 'maintenance':
        data = await prisma.maintenanceRequest.findMany({
          where: {
            ...filters,
            ...dateFilter
          }
        });
        break;

      case 'expenses':
        data = await prisma.expense.findMany({
          where: {
            building: { companyId },
            ...filters,
            ...dateFilter
          },
          include: {
            building: { select: { nombre: true } }
          }
        });
        break;

      case 'providers':
        data = await prisma.provider.findMany({
          where: { companyId, ...filters, ...dateFilter }
        });
        break;

      default:
        throw new Error(`Modelo no soportado: ${model}`);
    }

    // Formatear datos según el tipo
    if (format === 'csv') {
      return convertToCSV(data);
    } else if (format === 'xlsx') {
      // En producción, usar una librería como 'xlsx' para generar Excel
      return {
        data,
        format: 'xlsx',
        filename: `${model}_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`
      };
    } else {
      return {
        data,
        format: 'json',
        filename: `${model}_${formatDate(new Date(), 'yyyy-MM-dd')}.json`
      };
    }
  } catch (error: any) {
    console.error('Error exporting data:', error);
    throw new Error(`Error al exportar datos: ${error.message}`);
  }
}

/**
 * Convertir datos a formato CSV
 */
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  // Obtener headers (keys del primer objeto)
  const headers = Object.keys(flattenObject(data[0]));
  
  // Crear filas
  const rows = data.map(item => {
    const flattened = flattenObject(item);
    return headers.map(header => {
      const value = flattened[header];
      // Escapar comas y comillas en valores
      if (value === null || value === undefined) return '';
      const stringValue = typeof value === 'string' ? value : value.toString();
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  // Combinar headers y rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Aplanar objeto anidado para CSV
 */
function flattenObject(obj: any, prefix = ''): any {
  const flattened: any = {};

  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      flattened[prefix + key] = obj[key];
    } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
      Object.assign(flattened, flattenObject(obj[key], `${prefix}${key}_`));
    } else if (Array.isArray(obj[key])) {
      flattened[prefix + key] = obj[key].join('; ');
    } else {
      flattened[prefix + key] = obj[key];
    }
  }

  return flattened;
}

/**
 * Obtener lista de backups
 */
export async function getBackups(companyId: string) {
  return await prisma.systemBackup.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

/**
 * Eliminar backups antiguos (más de X días)
 */
export async function cleanOldBackups(companyId: string, daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  await prisma.systemBackup.deleteMany({
    where: {
      companyId,
      createdAt: {
        lt: cutoffDate
      }
    }
  });
}
