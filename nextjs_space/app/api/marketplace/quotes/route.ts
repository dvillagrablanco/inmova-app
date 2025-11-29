import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
// import { suggestProviderForService } from '@/lib/marketplace-service';

// GET /api/marketplace/quotes - Obtener cotizaciones
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const providerId = searchParams.get('providerId');

    const quotes = await prisma.serviceQuote.findMany({
      where: {
        companyId: session.user.companyId,
        ...(estado && { estado: estado as any }),
        ...(providerId && { providerId }),
      },
      include: {
        provider: true,
        building: true,
        unit: true,
      },
      orderBy: { fechaSolicitud: 'desc' },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/quotes - Crear cotización
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      providerId,
      buildingId,
      unitId,
      titulo,
      descripcion,
      servicioRequerido,
      urgencia,
    } = body;

    // Si no se proporciona proveedor, sugerir uno
    const selectedProviderId = providerId;
    // if (!selectedProviderId && servicioRequerido) {
    //   const suggestion = await suggestProviderForService(
    //     session.user.companyId,
    //     servicioRequerido
    //   );
    //   if (suggestion) {
    //     selectedProviderId = suggestion.provider.id;
    //   }
    // }

    if (!selectedProviderId) {
      return NextResponse.json(
        { error: 'Debe seleccionar un proveedor o tipo de servicio' },
        { status: 400 }
      );
    }

    const quote = await prisma.serviceQuote.create({
      data: {
        companyId: session.user.companyId,
        providerId: selectedProviderId,
        buildingId: buildingId || null,
        unitId: unitId || null,
        titulo,
        descripcion,
        servicioRequerido,
        urgencia: urgencia || 'media',
        solicitadoPor: session.user.email || '',
      },
      include: {
        provider: true,
        building: true,
        unit: true,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Error al crear cotización' },
      { status: 500 }
    );
  }
}
