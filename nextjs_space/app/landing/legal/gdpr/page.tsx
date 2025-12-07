'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export default function GDPRPage() {
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
        <h1 className="text-4xl font-bold mb-8">Cumplimiento GDPR</h1>
        <div className="prose max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold mb-4">Compromiso con el RGPD</h2>
            <p>
              INMOVA cumple estrictamente con el Reglamento General de Protección de Datos
              (RGPD/GDPR) de la Unión Europea.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Base Legal del Tratamiento</h2>
            <p>
              Tratamos sus datos basándonos en: ejecución de contrato, cumplimiento de obligaciones
              legales, interés legítimo, y consentimiento explícito cuando corresponda.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Transferencias Internacionales</h2>
            <p>
              Los datos se almacenan en servidores ubicados en la UE. Cualquier transferencia fuera
              de la UE se realiza con garantías adecuadas.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Derechos del Interesado</h2>
            <p>
              Conforme al RGPD, usted tiene derecho a: acceso, rectificación, supresión ("derecho al
              olvido"), limitación del tratamiento, oposición, portabilidad, y a no ser objeto de
              decisiones automatizadas.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Delegado de Protección de Datos (DPO)</h2>
            <p>Para ejercer sus derechos o consultas sobre GDPR: dpo@inmova.com</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-4">Notificación de Brechas</h2>
            <p>
              En caso de brecha de seguridad que afecte sus datos, le notificaremos dentro de las 72
              horas según requiere el RGPD.
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
