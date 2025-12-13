import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import salesTeamService from '@/lib/services/sales-team-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Solo admin puede ver el dashboard general
  if (session.user.role !== 'super_admin' && session.user.role !== 'administrador') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }

    const dashboard = await salesTeamService.getAdminDashboard();
    return res.status(200).json(dashboard);
  } catch (error: any) {
    console.error('Error en dashboard administrativo:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
