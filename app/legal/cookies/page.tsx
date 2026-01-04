import { Metadata } from 'next';
import { LegalLayout, LastUpdated } from '@/components/legal/legal-layout';
import { OpenCookieBannerButton } from '@/components/legal/open-cookie-banner-button';

export const metadata: Metadata = {
  title: 'Política de Cookies | Inmova',
  description: 'Política de cookies de Inmova App conforme a LSSI y GDPR',
  robots: 'noindex, nofollow',
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies" lastUpdated="4 de enero de 2026">
      <LastUpdated date="4 de enero de 2026" />

      <section id="intro">
        <h2>1. ¿Qué son las Cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que se almacenan en su dispositivo
          (ordenador, tablet, smartphone) cuando visita un sitio web.
        </p>
        <p>
          Estos archivos permiten que el sitio web "recuerde" sus acciones y preferencias
          durante un período de tiempo, mejorando su experiencia de navegación.
        </p>
      </section>

      <section id="uso">
        <h2>2. ¿Cómo Usamos las Cookies?</h2>
        <p>
          En <strong>Inmova App</strong> utilizamos cookies para:
        </p>
        <ul>
          <li>Mantener su sesión activa y segura</li>
          <li>Recordar sus preferencias (idioma, tema, configuración)</li>
          <li>Analizar el uso de la Plataforma para mejorarla</li>
          <li>Personalizar contenido y funcionalidades</li>
          <li>Medir la efectividad de nuestro marketing (con su consentimiento)</li>
        </ul>
      </section>

      <section id="tipos">
        <h2>3. Tipos de Cookies que Utilizamos</h2>

        <h3>3.1. Cookies Técnicas (Necesarias)</h3>
        <p>
          <strong>Finalidad:</strong> Esenciales para el funcionamiento básico de la Plataforma.
        </p>
        <p>
          <strong>Consentimiento:</strong> No requieren consentimiento (LSSI exención).
        </p>
        <table className="min-w-full divide-y divide-gray-300 my-4 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Cookie</th>
              <th className="px-3 py-2 text-left font-semibold">Propósito</th>
              <th className="px-3 py-2 text-left font-semibold">Duración</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr>
              <td className="px-3 py-2"><code>next-auth.session-token</code></td>
              <td className="px-3 py-2">Mantener sesión de usuario</td>
              <td className="px-3 py-2">30 días</td>
            </tr>
            <tr>
              <td className="px-3 py-2"><code>next-auth.csrf-token</code></td>
              <td className="px-3 py-2">Seguridad CSRF</td>
              <td className="px-3 py-2">Sesión</td>
            </tr>
            <tr>
              <td className="px-3 py-2"><code>__Secure-next-auth.callback-url</code></td>
              <td className="px-3 py-2">Gestión de autenticación</td>
              <td className="px-3 py-2">Sesión</td>
            </tr>
            <tr>
              <td className="px-3 py-2"><code>inmova-preferences</code></td>
              <td className="px-3 py-2">Preferencias de usuario (idioma, tema)</td>
              <td className="px-3 py-2">1 año</td>
            </tr>
          </tbody>
        </table>

        <h3>3.2. Cookies de Rendimiento y Análisis</h3>
        <p>
          <strong>Finalidad:</strong> Recopilar información sobre cómo los usuarios utilizan la Plataforma.
        </p>
        <p>
          <strong>Consentimiento:</strong> Requieren su consentimiento.
        </p>
        <table className="min-w-full divide-y divide-gray-300 my-4 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Cookie</th>
              <th className="px-3 py-2 text-left font-semibold">Proveedor</th>
              <th className="px-3 py-2 text-left font-semibold">Propósito</th>
              <th className="px-3 py-2 text-left font-semibold">Duración</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr>
              <td className="px-3 py-2"><code>_ga</code></td>
              <td className="px-3 py-2">Google Analytics</td>
              <td className="px-3 py-2">Distinguir usuarios</td>
              <td className="px-3 py-2">2 años</td>
            </tr>
            <tr>
              <td className="px-3 py-2"><code>_ga_*</code></td>
              <td className="px-3 py-2">Google Analytics 4</td>
              <td className="px-3 py-2">Mantener estado de sesión</td>
              <td className="px-3 py-2">2 años</td>
            </tr>
            <tr>
              <td className="px-3 py-2"><code>_gid</code></td>
              <td className="px-3 py-2">Google Analytics</td>
              <td className="px-3 py-2">Distinguir usuarios</td>
              <td className="px-3 py-2">24 horas</td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm text-gray-600 mt-2">
          <strong>Más información:</strong>{' '}
          <a 
            href="https://policies.google.com/technologies/cookies" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Política de cookies de Google
          </a>
        </p>

        <h3>3.3. Cookies de Funcionalidad</h3>
        <p>
          <strong>Finalidad:</strong> Recordar elecciones del usuario para mejorar su experiencia.
        </p>
        <p>
          <strong>Consentimiento:</strong> Requieren su consentimiento.
        </p>
        <table className="min-w-full divide-y divide-gray-300 my-4 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Cookie</th>
              <th className="px-3 py-2 text-left font-semibold">Propósito</th>
              <th className="px-3 py-2 text-left font-semibold">Duración</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr>
              <td className="px-3 py-2"><code>inmova-theme</code></td>
              <td className="px-3 py-2">Recordar preferencia de tema (claro/oscuro)</td>
              <td className="px-3 py-2">1 año</td>
            </tr>
            <tr>
              <td className="px-3 py-2"><code>inmova-layout</code></td>
              <td className="px-3 py-2">Recordar configuración de layout</td>
              <td className="px-3 py-2">1 año</td>
            </tr>
            <tr>
              <td className="px-3 py-2"><code>inmova-tutorial-completed</code></td>
              <td className="px-3 py-2">Recordar si completó tutorial</td>
              <td className="px-3 py-2">1 año</td>
            </tr>
          </tbody>
        </table>

        <h3>3.4. Cookies de Terceros</h3>
        <p>
          Algunos servicios externos que utilizamos pueden establecer sus propias cookies:
        </p>
        <table className="min-w-full divide-y divide-gray-300 my-4 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Servicio</th>
              <th className="px-3 py-2 text-left font-semibold">Propósito</th>
              <th className="px-3 py-2 text-left font-semibold">Más información</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            <tr>
              <td className="px-3 py-2">Cloudflare</td>
              <td className="px-3 py-2">Seguridad y rendimiento CDN</td>
              <td className="px-3 py-2">
                <a href="https://www.cloudflare.com/cookie-policy/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                  Política
                </a>
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">Stripe</td>
              <td className="px-3 py-2">Procesamiento de pagos seguro</td>
              <td className="px-3 py-2">
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                  Política
                </a>
              </td>
            </tr>
            <tr>
              <td className="px-3 py-2">Google Analytics</td>
              <td className="px-3 py-2">Análisis de uso (con consentimiento)</td>
              <td className="px-3 py-2">
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                  Política
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="gestion">
        <h2>4. Gestión de Cookies</h2>

        <h3>4.1. Panel de Preferencias de Cookies</h3>
        <p>
          Puede gestionar sus preferencias de cookies en cualquier momento desde nuestro
          panel de configuración:
        </p>
        <OpenCookieBannerButton />

        <h3>4.2. Configuración del Navegador</h3>
        <p>
          También puede gestionar o eliminar cookies mediante la configuración de su navegador:
        </p>
        <ul>
          <li>
            <strong>Chrome:</strong>{' '}
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Borrar, habilitar y gestionar cookies
            </a>
          </li>
          <li>
            <strong>Firefox:</strong>{' '}
            <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Habilitar y deshabilitar cookies
            </a>
          </li>
          <li>
            <strong>Safari:</strong>{' '}
            <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Gestionar cookies y datos de sitios web
            </a>
          </li>
          <li>
            <strong>Edge:</strong>{' '}
            <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Eliminar las cookies
            </a>
          </li>
        </ul>

        <h3>4.3. Consecuencias de Bloquear Cookies</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
          <p className="text-yellow-800">
            <strong>Advertencia:</strong> Si bloquea o elimina las cookies técnicas (necesarias),
            algunas funcionalidades de la Plataforma pueden no funcionar correctamente, como:
          </p>
          <ul className="mt-2 text-yellow-800">
            <li>• Mantener su sesión iniciada</li>
            <li>• Recordar sus preferencias</li>
            <li>• Acceder a áreas protegidas</li>
          </ul>
        </div>

        <h3>4.4. Do Not Track (DNT)</h3>
        <p>
          Respetamos la señal "Do Not Track" (DNT) de su navegador. Si tiene DNT activado,
          no utilizaremos cookies de análisis ni publicidad sin su consentimiento explícito.
        </p>
      </section>

      <section id="actualizaciones">
        <h2>5. Actualizaciones de la Política de Cookies</h2>
        <p>
          Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios
          en las cookies que utilizamos o por motivos operativos, legales o regulatorios.
        </p>
        <p>
          Le recomendamos que revise esta política periódicamente. La fecha de "última
          actualización" al inicio del documento indica cuándo se realizó la última modificación.
        </p>
      </section>

      <section id="mas-info">
        <h2>6. Más Información</h2>
        <p>
          Para más información sobre cómo tratamos sus datos personales, consulte nuestra{' '}
          <a href="/legal/privacy" className="text-blue-600 hover:underline">
            Política de Privacidad
          </a>.
        </p>
        <p>
          Si tiene preguntas sobre nuestro uso de cookies, puede contactarnos:
        </p>
        <ul>
          <li><strong>Email:</strong> privacy@inmova.app</li>
          <li><strong>DPO:</strong> dpo@inmova.app</li>
        </ul>
      </section>

      <section id="bases-legales">
        <h2>7. Bases Legales</h2>
        <p>
          Esta Política de Cookies cumple con:
        </p>
        <ul>
          <li><strong>GDPR:</strong> Reglamento (UE) 2016/679</li>
          <li><strong>ePrivacy Directive:</strong> Directiva 2002/58/CE</li>
          <li><strong>LSSI:</strong> Ley 34/2002 de Servicios de la Sociedad de la Información (España)</li>
          <li><strong>LOPD:</strong> Ley Orgánica 3/2018 de Protección de Datos</li>
        </ul>
      </section>

      <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-8">
        <p className="text-sm text-green-800">
          <strong>Transparencia:</strong> En Inmova App creemos en la transparencia total sobre
          el uso de cookies. Usted tiene el control completo sobre qué cookies acepta.
        </p>
      </div>

      <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-4">
        <p className="text-sm text-gray-700">
          <strong>Nota Legal:</strong> Este documento constituye un template profesional conforme
          a LSSI/GDPR. Se recomienda revisión por asesor legal especializado antes de uso en
          producción. Actualizar tablas de cookies con las cookies reales que utilice su aplicación.
        </p>
      </div>
    </LegalLayout>
  );
}
