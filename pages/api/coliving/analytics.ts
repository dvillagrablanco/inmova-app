import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ColivingAnalyticsService } from '@/lib/coliving-analytics-service';
import { startOfMonth } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.companyId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const companyId = session.user.companyId;

  if (req.method === 'GET') {
    try {
      // Parámetro opcional de periodo (mes/año)
      const { mes, anio } = req.query;

      let periodo: Date;
      if (mes && anio) {
        periodo = new Date(parseInt(anio as string), parseInt(mes as string) - 1, 1);
      } else {
        periodo = startOfMonth(new Date());
      }

      const analytics = await ColivingAnalyticsService.generateAnalytics(
        companyId,
        periodo
      );

      return res.status(200).json(analytics);
    } catch (error) {
      console.error('Error al generar analytics:', error);
      return res.status(500).json({ error: 'Error al generar analytics' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Forzar regeneración de analytics para un periodo específico
      const { periodo } = req.body;

      if (!periodo) {
        return res.status(400).json({ error: 'Periodo requerido' });
      }

      const analytics = await ColivingAnalyticsService.generateAnalytics(
        companyId,
        new Date(periodo)
      );

      return res.status(200).json(analytics);
    } catch (error) {
      console.error('Error al regenerar analytics:', error);
      return res.status(500).json({ error: 'Error al regenerar analytics' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
