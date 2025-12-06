import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.companyId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method === 'GET') {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId requerido' });
      }

      const profile = await prisma.tenantProfile.findUnique({
        where: { tenantId: tenantId as string },
      });

      return res.status(200).json(profile);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return res.status(500).json({ error: 'Error al obtener perfil' });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;

      if (!data.tenantId) {
        return res.status(400).json({ error: 'tenantId requerido' });
      }

      const profile = await prisma.tenantProfile.create({
        data,
      });

      return res.status(201).json(profile);
    } catch (error) {
      console.error('Error al crear perfil:', error);
      return res.status(500).json({ error: 'Error al crear perfil' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { tenantId, ...data } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId requerido' });
      }

      const profile = await prisma.tenantProfile.update({
        where: { tenantId },
        data,
      });

      return res.status(200).json(profile);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      return res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
