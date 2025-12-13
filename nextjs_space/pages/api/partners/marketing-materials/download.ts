import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import partnersService from '@/lib/services/partners-service';

/**
 * API para registrar descarga de material de marketing
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const { salesRepId, materialId } = req.body;
    
    if (!salesRepId || !materialId) {
      return res.status(400).json({ error: 'salesRepId y materialId son requeridos' });
    }
    
    await partnersService.trackMaterialDownload(salesRepId, materialId);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error en /api/partners/marketing-materials/download:', error);
    return res.status(500).json({ error: 'Error al registrar descarga' });
  }
}
