import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import Papa from 'papaparse';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/import?type=buildings|units|tenants
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as any;
    const companyId = user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Tipo no especificado' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: 'Error al parsear CSV', details: parsed.errors },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      errors: [] as any[],
      total: parsed.data.length,
    };

    switch (type) {
      case 'buildings':
        for (const [index, row] of (parsed.data as any[]).entries()) {
          try {
            await db.building.create({
              data: {
                companyId,
                nombre: row.nombre,
                direccion: row.direccion,
                tipo: row.tipo || 'residencial',
                anoConstructor: parseInt(row.anoConstructor) || new Date().getFullYear(),
                numeroUnidades: parseInt(row.numeroUnidades) || 0,
                estadoConservacion: row.estadoConservacion || null,
                certificadoEnergetico: row.certificadoEnergetico || null,
                ascensor: row.ascensor?.toLowerCase() === 'sí' || row.ascensor?.toLowerCase() === 'si',
                garaje: row.garaje?.toLowerCase() === 'sí' || row.garaje?.toLowerCase() === 'si',
                trastero: row.trastero?.toLowerCase() === 'sí' || row.trastero?.toLowerCase() === 'si',
                piscina: row.piscina?.toLowerCase() === 'sí' || row.piscina?.toLowerCase() === 'si',
                jardin: row.jardin?.toLowerCase() === 'sí' || row.jardin?.toLowerCase() === 'si',
                gastosComunidad: row.gastosComunidad ? parseFloat(row.gastosComunidad) : null,
                ibiAnual: row.ibiAnual ? parseFloat(row.ibiAnual) : null,
              },
            });
            results.success++;
          } catch (error: any) {
            results.errors.push({
              row: index + 1,
              data: row,
              error: error.message,
            });
          }
        }
        break;

      case 'units':
        for (const [index, row] of (parsed.data as any[]).entries()) {
          try {
            // Buscar el edificio por nombre
            const building = await db.building.findFirst({
              where: { nombre: row.edificio },
            });

            if (!building) {
              throw new Error(`Edificio "${row.edificio}" no encontrado`);
            }

            await db.unit.create({
              data: {
                numero: row.numero,
                buildingId: building.id,
                tipo: row.tipo || 'vivienda',
                estado: row.estado || 'disponible',
                superficie: parseFloat(row.superficie) || 0,
                habitaciones: row.habitaciones ? parseInt(row.habitaciones) : null,
                banos: row.banos ? parseInt(row.banos) : null,
                planta: row.planta ? parseInt(row.planta) : null,
                orientacion: row.orientacion || null,
                rentaMensual: parseFloat(row.rentaMensual) || 0,
                amueblado: row.amueblado?.toLowerCase() === 'sí' || row.amueblado?.toLowerCase() === 'si',
                aireAcondicionado: row.aireAcondicionado?.toLowerCase() === 'sí' || row.aireAcondicionado?.toLowerCase() === 'si',
                calefaccion: row.calefaccion?.toLowerCase() === 'sí' || row.calefaccion?.toLowerCase() === 'si',
              },
            });
            results.success++;
          } catch (error: any) {
            results.errors.push({
              row: index + 1,
              data: row,
              error: error.message,
            });
          }
        }
        break;

      case 'tenants':
        for (const [index, row] of (parsed.data as any[]).entries()) {
          try {
            await db.tenant.create({
              data: {
                companyId,
                nombreCompleto: row.nombreCompleto,
                dni: row.dni,
                email: row.email,
                telefono: row.telefono,
                fechaNacimiento: new Date(row.fechaNacimiento),
                nacionalidad: row.nacionalidad || null,
                estadoCivil: row.estadoCivil || null,
                numeroOcupantes: row.numeroOcupantes ? parseInt(row.numeroOcupantes) : null,
                situacionLaboral: row.situacionLaboral || null,
                empresa: row.empresa || null,
                ingresosMensuales: row.ingresosMensuales ? parseFloat(row.ingresosMensuales) : null,
                scoring: row.scoring ? parseInt(row.scoring) : 50,
                nivelRiesgo: row.nivelRiesgo || 'medio',
                notas: '',
              },
            });
            results.success++;
          } catch (error: any) {
            results.errors.push({
              row: index + 1,
              data: row,
              error: error.message,
            });
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
    }

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Error al importar:', error);
    return NextResponse.json(
      { error: 'Error al importar datos' },
      { status: 500 }
    );
  }
}

// DELETE /api/import?action=clear - Limpiar datos de ejemplo
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action !== 'clear') {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    // Eliminar en orden debido a las relaciones
    await db.payment.deleteMany({});
    await db.contract.deleteMany({});
    await db.document.deleteMany({});
    await db.maintenanceRequest.deleteMany({});
    await db.expense.deleteMany({});
    await db.visit.deleteMany({});
    await db.candidate.deleteMany({});
    await db.unit.deleteMany({});
    await db.building.deleteMany({});
    await db.tenant.deleteMany({});
    await db.provider.deleteMany({});
    await db.notification.deleteMany({});
    await db.message.deleteMany({});
    await db.template.deleteMany({});

    return NextResponse.json({
      message: 'Datos de ejemplo eliminados correctamente',
    });
  } catch (error) {
    logger.error('Error al limpiar datos:', error);
    return NextResponse.json(
      { error: 'Error al limpiar datos' },
      { status: 500 }
    );
  }
}
