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

  const companyId = session.user.companyId;

  if (req.method === 'GET') {
    try {
      const { spaceId } = req.query;

      if (!spaceId) {
        return res.status(400).json({ error: 'spaceId requerido' });
      }

      const ratings = await ColivingSpacesService.getSpaceRatings(spaceId as string);

      return res.status(200).json(ratings);
    } catch (error) {
      console.error('Error al obtener ratings:', error);
      return res.status(500).json({ error: 'Error al obtener ratings' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { spaceId, tenantId, reservationId, puntuacion, comentario, aspectosPositivos, aspectosNegativos } = req.body;

      if (!spaceId || !tenantId || !reservationId || puntuacion === undefined) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      if (puntuacion < 1 || puntuacion > 5) {
        return res.status(400).json({ error: 'Puntuación debe estar entre 1 y 5' });
      }

      const rating = await ColivingSpacesService.createSpaceRating({
        companyId,
        spaceId,
        tenantId,
        reservationId,
        puntuacion,
        comentario,
        aspectosPositivos,
        aspectosNegativos,
      });

      return res.status(201).json(rating);
    } catch (error) {
      console.error('Error al crear rating:', error);
      return res.status(500).json({ error: 'Error al crear rating' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
