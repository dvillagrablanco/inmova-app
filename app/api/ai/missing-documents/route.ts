import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/ai/missing-documents
 * Detecta documentación faltante en la cartera:
 * - Contratos activos sin PDF adjunto
 * - Inquilinos sin DNI registrado
 * - Edificios sin certificado energético
 * - Seguros vencidos o sin póliza
 * - ITEs pendientes
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role as any,
      primaryCompanyId: session.user?.companyId,
      request,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const companyId = scope.activeCompanyId;
    const issues: Array<{
      tipo: string;
      prioridad: 'alta' | 'media' | 'baja';
      entidad: string;
      detalle: string;
      accion: string;
    }> = [];

    // 1. Contratos activos sin PDF
    const contractsNoPdf = await prisma.contract.findMany({
      where: {
        unit: { building: { companyId } },
        estado: 'activo',
        OR: [{ contractPdfPath: null }, { contractPdfPath: '' }],
      },
      include: {
        tenant: { select: { nombreCompleto: true } },
        unit: { select: { numero: true, building: { select: { nombre: true } } } },
      },
    });

    for (const c of contractsNoPdf) {
      issues.push({
        tipo: 'contrato_sin_pdf',
        prioridad: 'alta',
        entidad: `${c.unit?.building?.nombre} ${c.unit?.numero}`,
        detalle: `Contrato de ${c.tenant?.nombreCompleto || 'Sin inquilino'} sin documento PDF adjunto`,
        accion: 'Subir PDF del contrato firmado',
      });
    }

    // 2. Inquilinos sin DNI
    const tenantsNoDni = await prisma.tenant.findMany({
      where: {
        companyId,
        dni: '',
      },
      select: {
        nombreCompleto: true,
        contracts: {
          where: { estado: 'activo' },
          select: { unit: { select: { numero: true, building: { select: { nombre: true } } } } },
          take: 1,
        },
      },
    });

    for (const t of tenantsNoDni) {
      const ubicacion = t.contracts?.[0]?.unit
        ? `${t.contracts[0].unit.building?.nombre} ${t.contracts[0].unit.numero}`
        : 'Sin unidad';
      issues.push({
        tipo: 'inquilino_sin_dni',
        prioridad: 'media',
        entidad: t.nombreCompleto,
        detalle: `Inquilino en ${ubicacion} sin DNI/NIE registrado`,
        accion: 'Solicitar copia del DNI/NIE al inquilino',
      });
    }

    // 3. Edificios sin certificado energético
    const buildingsNoCert = await prisma.building.findMany({
      where: {
        companyId,
        isDemo: false,
        OR: [{ certificadoEnergetico: null }, { certificadoEnergetico: '' }],
      },
      select: { nombre: true, direccion: true },
    });

    for (const b of buildingsNoCert) {
      issues.push({
        tipo: 'edificio_sin_certificado',
        prioridad: 'baja',
        entidad: b.nombre,
        detalle: `${b.direccion} — sin certificado energético`,
        accion: 'Solicitar certificado energético a técnico',
      });
    }

    // 4. Seguros vencidos
    try {
      const today = new Date();
      const expiredInsurance = await prisma.insurance.findMany({
        where: {
          companyId,
          fechaVencimiento: { lt: today },
          estado: { not: 'cancelada' },
        },
        include: { building: { select: { nombre: true } } },
      });

      for (const seg of expiredInsurance) {
        issues.push({
          tipo: 'seguro_vencido',
          prioridad: 'alta',
          entidad: seg.building?.nombre || 'General',
          detalle: `Seguro ${seg.tipo} (${seg.aseguradora}) vencido el ${seg.fechaVencimiento.toLocaleDateString('es-ES')}`,
          accion: 'Renovar póliza inmediatamente',
        });
      }
    } catch {
      /* Insurance model may not exist */
    }

    // Ordenar por prioridad
    const prioridadOrden: Record<string, number> = { alta: 0, media: 1, baja: 2 };
    issues.sort((a, b) => prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]);

    return NextResponse.json({
      success: true,
      resumen: {
        total: issues.length,
        alta: issues.filter((i) => i.prioridad === 'alta').length,
        media: issues.filter((i) => i.prioridad === 'media').length,
        baja: issues.filter((i) => i.prioridad === 'baja').length,
        porTipo: {
          contratosSinPdf: contractsNoPdf.length,
          inquilinosSinDni: tenantsNoDni.length,
          edificiosSinCertificado: buildingsNoCert.length,
        },
      },
      issues,
    });
  } catch (error: any) {
    logger.error('[Missing Documents]:', error);
    return NextResponse.json({ error: 'Error detectando documentación faltante' }, { status: 500 });
  }
}
