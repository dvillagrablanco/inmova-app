import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos del Programa de Partners | Inmova',
  description: 'Términos y condiciones del Programa de Partners de Inmova',
};

export default function PartnerTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/partners">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Programa
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-4">
            Términos y Condiciones del Programa de Partners
          </h1>
          <p className="text-muted-foreground">Última actualización: 31 de Diciembre de 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Definiciones</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Partner:</strong> Persona física o jurídica que se adhiere al Programa de
              Partners de Inmova para promocionar y comercializar la plataforma.
            </p>
            <p className="text-gray-700 leading-relaxed mt-2">
              <strong>Cliente Referido:</strong> Empresa o persona que contrata Inmova a través de
              un código de referido único del Partner.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Comisiones</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">2.1 Estructura de Comisiones</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>
                    <strong>SaaS Subscriptions:</strong> 25% de la subscripción mensual del cliente
                    durante los primeros 12 meses
                  </li>
                  <li>
                    <strong>Premium Services:</strong> 20% del valor de servicios premium
                    contratados
                  </li>
                  <li>
                    <strong>Marketplace Commissions:</strong> 50% de las comisiones generadas por el
                    cliente en el marketplace de oficios
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">2.2 Bonos por Volumen</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>10+ clientes: +2% en todas las comisiones</li>
                  <li>25+ clientes: +3% adicional</li>
                  <li>50+ clientes: +5% adicional</li>
                  <li>100+ clientes: +7% adicional (total: +17%)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">2.3 Early Adopter Bonus</h3>
                <p className="text-gray-700">
                  Los primeros 100 partners registrados obtienen +5% de comisión adicional{' '}
                  <strong>de por vida</strong> en todos sus clientes referidos.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Obligaciones del Partner</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Promocionar Inmova de forma ética y profesional</li>
              <li>No realizar publicidad engañosa o falsa</li>
              <li>Cumplir con las normativas de protección de datos (GDPR)</li>
              <li>Informar a Inmova de cualquier incidencia o reclamación del cliente</li>
              <li>No competir directamente con Inmova durante la vigencia del acuerdo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Pagos</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Periodicidad:</strong> Las comisiones se liquidan mensualmente, antes del
                día 15 del mes siguiente.
              </p>
              <p>
                <strong>Método de Pago:</strong> Transferencia bancaria a la cuenta indicada por el
                Partner.
              </p>
              <p>
                <strong>Mínimo de Pago:</strong> €50. Si no se alcanza el mínimo, se acumula para el
                siguiente mes.
              </p>
              <p>
                <strong>Retenciones fiscales:</strong> El Partner es responsable de declarar sus
                ingresos según la legislación aplicable.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Duración y Terminación</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>Duración:</strong> El acuerdo es indefinido y puede ser cancelado por
                cualquiera de las partes con 30 días de preaviso.
              </p>
              <p>
                <strong>Comisiones tras cancelación:</strong> El Partner seguirá recibiendo
                comisiones de clientes referidos durante 12 meses adicionales, con reducción gradual
                (100% mes 1-6, 50% mes 7-12, 0% mes 13+).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Confidencialidad</h2>
            <p className="text-gray-700">
              El Partner se compromete a mantener la confidencialidad de toda información comercial,
              técnica o estratégica de Inmova a la que tenga acceso durante la vigencia del acuerdo
              y durante 2 años posteriores a su finalización.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Propiedad Intelectual</h2>
            <p className="text-gray-700">
              El Partner reconoce que Inmova es titular exclusivo de todos los derechos de propiedad
              intelectual sobre la plataforma, marca y contenidos. El Partner tiene derecho a usar
              los materiales de marketing proporcionados por Inmova exclusivamente para la promoción
              del programa.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Limitación de Responsabilidad</h2>
            <p className="text-gray-700">
              Inmova no será responsable de pérdidas indirectas, lucro cesante o daños especiales
              derivados del uso de la plataforma por parte de los clientes referidos. La
              responsabilidad máxima de Inmova se limita al importe de las comisiones pagadas en los
              últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Modificaciones</h2>
            <p className="text-gray-700">
              Inmova se reserva el derecho de modificar estos términos con 30 días de preaviso. Los
              cambios se notificarán por email a todos los partners activos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Jurisdicción y Ley Aplicable</h2>
            <p className="text-gray-700">
              Este acuerdo se rige por la legislación española. Para cualquier controversia, las
              partes se someten a los juzgados y tribunales de Madrid.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Contacto</h2>
            <p className="text-gray-700">
              Para cualquier consulta sobre el Programa de Partners:
              <br />
              <strong>Email:</strong> partners@inmova.app
              <br />
              <strong>Teléfono:</strong> +34 910 000 000
            </p>
          </section>
        </div>

        {/* CTA Bottom */}
        <div className="mt-12 text-center">
          <Link href="/partners">
            <Button size="lg" className="px-8">
              Volver al Programa de Partners
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
