import { Metadata } from 'next';
import { LegalLayout, LastUpdated } from '@/components/legal/legal-layout';

export const metadata: Metadata = {
  title: 'Aviso Legal | Inmova',
  description: 'Aviso legal de Inmova App conforme a LSSI',
  robots: 'noindex, nofollow',
};

export default function LegalNoticePage() {
  return (
    <LegalLayout title="Aviso Legal" lastUpdated="4 de enero de 2026">
      <LastUpdated date="4 de enero de 2026" />

      <section id="identificacion">
        <h2>1. Identificación del Titular</h2>
        <p>
          En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad
          de la Información y de Comercio Electrónico (LSSI), se informa de los siguientes
          datos:
        </p>
        <ul className="space-y-2">
          <li><strong>Denominación Social:</strong> Inmova App S.L.</li>
          <li><strong>NIF:</strong> [NIF de la empresa - Ejemplo: B-12345678]</li>
          <li><strong>Domicilio Social:</strong> [Dirección completa - Calle, número, CP, Ciudad, Provincia]</li>
          <li><strong>Email de contacto:</strong> <a href="mailto:info@inmova.app" className="text-blue-600 hover:underline">info@inmova.app</a></li>
          <li><strong>Teléfono:</strong> [Teléfono de contacto]</li>
          <li><strong>Registro Mercantil:</strong> [Ciudad], Tomo [X], Folio [X], Hoja [X], Inscripción [X]</li>
          <li><strong>Nombre de dominio:</strong> inmovaapp.com</li>
        </ul>
      </section>

      <section id="objeto">
        <h2>2. Objeto y Ámbito de Aplicación</h2>
        <p>
          El presente Aviso Legal regula el acceso y uso del sitio web{' '}
          <strong>inmovaapp.com</strong> (en adelante, "el Sitio Web" o "la Plataforma"),
          así como de los servicios ofrecidos a través del mismo.
        </p>
        <p>
          El acceso y/o uso del Sitio Web atribuye la condición de <strong>Usuario</strong> y
          supone la aceptación plena y sin reservas de todas y cada una de las disposiciones
          incluidas en este Aviso Legal.
        </p>
        <p>
          Si el Usuario no estuviera de acuerdo con las condiciones aquí establecidas, deberá
          abstenerse de acceder y/o utilizar los servicios y/o contenidos puestos a su disposición
          en el Sitio Web.
        </p>
      </section>

      <section id="descripcion">
        <h2>3. Descripción de los Servicios</h2>
        <p>
          Inmova App es una plataforma tecnológica PropTech (Property Technology) que ofrece
          servicios de:
        </p>
        <ul>
          <li>Gestión integral de propiedades inmobiliarias</li>
          <li>Gestión de inquilinos y contratos de arrendamiento</li>
          <li>Procesamiento de pagos</li>
          <li>Firma electrónica de documentos</li>
          <li>Almacenamiento y gestión documental</li>
          <li>CRM inmobiliario</li>
          <li>Herramientas de análisis y reporting</li>
          <li>Servicios auxiliares relacionados con la gestión inmobiliaria</li>
        </ul>
        <p>
          El acceso a determinados servicios puede estar sujeto a registro previo del Usuario
          y/o pago de una tarifa, según se especifique en cada caso.
        </p>
      </section>

      <section id="condiciones-uso">
        <h2>4. Condiciones de Acceso y Uso</h2>

        <h3>4.1. Acceso Gratuito</h3>
        <p>
          El acceso al Sitio Web tiene carácter gratuito para los Usuarios, sin perjuicio de
          las tarifas establecidas para el uso de determinados servicios específicos.
        </p>

        <h3>4.2. Registro de Usuario</h3>
        <p>
          Para acceder a ciertos servicios es necesario el registro previo del Usuario,
          quien se compromete a:
        </p>
        <ul>
          <li>Proporcionar información veraz, exacta, completa y actualizada</li>
          <li>Mantener actualizados sus datos de registro</li>
          <li>Ser responsable de la confidencialidad de su contraseña</li>
          <li>Comunicar inmediatamente cualquier uso no autorizado de su cuenta</li>
        </ul>

        <h3>4.3. Uso Adecuado</h3>
        <p>
          El Usuario se compromete a utilizar el Sitio Web y los Servicios de conformidad con:
        </p>
        <ul>
          <li>La legislación vigente</li>
          <li>El presente Aviso Legal</li>
          <li>Los Términos y Condiciones específicos de cada servicio</li>
          <li>La moral y buenas costumbres generalmente aceptadas</li>
          <li>El orden público</li>
        </ul>

        <h3>4.4. Usos Prohibidos</h3>
        <p>
          El Usuario se obliga a NO realizar las siguientes conductas:
        </p>
        <ul>
          <li>Realizar actos ilícitos, ilegales o contrarios a la buena fe y al orden público</li>
          <li>Difundir contenidos o propaganda de carácter racista, xenófobo, pornográfico-ilegal, de apología del terrorismo o atentatoria contra los derechos humanos</li>
          <li>Provocar daños en los sistemas físicos y lógicos del Sitio Web, de sus proveedores o de terceras personas</li>
          <li>Introducir o difundir en la red virus informáticos o cualesquiera otros sistemas físicos o lógicos susceptibles de provocar daños</li>
          <li>Intentar acceder y, en su caso, utilizar las cuentas de correo electrónico de otros usuarios y modificar o manipular sus mensajes</li>
          <li>Suplantar la identidad de otro usuario, de las administraciones públicas o de un tercero</li>
          <li>Reproducir, copiar, distribuir, poner a disposición o de cualquier otra forma comunicar públicamente, transformar o modificar los contenidos, a menos que se cuente con la autorización del titular de los correspondientes derechos o ello resulte legalmente permitido</li>
          <li>Recabar datos con finalidad publicitaria y de remitir publicidad de cualquier clase y comunicaciones con fines de venta u otras de naturaleza comercial sin que medie su previa solicitud o consentimiento</li>
        </ul>
      </section>

      <section id="propiedad-intelectual">
        <h2>5. Propiedad Intelectual e Industrial</h2>

        <h3>5.1. Derechos del Titular</h3>
        <p>
          Todos los contenidos del Sitio Web, salvo que se indique lo contrario, son titularidad
          exclusiva de Inmova App S.L. y, en particular, el diseño gráfico, código fuente,
          logotipos, textos, gráficos, ilustraciones, fotografías, y demás elementos que aparecen
          en el Sitio Web.
        </p>
        <p>
          Asimismo, todos los nombres comerciales, marcas o signos distintivos de cualquier clase
          contenidos en el Sitio Web están protegidos por la Ley de Propiedad Industrial.
        </p>

        <h3>5.2. Prohibición de Uso No Autorizado</h3>
        <p>
          Queda expresamente prohibida la reproducción, distribución, comunicación pública,
          puesta a disposición, transformación, de la totalidad o parte de los contenidos de
          este Sitio Web, en cualquier soporte y por cualquier medio técnico, sin la autorización
          de Inmova App S.L.
        </p>

        <h3>5.3. Contenido de Usuario</h3>
        <p>
          El Usuario conserva todos los derechos de propiedad intelectual sobre los contenidos
          que suba, publique o muestre en o a través del Sitio Web. Al hacerlo, otorga a
          Inmova App S.L. una licencia mundial, no exclusiva y libre de regalías (con derecho
          a sublicenciar) para usar, copiar, reproducir, procesar, adaptar, modificar, publicar,
          transmitir, mostrar y distribuir dicho Contenido únicamente para los fines de prestación
          del Servicio.
        </p>
      </section>

      <section id="exclusion-garantias">
        <h2>6. Exclusión de Garantías y Responsabilidad</h2>

        <h3>6.1. Disponibilidad del Servicio</h3>
        <p>
          Inmova App S.L. no garantiza la disponibilidad y continuidad del funcionamiento del
          Sitio Web y de los Servicios. Cuando ello sea razonablemente posible, advertirá
          previamente las interrupciones en el funcionamiento del Sitio Web.
        </p>

        <h3>6.2. Contenidos</h3>
        <p>
          Inmova App S.L. no se hace responsable de:
        </p>
        <ul>
          <li>La utilidad o veracidad de los contenidos introducidos por los Usuarios</li>
          <li>La actualidad, exactitud, exhaustividad, calidad y validez de cualquier contenido del Sitio Web</li>
          <li>La existencia de virus u otros elementos en los contenidos que puedan producir alteraciones en el sistema informático, documentos electrónicos o datos de los Usuarios</li>
        </ul>

        <h3>6.3. Enlaces a Terceros</h3>
        <p>
          El Sitio Web puede contener enlaces a sitios web de terceros. Inmova App S.L. no
          controla ni asume responsabilidad alguna por el contenido de dichos sitios web.
          El acceso y uso de los mismos es responsabilidad exclusiva del Usuario.
        </p>

        <h3>6.4. Limitación de Responsabilidad</h3>
        <p>
          En ningún caso Inmova App S.L. será responsable por:
        </p>
        <ul>
          <li>Daños y perjuicios de cualquier naturaleza derivados de la falta de disponibilidad, mantenimiento y efectivo funcionamiento del Sitio Web</li>
          <li>Daños y perjuicios causados por la falta de utilidad, adecuación o validez de los contenidos del Sitio Web</li>
          <li>Daños ocasionados por virus, ataques informáticos o fallos de software o hardware</li>
          <li>Daños causados por el uso indebido del Sitio Web por los Usuarios</li>
          <li>Pérdidas derivadas de decisiones económicas tomadas en base a información del Sitio Web</li>
        </ul>

        <h3>6.5. Fuerza Mayor</h3>
        <p>
          Inmova App S.L. no será responsable por cualquier incumplimiento o retraso en el
          cumplimiento de alguna de las obligaciones asumidas, cuando el mismo se deba a
          acontecimientos que están fuera de su control razonable, es decir, que se deban a
          causa de fuerza mayor.
        </p>
      </section>

      <section id="proteccion-datos">
        <h2>7. Protección de Datos Personales</h2>
        <p>
          El tratamiento de los datos personales de los Usuarios se realizará conforme a lo
          establecido en:
        </p>
        <ul>
          <li>Reglamento (UE) 2016/679 (GDPR)</li>
          <li>Ley Orgánica 3/2018 de Protección de Datos Personales</li>
          <li>Nuestra{' '}
            <a href="/legal/privacy" className="text-blue-600 hover:underline">
              Política de Privacidad
            </a>
          </li>
        </ul>
        <p>
          El Usuario puede ejercer sus derechos de acceso, rectificación, supresión, limitación,
          portabilidad y oposición mediante email a: privacy@inmova.app
        </p>
      </section>

      <section id="cookies">
        <h2>8. Uso de Cookies</h2>
        <p>
          El Sitio Web utiliza cookies propias y de terceros. Para más información consulte
          nuestra{' '}
          <a href="/legal/cookies" className="text-blue-600 hover:underline">
            Política de Cookies
          </a>.
        </p>
      </section>

      <section id="legislacion">
        <h2>9. Legislación Aplicable y Jurisdicción</h2>
        <p>
          El presente Aviso Legal se rige en todos y cada uno de sus extremos por la ley española.
        </p>
        <p>
          Para la resolución de cualquier controversia que pudiera suscitarse con ocasión de
          la visita al Sitio Web o del uso de los servicios que en él se puedan ofertar, Inmova
          App S.L. y el Usuario acuerdan someterse a los Jueces y Tribunales del domicilio del
          usuario, salvo normativa específica que establezca otra cosa.
        </p>
        <p>
          En caso de que el Usuario tenga su domicilio fuera de España, Inmova App S.L. y el
          Usuario, con renuncia expresa a cualquier otro fuero, se someten a los juzgados y
          tribunales de Madrid (España).
        </p>
      </section>

      <section id="modificaciones">
        <h2>10. Modificaciones</h2>
        <p>
          Inmova App S.L. se reserva el derecho de efectuar sin previo aviso las modificaciones
          que considere oportunas en su portal, pudiendo cambiar, suprimir o añadir tanto los
          contenidos y servicios que se presten a través de la misma como la forma en la que
          éstos aparezcan presentados o localizados en su portal.
        </p>
        <p>
          La vigencia del presente Aviso Legal coincide con el tiempo de su exposición, hasta
          que sea modificado total o parcialmente, momento en el que pasará a tener vigencia
          el Aviso Legal modificado.
        </p>
      </section>

      <section id="contacto">
        <h2>11. Contacto</h2>
        <p>
          Para cualquier consulta, sugerencia o reclamación relacionada con el Sitio Web,
          puede contactar con nosotros a través de:
        </p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:info@inmova.app" className="text-blue-600 hover:underline">info@inmova.app</a></li>
          <li><strong>Email legal:</strong> <a href="mailto:legal@inmova.app" className="text-blue-600 hover:underline">legal@inmova.app</a></li>
          <li><strong>Dirección postal:</strong> [Dirección completa]</li>
          <li><strong>Teléfono:</strong> [Teléfono de contacto]</li>
          <li><strong>Horario de atención:</strong> Lunes a Viernes, 9:00 - 18:00 (CET)</li>
        </ul>
      </section>

      <section id="enlaces-legales">
        <h2>12. Enlaces Relacionados</h2>
        <ul>
          <li>
            <a href="/legal/terms" className="text-blue-600 hover:underline">
              Términos y Condiciones
            </a>
          </li>
          <li>
            <a href="/legal/privacy" className="text-blue-600 hover:underline">
              Política de Privacidad
            </a>
          </li>
          <li>
            <a href="/legal/cookies" className="text-blue-600 hover:underline">
              Política de Cookies
            </a>
          </li>
        </ul>
      </section>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-8">
        <p className="text-sm text-blue-800">
          <strong>Transparencia Legal:</strong> Este Aviso Legal cumple con los requisitos
          establecidos por la LSSI (Ley 34/2002) y proporciona toda la información identificativa
          y de contacto de Inmova App S.L. de forma clara y accesible.
        </p>
      </div>

      <div className="bg-gray-100 border-l-4 border-gray-400 p-4 mt-4">
        <p className="text-sm text-gray-700">
          <strong>Nota Legal:</strong> Este documento constituye un template profesional conforme
          a LSSI. Se recomienda revisión por asesor legal especializado antes de uso en producción.
          Actualizar todos los campos entre [corchetes] con los datos reales de la empresa antes
          de publicar.
        </p>
      </div>
    </LegalLayout>
  );
}
