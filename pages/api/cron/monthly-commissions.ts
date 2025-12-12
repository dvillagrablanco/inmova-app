import type { NextApiRequest, NextApiResponse } from 'next';
import automationService from '@/lib/services/automation-service';

export const config = {
  api: {
    externalResolver: true,
  },
};

/**
 * API de CRON para cálculo mensual de comisiones
 * 
 * Esta API debe ser llamada el día 1 de cada mes.
 * Configurar en el sistema de CRON de la plataforma:
 * 0 0 1 * * (ejecutar a las 00:00 del día 1 de cada mes)
 * 
 * O usar servicios externos como:
 * - cron-job.org
 * - EasyCron
 * - Vercel Cron Jobs
 * - GitHub Actions scheduled workflows
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar método
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  // Verificar token de autorización para evitar ejecuciones no autorizadas
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  const expectedToken = process.env.CRON_SECRET_TOKEN;
  
  if (expectedToken && authToken !== expectedToken) {
    console.log('[CRON] Intento de acceso no autorizado');
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  try {
    console.log('[CRON] Iniciando cálculo de comisiones mensuales...');
    
    const result = await automationService.calculateMonthlyCommissions();
    
    console.log('[CRON] Cálculo de comisiones completado:', result);
    
    return res.status(200).json({
      success: true,
      message: 'Comisiones mensuales calculadas exitosamente',
      data: result,
    });
  } catch (error) {
    console.error('[CRON] Error al calcular comisiones:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al calcular comisiones',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
