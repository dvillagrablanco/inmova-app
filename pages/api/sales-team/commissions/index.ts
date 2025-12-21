import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import salesTeamService from '@/lib/services/sales-team-service';

// Definiciones de tipos inline (reemplaza imports de @prisma/client)
type SalesCommissionStatus = 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'CANCELADA' | 'RETENIDA';
type SalesCommissionType = 'CAPTACION' | 'RECURRENTE' | 'REACTIVACION' | 'BONIFICACION' | 'NIVEL2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { salesRepId, estado, tipo, periodo } = req.query;
        
        const filters: any = {};
        if (salesRepId) filters.salesRepId = salesRepId as string;
        if (estado) filters.estado = estado as SalesCommissionStatus;
        if (tipo) filters.tipo = tipo as SalesCommissionType;
        if (periodo) filters.periodo = periodo as string;

        const commissions = await salesTeamService.getCommissions(filters);
        return res.status(200).json(commissions);
      }

      case 'POST': {
        // Solo admin puede crear comisiones manuales
        if (session.user.role !== 'super_admin' && session.user.role !== 'administrador') {
          return res.status(403).json({ error: 'No tienes permisos' });
        }

        const data = req.body;
        
        if (!data.salesRepId || !data.tipo || !data.descripcion || !data.montoBase || !data.montoComision) {
          return res.status(400).json({ error: 'Datos incompletos' });
        }

        const commission = await salesTeamService.createCommission(data);
        return res.status(201).json(commission);
      }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error: any) {
    console.error('Error en /api/sales-team/commissions:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
}
