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

  if (req.method === 'GET') {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId requerido' });
      }

      const credits = await ColivingSpacesService.getCredits(tenantId as string);

      return res.status(200).json(credits);
    } catch (error) {
      console.error('Error al obtener créditos:', error);
      return res.status(500).json({ error: 'Error al obtener créditos' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, tenantId, creditsToUse } = req.body;

      if (!action || !tenantId) {
        return res.status(400).json({ error: 'Datos incompletos' });
      }

      if (action === 'use') {
        const credits = await ColivingSpacesService.useReservationCredits(
          tenantId,
          creditsToUse || 1
        );
        return res.status(200).json(credits);
      }

      if (action === 'recharge') {
        const credits = await ColivingSpacesService.rechargeCredits(tenantId);
        return res.status(200).json(credits);
      }

      return res.status(400).json({ error: 'Acción inválida' });
    } catch (error: any) {
      console.error('Error al gestionar créditos:', error);
      return res.status(500).json({ error: error.message || 'Error al gestionar créditos' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
