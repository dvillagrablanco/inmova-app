import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { ColivingAnalyticsService } from '@/lib/coliving-analytics-service';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.companyId) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const companyId = session.user.companyId;

  if (req.method === 'GET') {
    try {
      // Obtener encuestas NPS
      const { tenantId } = req.query;

      const where: any = { companyId };
      if (tenantId) {
        where.tenantId = tenantId as string;
      }

      const surveys = await prisma.nPSSurvey.findMany({
        where,
        include: {
          tenant: {
            select: {
              nombre: true,
              apellidos: true,
              email: true,
            },
          },
        },
        orderBy: { fechaEncuesta: 'desc' },
      });

      return res.status(200).json(surveys);
    } catch (error) {
      console.error('Error al obtener encuestas NPS:', error);
      return res.status(500).json({ error: 'Error al obtener encuestas' });
    }
  }

  if (req.method === 'POST') {
    try {
      // Crear nueva encuesta NPS
      const { tenantId } = req.body;

      if (!tenantId) {
        return res.status(400).json({ error: 'tenantId requerido' });
      }

      const survey = await ColivingAnalyticsService.createNPSSurvey(
        companyId,
        tenantId
      );

      return res.status(201).json(survey);
    } catch (error) {
      console.error('Error al crear encuesta NPS:', error);
      return res.status(500).json({ error: 'Error al crear encuesta' });
    }
  }

  if (req.method === 'PUT') {
    try {
      // Actualizar respuesta de encuesta NPS
      const { surveyId, score, comentario } = req.body;

      if (!surveyId || score === undefined) {
        return res.status(400).json({ error: 'surveyId y score requeridos' });
      }

      if (score < 0 || score > 10) {
        return res.status(400).json({ error: 'Score debe estar entre 0 y 10' });
      }

      const survey = await ColivingAnalyticsService.updateNPSSurvey(
        surveyId,
        score,
        comentario
      );

      return res.status(200).json(survey);
    } catch (error) {
      console.error('Error al actualizar encuesta NPS:', error);
      return res.status(500).json({ error: 'Error al actualizar encuesta' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
