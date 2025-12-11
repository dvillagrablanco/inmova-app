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
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }

    const { tipo } = req.body;

    if (!tipo || !['llamada', 'email', 'reunion'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de interacción inválido' });
    }

    const lead = await salesTeamService.registerLeadInteraction(id, tipo);
    return res.status(200).json(lead);
  } catch (error: any) {
    console.error(`Error al registrar interacción con lead ${id}:`, error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
