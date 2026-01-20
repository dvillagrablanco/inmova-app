/**
 * API: /api/company/addons
 * 
 * GET - Obtiene los addons activos de la compañía del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const addonCode = searchParams.get('code'); // Opcional: filtrar por código específico

    // Obtener los addons activos de la compañía
    const companyAddons = await prisma.companyAddOn.findMany({
      where: {
        companyId,
        activo: true,
        ...(addonCode ? { addOn: { codigo: addonCode } } : {})
      },
      include: {
        addOn: true
      }
    });

    // Si se pide un addon específico, devolver solo si está activo
    if (addonCode) {
      const hasAddon = companyAddons.some(ca => ca.addOn.codigo === addonCode);
      const addon = companyAddons.find(ca => ca.addOn.codigo === addonCode);
      
      return NextResponse.json({
        success: true,
        hasAddon,
        addon: addon ? {
          id: addon.addOn.id,
          codigo: addon.addOn.codigo,
          nombre: addon.addOn.nombre,
          activatedAt: addon.fechaActivacion,
          usage: addon.usoAcumulado
        } : null
      });
    }

    // Obtener también información del plan de la compañía para ver addons incluidos
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { 
        plan: true,
        stripeSubscriptionId: true 
      }
    });

    // Obtener todos los addons disponibles para marcar cuáles están incluidos en el plan
    const allAddons = await prisma.addOn.findMany({
      where: { activo: true },
      orderBy: [{ destacado: 'desc' }, { orden: 'asc' }]
    });

    const addonsStatus = allAddons.map(addon => {
      const isActive = companyAddons.some(ca => ca.addOnId === addon.id);
      const companyAddon = companyAddons.find(ca => ca.addOnId === addon.id);
      const disponiblePara = addon.disponiblePara as string[];
      const incluidoEn = (addon.incluidoEn as string[]) || [];
      const isIncludedInPlan = company?.plan ? incluidoEn.includes(company.plan.toUpperCase()) : false;

      return {
        id: addon.id,
        codigo: addon.codigo,
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        categoria: addon.categoria,
        precioMensual: addon.precioMensual,
        precioAnual: addon.precioAnual,
        destacado: addon.destacado,
        isActive: isActive || isIncludedInPlan,
        isIncludedInPlan,
        isPurchased: isActive && !isIncludedInPlan,
        activatedAt: companyAddon?.fechaActivacion,
        usage: companyAddon?.usoAcumulado
      };
    });

    return NextResponse.json({
      success: true,
      companyPlan: company?.plan || 'starter',
      addons: addonsStatus,
      activeCount: addonsStatus.filter(a => a.isActive).length,
      availableCount: addonsStatus.filter(a => !a.isActive).length
    });
  } catch (error: any) {
    logger.error('Error obteniendo addons de la compañía:', error);
    return NextResponse.json(
      { error: 'Error obteniendo addons', details: error.message },
      { status: 500 }
    );
  }
}
