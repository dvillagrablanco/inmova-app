import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

// IDs de usuarios autorizados (socio fundador)
// TODO: Configurar en variables de entorno
const SOCIO_FUNDADOR_IDS = process.env.EWOORKER_SOCIO_IDS?.split(",") || [];

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
    const sessionRole = (session.user as any)?.role as string | undefined;

    // Verificar si es el socio fundador o superadmin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true,
        email: true
      }
    });

    const isSocio = SOCIO_FUNDADOR_IDS.includes(userId) || 
                    sessionRole === "super_admin" ||
                    user?.role === "super_admin" ||
                    user?.email?.includes("@socio-ewoorker.com"); // Ejemplo

    if (!isSocio) {
      // Log intento de acceso no autorizado
      await prisma.ewoorkerLogSocio.create({
        data: {
          userId,
          userName: ((session.user as any)?.name as string | undefined) || "Unknown",
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
        userName: ((session.user as any)?.name as string | undefined) || "Socio",
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
          beneficioSocio: true,      // 50% socio
          comisionSuscripciones: true, // No existe este campo en el modelo, ajustar
          comisionEscrow: true,      // No existe, ajustar
          comisionUrgentes: true,    // No existe, ajustar
          comisionOtros: true        // No existe, ajustar
        }
      }),

      // Datos de suscripciones
      prisma.ewoorkerPerfilEmpresa.aggregate({
        where: {
          planActual: {
            not: "OBRERO_FREE"
          }
        },
        _count: {
          id: true
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
      prisma.$queryRaw<any[]>`
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
    const planesMap = planesDistribucion.reduce((acc: any, item: any) => {
      acc[item.planActual] = item._count.id;
      return acc;
    }, {});

    const usuariosObrero = planesMap["OBRERO_FREE"] || 0;
    const usuariosCapataz = planesMap["CAPATAZ_PRO"] || 0;
    const usuariosConstructor = planesMap["CONSTRUCTOR_ENTERPRISE"] || 0;

    // Calcular MRR (Monthly Recurring Revenue)
    // Precios: Capataz €39, Constructor €119 (promedio)
    const mrrSuscripciones = (usuariosCapataz * 3900) + (usuariosConstructor * 11900); // En céntimos

    // Calcular tasa de conversión
    const totalOfertas = metricsEngagement[0]?.total_ofertas || 0;
    const totalContratos = metricsEngagement[0]?.total_contratos || 0;
    const tasaConversion = totalOfertas > 0 ? (totalContratos / totalOfertas) * 100 : 0;

    // Tiempo medio de adjudicación
    const tiempoMedioAdjudicacion = metricsEngagement[0]?.dias_promedio || 0;

    // Rating promedio
    const valoracionMediaPlataforma = metricsEngagement[0]?.rating_promedio || 0;

    // Datos financieros
    const gmvTotal = pagosData._sum.montoBase || 0;
    const comisionesGeneradas = pagosData._sum.montoComision || 0;
    const beneficioSocio = pagosData._sum.beneficioSocio || 0;
    const beneficioPlataforma = pagosData._sum.beneficioEwoorker || 0;

    // Desglose de comisiones (por ahora aproximado, necesita refinamiento)
    // TODO: Implementar tracking granular por tipo de comisión
    const comisionSuscripciones = mrrSuscripciones * (periodo === "mes" ? 1 : periodo === "trimestre" ? 3 : 12);
    const comisionEscrow = Math.floor(comisionesGeneradas * 0.4); // ~40% de escrow
    const comisionUrgentes = Math.floor(comisionesGeneradas * 0.2); // ~20% urgentes
    const comisionOtros = comisionesGeneradas - comisionEscrow - comisionUrgentes;

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
      suscripcionesActivas: suscripcionesData._count.id,
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

  } catch (error) {
    console.error("[EWOORKER_ADMIN_SOCIO_METRICAS]", error);
    return NextResponse.json(
      { error: "Error al obtener métricas" },
      { status: 500 }
    );
  }
}
