import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Search across all entities
    const [buildings, units, tenants, contracts, providers] = await Promise.all([
      // Buildings
      prisma.building.findMany({
        where: {
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } },
            { direccion: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nombre: true, direccion: true },
        take: 5,
      }),

      // Units
      prisma.unit.findMany({
        where: {
          OR: [
            { numero: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          numero: true,
          building: { select: { nombre: true } },
        },
        take: 5,
      }),

      // Tenants
      prisma.tenant.findMany({
        where: {
          OR: [
            { nombreCompleto: { contains: query, mode: 'insensitive' } },
            { dni: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nombreCompleto: true, email: true },
        take: 5,
      }),

      // Contracts
      prisma.contract.findMany({
        where: {
          OR: [
            { unit: { numero: { contains: query, mode: 'insensitive' } } },
            { tenant: { nombreCompleto: { contains: query, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true,
          unit: { select: { numero: true } },
          tenant: { select: { nombreCompleto: true } },
        },
        take: 5,
      }),

      // Providers
      prisma.provider.findMany({
        where: {
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } },
            { tipo: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, nombre: true, tipo: true },
        take: 5,
      }),
    ]);

    const results = {
      buildings: buildings.map(b => ({ ...b, type: 'building' })),
      units: units.map(u => ({ ...u, type: 'unit' })),
      tenants: tenants.map(t => ({ ...t, type: 'tenant' })),
      contracts: contracts.map(c => ({ ...c, type: 'contract' })),
      providers: providers.map(p => ({ ...p, type: 'provider' })),
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json({ error: 'Error en la búsqueda' }, { status: 500 });
  }
}