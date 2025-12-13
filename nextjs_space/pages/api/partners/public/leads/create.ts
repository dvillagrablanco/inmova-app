import type { NextApiRequest, NextApiResponse } from 'next';
import partnersService from '@/lib/services/partners-service';
import salesTeamService from '@/lib/services/sales-team-service';

/**
 * API PÚBLICA para crear leads mediante API Key
 * Requiere API Key y API Secret en headers
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    // Verificar API Key
    const apiKey = req.headers['x-api-key'] as string;
    const apiSecret = req.headers['x-api-secret'] as string;
    
    if (!apiKey || !apiSecret) {
      return res.status(401).json({ error: 'API Key y API Secret son requeridos en headers' });
    }
    
    const partner = await partnersService.verifyPartnerAPIKey(apiKey, apiSecret);
    
    if (!partner) {
      return res.status(401).json({ error: 'API Key inválida o expirada' });
    }
    
    const {
      nombreContacto,
      emailContacto,
      telefonoContacto,
      nombreEmpresa,
      sector,
      tipoCliente,
      propiedadesEstimadas,
      presupuestoMensual,
      notas,
    } = req.body;
    
    if (!nombreContacto || !emailContacto || !nombreEmpresa) {
      return res.status(400).json({
        error: 'Campos requeridos: nombreContacto, emailContacto, nombreEmpresa',
      });
    }
    
    const lead = await salesTeamService.createLead({
      salesRepId: partner.id,
      nombreContacto,
      emailContacto,
      telefonoContacto,
      nombreEmpresa,
      sector,
      tipoCliente,
      propiedadesEstimadas,
      presupuestoMensual,
      origenCaptura: 'API',
      notas,
    });
    
    return res.status(201).json({
      success: true,
      leadId: lead.id,
      message: 'Lead creado exitosamente',
    });
  } catch (error) {
    console.error('Error en /api/partners/public/leads/create:', error);
    return res.status(500).json({ error: 'Error al crear lead' });
  }
}
