/**
 * White Screen Detector - Sistema de Detección de Pantalla Blanca
 * 
 * Detecta y reporta cuando la aplicación cae en estado de pantalla blanca
 * causado por errores no capturados.
 */

export class WhiteScreenDetector {
  private static instance: WhiteScreenDetector;
  private checkInterval: NodeJS.Timeout | null = null;
  private onWhiteScreenDetected?: (details: WhiteScreenDetails) => void;
  private isMonitoring = false;

  private constructor() {}

  static getInstance(): WhiteScreenDetector {
    if (!WhiteScreenDetector.instance) {
      WhiteScreenDetector.instance = new WhiteScreenDetector();
    }
    return WhiteScreenDetector.instance;
  }

  /**
   * Inicia el monitoreo de pantalla blanca
   */
  start(callback?: (details: WhiteScreenDetails) => void) {
    if (typeof window === 'undefined') return;
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.onWhiteScreenDetected = callback;

    // Check inicial después de 2 segundos (dar tiempo a hydration)
    setTimeout(() => {
      this.performCheck();
    }, 2000);

    // Check periódico cada 5 segundos
    this.checkInterval = setInterval(() => {
      this.performCheck();
    }, 5000);

    // Escuchar errores no capturados
    this.setupErrorListeners();

    console.log('✅ [WhiteScreenDetector] Monitoreo iniciado');
  }

  /**
   * Detiene el monitoreo
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('🛑 [WhiteScreenDetector] Monitoreo detenido');
  }

  /**
   * Realiza una verificación de pantalla blanca
   */
  private performCheck() {
    if (typeof window === 'undefined') return;

    const details = this.detectWhiteScreen();

    if (details.isWhiteScreen) {
      console.error('🔴 [WhiteScreenDetector] Pantalla blanca detectada!', details);
      this.onWhiteScreenDetected?.(details);

      // Intentar recuperación automática
      this.attemptRecovery(details);
    }
  }

  /**
   * Detecta si hay pantalla blanca
   */
  private detectWhiteScreen(): WhiteScreenDetails {
    const details: WhiteScreenDetails = {
      isWhiteScreen: false,
      checks: {},
      timestamp: new Date().toISOString(),
    };

    try {
      // Check 1: Verificar si el body tiene contenido visible
      const bodyHasContent = document.body.children.length > 0;
      details.checks.hasBodyContent = bodyHasContent;

      // Check 2: Verificar si hay elementos visibles (no display:none)
      const visibleElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
      details.checks.hasVisibleElements = visibleElements.length > 10; // Al menos 10 elementos visibles

      // Check 3: Verificar si hay texto visible
      const bodyText = document.body.innerText?.trim() || '';
      details.checks.hasVisibleText = bodyText.length > 20;

      // Check 4: Verificar altura del body
      const bodyHeight = document.body.offsetHeight;
      details.checks.hasProperHeight = bodyHeight > 100;

      // Check 5: Verificar si React está montado (buscar atributos típicos)
      const hasReactRoot = document.querySelector('[data-reactroot], #__next, [id^="react-"]') !== null;
      details.checks.hasReactRoot = hasReactRoot;

      // Check 6: Verificar color de fondo del body
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const isWhiteBg = bodyBg === 'rgb(255, 255, 255)' || bodyBg === 'rgba(255, 255, 255, 1)' || bodyBg === 'white';
      details.checks.hasWhiteBackground = isWhiteBg;

      // Determinar si es pantalla blanca
      // Criterios: fondo blanco Y (sin contenido visible O sin texto O sin altura)
      details.isWhiteScreen = details.checks.hasWhiteBackground && (
        !details.checks.hasVisibleElements ||
        !details.checks.hasVisibleText ||
        !details.checks.hasProperHeight
      );

      // Capturar snapshot del DOM para debugging
      if (details.isWhiteScreen) {
        details.domSnapshot = {
          bodyChildren: document.body.children.length,
          bodyHTML: document.body.innerHTML.substring(0, 500), // Primeros 500 chars
          bodyHeight,
          visibleElementsCount: visibleElements.length,
          textLength: bodyText.length,
        };
      }

    } catch (error) {
      console.error('[WhiteScreenDetector] Error en detección:', error);
      details.error = error instanceof Error ? error.message : String(error);
    }

    return details;
  }

  /**
   * Setup de listeners para errores no capturados
   */
  private setupErrorListeners() {
    if (typeof window === 'undefined') return;

    // Capturar errores de JavaScript
    window.addEventListener('error', (event) => {
      console.error('🔴 [WhiteScreenDetector] Error global capturado:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });

      // Check después del error
      setTimeout(() => this.performCheck(), 500);
    });

    // Capturar promesas rechazadas no manejadas
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🔴 [WhiteScreenDetector] Promise rechazada no manejada:', {
        reason: event.reason,
        promise: event.promise,
      });

      // Check después del error
      setTimeout(() => this.performCheck(), 500);
    });
  }

  /**
   * Intenta recuperación automática
   */
  private attemptRecovery(details: WhiteScreenDetails) {
    console.warn('🔧 [WhiteScreenDetector] Intentando recuperación automática...');

    // Estrategia 1: Intentar forzar re-render de React
    try {
      const rootEl = document.getElementById('__next') || document.getElementById('root');
      if (rootEl) {
        // Trigger re-paint
        rootEl.style.display = 'none';
        setTimeout(() => {
          rootEl.style.display = '';
        }, 100);
      }
    } catch (e) {
      console.error('[WhiteScreenDetector] Estrategia 1 falló:', e);
    }

    // Estrategia 2: Si persiste después de 3 segundos, ofrecer reload
    setTimeout(() => {
      const checkAgain = this.detectWhiteScreen();
      if (checkAgain.isWhiteScreen) {
        console.error('🔴 [WhiteScreenDetector] Recuperación automática falló. Mostrando opción de reload.');
        this.showRecoveryUI();
      }
    }, 3000);
  }

  /**
   * Muestra UI de recuperación (overlay)
   */
  private showRecoveryUI() {
    if (typeof window === 'undefined') return;

    // Evitar duplicar el overlay
    if (document.getElementById('white-screen-recovery')) return;

    const overlay = document.createElement('div');
    overlay.id = 'white-screen-recovery';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 1rem;
    `;

    overlay.innerHTML = `
      <div style="
        max-width: 400px;
        background: white;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      ">
        <div style="
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
          background: #fee2e2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        ">⚠️</div>
        
        <h2 style="
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #1f2937;
        ">Error de Aplicación</h2>
        
        <p style="
          color: #6b7280;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
        ">
          La aplicación ha dejado de responder. 
          Por favor, recarga la página para continuar.
        </p>
        
        <button onclick="window.location.reload()" style="
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 1rem;
          transition: background 0.2s;
        " onmouseover="this.style.background='#4338ca'" onmouseout="this.style.background='#4f46e5'">
          Recargar Página
        </button>
        
        <button onclick="window.location.href='/landing'" style="
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.875rem;
        " onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'">
          Ir a la página principal
        </button>
      </div>
    `;

    document.body.appendChild(overlay);
  }
}

export interface WhiteScreenDetails {
  isWhiteScreen: boolean;
  checks: {
    hasBodyContent?: boolean;
    hasVisibleElements?: boolean;
    hasVisibleText?: boolean;
    hasProperHeight?: boolean;
    hasReactRoot?: boolean;
    hasWhiteBackground?: boolean;
  };
  timestamp: string;
  error?: string;
  domSnapshot?: {
    bodyChildren: number;
    bodyHTML: string;
    bodyHeight: number;
    visibleElementsCount: number;
    textLength: number;
  };
}

/**
 * Hook para usar el detector en componentes React
 */
export function useWhiteScreenDetector() {
  if (typeof window !== 'undefined') {
    const detector = WhiteScreenDetector.getInstance();
    
    return {
      start: (callback?: (details: WhiteScreenDetails) => void) => detector.start(callback),
      stop: () => detector.stop(),
    };
  }
  
  return {
    start: () => {},
    stop: () => {},
  };
}
