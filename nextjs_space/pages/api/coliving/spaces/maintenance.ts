import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ColivingSpacesService } from '@/lib/coliving-spaces-service';
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
      const predictions = await ColivingSpacesService.getPendingMaintenance(companyId);

      return res.status(200).json(predictions);
    } catch (error) {
      console.error('Error al obtener predicciones de mantenimiento:', error);
      return res.status(500).json({ error: 'Error al obtener predicciones' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { spaceId, periodo } = req.body;

      if (!spaceId) {
        return res.status(400).json({ error: 'spaceId requerido' });
      }

      const periodoDate = periodo ? new Date(periodo) : startOfMonth(new Date());

      const prediction = await ColivingSpacesService.analyzeMaintenance(
        spaceId,
        periodoDate
      );

      return res.status(200).json(prediction);
    } catch (error) {
      console.error('Error al analizar mantenimiento:', error);
      return res.status(500).json({ error: 'Error al analizar mantenimiento' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { predictionId } = req.body;

      if (!predictionId) {
        return res.status(400).json({ error: 'predictionId requerido' });
      }

      const prediction = await ColivingSpacesService.markMaintenanceAlertSent(predictionId);

      return res.status(200).json(prediction);
    } catch (error) {
      console.error('Error al actualizar predicción:', error);
      return res.status(500).json({ error: 'Error al actualizar predicción' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
