import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import reportsService from '@/lib/services/reports-service';

/**
 * API de reportes de comerciales
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const { estado, activo, format, type } = req.query;
    
    // Formato CSV
    if (format === 'csv') {
      const csv = await reportsService.generateSalesRepsCSV({
        estado: estado as string,
        activo: activo === 'true' ? true : activo === 'false' ? false : undefined,
      });
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="comerciales_${Date.now()}.csv"`
      );
      return res.status(200).send(csv);
    }
    
    // Ranking de comerciales
    if (type === 'ranking') {
      const periodo = req.query.periodo as string;
      const ranking = await reportsService.getSalesRepsRanking(periodo);
      return res.status(200).json(ranking);
    }
    
    // Estadísticas generales
    if (type === 'stats') {
      const periodo = req.query.periodo as string;
      const stats = await reportsService.getGeneralStats(periodo);
      return res.status(200).json(stats);
    }
    
    return res.status(400).json({ error: 'Formato no soportado' });
  } catch (error) {
    console.error('Error en /api/reports/sales-reps:', error);
    return res.status(500).json({ error: 'Error al generar reporte' });
  }
}
