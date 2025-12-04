import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { addDays } from 'date-fns';
import { logError } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const documentos = await prisma.documentoFirma.findMany({
      where: {
        companyId: session.user.companyId
      },
      include: {
        firmantes: {
          orderBy: {
            orden: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(documentos);
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error fetching documents'), {
      context: 'GET /api/admin/firma-digital/documentos',
      companyId: session?.user?.companyId,
    });
    return NextResponse.json(
      { error: 'Error al obtener documentos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      titulo,
      descripcion,
      tipoDocumento,
      requiereOrden,
      diasExpiracion,
      recordatorios,
      diasRecordatorio,
      firmantes
    } = body;

    if (!titulo || !tipoDocumento || !firmantes || firmantes.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Calcular fecha de expiración
    const fechaExpiracion = addDays(new Date(), parseInt(diasExpiracion) || 30);

    // Crear el documento con sus firmantes
    const documento = await prisma.documentoFirma.create({
      data: {
        companyId: session.user.companyId,
        titulo,
        descripcion: descripcion || null,
        tipoDocumento,
        requiereOrden: requiereOrden === true,
        diasExpiracion: parseInt(diasExpiracion) || 30,
        fechaExpiracion,
        recordatorios: recordatorios !== false,
        diasRecordatorio: parseInt(diasRecordatorio) || 3,
        creadoPor: session.user.id,
        estado: 'pendiente',
        firmantes: {
          create: firmantes.map((firmante: any) => ({
            nombre: firmante.nombre,
            email: firmante.email,
            telefono: firmante.telefono || null,
            rol: firmante.rol,
            orden: firmante.orden,
            estado: 'pendiente'
          }))
        }
      },
      include: {
        firmantes: {
          orderBy: {
            orden: 'asc'
          }
        }
      }
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error) {
    logError(new Error(error instanceof Error ? error.message : 'Error creating document'), {
      context: 'POST /api/admin/firma-digital/documentos',
      titulo: body?.titulo,
      companyId: session?.user?.companyId,
    });
    return NextResponse.json(
      { error: 'Error al crear documento' },
      { status: 500 }
    );
  }
}