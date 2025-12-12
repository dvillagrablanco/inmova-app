'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export default function TerminosPage() {
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
        <h1 className="text-4xl font-bold mb-8">Términos y Condiciones</h1>
        <div className="prose max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Aceptación de Términos</h2>
            <p>
              Al usar INMOVA, acepta estos términos. Si no está de acuerdo, no use la plataforma.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Descripción del Servicio</h2>
            <p>
              INMOVA es una plataforma SaaS de gestión inmobiliaria multi-vertical con 56 módulos
              profesionales.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Cuenta de Usuario</h2>
            <p>
              Es responsable de mantener la confidencialidad de su cuenta y contraseña. Debe
              notificar inmediatamente cualquier uso no autorizado.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de INMOVA es propiedad de Enxames Investments SL y está protegido
              por leyes de propiedad intelectual.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Limitación de Responsabilidad</h2>
            <p>
              INMOVA se proporciona "tal cual". No garantizamos que el servicio será ininterrumpido
              o libre de errores.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los
              cambios entrarán en vigor al publicarse.
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
