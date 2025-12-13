'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/landing" className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <span className="font-bold">INMOVA</span>
          </Link>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Política de Cookies</h1>
        <div className="prose max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold mb-4">¿Qué son las Cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando
              visita nuestro sitio web.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Tipos de Cookies que Usamos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Cookies Esenciales:</strong> Necesarias para el funcionamiento básico del
                sitio (sesión, autenticación).
              </li>
              <li>
                <strong>Cookies de Rendimiento:</strong> Analizan cómo los usuarios utilizan el
                sitio para mejorar la experiencia.
              </li>
              <li>
                <strong>Cookies Funcionales:</strong> Recuerdan sus preferencias (idioma,
                configuración).
              </li>
              <li>
                <strong>Cookies de Marketing:</strong> Se utilizan para personalizar anuncios (si
                corresponde).
              </li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Cookies de Terceros</h2>
            <p>
              Podemos usar cookies de servicios de terceros como Google Analytics para analizar el
              uso del sitio.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Control de Cookies</h2>
            <p>
              Puede controlar y/o eliminar las cookies según desee. Puede configurar su navegador
              para rechazar cookies, aunque esto puede afectar la funcionalidad del sitio.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Consentimiento</h2>
            <p>
              Al continuar usando nuestro sitio web, acepta el uso de cookies según esta política.
              Puede retirar su consentimiento en cualquier momento.
            </p>
          </section>
          <p className="text-sm text-gray-500 mt-8">Última actualización: Enero 2026</p>
        </div>
        <div className="mt-8">
          <Link href="/landing">
            <Button>Volver</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
