import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import partnersService from '@/lib/services/partners-service';

/**
 * API para obtener certificaciones de un partner
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
    
    const { salesRepId } = req.query;
    
    const certifications = await partnersService.getPartnerCertifications(salesRepId as string);
    
    return res.status(200).json(certifications);
  } catch (error) {
    console.error('Error en /api/partners/certifications/[salesRepId]:', error);
    return res.status(500).json({ error: 'Error al obtener certificaciones' });
  }
}
