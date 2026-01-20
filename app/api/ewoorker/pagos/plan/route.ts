export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth-options';
import prisma from "@/lib/prisma";

import logger from '@/lib/logger';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({
        planActual: "OBRERO_FREE",
        fechaProximoPago: null
      });
    }

    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId: user.companyId },
      select: {
        planActual: true,
        fechaProximoPago: true,
        stripeSubscriptionId: true
      }
    });

    if (!perfil) {
      return NextResponse.json({
        planActual: "OBRERO_FREE",
        fechaProximoPago: null
      });
    }

    return NextResponse.json({
      planActual: perfil.planActual,
      fechaProximoPago: perfil.fechaProximoPago,
      tieneSubscripcion: !!perfil.stripeSubscriptionId
    });

  } catch (error) {
    logger.error("[EWOORKER_PLAN_INFO]", error);
    return NextResponse.json(
      { error: "Error al obtener info del plan" },
      { status: 500 }
    );
  }
}
