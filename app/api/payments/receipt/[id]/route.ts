import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { db } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/payments/receipt/[id] - Obtener datos para generar recibo
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const paymentId = params.id;

    // Obtener el pago con todas las relaciones necesarias
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Obtener configuración de la empresa
    let company = await db.company.findFirst();
    if (!company) {
      company = await db.company.create({
        data: {
          nombre: 'INMOVA',
          colorPrimario: '#000000',
          colorSecundario: '#FFFFFF',
        },
      });
    }

    // Preparar datos para el recibo
    const receiptData = {
      // Datos del pago
      payment: {
        id: payment.id,
        periodo: payment.periodo,
        monto: payment.monto,
        fechaVencimiento: payment.fechaVencimiento,
        fechaPago: payment.fechaPago,
        estado: payment.estado,
        metodoPago: payment.metodoPago,
      },
      // Datos del inquilino
      tenant: {
        nombreCompleto: payment.contract.tenant.nombreCompleto,
        dni: payment.contract.tenant.dni,
        email: payment.contract.tenant.email,
        telefono: payment.contract.tenant.telefono,
      },
      // Datos de la unidad
      unit: {
        numero: payment.contract.unit.numero,
        tipo: payment.contract.unit.tipo,
        direccion: payment.contract.unit.building.direccion,
        edificio: payment.contract.unit.building.nombre,
      },
      // Datos del contrato
      contract: {
        id: payment.contract.id,
        fechaInicio: payment.contract.fechaInicio,
        fechaFin: payment.contract.fechaFin,
        rentaMensual: payment.contract.rentaMensual,
      },
      // Datos de la empresa
      company: {
        nombre: company.nombre,
        cif: company.cif,
        direccion: company.direccion,
        telefono: company.telefono,
        email: company.email,
        logoUrl: company.logoUrl,
        colorPrimario: company.colorPrimario,
        colorSecundario: company.colorSecundario,
        pieDocumento: company.pieDocumento,
      },
    };

    return NextResponse.json(receiptData);
  } catch (error) {
    logger.error('Error al obtener datos del recibo:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del recibo' },
      { status: 500 }
    );
  }
}
