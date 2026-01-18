import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

// Plantillas de email predefinidas
const EMAIL_TEMPLATE_PRESETS = {
  welcome: {
    name: 'Bienvenida',
    subject: '¡Bienvenido a {{company_name}}!',
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">¡Bienvenido, {{user_name}}!</h1>
  <p>Nos alegra tenerte en {{company_name}}.</p>
  <p>Tu cuenta ha sido creada exitosamente. Aquí tienes algunos pasos para comenzar:</p>
  <ul>
    <li>Completa tu perfil</li>
    <li>Explora las funcionalidades</li>
    <li>Contacta a soporte si necesitas ayuda</li>
  </ul>
  <p>¡Gracias por confiar en nosotros!</p>
  <p>El equipo de {{company_name}}</p>
</div>
    `.trim(),
    variables: ['user_name', 'company_name'],
  },
  payment_reminder: {
    name: 'Recordatorio de Pago',
    subject: 'Recordatorio: Pago pendiente - {{invoice_number}}',
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Recordatorio de Pago</h2>
  <p>Estimado/a {{tenant_name}},</p>
  <p>Le recordamos que tiene un pago pendiente:</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
    <p><strong>Factura:</strong> {{invoice_number}}</p>
    <p><strong>Importe:</strong> {{amount}} €</p>
    <p><strong>Fecha de vencimiento:</strong> {{due_date}}</p>
  </div>
  <p>Por favor, realice el pago lo antes posible para evitar recargos.</p>
  <p>Si ya ha realizado el pago, ignore este mensaje.</p>
  <p>Atentamente,<br>{{company_name}}</p>
</div>
    `.trim(),
    variables: ['tenant_name', 'invoice_number', 'amount', 'due_date', 'company_name'],
  },
  contract_signed: {
    name: 'Contrato Firmado',
    subject: 'Contrato firmado correctamente - {{property_address}}',
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Contrato Firmado</h2>
  <p>Estimado/a {{tenant_name}},</p>
  <p>Su contrato de alquiler ha sido firmado correctamente.</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
    <p><strong>Propiedad:</strong> {{property_address}}</p>
    <p><strong>Fecha de inicio:</strong> {{start_date}}</p>
    <p><strong>Fecha de fin:</strong> {{end_date}}</p>
    <p><strong>Renta mensual:</strong> {{monthly_rent}} €</p>
  </div>
  <p>Adjunto encontrará una copia del contrato firmado.</p>
  <p>Atentamente,<br>{{company_name}}</p>
</div>
    `.trim(),
    variables: ['tenant_name', 'property_address', 'start_date', 'end_date', 'monthly_rent', 'company_name'],
  },
  maintenance_update: {
    name: 'Actualización de Incidencia',
    subject: 'Actualización de su incidencia #{{ticket_number}}',
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Actualización de Incidencia</h2>
  <p>Estimado/a {{user_name}},</p>
  <p>Su incidencia ha sido actualizada:</p>
  <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
    <p><strong>Ticket:</strong> #{{ticket_number}}</p>
    <p><strong>Estado:</strong> {{status}}</p>
    <p><strong>Última actualización:</strong> {{update_date}}</p>
  </div>
  <p><strong>Comentario:</strong></p>
  <p>{{comment}}</p>
  <p>Atentamente,<br>{{company_name}}</p>
</div>
    `.trim(),
    variables: ['user_name', 'ticket_number', 'status', 'update_date', 'comment', 'company_name'],
  },
  password_reset: {
    name: 'Recuperación de Contraseña',
    subject: 'Solicitud de cambio de contraseña',
    content: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">Recuperación de Contraseña</h2>
  <p>Hola {{user_name}},</p>
  <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
  <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{reset_link}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
      Restablecer Contraseña
    </a>
  </div>
  <p>Este enlace expirará en 24 horas.</p>
  <p>Si no solicitaste este cambio, ignora este mensaje.</p>
  <p>Atentamente,<br>{{company_name}}</p>
</div>
    `.trim(),
    variables: ['user_name', 'reset_link', 'company_name'],
  },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'admin', 'SUPER_ADMIN', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { templateType, customizations } = body;

    if (!templateType || !EMAIL_TEMPLATE_PRESETS[templateType as keyof typeof EMAIL_TEMPLATE_PRESETS]) {
      return NextResponse.json(
        { 
          error: 'Tipo de plantilla no válido',
          availableTypes: Object.keys(EMAIL_TEMPLATE_PRESETS),
        },
        { status: 400 }
      );
    }

    const preset = EMAIL_TEMPLATE_PRESETS[templateType as keyof typeof EMAIL_TEMPLATE_PRESETS];
    
    // Aplicar personalizaciones si se proporcionan
    let generatedContent = preset.content;
    let generatedSubject = preset.subject;
    
    if (customizations) {
      Object.entries(customizations).forEach(([key, value]) => {
        generatedContent = generatedContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        generatedSubject = generatedSubject.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
    }

    return NextResponse.json({
      success: true,
      template: {
        name: preset.name,
        subject: generatedSubject,
        content: generatedContent,
        variables: preset.variables,
        type: templateType,
      },
    });
  } catch (error) {
    logger.error('Error al generar plantilla de email:', error);
    return NextResponse.json(
      { error: 'Error al generar plantilla' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Devolver lista de plantillas disponibles
    const templates = Object.entries(EMAIL_TEMPLATE_PRESETS).map(([key, value]) => ({
      id: key,
      name: value.name,
      subject: value.subject,
      variables: value.variables,
    }));

    return NextResponse.json({
      templates,
    });
  } catch (error) {
    logger.error('Error al obtener plantillas disponibles:', error);
    return NextResponse.json(
      { error: 'Error al obtener plantillas' },
      { status: 500 }
    );
  }
}
