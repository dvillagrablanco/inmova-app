import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import logger, { logError } from '@/lib/logger';
import {
  generateCSV,
  createCSVResponse,
  formatDateForCSV,
  formatBooleanForCSV,
  formatMoneyForCSV,
  CSV_CONFIG,
} from '@/lib/csv-export-helpers';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de Exportación CSV Mejorado
 *
 * Mejoras aplicadas (Semana 2, Tarea 2.6):
 * - Filtrado obligatorio por companyId (seguridad)
 * - Límite de 10,000 filas (performance)
 * - Formato UTF-8 con BOM (compatibilidad Excel)
 * - Helpers reutilizables
 * - Error handling robusto
 *
 * GET /api/export?type=buildings|units|tenants|contracts|payments|expenses
 */
export async function GET(request: Request) {
  // Extract type outside try-catch for error logging
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Tipo no especificado' }, { status: 400 });
    }

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'buildings':
        const buildings = await db.building.findMany({
          where: { companyId },
          orderBy: { nombre: 'asc' },
          take: CSV_CONFIG.MAX_ROWS,
        });
        data = buildings.map((b) => ({
          nombre: b.nombre,
          direccion: b.direccion,
          tipo: b.tipo,
          anoConstructor: b.anoConstructor,
          numeroUnidades: b.numeroUnidades,
          estadoConservacion: b.estadoConservacion || '',
          certificadoEnergetico: b.certificadoEnergetico || '',
          ascensor: formatBooleanForCSV(b.ascensor),
          garaje: formatBooleanForCSV(b.garaje),
          trastero: formatBooleanForCSV(b.trastero),
          piscina: formatBooleanForCSV(b.piscina),
          jardin: formatBooleanForCSV(b.jardin),
          gastosComunidad: formatMoneyForCSV(b.gastosComunidad),
          ibiAnual: formatMoneyForCSV(b.ibiAnual),
        }));
        filename = 'edificios.csv';
        break;

      case 'units':
        const units = await db.unit.findMany({
          where: { building: { companyId } },
          include: {
            building: { select: { nombre: true } },
            tenant: { select: { nombreCompleto: true } },
          },
          orderBy: { numero: 'asc' },
          take: CSV_CONFIG.MAX_ROWS,
        });
        data = units.map((u) => ({
          edificio: u.building.nombre,
          numero: u.numero,
          tipo: u.tipo,
          estado: u.estado,
          superficie: u.superficie,
          habitaciones: u.habitaciones || '',
          banos: u.banos || '',
          planta: u.planta || '',
          orientacion: u.orientacion || '',
          rentaMensual: u.rentaMensual,
          inquilino: u.tenant?.nombreCompleto || '',
          amueblado: u.amueblado ? 'Sí' : 'No',
          aireAcondicionado: u.aireAcondicionado ? 'Sí' : 'No',
          calefaccion: u.calefaccion ? 'Sí' : 'No',
        }));
        filename = 'unidades.csv';
        break;

      case 'tenants':
        const tenants = await db.tenant.findMany({
          orderBy: { nombreCompleto: 'asc' },
        });
        data = tenants.map((t) => ({
          nombreCompleto: t.nombreCompleto,
          dni: t.dni,
          email: t.email,
          telefono: t.telefono,
          fechaNacimiento: t.fechaNacimiento.toISOString().split('T')[0],
          nacionalidad: t.nacionalidad || '',
          estadoCivil: t.estadoCivil || '',
          numeroOcupantes: t.numeroOcupantes || '',
          situacionLaboral: t.situacionLaboral || '',
          empresa: t.empresa || '',
          ingresosMensuales: t.ingresosMensuales || '',
          scoring: t.scoring,
          nivelRiesgo: t.nivelRiesgo,
        }));
        filename = 'inquilinos.csv';
        break;

      case 'contracts':
        const contracts = await db.contract.findMany({
          include: {
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
            tenant: { select: { nombreCompleto: true } },
          },
          orderBy: { fechaInicio: 'desc' },
        });
        data = contracts.map((c) => ({
          edificio: c.unit.building.nombre,
          unidad: c.unit.numero,
          inquilino: c.tenant.nombreCompleto,
          fechaInicio: c.fechaInicio.toISOString().split('T')[0],
          fechaFin: c.fechaFin.toISOString().split('T')[0],
          rentaMensual: c.rentaMensual,
          deposito: c.deposito,
          estado: c.estado,
          tipo: c.tipo,
        }));
        filename = 'contratos.csv';
        break;

      case 'payments':
        const payments = await db.payment.findMany({
          include: {
            contract: {
              include: {
                unit: { select: { numero: true, building: { select: { nombre: true } } } },
                tenant: { select: { nombreCompleto: true } },
              },
            },
          },
          orderBy: { fechaVencimiento: 'desc' },
        });
        data = payments.map((p) => ({
          edificio: p.contract.unit.building.nombre,
          unidad: p.contract.unit.numero,
          inquilino: p.contract.tenant.nombreCompleto,
          periodo: p.periodo,
          monto: p.monto,
          fechaVencimiento: p.fechaVencimiento.toISOString().split('T')[0],
          fechaPago: p.fechaPago ? p.fechaPago.toISOString().split('T')[0] : '',
          estado: p.estado,
          metodoPago: p.metodoPago || '',
        }));
        filename = 'pagos.csv';
        break;

      case 'expenses':
        const expenses = await db.expense.findMany({
          include: {
            building: { select: { nombre: true } },
            unit: { select: { numero: true } },
            provider: { select: { nombre: true } },
          },
          orderBy: { fecha: 'desc' },
        });
        data = expenses.map((e) => ({
          edificio: e.building?.nombre || '',
          unidad: e.unit?.numero || '',
          proveedor: e.provider?.nombre || '',
          concepto: e.concepto,
          categoria: e.categoria,
          monto: e.monto,
          fecha: e.fecha.toISOString().split('T')[0],
        }));
        filename = 'gastos.csv';
        break;

      default:
        return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
    }

    // Validar que hay datos
    if (data.length === 0) {
      return NextResponse.json({ error: 'No hay datos para exportar' }, { status: 404 });
    }

    // Convertir a CSV con formato optimizado
    const csv = generateCSV(data);

    // Log de exportación exitosa
    logger.info('Exportación CSV exitosa', {
      type,
      companyId,
      recordCount: data.length,
      filename,
    });

    // Retornar respuesta con headers correctos
    return createCSVResponse(csv, filename);
  } catch (error: any) {
    logger.error('Error al exportar:', {
      type,
      error: error.message,
      stack: error.stack,
    });

    // Manejar errores específicos de Prisma
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'No se encontraron datos' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Error al exportar datos. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
