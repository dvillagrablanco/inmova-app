import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Shield, Cookie, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LegalLayoutProps {
  children: ReactNode;
  title: string;
  lastUpdated: string;
}

export function LegalLayout({ children, title, lastUpdated }: LegalLayoutProps) {
  const legalPages = [
    { href: '/legal/terms', label: 'Términos y Condiciones', icon: FileText },
    { href: '/legal/privacy', label: 'Política de Privacidad', icon: Shield },
    { href: '/legal/cookies', label: 'Política de Cookies', icon: Cookie },
    { href: '/legal/legal-notice', label: 'Aviso Legal', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-2">
            Última actualización: {lastUpdated}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-3">Legal</h3>
              <nav className="space-y-1">
                {legalPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <Link
                      key={page.href}
                      href={page.href}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-gray-500" />
                      {page.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-gray-500 mb-2">
                  ¿Dudas legales?
                </p>
                <Link href="/soporte">
                  <Button variant="outline" size="sm" className="w-full">
                    Contactar Soporte
                  </Button>
                </Link>
              </div>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-500 text-center" suppressHydrationWarning>
            © 2026 Inmova App. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function LastUpdated({ date }: { date: string }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <p className="text-sm text-blue-800">
        <strong>Última actualización:</strong> {date}
      </p>
    </div>
  );
}
