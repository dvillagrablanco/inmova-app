import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ColivingSpacesService } from '@/lib/coliving-spaces-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.companyId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'POST') {
    try {
      const { reservationId, action } = req.body;

      if (!reservationId || !action) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      if (action === 'confirm') {
        const reservation = await ColivingSpacesService.confirmCheckIn(reservationId);
        return res.status(200).json(reservation);
      }

      if (action === 'no-show') {
        const reservation = await ColivingSpacesService.markNoShow(reservationId);
        return res.status(200).json(reservation);
      }

      return res.status(400).json({ error: 'Acción inválida' });
    } catch (error: any) {
      console.error('Error al procesar check-in:', error);
      return res.status(500).json({ error: error.message || 'Error al procesar check-in' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
