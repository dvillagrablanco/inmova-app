'use client';

/**
 * SkipLink Component - WCAG 2.1 AA Required
 * 
 * Permite a usuarios de teclado saltar navegación y ir directamente al contenido principal.
 * Es invisible hasta que recibe foco con Tab.
 */
export function SkipLink() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const main = document.querySelector('main') || document.querySelector('#main-content');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus();
      main.removeAttribute('tabindex');
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[100]
        focus:px-4 focus:py-2
        focus:bg-primary focus:text-primary-foreground
        focus:rounded-md focus:shadow-lg
        focus:ring-4 focus:ring-primary/50
        focus:outline-none
        transition-all
      "
    >
      Saltar al contenido principal
    </a>
  );
}
