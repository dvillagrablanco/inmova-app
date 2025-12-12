import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import partnersService from '@/lib/services/partners-service';

/**
 * API para generar API Keys para partners
 * Solo administradores pueden generar API keys
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
    
    const { salesRepId } = req.body;
    
    if (!salesRepId) {
      return res.status(400).json({ error: 'salesRepId es requerido' });
    }
    
    const result = await partnersService.generatePartnerAPIKey(salesRepId);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en /api/partners/api-keys/generate:', error);
    return res.status(500).json({ error: 'Error al generar API key' });
  }
}
