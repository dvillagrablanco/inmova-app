export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
// IDs de usuarios autorizados (socio fundador)
const SOCIO_FUNDADOR_IDS = process.env.EWOORKER_SOCIO_IDS?.split(",") || [];

type EngagementMetricsRow = {
  total_ofertas: number | string | bigint | null;
  total_contratos: number | string | bigint | null;
  dias_promedio: number | string | bigint | null;
  rating_promedio: number | string | bigint | null;
};

type ComisionPorTipoRow = {
  tipo: string;
  _sum: {
    montoComision: number | null;
  };
};

const toNumber = (value: number | string | bigint | null | undefined): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number(value);
  return 0;
};

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

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // Verificar si es el socio fundador o tiene rol autorizado
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true,
        email: true
      }
    });

    const allowedRoles = ['super_admin', 'administrador', 'socio_ewoorker'];
    const userRole = user?.role ?? null;
    const isSocio = SOCIO_FUNDADOR_IDS.includes(userId) ||
                    (userRole ? allowedRoles.includes(userRole) : false) ||
                    user?.email?.includes("@socio-ewoorker.com") ||
                    user?.email?.includes("@ewoorker.com");

    if (!isSocio) {
      // Log intento de acceso no autorizado
      await prisma.ewoorkerLogSocio.create({
        data: {
          userId,
          userName: session.user.nombre || "Unknown",
          userEmail: session.user.email || "",
          accion: "LOGIN",
          descripcion: "Intento de acceso no autorizado al panel del socio",
          modulo: "DASHBOARD",
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "",
          exitoso: false,
          error: "Usuario no autorizado"
        }
      });

      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Log acceso exitoso
    await prisma.ewoorkerLogSocio.create({
      data: {
        userId,
        userName: session.user.nombre || "Socio",
        userEmail: session.user.email || "",
        accion: "VER_METRICAS",
        descripcion: "Acceso al dashboard de métricas",
        modulo: "DASHBOARD",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "",
        exitoso: true
      }
    });

    // Obtener período solicitado
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get("periodo") || "mes";

    const now = new Date();
    let fechaInicio: Date;

    switch (periodo) {
      case "trimestre":
        fechaInicio = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case "ano":
        fechaInicio = new Date(now.getFullYear(), 0, 1);
        break;
      case "mes":
      default:
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Calcular métricas en paralelo
    const [
      totalEmpresas,
      empresasActivas,
      nuevasEmpresasMes,
      empresasVerificadas,
      obrasPublicadas,
      ofertasEnviadas,
      contratosActivos,
      contratosCompletados,
      pagosData,
      comisionesPorTipo,
      suscripcionesData,
      planesDistribucion,
      metricsEngagement
    ] = await Promise.all([
      // Total empresas con perfil ewoorker
      prisma.ewoorkerPerfilEmpresa.count(),

      // Empresas activas (con actividad en últimos 30 días)
      prisma.ewoorkerPerfilEmpresa.count({
        where: {
          disponible: true,
          ultimaActividad: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Nuevas empresas este mes
      prisma.ewoorkerPerfilEmpresa.count({
        where: {
          createdAt: {
            gte: fechaInicio
          }
        }
      }),

      // Empresas verificadas
      prisma.ewoorkerPerfilEmpresa.count({
        where: { verificado: true }
      }),

      // Obras publicadas en el período
      prisma.ewoorkerObra.count({
        where: {
          fechaPublicacion: {
            gte: fechaInicio
          }
        }
      }),

      // Ofertas enviadas
      prisma.ewoorkerOferta.count({
        where: {
          fechaEnvio: {
            gte: fechaInicio
          }
        }
      }),

      // Contratos activos
      prisma.ewoorkerContrato.count({
        where: {
          estado: {
            in: ["ACTIVO", "EN_EJECUCION"]
          }
        }
      }),

      // Contratos completados en el período
      prisma.ewoorkerContrato.count({
        where: {
          estado: "COMPLETADO",
          fechaFinalizacion: {
            gte: fechaInicio
          }
        }
      }),

      // Datos de pagos (GMV, comisiones, beneficios)
      prisma.ewoorkerPago.aggregate({
        where: {
          fechaSolicitud: {
            gte: fechaInicio
          }
        },
        _sum: {
          montoBase: true,          // GMV total en céntimos
          montoComision: true,       // Comisiones totales
          beneficioEwoorker: true,   // 50% plataforma
          beneficioSocio: true       // 50% socio
        }
      }),

      // Comisiones por tipo
      prisma.ewoorkerPago.groupBy({
        by: ["tipo"],
        where: {
          fechaSolicitud: {
            gte: fechaInicio
          }
        },
        _sum: {
          montoComision: true
        }
      }),

      // Datos de suscripciones activas (MRR real)
      prisma.ewoorkerSuscripcion.aggregate({
        where: {
          estado: "ACTIVA"
        },
        _count: {
          id: true
        },
        _sum: {
          precio: true
        }
      }),

      // Distribución por planes
      prisma.ewoorkerPerfilEmpresa.groupBy({
        by: ["planActual"],
        _count: {
          id: true
        }
      }),

      // Métricas de engagement
      prisma.$queryRaw<EngagementMetricsRow[]>`
        SELECT 
          COUNT(DISTINCT o.id) as total_ofertas,
          COUNT(DISTINCT c.id) as total_contratos,
          AVG(EXTRACT(EPOCH FROM (c."createdAt" - ob."fechaPublicacion")) / 86400) as dias_promedio,
          AVG(p."valoracionMedia") as rating_promedio
        FROM "ewoorker_obra" ob
        LEFT JOIN "ewoorker_oferta" o ON o."obraId" = ob.id
        LEFT JOIN "ewoorker_contrato" c ON c."obraId" = ob.id
        LEFT JOIN "ewoorker_perfil_empresa" p ON p.id = c."subcontratistaId"
        WHERE ob."fechaPublicacion" >= ${fechaInicio}
      `
    ]);

    // Calcular planes
    const planesMap = planesDistribucion.reduce<Record<string, number>>((acc, item) => {
      acc[item.planActual] = item._count.id;
      return acc;
    }, {});

    const usuariosObrero = planesMap["OBRERO_FREE"] || 0;
    const usuariosCapataz = planesMap["CAPATAZ_PRO"] || 0;
    const usuariosConstructor = planesMap["CONSTRUCTOR_ENTERPRISE"] || 0;

    // Calcular MRR (Monthly Recurring Revenue) desde suscripciones activas
    const mrrSuscripciones = suscripcionesData._sum.precio ?? 0;

    // Calcular tasa de conversión
    const totalOfertas = toNumber(metricsEngagement[0]?.total_ofertas);
    const totalContratos = toNumber(metricsEngagement[0]?.total_contratos);
    const tasaConversion = totalOfertas > 0 ? (totalContratos / totalOfertas) * 100 : 0;

    // Tiempo medio de adjudicación
    const tiempoMedioAdjudicacion = toNumber(metricsEngagement[0]?.dias_promedio);

    // Rating promedio
    const valoracionMediaPlataforma = toNumber(metricsEngagement[0]?.rating_promedio);

    // Datos financieros
    const gmvTotal = pagosData._sum.montoBase || 0;
    const comisionesGeneradas = pagosData._sum.montoComision || 0;
    const beneficioSocio = pagosData._sum.beneficioSocio || 0;
    const beneficioPlataforma = pagosData._sum.beneficioEwoorker || 0;

    // Desglose de comisiones por tipo
    const comisionesMap = comisionesPorTipo.reduce<Record<string, number>>((acc, item) => {
      acc[item.tipo] = item._sum.montoComision ?? 0;
      return acc;
    }, {});

    const comisionSuscripciones = comisionesMap["SUSCRIPCION_MENSUAL"] ?? 0;
    const comisionEscrow = comisionesMap["PAGO_SEGURO_ESCROW"] ?? 0;
    const comisionUrgentes = comisionesMap["CONTRATACION_URGENTE"] ?? 0;
    const comisionOtros = Object.entries(comisionesMap)
      .filter(([tipo]) => ![
        "SUSCRIPCION_MENSUAL",
        "PAGO_SEGURO_ESCROW",
        "CONTRATACION_URGENTE",
      ].includes(tipo))
      .reduce((sum, [, value]) => sum + value, 0);

    const metricas = {
      mes: now.getMonth() + 1,
      ano: now.getFullYear(),
      
      // Usuarios
      totalEmpresas,
      empresasActivas,
      nuevasEmpresasMes,
      empresasVerificadas,
      
      // Actividad
      obrasPublicadas,
      ofertasEnviadas,
      contratosActivos,
      contratosCompletados,
      
      // Financiero (en céntimos)
      gmvTotal,
      comisionesGeneradas,
      beneficioSocio,
      beneficioPlataforma,
      
      // Suscripciones
      suscripcionesActivas: suscripcionesData._count.id ?? 0,
      mrrSuscripciones,
      
      // Por plan
      usuariosObrero,
      usuariosCapataz,
      usuariosConstructor,
      
      // Engagement
      tasaConversion: Number(tasaConversion.toFixed(2)),
      tiempoMedioAdjudicacion: Number(tiempoMedioAdjudicacion.toFixed(1)),
      valoracionMediaPlataforma: Number(valoracionMediaPlataforma.toFixed(2)),
      
      // Desglose comisiones
      comisionSuscripciones,
      comisionEscrow,
      comisionUrgentes,
      comisionOtros
    };

    // Guardar métricas en BD para histórico
    await prisma.ewoorkerMetricaSocio.upsert({
      where: {
        mes_ano: {
          mes: now.getMonth() + 1,
          ano: now.getFullYear()
        }
      },
      update: metricas,
      create: metricas
    });

    return NextResponse.json(metricas);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    logger.error("[EWOORKER_ADMIN_SOCIO_METRICAS]", { message });
    return NextResponse.json(
      { error: "Error al obtener métricas" },
      { status: 500 }
    );
  }
}
