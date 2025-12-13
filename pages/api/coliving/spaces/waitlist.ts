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

      const waitlist = await ColivingSpacesService.getWaitlist(spaceId as string);

      return res.status(200).json(waitlist);
    } catch (error) {
      console.error('Error al obtener waitlist:', error);
      return res.status(500).json({ error: 'Error al obtener waitlist' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;

      if (!data.spaceId || !data.tenantId || !data.fechaDeseada || !data.horaInicio || !data.horaFin) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      const waitlist = await ColivingSpacesService.addToWaitlist({
        companyId,
        ...data,
        fechaDeseada: new Date(data.fechaDeseada),
      });

      return res.status(201).json(waitlist);
    } catch (error) {
      console.error('Error al agregar a waitlist:', error);
      return res.status(500).json({ error: 'Error al agregar a waitlist' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
