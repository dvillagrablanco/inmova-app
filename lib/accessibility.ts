/**
 * Accessibility (a11y) Utilities
 * 
 * WCAG 2.1 AA compliance helpers
 */

/**
 * Generate accessible label for monetary values
 */
export function formatCurrencyAccessible(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(amount);
}

/**
 * Generate screen-reader friendly date
 */
export function formatDateAccessible(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', { dateStyle: 'long' });
}

/**
 * Check color contrast ratio (WCAG AA requires 4.5:1 for normal text, 3:1 for large)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): number[] {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

/**
 * Focus trap for modals (keyboard navigation)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusable = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handler = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault(); }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  };

  element.addEventListener('keydown', handler);
  first?.focus();

  return () => element.removeEventListener('keydown', handler);
}

/**
 * Skip link target IDs used across the app
 */
export const SKIP_TARGETS = {
  mainContent: 'main-content',
  navigation: 'main-navigation',
  search: 'global-search',
} as const;

/**
 * Announce to screen readers (live region)
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('a11y-announcer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'a11y-announcer';
    el.setAttribute('aria-live', priority);
    el.setAttribute('aria-atomic', 'true');
    el.className = 'sr-only';
    document.body.appendChild(el);
  }
  el.textContent = '';
  setTimeout(() => { el!.textContent = message; }, 100);
}
