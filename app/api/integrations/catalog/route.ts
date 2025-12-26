/**
 * API: /api/integrations/catalog
 * GET: Obtener catálogo completo de integraciones disponibles
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { IntegrationManager, INTEGRATION_CATEGORIES } from '@/lib/integration-manager';

/**
 * GET /api/integrations/catalog
 * Retorna todas las integraciones disponibles organizadas por categoría
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // Obtener providers
    let providers = IntegrationManager.getAvailableProviders();

    // Filtrar por categoría si se especifica
    if (category) {
      providers = IntegrationManager.getProvidersByCategory(category as any);
    }

    // Agrupar por categoría
    const groupedByCategory: Record<string, any[]> = {};
    
    Object.keys(INTEGRATION_CATEGORIES).forEach(cat => {
      groupedByCategory[cat] = providers.filter(p => p.category === cat);
    });

    return NextResponse.json({
      success: true,
      data: {
        categories: INTEGRATION_CATEGORIES,
        providers,
        groupedByCategory,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
