import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import salesTeamService from '@/lib/services/sales-team-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }

    const dashboard = await salesTeamService.getSalesRepDashboard(id);
    return res.status(200).json(dashboard);
  } catch (error: any) {
    console.error(`Error en dashboard del comercial ${id}:`, error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
