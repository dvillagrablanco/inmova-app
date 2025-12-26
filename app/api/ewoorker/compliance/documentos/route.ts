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

    const userId = session.user.id;

    // Obtener perfil ewoorker
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({
        documentos: [],
        semaforo: { verde: 0, amarillo: 0, rojo: 0 }
      });
    }

    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId: user.companyId }
    });

    if (!perfil) {
      return NextResponse.json({
        documentos: [],
        semaforo: { verde: 0, amarillo: 0, rojo: 0 }
      });
    }

    // Obtener documentos
    const documentos = await prisma.ewoorkerDocumento.findMany({
      where: { perfilId: perfil.id },
      orderBy: [
        { estado: "asc" }, // ROJO primero
        { fechaCaducidad: "asc" }
      ],
      select: {
        id: true,
        tipo: true,
        nombreArchivo: true,
        urlArchivo: true,
        fechaCaducidad: true,
        estado: true,
        confianzaOCR: true,
        numeroDocumento: true,
        requiereRevisionManual: true,
        createdAt: true
      }
    });

    // Calcular semáforo
    const semaforo = documentos.reduce(
      (acc, doc) => {
        if (doc.estado === "VERDE") acc.verde++;
        else if (doc.estado === "AMARILLO") acc.amarillo++;
        else if (doc.estado === "ROJO") acc.rojo++;
        return acc;
      },
      { verde: 0, amarillo: 0, rojo: 0 }
    );

    return NextResponse.json({
      documentos,
      semaforo,
      perfil: {
        id: perfil.id,
        tipoEmpresa: perfil.tipoEmpresa,
        numeroREA: perfil.numeroREA,
        estadoREA: perfil.estadoREA
      }
    });

  } catch (error) {
    console.error("[EWOORKER_COMPLIANCE_DOCS]", error);
    return NextResponse.json(
      { error: "Error al obtener documentos" },
      { status: 500 }
    );
  }
}
