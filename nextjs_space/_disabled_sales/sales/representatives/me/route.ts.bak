import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/sales/representatives/me - Obtener información del comercial actual
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Buscar el representante de ventas por email
    const salesRep = await prisma.salesRepresentative.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        nombreCompleto: true,
        dni: true,
        email: true,
        telefono: true,
        telefonoSecundario: true,
        direccion: true,
        ciudad: true,
        codigoPostal: true,
        pais: true,
        codigoReferido: true,
        comisionCaptacion: true,
        comisionRecurrente: true,
        bonificacionObjetivo: true,
        objetivoLeadsMes: true,
        objetivoConversionesMes: true,
        estado: true,
        activo: true,
        fechaAlta: true,
        totalLeadsGenerados: true,
        totalConversiones: true,
        totalComisionGenerada: true,
        tasaConversion: true,
      },
    });

    if (!salesRep) {
      return NextResponse.json(
        { error: 'Representante de ventas no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(salesRep);
  } catch (error) {
    logError('Error en GET /api/sales/representatives/me', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener información del comercial' },
      { status: 500 }
    );
  }
}
