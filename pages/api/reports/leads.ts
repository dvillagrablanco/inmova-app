import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import reportsService from '@/lib/services/reports-service';

/**
 * API de reportes de leads
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
    
    const { salesRepId, estado, convertido, format, type } = req.query;
    
    // Formato CSV
    if (format === 'csv') {
      const csv = await reportsService.generateLeadsCSV({
        salesRepId: salesRepId as string,
        estado: estado as string,
        convertido: convertido === 'true' ? true : convertido === 'false' ? false : undefined,
      });
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="leads_${estado || 'todos'}_${Date.now()}.csv"`
      );
      return res.status(200).send(csv);
    }
    
    // Formato JSON para gráficas
    if (type === 'chart') {
      const months = parseInt(req.query.months as string) || 12;
      const chartData = await reportsService.getLeadsChartData(
        salesRepId as string,
        months
      );
      return res.status(200).json(chartData);
    }
    
    return res.status(400).json({ error: 'Formato no soportado' });
  } catch (error) {
    console.error('Error en /api/reports/leads:', error);
    return res.status(500).json({ error: 'Error al generar reporte' });
  }
}
