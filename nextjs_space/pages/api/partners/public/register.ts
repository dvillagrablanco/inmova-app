import type { NextApiRequest, NextApiResponse } from 'next';
import partnersService from '@/lib/services/partners-service';
import salesTeamService from '@/lib/services/sales-team-service';
import automationService from '@/lib/services/automation-service';

/**
 * API PÚBLICA para registro de nuevos partners
 * No requiere autenticación
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    const {
      nombre,
      apellidos,
      dni,
      email,
      telefono,
      password,
      telefonoSecundario,
      numeroAutonomo,
      iban,
      direccion,
      ciudad,
      codigoPostal,
    } = req.body;
    
    if (!nombre || !apellidos || !dni || !email || !telefono || !password) {
      return res.status(400).json({
        error: 'Campos requeridos: nombre, apellidos, dni, email, telefono, password',
      });
    }
    
    // Crear nuevo partner (inicia como PENDIENTE)
    const salesRep = await salesTeamService.createSalesRepresentative({
      nombre,
      apellidos,
      dni,
      email,
      telefono,
      password,
      telefonoSecundario,
      numeroAutonomo,
      iban,
      direccion,
      ciudad,
      codigoPostal,
    });
    
    // Enviar email de bienvenida
    await automationService.sendPartnerWelcomeEmail(salesRep.id);
    
    return res.status(201).json({
      success: true,
      message: 'Registro exitoso. Tu cuenta está pendiente de aprobación.',
      partnerId: salesRep.id,
      codigoReferido: salesRep.codigoReferido,
    });
  } catch (error) {
    console.error('Error en /api/partners/public/register:', error);
    return res.status(500).json({ error: 'Error al procesar registro' });
  }
}
