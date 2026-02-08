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

    const userId = session.user.id;

    // Obtener companyId del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });

    if (!user?.companyId) {
      return NextResponse.json({
        obrasActivas: 0,
        ofertasPendientes: 0,
        contratosVigentes: 0,
        documentosVencer: 0,
        facturacionMes: 0,
        calificacionMedia: 0
      });
    }

    const companyId = user.companyId;

    // Verificar si tiene perfil ewoorker
    const perfil = await prisma.ewoorkerPerfilEmpresa.findUnique({
      where: { companyId },
      include: {
        company: {
          select: { nombre: true },
        },
      },
    });

    if (!perfil) {
      // Aún no tiene perfil ewoorker, devolver zeros
      return NextResponse.json({
        obrasActivas: 0,
        ofertasPendientes: 0,
        contratosVigentes: 0,
        documentosVencer: 0,
        facturacionMes: 0,
        calificacionMedia: 0,
        nuevoPerfil: true
      });
    }

    // Calcular estadísticas reales
    const [
      obrasActivas,
      ofertasPendientes,
      contratosVigentes,
      documentosVencer,
      pagosEsteMes
    ] = await Promise.all([
      // Obras activas (publicadas o en ejecución)
      prisma.ewoorkerObra.count({
        where: {
          companyId,
          estado: {
            in: ["PUBLICADA", "EN_LICITACION", "EN_EJECUCION"]
          }
        }
      }),

      // Ofertas pendientes de respuesta
      prisma.ewoorkerOferta.count({
        where: {
          perfilSubcontratistaId: perfil.id,
          estado: {
            in: ["ENVIADA", "EN_REVISION", "PRESELECCIONADA"]
          }
        }
      }),

      // Contratos vigentes
      prisma.ewoorkerContrato.count({
        where: {
          OR: [
            { constructorId: perfil.id },
            { subcontratistaId: perfil.id }
          ],
          estado: {
            in: ["ACTIVO", "EN_EJECUCION"]
          }
        }
      }),

      // Documentos próximos a vencer (30 días)
      prisma.ewoorkerDocumento.count({
        where: {
          perfilId: perfil.id,
          estado: {
            in: ["AMARILLO", "ROJO"]
          },
          fechaCaducidad: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
          }
        }
      }),

      // Facturación este mes
      prisma.ewoorkerPago.aggregate({
        where: {
          perfilReceptorId: perfil.id,
          estado: {
            in: ["PAGADO", "LIBERADO"]
          },
          fechaPago: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: {
          montoNeto: true
        }
      })
    ]);

    // Facturación en euros (de céntimos)
    const facturacionMes = (pagosEsteMes._sum.montoNeto || 0) / 100;

    return NextResponse.json({
      obrasActivas,
      ofertasPendientes,
      contratosVigentes,
      documentosVencer,
      facturacionMes,
      calificacionMedia: perfil.valoracionMedia || 0,
      perfil: {
        id: perfil.id,
        nombre: perfil.company?.nombre || "Sin nombre",
        tipo: perfil.tipoEmpresa,
        plan: perfil.planActual
      }
    });

  } catch (error: unknown) {
    logger.error("[EWOORKER_DASHBOARD_STATS]", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
