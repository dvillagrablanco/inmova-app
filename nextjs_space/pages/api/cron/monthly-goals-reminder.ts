import type { NextApiRequest, NextApiResponse } from 'next';
import automationService from '@/lib/services/automation-service';

export const config = {
  api: {
    externalResolver: true,
  },
};

/**
 * API de CRON para recordatorio de objetivos mensuales
 * 
 * Esta API debe ser llamada semanalmente.
 * Configurar en el sistema de CRON:
 * 0 9 * * 1 (ejecutar a las 09:00 todos los lunes)
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
    console.log('[CRON] Enviando recordatorios de objetivos...');
    
    await automationService.sendMonthlyGoalsReminder();
    
    console.log('[CRON] Recordatorios enviados exitosamente');
    
    return res.status(200).json({
      success: true,
      message: 'Recordatorios enviados exitosamente',
    });
  } catch (error) {
    console.error('[CRON] Error al enviar recordatorios:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al enviar recordatorios',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
