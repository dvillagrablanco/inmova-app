import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import salesTeamService from '@/lib/services/sales-team-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Solo admin puede marcar como pagado
  if (session.user.role !== 'super_admin' && session.user.role !== 'administrador') {
    return res.status(403).json({ error: 'No tienes permisos' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }

    const { referenciaPago, metodoPago, comprobantePago } = req.body;

    if (!referenciaPago || !metodoPago) {
      return res.status(400).json({ error: 'Datos de pago incompletos' });
    }

    const commission = await salesTeamService.markCommissionPaid(id, {
      referenciaPago,
      metodoPago,
      comprobantePago,
    });

    return res.status(200).json(commission);
  } catch (error: any) {
    console.error(`Error al marcar comisión ${id} como pagada:`, error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
