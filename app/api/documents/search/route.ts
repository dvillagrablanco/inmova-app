export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type'); // contract, tenant, building, unit
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Buscar en contratos
    const contracts = await prisma.contract.findMany({
      where: {
        unit: {
          building: {
            companyId: user.companyId
          }
        },
        ...(type === 'contract' && { id: { not: undefined } }),
        ...(query && {
          OR: [
            { tenant: { nombreCompleto: { contains: query, mode: 'insensitive' } } },
            { unit: { numero: { contains: query, mode: 'insensitive' } } }
          ]
        }),
        ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
        ...(dateTo && { createdAt: { lte: new Date(dateTo) } })
      },
      select: {
        id: true,
        createdAt: true,
        fechaInicio: true,
        fechaFin: true,
        tenant: { select: { nombreCompleto: true } },
        unit: {
          select: {
            numero: true,
            building: { select: { nombre: true } }
          }
        }
      },
      take: 50
    });

    // Buscar documentos en otras entidades si es necesario
    const results = contracts.map((c: any) => ({
      id: c.id,
      type: 'contract',
      title: `Contrato - ${c.tenant?.nombreCompleto || 'Sin inquilino'}`,
      description: `${c.unit?.building?.nombre || 'Sin edificio'} - ${c.unit?.numero || 'Sin unidad'}`,
      url: `/contratos/${c.id}`,
      date: c.createdAt,
      metadata: {
        fechaInicio: c.fechaInicio,
        fechaFin: c.fechaFin
      }
    }));

    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error('Error en búsqueda de documentos:', error);
    return NextResponse.json(
      { error: 'Error al buscar documentos' },
      { status: 500 }
    );
  }
}
