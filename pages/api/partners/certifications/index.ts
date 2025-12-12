import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import partnersService from '@/lib/services/partners-service';

/**
 * API para certificaciones de partners
 * POST: Crear nueva certificación (solo admin)
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
    
    const { nombre, descripcion, nivel, requisitos, beneficios } = req.body;
    
    if (!nombre || !descripcion || !nivel) {
      return res.status(400).json({ error: 'Campos requeridos: nombre, descripcion, nivel' });
    }
    
    const certification = await partnersService.createCertification({
      nombre,
      descripcion,
      nivel,
      requisitos: requisitos || [],
      beneficios: beneficios || [],
    });
    
    return res.status(201).json(certification);
  } catch (error) {
    console.error('Error en /api/partners/certifications:', error);
    return res.status(500).json({ error: 'Error al crear certificación' });
  }
}
