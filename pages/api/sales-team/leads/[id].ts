import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import salesTeamService from '@/lib/services/sales-team-service';
import type { LeadStatus } from '@prisma/client';

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
    switch (req.method) {
      case 'GET': {
        const lead = await salesTeamService.getLeadById(id);
        
        if (!lead) {
          return res.status(404).json({ error: 'Lead no encontrado' });
        }

        return res.status(200).json(lead);
      }

      case 'PUT': {
        const data = req.body;
        const lead = await salesTeamService.updateLead(id, data);
        return res.status(200).json(lead);
      }

      case 'PATCH': {
        const { estado, notas, motivoRechazo } = req.body;
        
        if (!estado) {
          return res.status(400).json({ error: 'Estado requerido' });
        }

        const lead = await salesTeamService.updateLeadStatus(id, estado as LeadStatus, notas, motivoRechazo);
        return res.status(200).json(lead);
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'PATCH']);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error: any) {
    console.error(`Error en /api/sales-team/leads/${id}:`, error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
