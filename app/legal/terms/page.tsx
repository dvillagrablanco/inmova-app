import { Metadata } from 'next';
import { LegalLayout, LastUpdated } from '@/components/legal/legal-layout';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Inmova',
  description: 'Términos y condiciones de uso de Inmova App',
  robots: 'noindex, nofollow',
};

export default function TermsPage() {
  return (
    <LegalLayout title="Términos y Condiciones" lastUpdated="4 de enero de 2026">
      <LastUpdated date="4 de enero de 2026" />

      <section id="introduccion">
        <h2>1. Introducción y Aceptación</h2>
        <p>
          Bienvenido a <strong>Inmova App</strong> ("nosotros", "nuestro" o "la Plataforma"),
          una plataforma PropTech de gestión inmobiliaria integral.
        </p>
        <p>
          Al acceder o utilizar nuestra Plataforma, usted ("Usuario", "usted" o "su") acepta
          estar sujeto a estos Términos y Condiciones ("Términos"). Si no está de acuerdo con
          estos Términos, por favor no utilice la Plataforma.
        </p>
        <p>
          <strong>Importante:</strong> Estos Términos constituyen un contrato legalmente vinculante
          entre usted e Inmova App.
        </p>
      </section>

      <section id="definiciones">
        <h2>2. Definiciones</h2>
        <ul>
          <li><strong>Plataforma:</strong> Inmova App y todos sus servicios asociados.</li>
          <li><strong>Usuario:</strong> Cualquier persona que acceda o utilice la Plataforma.</li>
          <li><strong>Contenido:</strong> Toda información, datos, textos, imágenes o materiales en la Plataforma.</li>
          <li><strong>Servicios:</strong> Todas las funcionalidades ofrecidas por la Plataforma.</li>
          <li><strong>Cuenta:</strong> Cuenta de usuario creada para acceder a los Servicios.</li>
          <li><strong>Datos Personales:</strong> Información identificable según GDPR.</li>
        </ul>
      </section>

      <section id="servicios">
        <h2>3. Descripción de los Servicios</h2>
        <p>
          Inmova App proporciona una plataforma de gestión inmobiliaria que incluye, sin limitación:
        </p>
        <ul>
          <li>Gestión de propiedades inmobiliarias</li>
          <li>Gestión de inquilinos y contratos de arrendamiento</li>
          <li>Procesamiento de pagos y facturación</li>
          <li>Firma digital de contratos</li>
          <li>Almacenamiento de documentos</li>
          <li>Gestión de incidencias y mantenimiento</li>
          <li>CRM inmobiliario</li>
          <li>Análisis y reportes</li>
        </ul>
        <p>
          Nos reservamos el derecho de modificar, suspender o discontinuar cualquier Servicio
          en cualquier momento con previo aviso.
        </p>
      </section>

      <section id="registro">
        <h2>4. Registro y Cuenta de Usuario</h2>
        
        <h3>4.1. Requisitos</h3>
        <p>
          Para utilizar la Plataforma, debe:
        </p>
        <ul>
          <li>Ser mayor de 18 años o tener capacidad legal para contratar</li>
          <li>Proporcionar información veraz, precisa y actualizada</li>
          <li>Mantener la seguridad de su contraseña</li>
          <li>Notificarnos inmediatamente sobre uso no autorizado de su cuenta</li>
        </ul>

        <h3>4.2. Responsabilidad de la Cuenta</h3>
        <p>
          Usted es responsable de todas las actividades realizadas bajo su cuenta. No comparta
          sus credenciales de acceso con terceros.
        </p>

        <h3>4.3. Suspensión de Cuenta</h3>
        <p>
          Nos reservamos el derecho de suspender o cancelar su cuenta si:
        </p>
        <ul>
          <li>Incumple estos Términos</li>
          <li>Proporciona información falsa</li>
          <li>Realiza actividades fraudulentas o ilegales</li>
          <li>No paga las tarifas aplicables</li>
        </ul>
      </section>

      <section id="uso-permitido">
        <h2>5. Uso Permitido de la Plataforma</h2>
        
        <h3>5.1. Usos Permitidos</h3>
        <p>
          Puede utilizar la Plataforma únicamente para:
        </p>
        <ul>
          <li>Gestión legítima de propiedades inmobiliarias</li>
          <li>Fines comerciales lícitos relacionados con bienes raíces</li>
          <li>Cumplimiento de sus obligaciones contractuales</li>
        </ul>

        <h3>5.2. Usos Prohibidos</h3>
        <p>
          Está estrictamente prohibido:
        </p>
        <ul>
          <li>Realizar ingeniería inversa, descompilar o desensamblar la Plataforma</li>
          <li>Copiar, modificar o distribuir el contenido sin autorización</li>
          <li>Transmitir virus, malware o código malicioso</li>
          <li>Realizar scraping, crawling o extracción automatizada de datos</li>
          <li>Intentar acceder a áreas restringidas o vulnerabilidades</li>
          <li>Interferir con el funcionamiento normal de la Plataforma</li>
          <li>Utilizar la Plataforma para actividades ilegales o fraudulentas</li>
          <li>Hacerse pasar por otra persona o entidad</li>
          <li>Spam, phishing o prácticas comerciales engañosas</li>
        </ul>
      </section>

      <section id="propiedad-intelectual">
        <h2>6. Propiedad Intelectual</h2>
        
        <h3>6.1. Derechos de Inmova</h3>
        <p>
          Todos los derechos de propiedad intelectual sobre la Plataforma, incluyendo pero no
          limitado a código fuente, diseño, logos, marcas, contenido y funcionalidades, son
          propiedad exclusiva de Inmova App o sus licenciantes.
        </p>

        <h3>6.2. Licencia de Uso</h3>
        <p>
          Se le otorga una licencia limitada, no exclusiva, no transferible y revocable para
          utilizar la Plataforma de acuerdo con estos Términos.
        </p>

        <h3>6.3. Contenido del Usuario</h3>
        <p>
          Usted conserva todos los derechos sobre el contenido que sube a la Plataforma. Al subir
          contenido, nos otorga una licencia mundial, libre de regalías, no exclusiva para
          almacenar, procesar y mostrar dicho contenido únicamente con el propósito de prestar
          los Servicios.
        </p>
      </section>

      <section id="pagos">
        <h2>7. Pagos y Facturación</h2>
        
        <h3>7.1. Planes y Precios</h3>
        <p>
          Los precios de nuestros planes están disponibles en nuestra página de precios.
          Nos reservamos el derecho de modificar los precios con previo aviso de 30 días.
        </p>

        <h3>7.2. Facturación</h3>
        <p>
          La facturación se realiza de forma mensual o anual según el plan contratado.
          Los pagos son procesados de forma segura a través de Stripe.
        </p>

        <h3>7.3. Reembolsos</h3>
        <p>
          Los planes mensuales son reembolsables dentro de los primeros 14 días. Los planes
          anuales tienen una garantía de reembolso de 30 días.
        </p>

        <h3>7.4. Impagos</h3>
        <p>
          El impago de facturas puede resultar en la suspensión o cancelación de su cuenta.
        </p>
      </section>

      <section id="privacidad">
        <h2>8. Protección de Datos y Privacidad</h2>
        <p>
          El tratamiento de sus datos personales se rige por nuestra{' '}
          <a href="/legal/privacy" className="text-blue-600 hover:underline">
            Política de Privacidad
          </a>
          , que forma parte integral de estos Términos.
        </p>
        <p>
          Cumplimos con el Reglamento General de Protección de Datos (GDPR) y la Ley Orgánica
          de Protección de Datos (LOPD).
        </p>
      </section>

      <section id="limitacion-responsabilidad">
        <h2>9. Limitación de Responsabilidad</h2>
        
        <h3>9.1. Disponibilidad</h3>
        <p>
          Nos esforzamos por mantener la Plataforma disponible 24/7, pero no garantizamos
          disponibilidad ininterrumpida. La Plataforma se proporciona "tal cual" y "según
          disponibilidad".
        </p>

        <h3>9.2. Exclusión de Garantías</h3>
        <p>
          NO GARANTIZAMOS QUE:
        </p>
        <ul>
          <li>La Plataforma esté libre de errores o interrupciones</li>
          <li>Los defectos serán corregidos inmediatamente</li>
          <li>La Plataforma esté libre de virus o componentes dañinos</li>
          <li>Los resultados obtenidos sean precisos o fiables</li>
        </ul>

        <h3>9.3. Limitación de Daños</h3>
        <p>
          EN LA MEDIDA MÁXIMA PERMITIDA POR LA LEY, INMOVA APP NO SERÁ RESPONSABLE DE DAÑOS
          INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS, INCLUYENDO PERO NO
          LIMITADO A PÉRDIDA DE BENEFICIOS, DATOS, USO O GOODWILL.
        </p>
        <p>
          Nuestra responsabilidad total no excederá la cantidad pagada por usted en los 12 meses
          anteriores al evento que dio lugar a la reclamación.
        </p>
      </section>

      <section id="indemnizacion">
        <h2>10. Indemnización</h2>
        <p>
          Usted acepta indemnizar, defender y mantener indemne a Inmova App, sus directores,
          empleados y agentes de cualquier reclamación, daño, pérdida, responsabilidad y gasto
          (incluyendo honorarios legales razonables) que surjan de:
        </p>
        <ul>
          <li>Su uso o mal uso de la Plataforma</li>
          <li>Violación de estos Términos</li>
          <li>Violación de derechos de terceros</li>
          <li>Contenido que usted suba o transmita</li>
        </ul>
      </section>

      <section id="cancelacion">
        <h2>11. Cancelación y Terminación</h2>
        
        <h3>11.1. Por parte del Usuario</h3>
        <p>
          Puede cancelar su cuenta en cualquier momento desde la configuración de su perfil.
          La cancelación será efectiva al final del periodo de facturación actual.
        </p>

        <h3>11.2. Por parte de Inmova</h3>
        <p>
          Podemos suspender o terminar su acceso inmediatamente y sin previo aviso si:
        </p>
        <ul>
          <li>Incumple materialmente estos Términos</li>
          <li>Realiza actividades fraudulentas o ilegales</li>
          <li>Su uso representa un riesgo de seguridad</li>
          <li>Por requerimiento legal o regulatorio</li>
        </ul>

        <h3>11.3. Efectos de la Terminación</h3>
        <p>
          Tras la terminación:
        </p>
        <ul>
          <li>Su derecho de acceso cesará inmediatamente</li>
          <li>Se eliminarán sus datos según nuestra Política de Privacidad</li>
          <li>Puede solicitar una copia de sus datos antes de la eliminación</li>
        </ul>
      </section>

      <section id="modificaciones">
        <h2>12. Modificaciones de los Términos</h2>
        <p>
          Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las
          modificaciones se notificarán con al menos 30 días de antelación a través de:
        </p>
        <ul>
          <li>Email a su dirección registrada</li>
          <li>Notificación dentro de la Plataforma</li>
          <li>Publicación en nuestra página web</li>
        </ul>
        <p>
          El uso continuado de la Plataforma después de la fecha efectiva constituye su
          aceptación de los Términos modificados.
        </p>
      </section>

      <section id="ley-aplicable">
        <h2>13. Ley Aplicable y Jurisdicción</h2>
        <p>
          Estos Términos se regirán e interpretarán de acuerdo con las leyes de España.
        </p>
        <p>
          Las partes se someten a la jurisdicción exclusiva de los tribunales de Madrid, España,
          renunciando expresamente a cualquier otro fuero que pudiera corresponderles.
        </p>
        <p>
          Para consumidores de la UE: Estos Términos no afectan los derechos que le otorga la
          legislación de protección al consumidor de su país de residencia.
        </p>
      </section>

      <section id="varios">
        <h2>14. Disposiciones Generales</h2>
        
        <h3>14.1. Acuerdo Completo</h3>
        <p>
          Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo completo
          entre usted e Inmova App.
        </p>

        <h3>14.2. Divisibilidad</h3>
        <p>
          Si alguna disposición de estos Términos se considera inválida o inaplicable, las
          disposiciones restantes continuarán en pleno vigor.
        </p>

        <h3>14.3. Renuncia</h3>
        <p>
          La falta de ejercicio de cualquier derecho no constituirá una renuncia a dicho derecho.
        </p>

        <h3>14.4. Cesión</h3>
        <p>
          No puede ceder estos Términos sin nuestro consentimiento previo por escrito. Podemos
          ceder nuestros derechos en caso de fusión, adquisición o venta de activos.
        </p>

        <h3>14.5. Idioma</h3>
        <p>
          Estos Términos se redactan en español. Cualquier traducción es solo para conveniencia.
          En caso de conflicto, prevalecerá la versión en español.
        </p>
      </section>

      <section id="contacto">
        <h2>15. Contacto</h2>
        <p>
          Para cualquier pregunta sobre estos Términos, puede contactarnos:
        </p>
        <ul>
          <li><strong>Email:</strong> legal@inmova.app</li>
          <li><strong>Dirección:</strong> [Dirección de la empresa]</li>
          <li><strong>Teléfono:</strong> [Teléfono de contacto]</li>
        </ul>
      </section>

      <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-8">
        <p className="text-sm text-gray-700">
          <strong>Nota Legal:</strong> Este documento constituye un template profesional basado
          en mejores prácticas GDPR. Se recomienda encarecidamente revisión por asesor legal
          especializado antes de uso en producción.
        </p>
      </div>
    </LegalLayout>
  );
}
