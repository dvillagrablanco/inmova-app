/**
 * Email Configuration
 * Configuración centralizada para envío de emails
 */

import nodemailer from 'nodemailer';

// Configuración del transporter de Nodemailer
export const createEmailTransporter = () => {
  // Verificar si hay configuración SMTP en variables de entorno
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Configuración por defecto (modo desarrollo - console log)
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
};

// Información del remitente
export const getEmailFrom = (companyName: string = 'INMOVA') => {
  return process.env.SMTP_FROM || `${companyName} <noreply@inmova.com>`;
};

// Función auxiliar para enviar email
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
  attachments,
  companyName,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
  companyName?: string;
}) => {
  const transporter = createEmailTransporter();
  
  try {
    const info = await transporter.sendMail({
      from: getEmailFrom(companyName),
      to,
      subject,
      text,
      html,
      attachments,
    });

    // En modo desarrollo, mostrar el email en consola
    if (!process.env.SMTP_HOST) {
      console.log('\n📧 EMAIL ENVIADO (Modo Desarrollo)');
      console.log('Para:', to);
      console.log('Asunto:', subject);
      console.log('MessageId:', info.messageId || 'N/A');
      console.log('\n');
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error enviando email:', error);
    return { success: false, error };
  }
};
