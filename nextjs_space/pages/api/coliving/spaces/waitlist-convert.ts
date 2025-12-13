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
      const { waitlistId } = req.body;

      if (!waitlistId) {
        return res.status(400).json({ error: 'waitlistId requerido' });
      }

      const reservation = await ColivingSpacesService.convertWaitlistToReservation(waitlistId);

      return res.status(200).json(reservation);
    } catch (error: any) {
      console.error('Error al convertir waitlist:', error);
      return res.status(500).json({ error: error.message || 'Error al convertir waitlist' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
