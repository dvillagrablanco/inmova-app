/**
 * Mobile Menu Controller - Maneja el menú móvil sin depender de React state
 * Funciona en modo incógnito sin localStorage
 */

let isMenuOpen = false;

export function toggleMobileMenu() {
  console.log('toggleMobileMenu called, current state:', isMenuOpen);
  isMenuOpen = !isMenuOpen;

  const sidebar = document.querySelector('[data-mobile-sidebar]') as HTMLElement;
  const overlay = document.querySelector('[data-mobile-overlay]') as HTMLElement;
  const body = document.body;

  console.log('Elements found:', { sidebar: !!sidebar, overlay: !!overlay });

  if (!sidebar || !overlay) {
    console.error('Sidebar or overlay not found!');
    return;
  }

  if (isMenuOpen) {
    // Abrir menú
    console.log('Opening menu...');
    sidebar.style.transform = 'translateX(0)';
    sidebar.style.visibility = 'visible';
    overlay.style.display = 'block';
    body.classList.add('sidebar-open');
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.width = '100%';
    body.style.height = '100vh';
    console.log('Menu opened');
  } else {
    // Cerrar menú
    console.log('Closing menu...');
    sidebar.style.transform = 'translateX(-100%)';
    overlay.style.display = 'none';
    body.classList.remove('sidebar-open');
    body.style.overflow = '';
    body.style.position = '';
    body.style.width = '';
    body.style.height = '';
    console.log('Menu closed');
  }
}

export function closeMobileMenu() {
  if (isMenuOpen) {
    toggleMobileMenu();
  }
}

export function isMobileMenuOpen() {
  return isMenuOpen;
}

// Cerrar con tecla Escape
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) {
      closeMobileMenu();
    }
  });
}
