import { Metadata } from 'next';
import { LegalLayout, LastUpdated } from '@/components/legal/legal-layout';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Inmova',
  description: 'Política de privacidad y protección de datos de Inmova App conforme al GDPR',
  robots: 'noindex, nofollow',
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de Privacidad" lastUpdated="4 de enero de 2026">
      <LastUpdated date="4 de enero de 2026" />

      <section id="intro">
        <h2>1. Introducción</h2>
        <p>
          En <strong>Inmova App</strong> (en adelante, "nosotros", "nuestro" o "la Plataforma"),
          nos tomamos muy en serio la protección de sus datos personales.
        </p>
        <p>
          Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y
          protegemos su información personal de acuerdo con:
        </p>
        <ul>
          <li><strong>GDPR:</strong> Reglamento (UE) 2016/679 del Parlamento Europeo</li>
          <li><strong>LOPD:</strong> Ley Orgánica 3/2018 de Protección de Datos Personales</li>
          <li><strong>LSSI:</strong> Ley 34/2002 de Servicios de la Sociedad de la Información</li>
        </ul>
      </section>

      <section id="responsable">
        <h2>2. Responsable del Tratamiento</h2>
        <p>
          <strong>Identidad:</strong> Inmova App S.L.<br />
          <strong>NIF:</strong> [NIF de la empresa]<br />
          <strong>Dirección:</strong> [Dirección postal completa]<br />
          <strong>Email:</strong> privacy@inmova.app<br />
          <strong>Teléfono:</strong> [Teléfono de contacto]<br />
          <strong>Registro Mercantil:</strong> [Datos de registro]<br />
          <strong>DPO (Delegado de Protección de Datos):</strong> dpo@inmova.app
        </p>
      </section>

      <section id="datos-recopilados">
        <h2>3. Datos Personales que Recopilamos</h2>
        
        <h3>3.1. Datos de Identificación</h3>
        <ul>
          <li>Nombre y apellidos</li>
          <li>Email</li>
          <li>Teléfono</li>
          <li>DNI/NIE (cuando sea legalmente requerido)</li>
          <li>Dirección postal</li>
          <li>Fecha de nacimiento</li>
        </ul>

        <h3>3.2. Datos de la Cuenta</h3>
        <ul>
          <li>Credenciales de acceso (email, contraseña hasheada)</li>
          <li>Preferencias de usuario</li>
          <li>Configuración de la cuenta</li>
          <li>Idioma y zona horaria</li>
        </ul>

        <h3>3.3. Datos de Propiedades Inmobiliarias</h3>
        <ul>
          <li>Direcciones de propiedades</li>
          <li>Características de inmuebles</li>
          <li>Fotografías y documentos</li>
          <li>Información de contratos de arrendamiento</li>
          <li>Datos de inquilinos (con su consentimiento)</li>
        </ul>

        <h3>3.4. Datos Financieros</h3>
        <ul>
          <li>Información de pago (procesada por Stripe, no almacenamos datos de tarjetas)</li>
          <li>Historial de transacciones</li>
          <li>Facturas</li>
          <li>Cuentas bancarias para transferencias</li>
        </ul>

        <h3>3.5. Datos de Uso</h3>
        <ul>
          <li>Dirección IP</li>
          <li>Tipo de navegador y dispositivo</li>
          <li>Páginas visitadas y tiempo de navegación</li>
          <li>Fecha y hora de acceso</li>
          <li>Eventos y acciones en la Plataforma</li>
          <li>Logs de sistema</li>
        </ul>

        <h3>3.6. Cookies y Tecnologías Similares</h3>
        <p>
          Utilizamos cookies y tecnologías similares. Consulte nuestra{' '}
          <a href="/legal/cookies" className="text-blue-600 hover:underline">
            Política de Cookies
          </a>{' '}
          para más información.
        </p>
      </section>

      <section id="finalidades">
        <h2>4. Finalidad del Tratamiento</h2>
        
        <h3>4.1. Prestación de Servicios</h3>
        <ul>
          <li><strong>Base legal:</strong> Ejecución del contrato</li>
          <li><strong>Finalidad:</strong> Proporcionar y mantener los servicios de la Plataforma</li>
          <li><strong>Plazo:</strong> Duración del contrato + periodo legal de conservación</li>
        </ul>

        <h3>4.2. Gestión de Pagos</h3>
        <ul>
          <li><strong>Base legal:</strong> Ejecución del contrato y obligación legal (facturación)</li>
          <li><strong>Finalidad:</strong> Procesar pagos, emitir facturas, gestión contable</li>
          <li><strong>Plazo:</strong> 6 años (obligación fiscal)</li>
        </ul>

        <h3>4.3. Comunicaciones</h3>
        <ul>
          <li><strong>Base legal:</strong> Ejecución del contrato y consentimiento</li>
          <li><strong>Finalidad:</strong> Emails transaccionales, notificaciones de servicio, soporte</li>
          <li><strong>Plazo:</strong> Duración de la relación + 1 año</li>
        </ul>

        <h3>4.4. Marketing (Opcional)</h3>
        <ul>
          <li><strong>Base legal:</strong> Consentimiento expreso</li>
          <li><strong>Finalidad:</strong> Newsletters, ofertas, novedades</li>
          <li><strong>Plazo:</strong> Hasta revocación del consentimiento</li>
          <li><strong>Opt-out:</strong> Puede darse de baja en cualquier momento</li>
        </ul>

        <h3>4.5. Mejora del Servicio</h3>
        <ul>
          <li><strong>Base legal:</strong> Interés legítimo</li>
          <li><strong>Finalidad:</strong> Análisis de uso, mejoras de UX, desarrollo de features</li>
          <li><strong>Plazo:</strong> Datos anonimizados de forma permanente</li>
        </ul>

        <h3>4.6. Cumplimiento Legal</h3>
        <ul>
          <li><strong>Base legal:</strong> Obligación legal</li>
          <li><strong>Finalidad:</strong> Cumplimiento de normativa fiscal, mercantil, prevención de blanqueo</li>
          <li><strong>Plazo:</strong> Según normativa aplicable (generalmente 6 años)</li>
        </ul>

        <h3>4.7. Seguridad</h3>
        <ul>
          <li><strong>Base legal:</strong> Interés legítimo</li>
          <li><strong>Finalidad:</strong> Prevención de fraude, detección de actividades sospechosas</li>
          <li><strong>Plazo:</strong> Logs de seguridad por 1 año</li>
        </ul>
      </section>

      <section id="destinatarios">
        <h2>5. Destinatarios de los Datos</h2>
        <p>
          Sus datos pueden ser compartidos con:
        </p>

        <h3>5.1. Proveedores de Servicios (Encargados del Tratamiento)</h3>
        <table className="min-w-full divide-y divide-gray-300 my-4">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold">Proveedor</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Finalidad</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Ubicación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-3 py-2 text-sm">AWS (S3)</td>
              <td className="px-3 py-2 text-sm">Almacenamiento de archivos</td>
              <td className="px-3 py-2 text-sm">UE (Frankfurt)</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-sm">Stripe</td>
              <td className="px-3 py-2 text-sm">Procesamiento de pagos</td>
              <td className="px-3 py-2 text-sm">UE/USA (Privacy Shield)</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-sm">Signaturit</td>
              <td className="px-3 py-2 text-sm">Firma electrónica</td>
              <td className="px-3 py-2 text-sm">España</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-sm">DocuSign</td>
              <td className="px-3 py-2 text-sm">Firma electrónica</td>
              <td className="px-3 py-2 text-sm">USA (Cláusulas contractuales tipo)</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-sm">Gmail (Google)</td>
              <td className="px-3 py-2 text-sm">Envío de emails</td>
              <td className="px-3 py-2 text-sm">UE/USA</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-sm">Cloudflare</td>
              <td className="px-3 py-2 text-sm">CDN y seguridad</td>
              <td className="px-3 py-2 text-sm">UE/USA</td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-gray-600">
          Todos los proveedores fuera de la UE están sujetos a cláusulas contractuales tipo
          de la UE o mecanismos de transferencia aprobados por el GDPR.
        </p>

        <h3>5.2. Autoridades y Organismos Públicos</h3>
        <p>
          Cuando sea legalmente requerido (órdenes judiciales, Agencia Tributaria, etc.).
        </p>

        <h3>5.3. No Vendemos ni Cedemos sus Datos</h3>
        <p>
          <strong>Importante:</strong> Nunca vendemos ni cedemos sus datos personales a
          terceros con fines comerciales sin su consentimiento explícito.
        </p>
      </section>

      <section id="derechos">
        <h2>6. Sus Derechos (GDPR)</h2>
        <p>
          Como titular de datos personales, tiene los siguientes derechos:
        </p>

        <h3>6.1. Derecho de Acceso</h3>
        <p>
          Puede solicitar una copia de todos los datos personales que tenemos sobre usted.
        </p>

        <h3>6.2. Derecho de Rectificación</h3>
        <p>
          Puede corregir datos inexactos o incompletos directamente desde su cuenta o
          contactándonos.
        </p>

        <h3>6.3. Derecho de Supresión ("Derecho al Olvido")</h3>
        <p>
          Puede solicitar la eliminación de sus datos personales, salvo que tengamos
          obligación legal de conservarlos.
        </p>

        <h3>6.4. Derecho de Limitación del Tratamiento</h3>
        <p>
          Puede solicitar que limitemos el tratamiento de sus datos en determinadas
          circunstancias.
        </p>

        <h3>6.5. Derecho de Portabilidad</h3>
        <p>
          Puede solicitar recibir sus datos en formato estructurado, de uso común y
          lectura mecánica (JSON, CSV).
        </p>

        <h3>6.6. Derecho de Oposición</h3>
        <p>
          Puede oponerse al tratamiento de sus datos con fines de marketing directo.
        </p>

        <h3>6.7. Derecho a no ser objeto de decisiones automatizadas</h3>
        <p>
          Tiene derecho a no ser objeto de decisiones basadas únicamente en el tratamiento
          automatizado, incluyendo la elaboración de perfiles.
        </p>

        <h3>6.8. Cómo Ejercer sus Derechos</h3>
        <p>
          Para ejercer cualquiera de estos derechos:
        </p>
        <ul>
          <li>Email: <a href="mailto:privacy@inmova.app" className="text-blue-600 hover:underline">privacy@inmova.app</a></li>
          <li>Formulario en línea: Configuración de cuenta → Privacidad</li>
          <li>Correo postal: [Dirección]</li>
        </ul>
        <p>
          <strong>Plazo de respuesta:</strong> 1 mes (prorrogable a 3 meses en casos complejos).
        </p>

        <h3>6.9. Derecho a Presentar Reclamación</h3>
        <p>
          Si considera que el tratamiento de sus datos vulnera el GDPR, puede presentar una
          reclamación ante la:
        </p>
        <p>
          <strong>Agencia Española de Protección de Datos (AEPD)</strong><br />
          C/ Jorge Juan, 6, 28001 Madrid<br />
          Web: <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            www.aepd.es
          </a>
        </p>
      </section>

      <section id="seguridad">
        <h2>7. Medidas de Seguridad</h2>
        <p>
          Implementamos medidas técnicas y organizativas para proteger sus datos:
        </p>

        <h3>7.1. Medidas Técnicas</h3>
        <ul>
          <li><strong>Cifrado:</strong> TLS/SSL para transmisión de datos</li>
          <li><strong>Contraseñas:</strong> Hasheadas con bcrypt (no almacenamos contraseñas en texto plano)</li>
          <li><strong>Autenticación:</strong> NextAuth.js con protección CSRF</li>
          <li><strong>Firewall:</strong> Cloudflare con protección DDoS</li>
          <li><strong>Backups:</strong> Copias de seguridad diarias cifradas</li>
          <li><strong>Logs de acceso:</strong> Auditoría de accesos a datos sensibles</li>
          <li><strong>Rate limiting:</strong> Protección contra ataques de fuerza bruta</li>
        </ul>

        <h3>7.2. Medidas Organizativas</h3>
        <ul>
          <li>Acceso a datos limitado por rol (principio de mínimo privilegio)</li>
          <li>Formación en protección de datos para empleados</li>
          <li>Acuerdos de confidencialidad con empleados y proveedores</li>
          <li>Política de gestión de incidentes de seguridad</li>
          <li>Revisiones de seguridad periódicas</li>
        </ul>

        <h3>7.3. Notificación de Brechas de Seguridad</h3>
        <p>
          En caso de brecha de seguridad que afecte a datos personales, notificaremos a la
          AEPD en un plazo de 72 horas y a los afectados sin dilación indebida si existe
          un alto riesgo para sus derechos y libertades.
        </p>
      </section>

      <section id="conservacion">
        <h2>8. Plazo de Conservación</h2>
        <table className="min-w-full divide-y divide-gray-300 my-4">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold">Tipo de Dato</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Plazo</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Justificación</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-3 py-2 text-sm">Datos de cuenta activa</td>
              <td className="px-3 py-2 text-sm">Duración del contrato</td>
              <td className="px-3 py-2 text-sm">Prestación del servicio</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-sm">Datos de facturación</td>
              <td className="px-3 py-2 text-sm">6 años</td>
              <td className="px-3 py-2 text-sm">Obligación fiscal</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-sm">Contratos</td>
              <td className="px-3 py-2 text-sm">6 años</td>
              <td className="px-3 py-2 text-sm">Obligación mercantil</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-sm">Logs de acceso</td>
              <td className="px-3 py-2 text-sm">1 año</td>
              <td className="px-3 py-2 text-sm">Seguridad y auditoría</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-sm">Datos de marketing</td>
              <td className="px-3 py-2 text-sm">Hasta revocación</td>
              <td className="px-3 py-2 text-sm">Consentimiento</td>
            </tr>
            <tr>
              <td className="px-3 py-2 text-sm">Cuenta cancelada</td>
              <td className="px-3 py-2 text-sm">30 días</td>
              <td className="px-3 py-2 text-sm">Plazo de reactivación</td>
            </tr>
          </tbody>
        </table>
        <p>
          Transcurridos los plazos, los datos se eliminan de forma segura o se anonimizan
          de forma irreversible.
        </p>
      </section>

      <section id="menores">
        <h2>9. Menores de Edad</h2>
        <p>
          Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos
          intencionadamente datos de menores.
        </p>
        <p>
          Si tiene conocimiento de que un menor ha proporcionado datos personales,
          contáctenos inmediatamente para su eliminación.
        </p>
      </section>

      <section id="transferencias">
        <h2>10. Transferencias Internacionales</h2>
        <p>
          Algunos de nuestros proveedores están ubicados fuera del Espacio Económico Europeo
          (EEE). En estos casos, aplicamos las garantías adecuadas:
        </p>
        <ul>
          <li><strong>Decisiones de adecuación:</strong> Para países con nivel de protección adecuado</li>
          <li><strong>Cláusulas contractuales tipo:</strong> Contratos aprobados por la Comisión Europea</li>
          <li><strong>Normas corporativas vinculantes:</strong> Para grupos empresariales</li>
          <li><strong>Privacy Shield:</strong> Cuando sea aplicable (en revisión post-Schrems II)</li>
        </ul>
      </section>

      <section id="modificaciones">
        <h2>11. Modificaciones de la Política</h2>
        <p>
          Nos reservamos el derecho de modificar esta Política de Privacidad. Los cambios
          serán notificados con al menos 30 días de antelación a través de:
        </p>
        <ul>
          <li>Email a su dirección registrada</li>
          <li>Notificación destacada en la Plataforma</li>
          <li>Actualización de la fecha de "última modificación" al inicio de este documento</li>
        </ul>
      </section>

      <section id="contacto">
        <h2>12. Contacto y DPO</h2>
        <p>
          Para cualquier consulta sobre esta Política de Privacidad o el tratamiento de sus
          datos personales:
        </p>
        <ul>
          <li><strong>Email general:</strong> <a href="mailto:privacy@inmova.app" className="text-blue-600 hover:underline">privacy@inmova.app</a></li>
          <li><strong>DPO (Delegado de Protección de Datos):</strong> <a href="mailto:dpo@inmova.app" className="text-blue-600 hover:underline">dpo@inmova.app</a></li>
          <li><strong>Dirección postal:</strong> [Dirección completa]</li>
          <li><strong>Teléfono:</strong> [Teléfono]</li>
        </ul>
      </section>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-8">
        <p className="text-sm text-blue-800">
          <strong>Compromiso de Inmova App:</strong> Nos comprometemos a proteger su privacidad
          y tratar sus datos con la máxima transparencia y seguridad, cumpliendo estrictamente
          con el GDPR y demás normativa aplicable.
        </p>
      </div>

      <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-4">
        <p className="text-sm text-gray-700">
          <strong>Nota Legal:</strong> Este documento constituye un template profesional GDPR-compliant.
          Se recomienda encarecidamente revisión por Data Protection Officer (DPO) o asesor legal
          especializado antes de uso en producción. Actualizar campos entre [corchetes] con datos reales.
        </p>
      </div>
    </LegalLayout>
  );
}
