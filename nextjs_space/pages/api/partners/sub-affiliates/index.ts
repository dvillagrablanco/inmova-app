import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import partnersService from '@/lib/services/partners-service';

/**
 * API para sub-afiliados
 * GET: Obtener sub-afiliados de un partner
 * POST: Crear nuevo sub-afiliado
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
    
    if (req.method === 'GET') {
      const { parentSalesRepId } = req.query;
      
      if (!parentSalesRepId) {
        return res.status(400).json({ error: 'parentSalesRepId es requerido' });
      }
      
      const subAffiliates = await partnersService.getSubAffiliates(parentSalesRepId as string);
      return res.status(200).json(subAffiliates);
    }
    
    if (req.method === 'POST') {
      const { parentSalesRepId, nombre, apellidos, email, telefono, password } = req.body;
      
      if (!parentSalesRepId || !nombre || !apellidos || !email || !telefono || !password) {
        return res.status(400).json({
          error: 'Campos requeridos: parentSalesRepId, nombre, apellidos, email, telefono, password',
        });
      }
      
      const subAffiliate = await partnersService.createSubAffiliate({
        parentSalesRepId,
        nombre,
        apellidos,
        email,
        telefono,
        password,
      });
      
      return res.status(201).json(subAffiliate);
    }
    
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en /api/partners/sub-affiliates:', error);
    return res.status(500).json({ error: 'Error al procesar solicitud' });
  }
}
