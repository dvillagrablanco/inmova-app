import type { NextApiRequest, NextApiResponse } from 'next';
import automationService from '@/lib/services/automation-service';

export const config = {
  api: {
    externalResolver: true,
  },
};

/**
 * API de CRON para actualización de métricas
 * 
 * Esta API debe ser llamada diariamente.
 * Configurar en el sistema de CRON:
 * 0 2 * * * (ejecutar a las 02:00 todos los días)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  const expectedToken = process.env.CRON_SECRET_TOKEN;
  
  if (expectedToken && authToken !== expectedToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    console.log('[CRON] Actualizando métricas de comerciales...');
    
    await automationService.updateAllSalesRepsMetrics();
    
    console.log('[CRON] Métricas actualizadas exitosamente');
    
    return res.status(200).json({
      success: true,
      message: 'Métricas actualizadas exitosamente',
    });
  } catch (error) {
    console.error('[CRON] Error al actualizar métricas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar métricas',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
