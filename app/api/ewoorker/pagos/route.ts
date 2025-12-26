import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

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
      return NextResponse.json({ pagos: [] });
    }

    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId: user.companyId }
    });

    if (!perfil) {
      return NextResponse.json({ pagos: [] });
    }

    const pagos = await prisma.ewoorkerPago.findMany({
      where: {
        perfilReceptorId: perfil.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50 // Últimos 50 pagos
    });

    return NextResponse.json({ pagos });

  } catch (error) {
    console.error("[EWOORKER_PAGOS_GET]", error);
    return NextResponse.json(
      { error: "Error al obtener pagos" },
      { status: 500 }
    );
  }
}
