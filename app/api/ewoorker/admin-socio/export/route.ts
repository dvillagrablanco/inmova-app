import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar roles permitidos para el panel del socio
    const allowedRoles = ['super_admin', 'administrador', 'socio_ewoorker'];
    if (!session || !allowedRoles.includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'mes_actual';

    // Obtener métricas (reutilizar lógica del endpoint metrics)
    const metricsResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/ewoorker/admin-socio/metrics?periodo=${periodo}`
    );
    const metrics = await metricsResponse.json();

    // Generar reporte en texto/CSV (simplificado)
    const now = new Date().toISOString().split('T')[0];
    const report = `
REPORTE EWOORKER - SOCIO FUNDADOR
Fecha: ${now}
Periodo: ${periodo.replace('_', ' ').toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINANCIERO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GMV Total:                €${(metrics.gmvTotal / 100).toFixed(2)}
Comisiones Generadas:     €${(metrics.comisionesGeneradas / 100).toFixed(2)}

BENEFICIO SOCIO (50%):    €${(metrics.beneficioSocio / 100).toFixed(2)}
Beneficio Plataforma:     €${(metrics.beneficioPlataforma / 100).toFixed(2)}

MRR Suscripciones:        €${(metrics.mrrSuscripciones / 100).toFixed(2)}
Suscripciones Activas:    ${metrics.suscripcionesActivas}

Desglose Comisiones:
  - Suscripciones:        €${(metrics.comisionSuscripciones / 100).toFixed(2)}
  - Escrow (2-3%):        €${(metrics.comisionEscrow / 100).toFixed(2)}
  - Urgentes (5-10%):     €${(metrics.comisionUrgentes / 100).toFixed(2)}
  - Otros:                €${(metrics.comisionOtros / 100).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USUARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Empresas:           ${metrics.totalEmpresas}
Empresas Activas:         ${metrics.empresasActivas}
Nuevas este mes:          ${metrics.nuevasEmpresasMes}
Empresas Verificadas:     ${metrics.empresasVerificadas}

Por Plan:
  - Obrero (Gratis):      ${metrics.usuariosObrero}
  - Capataz (€49):        ${metrics.usuariosCapataz}
  - Constructor (€149):   ${metrics.usuariosConstructor}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPERACIONES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Obras Publicadas:         ${metrics.obrasPublicadas}
Ofertas Enviadas:         ${metrics.ofertasEnviadas}
Contratos Activos:        ${metrics.contratosActivos}
Contratos Completados:    ${metrics.contratosCompletados}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tasa de Conversión:       ${metrics.tasaConversion.toFixed(1)}%
Tiempo Adjudicación:      ${metrics.tiempoMedioAdjudicacion.toFixed(1)} días
Valoración Plataforma:    ${metrics.valoracionMediaPlataforma.toFixed(1)} / 5.0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Modelo de negocio: B2B Marketplace para subcontratación en construcción
División de beneficios: 50% Socio Fundador / 50% Plataforma
`.trim();

    return new NextResponse(report, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="ewoorker-reporte-socio-${periodo}-${now}.txt"`,
      },
    });
  } catch (error: any) {
    logger.error('[eWoorker Export Error]:', error);
    return NextResponse.json({ error: 'Error al exportar reporte' }, { status: 500 });
  }
}
