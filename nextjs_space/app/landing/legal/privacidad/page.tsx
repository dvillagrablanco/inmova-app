'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export default function PrivacidadPage() {
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
        <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>
        <div className="prose max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Responsable del Tratamiento</h2>
            <p>
              Enxames Investments SL, responsable de INMOVA, se compromete a proteger la privacidad
              de sus usuarios conforme al RGPD y LOPDGDD.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Datos Recopilados</h2>
            <p>
              Recopilamos: datos de identificación (nombre, email, teléfono), datos de empresa (CIF,
              dirección), datos de uso de la plataforma, y datos técnicos (IP, navegador).
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Finalidad del Tratamiento</h2>
            <p>
              Usamos sus datos para proveer servicios, mejorar la plataforma, comunicarnos con usted
              y cumplir obligaciones legales.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Derechos del Usuario</h2>
            <p>
              Tiene derecho a acceder, rectificar, suprimir, limitar el tratamiento, oponerse y
              portar sus datos. Contacte: privacidad@inmova.com
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos
              contra acceso no autorizado.
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
