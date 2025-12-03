import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/reuniones/[id]/generar-acta - Generar PDF del acta
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!['administrador', 'gestor'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No tienes permisos para generar actas' },
        { status: 403 }
      );
    }

    const reunion = await prisma.communityMeeting.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        building: true,
      },
    });

    if (!reunion) {
      return NextResponse.json(
        { error: 'Reunión no encontrada' },
        { status: 404 }
      );
    }

    // Generar contenido HTML del acta
    const ordenDia: any[] = [];
    const asistentes = reunion.asistentes ? (reunion.asistentes as any[]) : [];
    const acuerdos = reunion.acuerdos ? (reunion.acuerdos as any[]) : [];

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Acta de Reunión - ${reunion.titulo}</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 {
            text-align: center;
            color: #000;
            margin-bottom: 30px;
          }
          h2 {
            color: #333;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
            margin-top: 30px;
          }
          .header-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          .header-info p {
            margin: 5px 0;
          }
          .orden-item, .acuerdo-item {
            margin: 10px 0;
            padding-left: 20px;
          }
          .asistentes {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin: 15px 0;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>ACTA DE REUNIÓN DE COMUNIDAD</h1>
        
        <div class="header-info">
          <p><strong>Edificio:</strong> ${reunion.building.nombre}</p>
          <p><strong>Título:</strong> ${reunion.titulo}</p>
          <p><strong>Fecha:</strong> ${format(new Date(reunion.fechaReunion), "dd 'de' MMMM 'de' yyyy, HH:mm 'horas'", { locale: es })}</p>
          <p><strong>Lugar:</strong> ${reunion.ubicacion || 'No especificado'}</p>
          <p><strong>Organizador:</strong> ${reunion.organizadoPor}</p>
        </div>

        <h2>ASISTENTES</h2>
        <div class="asistentes">
          ${asistentes.map((a: any) => `<div>• ${a.nombre || a.email || 'Sin nombre'}</div>`).join('')}
        </div>

        <h2>ORDEN DEL DÍA</h2>
        ${ordenDia.map((item: any, index: number) => `
          <div class="orden-item">
            <strong>${index + 1}.</strong> ${item.titulo || item.texto || item}
            ${item.descripcion ? `<br><small>${item.descripcion}</small>` : ''}
          </div>
        `).join('')}

        ${acuerdos && acuerdos.length > 0 ? `
          <h2>ACUERDOS ADOPTADOS</h2>
          ${acuerdos.map((acuerdo: any, index: number) => `
            <div class="acuerdo-item">
              <strong>${index + 1}.</strong> ${acuerdo.texto || acuerdo.titulo || acuerdo}
              ${acuerdo.resultado ? `<br><small>Resultado: ${acuerdo.resultado}</small>` : ''}
            </div>
          `).join('')}
        ` : ''}

        <div class="footer">
          <p>Acta generada el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm 'horas'", { locale: es })}</p>
          <p>INMOVA - Sistema de Gestión de Propiedades</p>
        </div>
      </body>
      </html>
    `;

    // En producción, aquí se generaría el PDF con una librería como puppeteer o pdfkit
    // Por ahora, guardamos el HTML y devolvemos un enlace simulado
    const urlActa = `/actas/${params.id}.pdf`; // URL simulada

    // Actualizar la reunión con el acta generada
    const reunionActualizada = await prisma.communityMeeting.update({
      where: { id: params.id },
      data: {
        acta: htmlContent,
        actaFirmada: urlActa,
        estado: 'realizada',
      },
    });

    return NextResponse.json({
      success: true,
      urlActa,
      htmlContent, // Devolvemos el HTML para preview
      reunion: reunionActualizada,
    });
  } catch (error) {
    logger.error('Error al generar acta:', error);
    return NextResponse.json(
      { error: 'Error al generar acta' },
      { status: 500 }
    );
  }
}
