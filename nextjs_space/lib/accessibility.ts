/**
 * Utilidades de Accesibilidad (WCAG 2.1 AA)
 * Mejora la accesibilidad y usabilidad para todos los usuarios
 */

/**
 * Calcula el ratio de contraste entre dos colores
 * Según WCAG 2.1, el ratio mínimo debe ser:
 * - 4.5:1 para texto normal (AA)
 * - 3:1 para texto grande (AA)
 * - 7:1 para texto normal (AAA)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calcula la luminancia relativa de un color
 */
function getRelativeLuminance(color: string): number {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convierte color hex a RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Verifica si una combinación de colores cumple WCAG
 */
export function isWCAGCompliant(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AA') {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  } else {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
}

/**
 * Genera un ID único accesible para elementos de formulario
 */
export function generateAccessibleId(prefix: string = 'field'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Crea atributos ARIA para un elemento interactivo
 */
export function createAriaAttributes({
  label,
  description,
  required = false,
  invalid = false,
  disabled = false,
}: {
  label: string;
  description?: string;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const id = generateAccessibleId();
  
  return {
    id,
    'aria-label': label,
    'aria-describedby': description ? `${id}-description` : undefined,
    'aria-required': required,
    'aria-invalid': invalid,
    'aria-disabled': disabled,
  };
}

/**
 * Verifica si el usuario prefiere reducción de movimiento
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Verifica si el usuario prefiere modo oscuro
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Verifica si el usuario prefiere alto contraste
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

/**
 * Maneja la navegación por teclado en listas
 */
export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  items: any[],
  currentIndex: number,
  onSelect: (index: number) => void
) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      onSelect(Math.min(currentIndex + 1, items.length - 1));
      break;
    case 'ArrowUp':
      event.preventDefault();
      onSelect(Math.max(currentIndex - 1, 0));
      break;
    case 'Home':
      event.preventDefault();
      onSelect(0);
      break;
    case 'End':
      event.preventDefault();
      onSelect(items.length - 1);
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      // Ejecutar acción del item actual
      break;
  }
}

/**
 * Anuncia un mensaje al lector de pantalla
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  if (typeof document === 'undefined') return;
  
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Formatea un número como moneda accesible
 */
export function formatAccessibleCurrency(
  amount: number,
  currency: string = 'EUR'
): {
  display: string;
  ariaLabel: string;
} {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  });
  
  const display = formatter.format(amount);
  const ariaLabel = `${amount.toFixed(2)} ${currency === 'EUR' ? 'euros' : currency}`;
  
  return { display, ariaLabel };
}

/**
 * Formatea una fecha de manera accesible
 */
export function formatAccessibleDate(date: Date): {
  display: string;
  ariaLabel: string;
} {
  const display = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  
  const ariaLabel = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  
  return { display, ariaLabel };
}

/**
 * Clases de CSS para ocultar elementos visualmente pero mantenerlos accesibles
 */
export const srOnlyClass = 'sr-only';

/**
 * Verifica si un elemento está en el viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Mueve el foco a un elemento específico
 */
export function moveFocusTo(selector: string) {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    element.focus();
  }
}

/**
 * Crea un trap de foco para modales
 */
export function createFocusTrap(container: HTMLElement) {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  container.addEventListener('keydown', handleTab);
  
  return () => {
    container.removeEventListener('keydown', handleTab);
  };
}
