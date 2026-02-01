export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
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

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "mis-obras";

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({ obras: [] });
    }

    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId: user.companyId }
    });

    if (!perfil) {
      return NextResponse.json({ obras: [] });
    }

    let obras;

    if (tab === "mis-obras") {
      // Obras publicadas por mi empresa
      obras = await prisma.ewoorkerObra.findMany({
        where: {
          perfilConstructorId: perfil.id
        },
        include: {
          _count: {
            select: { ofertas: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      // Obras disponibles para ofertar (públicas y que no sean mías)
      obras = await prisma.ewoorkerObra.findMany({
        where: {
          estado: {
            in: ["PUBLICADA", "EN_LICITACION"]
          },
          perfilConstructorId: {
            not: perfil.id
          },
          // Filtrar por especialidades del perfil
          especialidadesRequeridas: {
            hasSome: perfil.especialidades
          }
        },
        include: {
          _count: {
            select: { ofertas: true }
          }
        },
        orderBy: { fechaPublicacion: "desc" }
      });
    }

    return NextResponse.json({ obras });

  } catch (error) {
    logger.error("[EWOORKER_OBRAS_GET]", error);
    return NextResponse.json(
      { error: "Error al obtener obras" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      titulo,
      descripcion,
      provincia,
      municipio,
      direccion,
      categoria,
      subcategorias,
      especialidadesRequeridas,
      presupuestoMinimo,
      presupuestoMaximo,
      fechaInicioDeseada,
      duracionEstimadaDias
    } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json(
        { error: "Usuario sin empresa" },
        { status: 400 }
      );
    }

    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId: user.companyId }
    });

    if (!perfil) {
      return NextResponse.json(
        { error: "Perfil ewoorker no encontrado" },
        { status: 404 }
      );
    }

    // Generar código único de obra
    const codigoObra = `OBR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const obra = await prisma.ewoorkerObra.create({
      data: {
        companyId: user.companyId,
        perfilConstructorId: perfil.id,
        titulo,
        descripcion,
        codigoObra,
        categoria,
        subcategorias: subcategorias || [],
        especialidadesRequeridas: especialidadesRequeridas || [],
        provincia,
        municipio,
        direccion,
        presupuestoMinimo: parseFloat(presupuestoMinimo),
        presupuestoMaximo: parseFloat(presupuestoMaximo),
        fechaInicioDeseada: new Date(fechaInicioDeseada),
        duracionEstimadaDias: parseInt(duracionEstimadaDias),
        estado: "BORRADOR"
      }
    });

    return NextResponse.json({ obra }, { status: 201 });

  } catch (error) {
    logger.error("[EWOORKER_OBRAS_POST]", error);
    return NextResponse.json(
      { error: "Error al crear obra" },
      { status: 500 }
    );
  }
}
