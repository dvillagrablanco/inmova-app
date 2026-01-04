import Link from 'next/link';

export function LegalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            © {currentYear} Inmova App. Todos los derechos reservados.
          </div>

          <nav className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <Link
              href="/legal/terms"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Términos y Condiciones
            </Link>
            <Link
              href="/legal/privacy"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacidad
            </Link>
            <Link
              href="/legal/cookies"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/legal/legal-notice"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Aviso Legal
            </Link>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-cookie-banner'));
              }}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Configurar Cookies
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
