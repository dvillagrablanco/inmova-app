import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import partnersService from '@/lib/services/partners-service';

/**
 * API para materiales de marketing
 * GET: Obtener materiales disponibles
 * POST: Crear nuevo material (solo admin)
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
      const { tipo } = req.query;
      const materials = await partnersService.getMarketingMaterials(tipo as string);
      return res.status(200).json(materials);
    }
    
    if (req.method === 'POST') {
      if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'No autorizado' });
      }
      
      const { tipo, titulo, descripcion, url, contenido, tags } = req.body;
      
      if (!tipo || !titulo || !descripcion) {
        return res.status(400).json({ error: 'Campos requeridos: tipo, titulo, descripcion' });
      }
      
      const material = await partnersService.createMarketingMaterial({
        tipo,
        titulo,
        descripcion,
        url,
        contenido,
        tags: tags || [],
      });
      
      return res.status(201).json(material);
    }
    
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en /api/partners/marketing-materials:', error);
    return res.status(500).json({ error: 'Error al procesar solicitud' });
  }
}
