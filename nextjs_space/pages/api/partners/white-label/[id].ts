import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import partnersService from '@/lib/services/partners-service';

/**
 * API para obtener configuración White Label de un partner
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const { id } = req.query;
    
    const config = await partnersService.getWhiteLabelConfig(id as string);
    
    return res.status(200).json(config);
  } catch (error) {
    console.error('Error en /api/partners/white-label/[id]:', error);
    return res.status(500).json({ error: 'Error al obtener configuración White Label' });
  }
}
