/**
 * Templates HTML profesionales para emails de Zero-Touch Onboarding
 * Diseños responsive y modernos
 */

interface EmailTemplateData {
  userName: string;
  userEmail?: string;
  companyName?: string;
  vertical?: string;
  progress?: number;
  tasksCompleted?: number;
  tasksTotal?: number;
  nextTask?: string;
  actionUrl?: string;
  isSecondReminder?: boolean;
  [key: string]: any;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inmova.app';
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER || '';
const BRAND_COLOR = '#4F46E5'; // Indigo-600
const BRAND_COLOR_DARK = '#4338CA'; // Indigo-700

/**
 * Template base con estilos comunes
 */
function getBaseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>INMOVA</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_COLOR_DARK} 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 20px;
    }
    .text {
      font-size: 16px;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: ${BRAND_COLOR};
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
    }
    .button:hover {
      background-color: ${BRAND_COLOR_DARK};
    }
    .stats-container {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .stat-item:last-child {
      border-bottom: none;
    }
    .stat-label {
      color: #6b7280;
      font-size: 14px;
    }
    .stat-value {
      color: #111827;
      font-weight: 600;
      font-size: 16px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }
    .footer-link {
      color: ${BRAND_COLOR};
      text-decoration: none;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: #dbeafe;
      color: #1e40af;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
    }
    .emoji {
      font-size: 24px;
      margin-right: 10px;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .greeting {
        font-size: 20px;
      }
      .text {
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 class="logo">INMOVA</h1>
    </div>
    ${content}
    <div class="footer">
      <p class="footer-text">
        © 2024 INMOVA. Todos los derechos reservados.<br>
        <a href="${APP_URL}" class="footer-link">inmova.app</a> | 
        <a href="${APP_URL}/docs" class="footer-link">Ayuda</a> | 
        <a href="${APP_URL}/contacto" class="footer-link">Contacto</a>
      </p>
      <p class="footer-text" style="margin-top: 20px; font-size: 12px;">
        Este es un email automático. Por favor no respondas a este correo.<br>
        Si tienes preguntas, contáctanos en <a href="mailto:soporte@inmova.com" class="footer-link">soporte@inmova.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Email de Bienvenida
 */
export function getWelcomeEmailTemplate(data: EmailTemplateData): { subject: string; html: string } {
  const content = `
    <div class="content">
      <h2 class="greeting">🚀 ¡Bienvenido a INMOVA, ${data.userName}!</h2>
      
      <p class="text">
        Estamos emocionados de tenerte con nosotros. INMOVA es la plataforma todo-en-uno que revolucionará 
        cómo gestionas tus propiedades.
      </p>

      <div class="stats-container">
        <p style="font-weight: 600; color: #111827; margin-bottom: 15px;">🎯 Lo que puedes hacer ahora:</p>
        <div class="stat-item">
          <span class="stat-label">✅ Completa tu perfil</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">🏗️ Añade tu primera propiedad</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📄 Crea tu primer contrato</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📊 Explora el dashboard</span>
        </div>
      </div>

      <p class="text">
        Hemos preparado una guía rápida de configuración que te ayudará a estar listo en menos de 15 minutos.
      </p>

      <center>
        <a href="${data.actionUrl}" class="button">
          Comenzar Configuración →
        </a>
      </center>

      <div class="divider"></div>

      <p class="text">
        <strong>🌟 Consejo Pro:</strong> Completa la configuración inicial para desbloquear todas las funcionalidades 
        de INMOVA y empezar a ahorrar tiempo desde el día 1.
      </p>
    </div>
  `;

  return {
    subject: '🚀 ¡Bienvenido a INMOVA! Comienza tu configuración',
    html: getBaseTemplate(content),
  };
}

/**
 * Email de Recordatorio de Onboarding
 */
export function getOnboardingReminderTemplate(data: EmailTemplateData): { subject: string; html: string } {
  const isSecond = data.isSecondReminder;
  
  const content = `
    <div class="content">
      <h2 class="greeting">🔔 ${isSecond ? 'Último recordatorio' : 'No olvides completar tu configuración'}, ${data.userName}</h2>
      
      <p class="text">
        ${isSecond 
          ? 'Notamos que aún no has completado la configuración inicial de tu cuenta INMOVA. ¡No te pierdas todo lo que puedes hacer!' 
          : 'Te escribimos para recordarte que tu configuración inicial está pendiente.'}
      </p>

      ${data.progress !== undefined ? `
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">Progreso actual</span>
            <span class="stat-value">${data.progress}%</span>
          </div>
          ${data.tasksCompleted !== undefined && data.tasksTotal !== undefined ? `
            <div class="stat-item">
              <span class="stat-label">Tareas completadas</span>
              <span class="stat-value">${data.tasksCompleted} de ${data.tasksTotal}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <p class="text">
        <strong>⏱️ Solo te tomará ${isSecond ? '10-15' : '15'} minutos</strong> y tendrás acceso completo a:
      </p>

      <div class="stats-container">
        <div class="stat-item">
          <span class="stat-label">✅ 88+ módulos profesionales</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">🤖 Asistente IA 24/7</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📊 Analytics avanzados</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">🔗 Integraciones con Stripe, Airbnb, etc.</span>
        </div>
      </div>

      <center>
        <a href="${data.actionUrl}" class="button">
          ${isSecond ? '¡Completar Ahora!' : 'Continuar Configuración'} →
        </a>
      </center>

      ${isSecond ? `
        <div class="divider"></div>
        <p class="text" style="text-align: center; color: #dc2626;">
          <strong>⚠️ Última oportunidad</strong> para activar todas las funcionalidades desde el inicio.
        </p>
      ` : ''}
    </div>
  `;

  return {
    subject: isSecond 
      ? '⚠️ Último recordatorio: Completa tu configuración de INMOVA'
      : '🔔 Tu configuración de INMOVA está pendiente',
    html: getBaseTemplate(content),
  };
}

/**
 * Email de Tarea Completada
 */
export function getTaskCompletedTemplate(data: EmailTemplateData): { subject: string; html: string } {
  const content = `
    <div class="content">
      <h2 class="greeting">🎉 ¡Excelente trabajo, ${data.userName}!</h2>
      
      <p class="text">
        Has completado una tarea importante de tu configuración. Estás cada vez más cerca de aprovechar al máximo INMOVA.
      </p>

      ${data.nextTask ? `
        <div class="stats-container">
          <p style="font-weight: 600; color: #111827; margin-bottom: 10px;">🎯 Siguiente paso:</p>
          <p style="color: #4b5563; margin: 0;">${data.nextTask}</p>
        </div>
      ` : ''}

      ${data.progress !== undefined ? `
        <p class="text">
          <strong>Tu progreso:</strong> ${data.progress}% completado
          <span class="badge">${data.tasksCompleted} de ${data.tasksTotal} tareas</span>
        </p>
      ` : ''}

      <center>
        <a href="${data.actionUrl}" class="button">
          Continuar →
        </a>
      </center>

      <div class="divider"></div>

      <p class="text" style="text-align: center; font-size: 14px; color: #6b7280;">
        💡 Cada paso que completas desbloquea más funcionalidades profesionales.
      </p>
    </div>
  `;

  return {
    subject: '🎉 ¡Tarea completada! Sigue avanzando en INMOVA',
    html: getBaseTemplate(content),
  };
}

/**
 * Email de Onboarding Completado
 */
export function getOnboardingCompletedTemplate(data: EmailTemplateData): { subject: string; html: string } {
  const content = `
    <div class="content">
      <h2 class="greeting" style="text-align: center;">🎉🎊 ¡Felicidades, ${data.userName}! 🎊🎉</h2>
      
      <p class="text" style="text-align: center; font-size: 18px;">
        <strong>Has completado la configuración inicial de INMOVA</strong>
      </p>

      <div class="stats-container" style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); border: 2px solid ${BRAND_COLOR};">
        <p style="text-align: center; font-size: 18px; margin: 0;">
          🚀 <strong>Ahora tienes acceso completo a las 88+ funcionalidades de INMOVA</strong>
        </p>
      </div>

      <p class="text">
        Estás listo para:
      </p>

      <div class="stats-container">
        <div class="stat-item">
          <span class="stat-label">🏗️ Gestionar propiedades como un profesional</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📄 Automatizar contratos y pagos</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📊 Visualizar analytics en tiempo real</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">🤖 Usar el asistente IA 24/7</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">🔗 Integrar con Stripe, Airbnb y más</span>
        </div>
      </div>

      <center>
        <a href="${APP_URL}/dashboard" class="button" style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_COLOR_DARK} 100%); font-size: 18px;">
          🚀 Ir al Dashboard
        </a>
      </center>

      <div class="divider"></div>

      <p class="text">
        <strong>🎓 Próximos pasos recomendados:</strong>
      </p>
      <ol style="color: #4b5563; line-height: 1.8;">
        <li>Explora los diferentes módulos del dashboard</li>
        <li>Consulta nuestra <a href="${APP_URL}/docs" style="color: ${BRAND_COLOR};">base de conocimiento</a></li>
        <li>Agenda una sesión de formación personalizada (gratis)</li>
        <li>Únete a nuestra <a href="${APP_URL}/comunidad" style="color: ${BRAND_COLOR};">comunidad de usuarios</a></li>
      </ol>

      <div class="divider"></div>

      <p class="text" style="text-align: center;">
        <strong>Si necesitas ayuda, estamos aquí:</strong><br>
        💬 Chat en vivo | 📧 soporte@inmova.com${SUPPORT_PHONE ? ` | 📞 ${SUPPORT_PHONE}` : ''}
      </p>
    </div>
  `;

  return {
    subject: '🎉 ¡Felicidades! Has completado la configuración de INMOVA',
    html: getBaseTemplate(content),
  };
}

/**
 * Email de Primera Propiedad Creada
 */
export function getBuildingCreatedTemplate(data: EmailTemplateData): { subject: string; html: string } {
  const content = `
    <div class="content">
      <h2 class="greeting">🏗️ ¡Has añadido tu primera propiedad, ${data.userName}!</h2>
      
      <p class="text">
        Este es un gran paso. Ya tienes configurada tu primera propiedad en INMOVA.
      </p>

      <div class="stats-container">
        <p style="font-weight: 600; color: #111827; margin-bottom: 15px;">🎯 ¿Qué hacer ahora?</p>
        <div class="stat-item">
          <span class="stat-label">1. Añadir unidades/espacios</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">2. Crear tu primer contrato</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">3. Configurar pagos automáticos</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">4. Subir documentos importantes</span>
        </div>
      </div>

      <center>
        <a href="${APP_URL}/propiedades" class="button">
          Ver Mi Propiedad →
        </a>
      </center>

      <div class="divider"></div>

      <p class="text">
        💡 <strong>Consejo:</strong> Usa los asistentes guiados para configurar cada sección rápidamente.
      </p>
    </div>
  `;

  return {
    subject: '🏗️ ¡Primera propiedad añadida! Siguientes pasos',
    html: getBaseTemplate(content),
  };
}

/**
 * Email de Primer Contrato Creado
 */
export function getFirstContractTemplate(data: EmailTemplateData): { subject: string; html: string } {
  const content = `
    <div class="content">
      <h2 class="greeting">📄 ¡Primer contrato creado, ${data.userName}!</h2>
      
      <p class="text">
        Excelente. Has creado tu primer contrato en INMOVA. Ahora puedes gestionar todo el ciclo de vida 
        del alquiler desde una sola plataforma.
      </p>

      <div class="stats-container" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 4px solid #10b981;">
        <p style="text-align: center; margin: 0; font-weight: 600; color: #047857;">
          ✅ Ya estás gestionando profesionalmente tus alquileres
        </p>
      </div>

      <p class="text">
        <strong>🚀 Funcionalidades que ahora puedes usar:</strong>
      </p>

      <div class="stats-container">
        <div class="stat-item">
          <span class="stat-label">💳 Cobros automáticos con Stripe</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📊 Dashboard financiero en tiempo real</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📧 Recordatorios automáticos de pago</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">📝 Renovaciones y prórrogas digitales</span>
        </div>
      </div>

      <center>
        <a href="${APP_URL}/contratos" class="button">
          Ver Mis Contratos →
        </a>
      </center>

      <div class="divider"></div>

      <p class="text" style="text-align: center;">
        💡 <strong>Siguiente nivel:</strong> Configura la integración con Stripe para cobros automáticos.
      </p>
    </div>
  `;

  return {
    subject: '📄 ¡Primer contrato activo! Activa pagos automáticos',
    html: getBaseTemplate(content),
  };
}
