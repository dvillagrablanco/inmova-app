import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, edificios, unidades, inquilinos, contratos, pagos, mantenimiento
    const limit = parseInt(searchParams.get('limit') || '20');

    const companyId = (session.user as any).companyId;

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: [],
        total: 0,
        query
      });
    }

    const results: any = {
      edificios: [],
      unidades: [],
      inquilinos: [],
      contratos: [],
      pagos: [],
      mantenimiento: [],
      proveedores: [],
      documentos: []
    };

    // Búsqueda en Edificios
    if (type === 'all' || type === 'edificios') {
      results.edificios = await prisma.building.findMany({
        where: {
          companyId,
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } },
            { direccion: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: { nombre: 'asc' }
      });
    }

    // Búsqueda en Unidades
    if (type === 'all' || type === 'unidades') {
      results.unidades = await prisma.unit.findMany({
        where: {
          building: { companyId },
          numero: { contains: query, mode: 'insensitive' }
        },
        include: {
          building: { select: { nombre: true } }
        },
        take: limit,
        orderBy: { numero: 'asc' }
      });
    }

    // Búsqueda en Inquilinos
    if (type === 'all' || type === 'inquilinos') {
      results.inquilinos = await prisma.tenant.findMany({
        where: {
          companyId,
          OR: [
            { nombreCompleto: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { telefono: { contains: query, mode: 'insensitive' } },
            { dni: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: { nombreCompleto: 'asc' }
      });
    }

    // Búsqueda en Contratos
    if (type === 'all' || type === 'contratos') {
      results.contratos = await prisma.contract.findMany({
        where: {
          unit: { building: { companyId } },
          OR: [
            { tenant: { nombreCompleto: { contains: query, mode: 'insensitive' } } },
            { unit: { numero: { contains: query, mode: 'insensitive' } } }
          ]
        },
        include: {
          tenant: { select: { nombreCompleto: true } },
          unit: { 
            select: { 
              numero: true, 
              building: { select: { nombre: true } } 
            } 
          }
        },
        take: limit,
        orderBy: { fechaInicio: 'desc' }
      });
    }

    // Búsqueda en Pagos
    if (type === 'all' || type === 'pagos') {
      results.pagos = await prisma.payment.findMany({
        where: {
          contract: { unit: { building: { companyId } } },
          OR: [
            { contract: { tenant: { nombreCompleto: { contains: query, mode: 'insensitive' } } } },
            { contract: { unit: { numero: { contains: query, mode: 'insensitive' } } } }
          ]
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
        },
        take: limit,
        orderBy: { fechaVencimiento: 'desc' }
      });
    }

    // Búsqueda en Mantenimiento
    if (type === 'all' || type === 'mantenimiento') {
      results.mantenimiento = await prisma.maintenanceRequest.findMany({
        where: {
          OR: [
            { titulo: { contains: query, mode: 'insensitive' } },
            { descripcion: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Búsqueda en Proveedores
    if (type === 'all' || type === 'proveedores') {
      results.proveedores = await prisma.provider.findMany({
        where: {
          companyId,
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { telefono: { contains: query, mode: 'insensitive' } },
            { tipo: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: limit,
        orderBy: { nombre: 'asc' }
      });
    }

    // Búsqueda en Documentos
    if (type === 'all' || type === 'documentos') {
      results.documentos = await prisma.document.findMany({
        where: {
          building: { companyId },
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          tenant: { select: { nombreCompleto: true } },
          building: { select: { nombre: true } },
          unit: { select: { numero: true } }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      });
    }

    // Calcular totales
    const resultArrays = Object.values(results) as any[][];
    const total = resultArrays.reduce((acc, arr) => acc + arr.length, 0);

    // Guardar en historial de búsquedas
    if (query.length >= 3) {
      await prisma.searchHistory.create({
        data: {
          userId: session.user.id,
          companyId,
          query,
          filters: { type },
          resultCount: total
        }
      });
    }

    return NextResponse.json({
      results,
      total,
      query,
      type
    });
  } catch (error: any) {
    console.error('Error en búsqueda global:', error);
    return NextResponse.json(
      { error: 'Error al realizar búsqueda', details: error.message },
      { status: 500 }
    );
  }
}
