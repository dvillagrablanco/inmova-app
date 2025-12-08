/**
 * EJEMPLO DE API OPTIMIZADA CON CACHÉ
 * 
 * Este es un ejemplo de cómo optimizar la API de buildings con Redis cache.
 * Para usar este código:
 * 1. Copia el contenido de este archivo
 * 2. Reemplaza el contenido de /app/api/buildings/route.ts
 * 3. Repite el patrón para otras APIs pesadas
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';
import { cachedBuildings } from '@/lib/cache-helpers';
import { PerformanceTimer } from '@/lib/performance';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const timer = new PerformanceTimer();
  
  try {
    const user = await requireAuth();
    const companyId = user.companyId;
    timer.mark('auth_complete');

    // Use cached buildings to reduce database load
    const buildings = await cachedBuildings(companyId, async () => {
      logger.debug(`Fetching fresh buildings data for company: ${companyId}`);
      
      // OPTIMIZACIÓN: Solo seleccionar campos necesarios en lugar de cargar todo
      return prisma.building.findMany({
        where: { companyId },
        select: {
          id: true,
          nombre: true,
          direccion: true,
          ciudad: true,
          codigoPostal: true,
          tipo: true,
          imagen: true,
          createdAt: true,
          updatedAt: true,
          // Solo contar unidades en lugar de cargar todas
          _count: {
            select: {
              units: true,
            },
          },
          // Si necesitas unidades, usa select para limitar campos
          units: {
            select: {
              id: true,
              identificador: true,
              tipo: true,
              estado: true,
              // NO cargar relaciones anidadas a menos que sea absolutamente necesario
            },
            // Limitar cantidad si es para preview
            take: 100, // Ajustar según necesidad
          },
        },
        orderBy: {
          nombre: 'asc',
        },
      });
    });
    
    timer.mark('data_fetched');
    timer.logSummary('GET /api/buildings', 500);

    return NextResponse.json(buildings);
  } catch (error: any) {
    logger.error('Error fetching buildings:', error);
    timer.logSummary('GET /api/buildings (ERROR)', 500);
    
    if (error.message === 'No autenticado') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: 'Error al obtener edificios' },
      { status: 500 }
    );
  }
}

// NOTA: Las operaciones POST, PUT, DELETE deben invalidar el caché
// Ejemplo para POST:
/*
import { invalidateResourceCache } from '@/lib/cache-helpers';

export async function POST(request: NextRequest) {
  // ... crear edificio ...
  
  // Invalidar caché después de la mutación
  await invalidateResourceCache(companyId, 'buildings');
  await invalidateResourceCache(companyId, 'dashboard');
  
  return NextResponse.json(newBuilding);
}
*/
