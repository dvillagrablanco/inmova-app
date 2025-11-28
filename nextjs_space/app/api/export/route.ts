import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import Papa from 'papaparse';

// GET /api/export?type=buildings|units|tenants|contracts|payments|expenses
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Tipo no especificado' }, { status: 400 });
    }

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'buildings':
        const buildings = await db.building.findMany({
          orderBy: { nombre: 'asc' },
        });
        data = buildings.map((b) => ({
          nombre: b.nombre,
          direccion: b.direccion,
          tipo: b.tipo,
          anoConstructor: b.anoConstructor,
          numeroUnidades: b.numeroUnidades,
          estadoConservacion: b.estadoConservacion || '',
          certificadoEnergetico: b.certificadoEnergetico || '',
          ascensor: b.ascensor ? 'Sí' : 'No',
          garaje: b.garaje ? 'Sí' : 'No',
          trastero: b.trastero ? 'Sí' : 'No',
          piscina: b.piscina ? 'Sí' : 'No',
          jardin: b.jardin ? 'Sí' : 'No',
          gastosComunidad: b.gastosComunidad || '',
          ibiAnual: b.ibiAnual || '',
        }));
        filename = 'edificios.csv';
        break;

      case 'units':
        const units = await db.unit.findMany({
          include: {
            building: { select: { nombre: true } },
            tenant: { select: { nombreCompleto: true } },
          },
          orderBy: { numero: 'asc' },
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

    // Convertir a CSV
    const csv = Papa.unparse(data);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error al exportar:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}
