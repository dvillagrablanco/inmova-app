import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import partnersService from '@/lib/services/partners-service';

/**
 * API para otorgar certificación a un partner
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
    
    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const { salesRepId, certificationId } = req.body;
    
    if (!salesRepId || !certificationId) {
      return res.status(400).json({ error: 'salesRepId y certificationId son requeridos' });
    }
    
    const awarded = await partnersService.awardCertification(salesRepId, certificationId);
    
    return res.status(200).json(awarded);
  } catch (error) {
    console.error('Error en /api/partners/certifications/award:', error);
    return res.status(500).json({ error: 'Error al otorgar certificación' });
  }
}
