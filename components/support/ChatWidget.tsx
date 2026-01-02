'use client';

import { useEffect } from 'react';
import Script from 'next/script';

/**
 * ChatWidget - El Escudo de Inmova
 * 
 * Widget de chat en vivo con Crisp.
 * Aparece en todas las páginas para soporte instantáneo 24/7.
 * 
 * @example
 * // En app/layout.tsx:
 * <ChatWidget />
 * 
 * @requires NEXT_PUBLIC_CRISP_WEBSITE_ID en .env
 */
export function ChatWidget() {
  const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

  useEffect(() => {
    if (!crispWebsiteId) {
      console.log('[ChatWidget] Crisp no configurado - NEXT_PUBLIC_CRISP_WEBSITE_ID no encontrado');
      return;
    }

    // Configurar Crisp solo en el cliente
    if (typeof window !== 'undefined') {
      // @ts-ignore - Crisp global
      window.$crisp = [];
      // @ts-ignore
      window.CRISP_WEBSITE_ID = crispWebsiteId;

      console.log('[ChatWidget] Crisp inicializado');

      // Configuración adicional de Crisp
      // @ts-ignore
      window.$crisp.push(['safe', true]); // Habilitar modo seguro

      // Personalización del widget
      // @ts-ignore
      window.$crisp.push(['config', 'color:theme', '#6366f1']); // Indigo 600 (color de Inmova)
      // @ts-ignore
      window.$crisp.push(['config', 'position:reverse', false]); // Posición derecha

      // Ocultar en páginas específicas (opcional)
      const hideOnPaths = [
        '/api-docs', // Swagger UI
        '/storybook', // Storybook
      ];

      const currentPath = window.location.pathname;
      if (hideOnPaths.some(path => currentPath.startsWith(path))) {
        // @ts-ignore
        window.$crisp.push(['do', 'chat:hide']);
      }
    }
  }, [crispWebsiteId]);

  // No renderizar si no está configurado
  if (!crispWebsiteId) {
    return null;
  }

  return (
    <>
      {/* Script de Crisp - Se carga de forma asíncrona */}
      <Script
        id="crisp-chat"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.$crisp=[];
            window.CRISP_WEBSITE_ID="${crispWebsiteId}";
            (function(){
              var d=document;
              var s=d.createElement("script");
              s.src="https://client.crisp.chat/l.js";
              s.async=1;
              d.getElementsByTagName("head")[0].appendChild(s);
            })();
          `,
        }}
      />
    </>
  );
}

/**
 * Utilidades para controlar Crisp programáticamente
 * 
 * @example
 * import { crispUtils } from '@/components/support/ChatWidget';
 * 
 * // Abrir chat
 * crispUtils.open();
 * 
 * // Enviar mensaje pre-definido
 * crispUtils.setMessage('Hola, necesito ayuda con...');
 * 
 * // Establecer datos del usuario
 * crispUtils.setUser({ email: 'user@example.com', nickname: 'Juan' });
 */
export const crispUtils = {
  /**
   * Abrir el chat de Crisp
   */
  open: () => {
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:open']);
    }
  },

  /**
   * Cerrar el chat de Crisp
   */
  close: () => {
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:close']);
    }
  },

  /**
   * Mostrar el widget
   */
  show: () => {
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:show']);
    }
  },

  /**
   * Ocultar el widget
   */
  hide: () => {
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(['do', 'chat:hide']);
    }
  },

  /**
   * Establecer un mensaje pre-escrito en el input
   */
  setMessage: (message: string) => {
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(['set', 'message:text', [message]]);
    }
  },

  /**
   * Establecer datos del usuario autenticado
   */
  setUser: (data: { email?: string; nickname?: string; avatar?: string }) => {
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      if (data.email) {
        (window as any).$crisp.push(['set', 'user:email', [data.email]]);
      }
      if (data.nickname) {
        (window as any).$crisp.push(['set', 'user:nickname', [data.nickname]]);
      }
      if (data.avatar) {
        (window as any).$crisp.push(['set', 'user:avatar', [data.avatar]]);
      }
    }
  },

  /**
   * Enviar un evento personalizado (para tracking)
   */
  sendEvent: (eventName: string, eventData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).$crisp) {
      (window as any).$crisp.push(['set', 'session:event', [[eventName, eventData]]]);
    }
  },
};
