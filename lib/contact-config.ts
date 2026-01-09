/**
 * Configuración centralizada de contacto para INMOVA
 * 
 * Todos los formularios de contacto, soporte, y comunicaciones
 * deben usar estas constantes para mantener consistencia.
 */

// Email principal para TODOS los formularios de contacto
export const CONTACT_EMAIL = 'inmovaapp@gmail.com';

// Alias para diferentes tipos de comunicación (todos van al mismo email)
export const SUPPORT_EMAIL = CONTACT_EMAIL;
export const INFO_EMAIL = CONTACT_EMAIL;
export const SALES_EMAIL = CONTACT_EMAIL;

// Configuración completa de contacto
export const CONTACT_CONFIG = {
  email: CONTACT_EMAIL,
  supportEmail: SUPPORT_EMAIL,
  infoEmail: INFO_EMAIL,
  salesEmail: SALES_EMAIL,
  phone: '+34 900 123 456',
  address: 'Madrid, España',
  companyName: 'INMOVA',
  legalName: 'Enxames Investments SL',
  website: 'https://inmovaapp.com',
} as const;

// Tipos de formulario de contacto
export type ContactFormType = 
  | 'landing'           // Formulario de landing page
  | 'soporte'           // Tickets de soporte
  | 'demo'              // Solicitud de demo
  | 'partner'           // Partners
  | 'chatbot'           // Chatbot
  | 'ewoorker'          // eWoorker (trabajadores)
  | 'feedback'          // Feedback
  | 'prensa'            // Prensa/Media
  | 'otro';             // Otro

// Función para obtener el email de destino según el tipo
export function getContactEmail(type?: ContactFormType): string {
  // Por ahora, todos van al mismo email
  // En el futuro se pueden separar si es necesario
  return CONTACT_EMAIL;
}
