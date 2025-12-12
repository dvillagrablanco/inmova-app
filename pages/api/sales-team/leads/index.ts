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

  try {
    switch (req.method) {
      case 'GET': {
        const { salesRepId, estado, convertido, prioridad, search } = req.query;
        
        const filters: any = {};
        if (salesRepId) filters.salesRepId = salesRepId as string;
        if (estado) filters.estado = estado as LeadStatus;
        if (convertido !== undefined) filters.convertido = convertido === 'true';
        if (prioridad) filters.prioridad = prioridad as string;
        if (search) filters.search = search as string;

        const leads = await salesTeamService.getLeads(filters);
        return res.status(200).json(leads);
      }

      case 'POST': {
        const data = req.body;
        
        if (!data.salesRepId || !data.nombreContacto || !data.emailContacto || !data.nombreEmpresa) {
          return res.status(400).json({ error: 'Datos incompletos' });
        }

        const lead = await salesTeamService.createLead(data);
        return res.status(201).json(lead);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error: any) {
    console.error('Error en /api/sales-team/leads:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
