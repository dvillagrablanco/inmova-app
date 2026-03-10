import type { HelpArticle } from '../types';

export const gestionarCuentaArticles: HelpArticle[] = [
  // --- equipos-y-usuarios (gc-001 a gc-005) ---
  {
    id: 'gc-001',
    slug: 'crear-gestionar-equipos',
    title: 'Cómo crear y gestionar equipos',
    excerpt:
      'Organiza tu empresa en equipos para asignar responsabilidades y dividir la cartera de inmuebles de forma eficiente.',
    content: `## ¿Qué son los equipos?

Los equipos te permiten organizar a los miembros de tu empresa por departamentos, zonas geográficas o tipos de gestión. Cada equipo puede tener su propia cartera de inmuebles y permisos específicos.

## Crear un equipo

1. Ve a **Configuración** > **Equipos**
2. Haz clic en **Nuevo equipo**
3. Introduce el nombre del equipo (ej: "Equipo Madrid Centro")
4. Asigna un responsable opcional
5. Guarda los cambios

## Gestionar equipos existentes

Desde la lista de equipos puedes editar el nombre, cambiar el responsable o desactivar equipos que ya no utilices. Los inmuebles asignados a un equipo desactivado pasan a estar sin asignar hasta que los reasignes.

## Buenas prácticas

- Crea equipos por zona geográfica cuando gestiones muchas propiedades
- Usa equipos por tipo de gestión (alquiler residencial, comercial, vacacional)
- Revisa periódicamente la asignación de inmuebles a equipos`,
    collection: 'gestionar-cuenta',
    subcollection: 'equipos-y-usuarios',
    tags: ['equipos', 'organización', 'configuración'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['gc-002', 'gc-004', 'gc-005'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-002',
    slug: 'roles-permisos-usuario',
    title: 'Roles y permisos de usuario',
    excerpt:
      'Configura qué puede ver y hacer cada usuario según su rol: administrador, gestor, agente o consultor.',
    content: `## Roles disponibles

Inmova incluye varios roles predefinidos con diferentes niveles de acceso:

- **Administrador**: Acceso total a todas las funciones y configuración
- **Gestor**: Gestión completa de inmuebles, contratos y pagos
- **Agente**: Gestión de inmuebles asignados y creación de contratos
- **Consultor**: Solo lectura de informes y datos

## Permisos personalizados

Para empresas con necesidades específicas, puedes crear roles personalizados:

1. Ve a **Configuración** > **Roles y permisos**
2. Crea un nuevo rol o duplica uno existente
3. Activa o desactiva cada permiso según necesites
4. Asigna el rol a los usuarios correspondientes

## Permisos por módulo

Los permisos se organizan por módulos: Inmuebles, Contratos, Pagos, Facturación, etc. Cada módulo puede tener permisos de lectura, creación, edición y eliminación independientes.`,
    collection: 'gestionar-cuenta',
    subcollection: 'equipos-y-usuarios',
    tags: ['roles', 'permisos', 'seguridad'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['gc-001', 'gc-003', 'gc-004'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-003',
    slug: 'invitar-eliminar-miembros-equipo',
    title: 'Invitar y eliminar miembros del equipo',
    excerpt:
      'Añade nuevos usuarios a tu cuenta y gestiona las bajas de forma segura con transferencia de datos.',
    content: `## Invitar a un miembro

1. Ve a **Configuración** > **Usuarios**
2. Haz clic en **Invitar usuario**
3. Introduce el email del nuevo miembro
4. Selecciona el rol que tendrá
5. Opcionalmente, asigna un equipo
6. El usuario recibirá un email con el enlace de activación

## Activar la cuenta

El invitado debe hacer clic en el enlace del email y establecer su contraseña. Hasta entonces, no podrá acceder a la plataforma. El enlace expira en 7 días.

## Eliminar un miembro

Cuando un empleado deja la empresa:

1. Ve a **Configuración** > **Usuarios**
2. Localiza al usuario y haz clic en **Desactivar**
3. Asigna sus inmuebles y contratos a otro usuario antes de desactivar
4. Una vez desactivado, perderá acceso inmediatamente

## Transferencia de datos

Antes de eliminar, asegúrate de reasignar los inmuebles asignados al usuario para que no queden huérfanos.`,
    collection: 'gestionar-cuenta',
    subcollection: 'equipos-y-usuarios',
    tags: ['invitaciones', 'usuarios', 'bajas'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['gc-001', 'gc-002', 'gc-005'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-004',
    slug: 'dividir-cartera-inmuebles-between-equipos',
    title: 'Dividir la cartera de inmuebles entre equipos',
    excerpt:
      'Asigna inmuebles a cada equipo para que cada uno gestione solo su parte de la cartera.',
    content: `## ¿Por qué dividir la cartera?

Cuando tienes varios equipos, cada uno puede gestionar su propia cartera de inmuebles. Esto mejora la organización y permite que cada equipo vea solo los inmuebles que le corresponden.

## Asignar inmuebles a equipos

1. Ve a **Inmuebles** (o al detalle de cada inmueble)
2. En el filtro o edición, selecciona el **Equipo** asignado
3. Puedes asignar inmuebles de forma individual o masiva

## Asignación masiva

Para asignar varios inmuebles a la vez:

1. Ve a **Inmuebles** y selecciona los inmuebles con los checkboxes
2. Haz clic en **Acciones** > **Asignar a equipo**
3. Selecciona el equipo destino
4. Confirma la operación

## Filtros por equipo

Los usuarios con rol de gestor o agente verán solo los inmuebles de su equipo asignado. Los administradores pueden ver todos los inmuebles.`,
    collection: 'gestionar-cuenta',
    subcollection: 'equipos-y-usuarios',
    tags: ['equipos', 'cartera', 'asignación'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['gc-001', 'gc-005', 'gc-006'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-005',
    slug: 'transferir-propiedades-between-equipos',
    title: 'Transferir propiedades entre equipos',
    excerpt:
      'Mueve inmuebles de un equipo a otro cuando cambien las responsabilidades o la estructura.',
    content: `## Cuándo transferir

Transfiere propiedades cuando un empleado cambie de equipo, cuando reorganicen zonas o cuando un equipo absorba la cartera de otro.

## Transferencia individual

1. Abre el **detalle del inmueble**
2. En la sección de asignación, cambia el equipo
3. Guarda los cambios

## Transferencia masiva

1. Ve a **Inmuebles** y filtra por el equipo origen
2. Selecciona los inmuebles a transferir
3. **Acciones** > **Transferir a equipo**
4. Selecciona el equipo destino
5. Confirma la transferencia

## Consideraciones

- Los contratos activos siguen vinculados al inmueble
- Los pagos y cobros no se modifican
- El historial de incidencias se mantiene
- Los usuarios del equipo destino verán los inmuebles desde el momento de la transferencia`,
    collection: 'gestionar-cuenta',
    subcollection: 'equipos-y-usuarios',
    tags: ['transferencia', 'equipos', 'propiedades'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['gc-001', 'gc-004', 'gc-006'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  // --- inmuebles (gc-006 a gc-012) ---
  {
    id: 'gc-006',
    slug: 'anadir-editar-inmueble',
    title: 'Añadir y editar un inmueble',
    excerpt:
      'Crea fichas completas de inmuebles con dirección, características, precios y documentación.',
    content: `## Crear un inmueble

1. Ve a **Inmuebles** > **Nuevo inmueble**
2. Completa los datos básicos: dirección, ciudad, código postal
3. Añade las características: habitaciones, baños, m², tipo de propiedad
4. Introduce el precio de alquiler o venta
5. Asigna el tipo de gestión (alquiler, venta, comercial)
6. Guarda la ficha

## Campos obligatorios

- Dirección y ubicación
- Superficie (m²)
- Tipo de propiedad
- Precio

## Editar un inmueble

Desde el listado de inmuebles, haz clic en cualquier fila para abrir el detalle. Edita los campos que necesites y guarda. Los cambios se reflejan en contratos, portales y anuncios vinculados.

## Inmuebles en edificios

Si el inmueble pertenece a un edificio con comunidad, selecciónalo en el campo correspondiente para heredar datos de comunidad y seguros.`,
    collection: 'gestionar-cuenta',
    subcollection: 'inmuebles',
    tags: ['inmuebles', 'alta', 'edición'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['gc-007', 'gc-008', 'gc-009'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-007',
    slug: 'archivar-restaurar-inmuebles',
    title: 'Archivar y restaurar inmuebles',
    excerpt:
      'Archiva inmuebles que ya no gestionas sin perder el historial. Restáuralos cuando vuelvan a tu cartera.',
    content: `## ¿Por qué archivar?

Archiva inmuebles cuando terminen los contratos y no vayas a gestionarlos más, o cuando los vendas. Los inmuebles archivados no aparecen en tu cartera activa pero conservan todo el historial.

## Archivar un inmueble

1. Abre el **detalle del inmueble**
2. Haz clic en **Más** > **Archivar** (o en el menú de acciones)
3. Opcionalmente, indica el motivo del archivo
4. Confirma la operación

## Restaurar un inmueble

1. Ve a **Inmuebles** y activa el filtro **Mostrar archivados**
2. Localiza el inmueble y ábrelo
3. Haz clic en **Restaurar**
4. El inmueble volverá a tu cartera activa

## Contratos y datos

No puedes archivar un inmueble con contrato activo. Primero debes dar de baja el contrato. Los documentos, fotos y historial de incidencias se conservan al archivar.`,
    collection: 'gestionar-cuenta',
    subcollection: 'inmuebles',
    tags: ['archivar', 'inmuebles', 'historial'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['gc-006', 'gc-013', 'gc-018'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-008',
    slug: 'configurar-caracteristicas-amenidades',
    title: 'Configurar características y amenidades',
    excerpt:
      'Define las características del inmueble (ascensor, parking, terraza) para que aparezcan en anuncios y filtros.',
    content: `## Características principales

En la ficha del inmueble encontrarás:

- **Habitaciones y baños**: Número de dormitorios y cuartos de baño
- **Superficie**: m² útiles y construidos
- **Planta**: Piso en el que se encuentra
- **Año de construcción**: Para el certificado de eficiencia energética

## Amenidades

Marca las amenidades disponibles:

- Ascensor
- Parking (garaje o plaza)
- Terraza o balcón
- Jardín
- Piscina
- Trastero
- Aire acondicionado
- Calefacción
- Mascotas permitidas

## Impacto en anuncios

Estas características aparecen en los portales de anuncios y permiten a los inquilinos filtrar por ellas. Cuanto más completo completes la ficha, mejor posicionarás el inmueble en las búsquedas.`,
    collection: 'gestionar-cuenta',
    subcollection: 'inmuebles',
    tags: ['características', 'amenidades', 'ficha'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['gc-006', 'gc-009', 'gc-011'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-009',
    slug: 'subir-fotos-documentos-inmueble',
    title: 'Subir fotos y documentos del inmueble',
    excerpt:
      'Añade fotos de calidad y documentos (CEE, IBI, escritura) para completar la ficha del inmueble.',
    content: `## Subir fotos

1. Abre el **detalle del inmueble**
2. Ve a la pestaña **Fotos** o **Galería**
3. Arrastra las imágenes o haz clic en **Añadir fotos**
4. Ordena las fotos arrastrando (la primera será la principal)
5. Añade títulos o descripciones opcionales

## Formatos y tamaños

- Formatos: JPG, PNG, WebP
- Tamaño máximo recomendado: 5 MB por imagen
- Resolución recomendada: 1920x1080 o superior

## Documentos

En la pestaña **Documentos** puedes subir:

- Certificado de Eficiencia Energética (CEE)
- Escritura de propiedad
- IBI
- Licencia de primera ocupación
- Otros documentos legales

Los documentos se almacenan de forma segura y pueden vincularse a contratos.`,
    collection: 'gestionar-cuenta',
    subcollection: 'inmuebles',
    tags: ['fotos', 'documentos', 'galería'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['gc-006', 'gc-008', 'gc-010'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-010',
    slug: 'configurar-tours-virtuales-360',
    title: 'Configurar tours virtuales 360°',
    excerpt:
      'Integra tours virtuales de Matterport, Kuula u otros proveedores para que los inquilinos visiten el inmueble online.',
    content: `## Proveedores compatibles

Inmova soporta la integración de tours virtuales de:

- Matterport
- Kuula
- Google Street View
- Otros enlaces embebibles (iframe)

## Añadir un tour virtual

1. Abre el **detalle del inmueble**
2. Ve a la sección **Tour virtual** o **Multimedia**
3. Pega la URL del embed del tour (o el código iframe)
4. Guarda los cambios

## Dónde aparece

El tour virtual se mostrará en:

- La ficha pública del inmueble
- Los portales de anuncios
- El portal del inquilino (si ya tiene contrato)

## Consejos

- Usa tours de alta calidad para mejorar la conversión
- Un tour 360° reduce las visitas presenciales innecesarias
- Combina el tour con fotos estáticas para mejor experiencia`,
    collection: 'gestionar-cuenta',
    subcollection: 'inmuebles',
    tags: ['tour virtual', '360', 'Matterport'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['gc-006', 'gc-009', 'gc-011'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-011',
    slug: 'etiquetas-filtros-avanzados-propiedades',
    title: 'Etiquetas y filtros avanzados de propiedades',
    excerpt:
      'Organiza tu cartera con etiquetas personalizadas y usa filtros avanzados para encontrar inmuebles rápidamente.',
    content: `## Crear etiquetas

1. Ve a **Configuración** > **Etiquetas** (o en el módulo de inmuebles)
2. Crea etiquetas como: "Reforma", "Urgente", "Premium", "Zona A"
3. Asigna colores para identificarlas visualmente

## Asignar etiquetas a inmuebles

- Desde el listado: selecciona inmuebles y asigna etiquetas en masa
- Desde el detalle: usa el selector de etiquetas en la ficha

## Filtros avanzados

Combina varios criterios en el buscador:

- Ubicación (ciudad, barrio, código postal)
- Rango de precio
- Características (habitaciones, m², amenidades)
- Estado (disponible, alquilado, en mantenimiento)
- Etiquetas
- Equipo asignado
- Fecha de alta

## Guardar búsquedas

Puedes guardar filtros frecuentes como "Presets" para acceder rápidamente a carteras específicas.`,
    collection: 'gestionar-cuenta',
    subcollection: 'inmuebles',
    tags: ['etiquetas', 'filtros', 'búsqueda'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['gc-006', 'gc-008', 'gc-012'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-012',
    slug: 'importacion-masiva-propiedades',
    title: 'Importación masiva de propiedades',
    excerpt:
      'Importa decenas o cientos de inmuebles desde un archivo CSV o Excel en una sola operación.',
    content: `## Preparar el archivo

1. Descarga la plantilla de importación desde **Inmuebles** > **Importar**
2. Completa las columnas obligatorias: dirección, ciudad, m², precio, tipo
3. Usa los códigos de referencia para tipos de propiedad y amenidades
4. Guarda el archivo en formato CSV o XLSX

## Proceso de importación

1. Ve a **Inmuebles** > **Importar**
2. Sube el archivo
3. Revisa la vista previa y mapea columnas si es necesario
4. Inicia la importación
5. Revisa el informe de resultados (éxitos y errores)

## Errores de importación

Si hay filas con errores, el sistema te indicará qué filas fallaron y por qué. Corrige el archivo y reimporta solo las filas fallidas. Los inmuebles importados correctamente no se duplican.

## Límites y recomendaciones

- Máximo recomendado: 500 inmuebles por importación
- Para más de 500, divide en varios archivos
- Las fotos deben importarse después de la importación de datos`,
    collection: 'gestionar-cuenta',
    subcollection: 'inmuebles',
    tags: ['importación', 'CSV', 'masivo'],
    difficulty: 'advanced',
    estimatedReadTime: 6,
    relatedArticles: ['gc-006', 'gc-011', 'gc-004'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  // --- contratos (gc-013 a gc-018) ---
  {
    id: 'gc-013',
    slug: 'crear-contrato-alquiler',
    title: 'Crear un contrato de alquiler',
    excerpt:
      'Genera contratos de arrendamiento desde una plantilla, vincula inquilino e inmueble y envía a firma.',
    content: `## Crear un contrato de alquiler

1. Ve a **Contratos** > **Nuevo contrato**
2. Selecciona el **inmueble** (debe estar disponible)
3. Selecciona o crea el **inquilino**
4. Elige la **plantilla** de contrato
5. Completa los datos: fecha inicio, duración, renta, fianza, gastos
6. Revisa el documento generado
7. Envía a firma o descarga como PDF

## Datos obligatorios

- Inmueble e inquilino
- Fecha de inicio y duración
- Renta mensual
- Fianza (mínimo 1 mes en España)
- Gastos incluidos o no

## Fianza y depósito

El sistema calcula automáticamente la fianza según la legislación. Puedes añadir depósitos adicionales por mascotas o garantías si lo permite tu plantilla.

## Después de crear

Una vez firmado, el contrato se activa y podrás programar los cobros de renta desde el módulo de pagos.`,
    collection: 'gestionar-cuenta',
    subcollection: 'contratos',
    tags: ['contrato', 'alquiler', 'crear'],
    difficulty: 'beginner',
    estimatedReadTime: 6,
    relatedArticles: ['gc-014', 'gc-015', 'gc-019'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-014',
    slug: 'plantillas-contrato-personalizables',
    title: 'Plantillas de contrato personalizables',
    excerpt:
      'Crea y modifica plantillas de contrato con cláusulas personalizadas y variables dinámicas.',
    content: `## Plantillas disponibles

Inmova incluye plantillas base para alquiler residencial y comercial. Puedes duplicarlas y personalizarlas según tus necesidades.

## Crear una plantilla personalizada

1. Ve a **Configuración** > **Plantillas de contrato**
2. Duplica una plantilla existente o crea una nueva
3. Edita el contenido del documento en el editor
4. Usa variables como {{inquilino}}, {{inmueble}}, {{renta}}, {{fecha_inicio}}

## Variables dinámicas

Las variables se reemplazan automáticamente al generar el contrato:

- Datos del inquilino (nombre, DNI, email)
- Datos del inmueble (dirección, referencia)
- Datos del contrato (renta, fianza, duración)
- Datos del propietario o empresa

## Cláusulas adicionales

Añade cláusulas específicas para tu negocio: mascotas, subarriendo, uso comercial, etc. Consulta con un asesor legal para cláusulas que afecten a derechos del inquilino.`,
    collection: 'gestionar-cuenta',
    subcollection: 'contratos',
    tags: ['plantillas', 'contrato', 'personalización'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['gc-013', 'gc-015', 'gc-018'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-015',
    slug: 'firma-digital-contratos',
    title: 'Firma digital de contratos',
    excerpt:
      'Envía contratos a firma electrónica con Signaturit o DocuSign. Cumple con la normativa eIDAS.',
    content: `## Configurar firma digital

1. Ve a **Configuración** > **Integraciones**
2. Conecta Signaturit o DocuSign con tu API key
3. Guarda la configuración

## Enviar a firma

1. Crea el contrato como normalmente
2. En lugar de descargar, haz clic en **Enviar a firma**
3. Indica el orden de firmantes (inquilino, propietario, gestor)
4. El sistema envía el email con el enlace de firma

## Seguimiento

Desde el detalle del contrato verás el estado de cada firma: pendiente, firmado, rechazado. Recibirás notificaciones cuando se complete el proceso.

## Validez legal

Las firmas con Signaturit o DocuSign cumplen el Reglamento eIDAS y tienen validez legal en la UE. El documento firmado se guarda en la ficha del contrato.`,
    collection: 'gestionar-cuenta',
    subcollection: 'contratos',
    tags: ['firma digital', 'Signaturit', 'DocuSign'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['gc-013', 'gc-014', 'gc-018'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-016',
    slug: 'renovacion-automatica-contratos',
    title: 'Renovación automática de contratos',
    excerpt:
      'Configura la renovación automática de contratos con prórroga tácita o nueva firma según tu política.',
    content: `## Tipos de renovación

- **Prórroga tácita**: El contrato se renueva automáticamente si no hay denuncia previa
- **Renovación con nuevo contrato**: Se genera un nuevo documento para firmar
- **Sin renovación**: El contrato termina en la fecha indicada

## Configurar renovación automática

1. Abre el **detalle del contrato**
2. Ve a **Opciones** o **Renovación**
3. Selecciona el tipo de renovación
4. Indica el plazo de preaviso (ej: 30 días antes)
5. Si aplica IPC, activa la actualización de renta

## Notificaciones

El sistema enviará recordatorios al inquilino y al gestor antes del vencimiento. Si usas prórroga tácita, se generará el aviso de renovación según la legislación.`,
    collection: 'gestionar-cuenta',
    subcollection: 'contratos',
    tags: ['renovación', 'prórroga', 'automatización'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['gc-013', 'gc-017', 'gc-019'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-017',
    slug: 'aplicar-ipc-contratos-existentes',
    title: 'Aplicar IPC a contratos existentes',
    excerpt:
      'Actualiza la renta de contratos según el Índice de Precios al Consumo (IPC) anual.',
    content: `## Cuándo aplicar IPC

En contratos de arrendamiento en España, la renta puede actualizarse anualmente según el IPC. La fecha de actualización suele ser el aniversario del contrato.

## Proceso de actualización

1. Ve a **Contratos** > **Actualización IPC** (o similar)
2. El sistema lista los contratos que cumplen aniversario
3. Revisa el IPC aplicable (Inmova puede obtenerlo automáticamente)
4. Confirma la actualización de la renta para cada contrato
5. Genera los avisos de actualización para el inquilino

## Límites legales

- En contratos de vivienda habitual, el IPC está limitado por ley
- Revisa la normativa vigente (Ley de Vivienda 2023) para límites específicos
- En contratos de uso distinto a vivienda, puede aplicarse el IPC completo

## Comunicación al inquilino

El sistema puede generar la carta de aviso de actualización de renta con el nuevo importe y la referencia legal.`,
    collection: 'gestionar-cuenta',
    subcollection: 'contratos',
    tags: ['IPC', 'actualización', 'renta'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['gc-013', 'gc-016', 'gc-019'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-018',
    slug: 'documentacion-legal-contrato',
    title: 'Documentación legal del contrato',
    excerpt:
      'Gestiona la documentación asociada al contrato: escritura, CEE, ficha de inscripción, etc.',
    content: `## Documentos obligatorios

Para un contrato de alquiler en España suelen requerirse:

- **Certificado de Eficiencia Energética (CEE)**
- **Ficha de inscripción** en el registro de arrendamientos (si aplica)
- **Escritura** o documento acreditativo de propiedad
- **Contrato firmado** por todas las partes

## Subir documentos

1. Abre el **detalle del contrato**
2. Ve a la pestaña **Documentos**
3. Sube cada documento con su tipo correspondiente
4. Los documentos se guardan en la nube de forma segura

## Documentos del inmueble

Algunos documentos (CEE, escritura) pueden estar ya en la ficha del inmueble. Si es así, se vinculan automáticamente al contrato. Puedes subir copias específicas si lo necesitas.

## Acceso del inquilino

El inquilino puede acceder a los documentos del contrato desde su portal. Asegúrate de que la documentación esté completa antes de activar el contrato.`,
    collection: 'gestionar-cuenta',
    subcollection: 'contratos',
    tags: ['documentos', 'legal', 'CEE'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['gc-013', 'gc-009', 'gc-015'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  // --- pagos-y-cobros (gc-019 a gc-024) ---
  {
    id: 'gc-019',
    slug: 'programar-ingresos-recurrentes-renta',
    title: 'Programar ingresos recurrentes de renta',
    excerpt:
      'Configura los cobros mensuales de renta para que se generen automáticamente cada mes.',
    content: `## ¿Cómo funciona?

Cuando un contrato está activo, el sistema puede generar automáticamente los cobros de renta cada mes. El importe se toma del contrato y se programa según la fecha de vencimiento.

## Activar cobros recurrentes

1. Abre el **detalle del contrato**
2. Ve a **Pagos** o **Cobros**
3. Activa la opción **Cobros recurrentes automáticos**
4. Indica el día de vencimiento (ej: día 5 de cada mes)
5. Guarda la configuración

## Primer cobro

El primer cobro puede ser prorrateado si el contrato empieza a mitad de mes. El sistema calcula la parte proporcional automáticamente.

## Fianza y gastos

La fianza se cobra normalmente al inicio. Los gastos de comunidad, IBI, etc. pueden configurarse como cobros adicionales recurrentes o puntuales según tu modelo.`,
    collection: 'gestionar-cuenta',
    subcollection: 'pagos-y-cobros',
    tags: ['renta', 'recurrente', 'cobros'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['gc-013', 'gc-020', 'gc-021'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-020',
    slug: 'pasarela-pagos-stripe',
    title: 'Pasarela de pagos con Stripe',
    excerpt:
      'Configura Stripe para que los inquilinos paguen la renta con tarjeta o domiciliación bancaria.',
    content: `## Conectar Stripe

1. Ve a **Configuración** > **Integraciones** > **Pagos**
2. Conecta tu cuenta de Stripe (o crea una si no tienes)
3. Autoriza el acceso desde Inmova
4. Guarda la configuración

## Envío de cobros

Cuando generes un cobro, puedes enviarlo por Stripe:

- **Link de pago**: El inquilino recibe un email con enlace para pagar con tarjeta
- **Domiciliación SEPA**: El inquilino autoriza el cargo recurrente (ideal para rentas)

## Comisiones

Stripe cobra una comisión por transacción. Consulta las tarifas actuales en stripe.com. Las comisiones pueden repercutirse al inquilino o asumirlas según tu política.

## Seguridad

Los datos de tarjeta se procesan directamente en Stripe. Inmova nunca almacena información de pago sensible.`,
    collection: 'gestionar-cuenta',
    subcollection: 'pagos-y-cobros',
    tags: ['Stripe', 'pagos', 'tarjeta'],
    difficulty: 'intermediate',
    estimatedReadTime: 6,
    relatedArticles: ['gc-019', 'gc-021', 'gc-022'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-021',
    slug: 'registrar-pagos-manuales',
    title: 'Registrar pagos manuales',
    excerpt:
      'Registra pagos recibidos por transferencia, efectivo o otros medios fuera de la pasarela.',
    content: `## Cuándo usar pagos manuales

Registra pagos manuales cuando el inquilino pague por:

- Transferencia bancaria
- Efectivo
- Bizum u otro método no integrado

## Registrar un pago

1. Ve a **Pagos** o al detalle del contrato > **Cobros**
2. Localiza el cobro pendiente
3. Haz clic en **Registrar pago**
4. Indica la fecha, importe y método de pago
5. Opcionalmente, asocia un comprobante (captura de transferencia)
6. Guarda el registro

## Conciliación

Los pagos manuales deben conciliarse con el extracto bancario. Usa el módulo de conciliación bancaria para verificar que los importes coincidan con lo ingresado en tu cuenta.`,
    collection: 'gestionar-cuenta',
    subcollection: 'pagos-y-cobros',
    tags: ['pagos manuales', 'transferencia', 'registro'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['gc-019', 'gc-022', 'gc-024'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-022',
    slug: 'generar-enviar-recibos-pago',
    title: 'Generar y enviar recibos de pago',
    excerpt:
      'Crea recibos de pago profesionales y envíalos automáticamente al inquilino por email.',
    content: `## Generar un recibo

1. Abre el **detalle del cobro** o **Pagos**
2. Para un cobro pagado, haz clic en **Generar recibo**
3. El sistema genera un PDF con el recibo con el detalle del pago
4. Descarga o envía por email

## Envío automático

Puedes configurar el envío automático de recibos:

- **Configuración** > **Pagos** > **Enviar recibo automáticamente**
- Cuando se registre un pago, el inquilino recibirá el recibo por email

## Contenido del recibo

El recibo incluye: datos del inquilino, inmueble, concepto, importe, fecha, método de pago. Puedes personalizar la plantilla en Configuración si necesitas añadir tu logo o texto legal.`,
    collection: 'gestionar-cuenta',
    subcollection: 'pagos-y-cobros',
    tags: ['recibos', 'PDF', 'email'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['gc-019', 'gc-021', 'gc-028'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-023',
    slug: 'gestionar-impagos-recordatorios-automaticos',
    title: 'Gestionar impagos y recordatorios automáticos',
    excerpt:
      'Configura recordatorios automáticos para cobros vencidos y gestiona el seguimiento de impagos.',
    content: `## Recordatorios automáticos

1. Ve a **Configuración** > **Pagos** > **Recordatorios**
2. Activa los recordatorios automáticos
3. Configura los plazos: ej. recordatorio a los 3 días, 7 días y 15 días de vencimiento
4. Personaliza el mensaje del email o SMS

## Flujo de impagos

Cuando un cobro vence:

- Día 0: Se envía el cobro (si está configurado)
- Día 3: Primer recordatorio
- Día 7: Segundo recordatorio
- Día 15: Tercer recordatorio + posible aviso de procedimiento

## Seguimiento manual

Desde **Pagos** > **Impagos** verás el listado de cobros vencidos. Puedes marcar notas, registrar llamadas o iniciar procedimientos legales. El historial se mantiene para cada inquilino.`,
    collection: 'gestionar-cuenta',
    subcollection: 'pagos-y-cobros',
    tags: ['impagos', 'recordatorios', 'morosidad'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['gc-019', 'gc-021', 'gc-039'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-024',
    slug: 'conciliacion-bancaria',
    title: 'Conciliación bancaria',
    excerpt:
      'Reconcilia los movimientos bancarios con los cobros y pagos registrados en Inmova.',
    content: `## ¿Qué es la conciliación?

La conciliación bancaria permite verificar que los ingresos y gastos registrados en Inmova coinciden con los movimientos reales de tu cuenta bancaria.

## Importar extracto bancario

1. Ve a **Contabilidad** o **Pagos** > **Conciliación**
2. Importa el extracto bancario (CSV, OFX o formato compatible)
3. El sistema carga los movimientos con fecha y importe

## Conciliar movimientos

1. Compara cada movimiento del banco con los cobros/pagos registrados
2. Marca como conciliados los que coincidan
3. Para movimientos sin coincidencia, registra el pago o ajuste correspondiente
4. Revisa las diferencias pendientes

## Informe de conciliación

Al finalizar el periodo, genera el informe de conciliación que muestra el estado de cada movimiento y las diferencias pendientes.`,
    collection: 'gestionar-cuenta',
    subcollection: 'pagos-y-cobros',
    tags: ['conciliación', 'bancario', 'extracto'],
    difficulty: 'advanced',
    estimatedReadTime: 6,
    relatedArticles: ['gc-021', 'gc-033', 'gc-032'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  // --- liquidaciones (gc-025 a gc-027) ---
  {
    id: 'gc-025',
    slug: 'como-funciona-sistema-liquidaciones',
    title: 'Cómo funciona el sistema de liquidaciones',
    excerpt:
      'Entiende el flujo de liquidaciones a propietarios: ingresos, gastos, comisiones y pagos.',
    content: `## ¿Qué es una liquidación?

Una liquidación es el documento que resume los ingresos y gastos de un inmueble en un periodo, y el importe a pagar al propietario tras deducir comisiones y gastos.

## Componentes de la liquidación

- **Ingresos**: Rentas cobradas, gastos repercutidos al inquilino
- **Gastos**: Comisión de gestión, reparaciones, IBI, comunidad, seguros
- **Resultado**: Importe neto a liquidar al propietario

## Frecuencia

Las liquidaciones pueden ser mensuales o trimestrales según tu acuerdo con el propietario. Configura la frecuencia en la ficha del propietario o del inmueble.

## Flujo de trabajo

1. Se cierran los cobros del periodo
2. Se generan las liquidaciones automáticamente
3. El propietario revisa (si tiene portal)
4. Se emite el pago o transferencia
5. Se marca como liquidada`,
    collection: 'gestionar-cuenta',
    subcollection: 'liquidaciones',
    tags: ['liquidaciones', 'propietarios', 'periodo'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['gc-026', 'gc-027', 'gc-019'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-026',
    slug: 'generar-liquidaciones-propietarios',
    title: 'Generar liquidaciones para propietarios',
    excerpt:
      'Genera las liquidaciones de un periodo de forma individual o masiva.',
    content: `## Generar liquidaciones

1. Ve a **Liquidaciones** > **Generar liquidaciones**
2. Selecciona el **periodo** (mes y año)
3. El sistema lista los propietarios con inmuebles con actividad en ese periodo
4. Revisa los datos previos (ingresos, gastos, comisiones)
5. Genera las liquidaciones (individual o masiva)

## Revisión previa

Antes de generar, revisa que:

- Todos los cobros del periodo estén registrados
- Los gastos deducibles estén correctos
- La comisión de gestión esté bien configurada

## Envío al propietario

Una vez generadas, las liquidaciones pueden enviarse por email al propietario. Si tiene portal, las verá en su área de acceso.`,
    collection: 'gestionar-cuenta',
    subcollection: 'liquidaciones',
    tags: ['generar', 'liquidaciones', 'propietarios'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['gc-025', 'gc-027', 'gc-028'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-027',
    slug: 'editar-anular-liquidaciones',
    title: 'Editar y anular liquidaciones',
    excerpt:
      'Corrige errores en liquidaciones o anúlalas si se generaron por error.',
    content: `## Editar una liquidación

Si detectas un error en una liquidación ya generada:

1. Abre el **detalle de la liquidación**
2. Haz clic en **Editar** (si el estado lo permite)
3. Modifica los importes o conceptos necesarios
4. Guarda los cambios

## Cuándo se puede editar

Solo puedes editar liquidaciones en estado "Borrador" o "Pendiente". Si ya se ha pagado al propietario, deberás crear una liquidación rectificativa.

## Anular una liquidación

Para anular una liquidación generada por error:

1. Abre el detalle de la liquidación
2. Haz clic en **Anular**
3. Indica el motivo de la anulación
4. Confirma la operación

La liquidación anulada no se tendrá en cuenta para pagos. Puedes generar una nueva con los datos correctos.`,
    collection: 'gestionar-cuenta',
    subcollection: 'liquidaciones',
    tags: ['editar', 'anular', 'rectificativa'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['gc-025', 'gc-026', 'gc-031'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  // --- facturacion (gc-028 a gc-032) ---
  {
    id: 'gc-028',
    slug: 'configurar-facturacion-automatica',
    title: 'Configurar facturación automática',
    excerpt:
      'Activa la facturación automática para generar facturas de comisiones y gastos sin intervención manual.',
    content: `## Activar facturación automática

1. Ve a **Configuración** > **Facturación**
2. Activa los tipos de facturación automática que necesites:
   - Facturas de comisión de gestión al propietario
   - Facturas de gastos repercutidos
   - Facturas de servicios adicionales

## Configuración por tipo

Para cada tipo de factura, indica:

- Frecuencia (mensual, trimestral)
- Fecha de emisión
- Serie de factura
- Conceptos por defecto

## Generación automática

El sistema generará las facturas según el calendario configurado. Recibirás una notificación cuando se generen. Puedes revisarlas antes de enviarlas si lo configuras así.

## Envío al cliente

Las facturas pueden enviarse automáticamente por email al propietario o cliente. Configura la plantilla de email en Configuración.`,
    collection: 'gestionar-cuenta',
    subcollection: 'facturacion',
    tags: ['facturación', 'automática', 'comisiones'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['gc-029', 'gc-030', 'gc-026'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-029',
    slug: 'personalizar-series-facturacion',
    title: 'Personalizar series de facturación',
    excerpt:
      'Configura series de facturación (F1, F2, R1, etc.) para organizar tus facturas.',
    content: `## ¿Qué son las series?

Las series permiten numerar las facturas por tipo: facturas normales (F), rectificativas (R), facturas simplificadas (FS), etc.

## Crear una serie

1. Ve a **Configuración** > **Facturación** > **Series**
2. Haz clic en **Nueva serie**
3. Indica el prefijo (ej: F, R, PRO)
4. Indica el número inicial (ej: 1)
5. Configura el formato de numeración (F-2026-00001)

## Series por defecto

- **F**: Facturas normales
- **R**: Facturas rectificativas
- **FS**: Facturas simplificadas (tickets)
- **PRO**: Facturas a propietarios

Puedes crear series adicionales para diferentes tipos de gestión o empresas.`,
    collection: 'gestionar-cuenta',
    subcollection: 'facturacion',
    tags: ['series', 'numeración', 'facturas'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['gc-028', 'gc-031', 'gc-032'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-030',
    slug: 'impuestos-retenciones-iva-irpf',
    title: 'Impuestos y retenciones: IVA e IRPF',
    excerpt:
      'Configura el IVA y las retenciones de IRPF en tus facturas según la normativa española.',
    content: `## IVA en facturación

- **Gestión de alquileres**: Generalmente exenta de IVA (Art. 20 LIVA)
- **Servicios adicionales**: Pueden estar sujetos a IVA (21%, 10%, 4%)
- **Comisiones**: Revisa con tu asesor si aplica IVA según tu actividad

Configura el tipo de IVA por defecto en cada concepto de factura.

## Retención IRPF

Cuando facturas a profesionales o empresas que actúan como propietarios:

- Aplica retención del 15% (o 7% si es inicio de actividad)
- La retención se resta del importe a cobrar
- Debes incluir la retención en el modelo 303 y 390

## Configuración en Inmova

1. Ve a **Configuración** > **Facturación** > **Impuestos**
2. Configura los tipos de IVA que uses
3. Activa la retención IRPF si aplica
4. Asigna por defecto a cada tipo de factura`,
    collection: 'gestionar-cuenta',
    subcollection: 'facturacion',
    tags: ['IVA', 'IRPF', 'retenciones'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['gc-028', 'gc-031', 'gc-036'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-031',
    slug: 'facturas-rectificativas',
    title: 'Facturas rectificativas',
    excerpt:
      'Emite facturas rectificativas para corregir errores en facturas ya emitidas.',
    content: `## Cuándo usar facturas rectificativas

- Error en el importe
- Error en los datos del cliente
- Anulación total de una factura
- Cambio de base imponible o IVA

## Crear una factura rectificativa

1. Ve a **Facturación** > **Nueva factura rectificativa**
2. Selecciona la factura original que se rectifica
3. Indica el tipo: sustitución total o parcial
4. Introduce los importes correctos (o los de la diferencia)
5. Genera la factura rectificativa

## Numeración

Las facturas rectificativas usan una serie diferente (R o similar) y deben incluir la referencia a la factura original.

## Comunicación a Hacienda

Para facturas con IVA, la rectificativa debe incluirse en el siguiente modelo 303. El sistema puede generar el archivo para el SII si aplica.`,
    collection: 'gestionar-cuenta',
    subcollection: 'facturacion',
    tags: ['rectificativas', 'corrección', 'anulación'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['gc-028', 'gc-029', 'gc-030'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-032',
    slug: 'exportar-datos-contables',
    title: 'Exportar datos contables',
    excerpt:
      'Exporta facturas, cobros y movimientos en formatos compatibles con tu software contable.',
    content: `## Formatos de exportación

Inmova permite exportar en:

- **CSV/Excel**: Para importar en cualquier software
- **SII (Suministro Inmediato de Información)**: Para facturas con IVA
- **Formato ContaSimple**: Para integración directa
- **PDF**: Para archivo y envío

## Qué exportar

- **Facturas emitidas**: Listado con filtros por fecha
- **Facturas recibidas**: Si las registras en Inmova
- **Cobros y pagos**: Movimientos por periodo
- **Informe contable**: Resumen por cuentas

## Exportación mensual

Puedes configurar exportaciones automáticas al cierre de cada mes. Los archivos se generan y se envían por email o se guardan en un área de descarga.`,
    collection: 'gestionar-cuenta',
    subcollection: 'facturacion',
    tags: ['exportar', 'contable', 'SII'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['gc-033', 'gc-034', 'gc-024'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  // --- contabilidad (gc-033 a gc-036) ---
  {
    id: 'gc-033',
    slug: 'automatizar-contabilidad',
    title: 'Automatizar la contabilidad',
    excerpt:
      'Configura el plan de cuentas y la asignación automática de movimientos a cuentas contables.',
    content: `## Plan de cuentas

1. Ve a **Configuración** > **Contabilidad** > **Plan de cuentas**
2. Importa tu plan de cuentas (PGC español) o usa el predeterminado
3. Configura las cuentas principales que uses

## Asignación automática

Cada tipo de movimiento (cobro de renta, comisión, gasto de comunidad) puede asignarse a una cuenta contable. Así, al registrar un cobro o pago, se genera automáticamente el apunte contable.

## Configuración por concepto

1. Ve a **Configuración** > **Contabilidad** > **Conceptos**
2. Para cada concepto (renta, comisión, IBI, etc.) asigna la cuenta de débito y crédito
3. El sistema aplicará la asignación al generar registros

## Asientos automáticos

Al cerrar un periodo, el sistema puede generar los asientos de resumen automáticamente. Revisa los asientos antes de exportar.`,
    collection: 'gestionar-cuenta',
    subcollection: 'contabilidad',
    tags: ['contabilidad', 'automatización', 'plan de cuentas'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['gc-034', 'gc-035', 'gc-032'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-034',
    slug: 'integracion-conta-simple',
    title: 'Integración con ContaSimple',
    excerpt:
      'Sincroniza tus datos contables con ContaSimple para llevar la contabilidad al día.',
    content: `## Conectar ContaSimple

1. Ve a **Configuración** > **Integraciones**
2. Busca ContaSimple y haz clic en **Conectar**
3. Inicia sesión con tu cuenta de ContaSimple
4. Autoriza el acceso desde Inmova
5. Guarda la configuración

## Qué se sincroniza

- **Facturas emitidas**: Se envían a ContaSimple como facturas de venta
- **Facturas recibidas**: Si las registras en Inmova
- **Cobros y pagos**: Movimientos bancarios con asignación contable
- **Liquidaciones**: Como ingresos de servicios

## Frecuencia de sincronización

Puedes configurar la sincronización en tiempo real o programada (diaria, semanal). En tiempo real, cada factura emitida se envía automáticamente a ContaSimple.

## Revisión

ContaSimple recibe los datos y los asigna a sus cuentas. Revisa periódicamente que la asignación sea correcta en ContaSimple.`,
    collection: 'gestionar-cuenta',
    subcollection: 'contabilidad',
    tags: ['ContaSimple', 'integración', 'sincronización'],
    difficulty: 'advanced',
    estimatedReadTime: 6,
    relatedArticles: ['gc-033', 'gc-032', 'gc-035'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-035',
    slug: 'asignar-cuentas-contables-conceptos',
    title: 'Asignar cuentas contables a conceptos',
    excerpt:
      'Configura la relación entre cada concepto de ingresos/gastos y las cuentas del plan contable.',
    content: `## Conceptos y cuentas

Cada concepto (renta, comisión, IBI, etc.) debe mapearse a las cuentas contables correctas para que los asientos se generen bien.

## Configurar asignación

1. Ve a **Configuración** > **Contabilidad** > **Asignación de conceptos**
2. Para cada concepto, indica:
   - **Cuenta de débito**: Cuenta que se carga (ej: 430 para clientes)
   - **Cuenta de crédito**: Cuenta que se abona (ej: 706 para comisiones)
3. Guarda la configuración

## Ejemplos típicos

- **Cobro renta**: 430 (Clientes) / 706 (Prestación servicios)
- **Comisión gestión**: 430 / 706
- **Gasto comunidad**: 622 (Reparaciones) / 400 (Proveedores)
- **IBI**: 631 (Impuestos) / 400

## Variaciones

Si tienes diferentes tipos de gestión (residencial, comercial), puedes crear conceptos distintos con asignaciones diferentes.`,
    collection: 'gestionar-cuenta',
    subcollection: 'contabilidad',
    tags: ['cuentas', 'conceptos', 'asignación'],
    difficulty: 'intermediate',
    estimatedReadTime: 4,
    relatedArticles: ['gc-033', 'gc-034', 'gc-036'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-036',
    slug: 'informes-fiscales-modelo-180-347',
    title: 'Informes fiscales: Modelo 180 y 347',
    excerpt:
      'Genera los informes para presentar el Modelo 180 (arrendamiento urbano) y el 347 (operaciones con terceros).',
    content: `## Modelo 180

El Modelo 180 declara los contratos de arrendamiento de vivienda urbana. Inmova puede generar el informe con los datos necesarios:

1. Ve a **Informes** > **Fiscal** > **Modelo 180**
2. Selecciona el año
3. El sistema lista los contratos de arrendamiento de vivienda
4. Revisa las altas y bajas
5. Exporta o genera el archivo para presentación telemática

## Modelo 347

El Modelo 347 declara operaciones con terceros (propietarios, proveedores) que superen cierto importe anual:

1. Ve a **Informes** > **Fiscal** > **Modelo 347**
2. Selecciona el año
3. El sistema agrupa por NIF/CIF y suma importes
4. Filtra los que superen el umbral (3.005,06 €)
5. Exporta para presentación

## Fechas de presentación

- Modelo 180: Del 1 al 30 de enero
- Modelo 347: Del 1 de febrero al 30 de marzo

Consulta la normativa vigente para plazos exactos.`,
    collection: 'gestionar-cuenta',
    subcollection: 'contabilidad',
    tags: ['Modelo 180', 'Modelo 347', 'fiscal'],
    difficulty: 'advanced',
    estimatedReadTime: 6,
    relatedArticles: ['gc-033', 'gc-030', 'gc-032'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  // --- comunicacion (gc-037 a gc-040) ---
  {
    id: 'gc-037',
    slug: 'sistema-mensajeria-interna',
    title: 'Sistema de mensajería interna',
    excerpt:
      'Comunícate con inquilinos, propietarios y miembros del equipo mediante el chat interno.',
    content: `## ¿Qué es la mensajería interna?

El chat interno permite comunicarte con inquilinos y propietarios sin salir de Inmova. Todas las conversaciones quedan registradas en la ficha del cliente o inmueble.

## Iniciar una conversación

1. Abre la ficha del **inquilino** o **propietario**
2. Ve a la pestaña **Mensajes** o **Comunicación**
3. Escribe tu mensaje y envía
4. El destinatario recibirá una notificación por email (si está configurado)

## Conversaciones por contexto

Puedes asociar conversaciones a un inmueble o contrato específico. Así, toda la comunicación sobre el alquiler de un piso queda en un mismo hilo.

## Historial

Todas las conversaciones se guardan. Cualquier miembro del equipo con acceso puede ver el historial para dar continuidad al servicio.`,
    collection: 'gestionar-cuenta',
    subcollection: 'comunicacion',
    tags: ['mensajería', 'chat', 'comunicación'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['gc-038', 'gc-039', 'gc-040'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-038',
    slug: 'notificaciones-push-email',
    title: 'Notificaciones push y email',
    excerpt:
      'Configura qué notificaciones reciben los usuarios y por qué canal (email, push, SMS).',
    content: `## Tipos de notificaciones

- **Email**: Para avisos importantes (cobro pendiente, contrato por firmar)
- **Push**: Para usuarios con la app o web abierta (mensaje nuevo, recordatorio)
- **SMS**: Para mensajes urgentes (opcional, requiere configuración Twilio)

## Configurar preferencias

1. Ve a **Configuración** > **Notificaciones** (o tu perfil)
2. Activa o desactiva cada tipo de notificación
3. Elige qué eventos generan notificación:
   - Cobro generado
   - Pago recibido
   - Mensaje nuevo
   - Contrato por firmar
   - Incidencia de mantenimiento

## Notificaciones a inquilinos

Los inquilinos pueden configurar sus preferencias desde su portal. Por defecto, reciben alertas de cobros y mensajes de su gestor.`,
    collection: 'gestionar-cuenta',
    subcollection: 'comunicacion',
    tags: ['notificaciones', 'email', 'push'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['gc-037', 'gc-039', 'gc-023'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-039',
    slug: 'plantillas-email-sms-personalizables',
    title: 'Plantillas de email y SMS personalizables',
    excerpt:
      'Crea y modifica plantillas de email y SMS para recordatorios, bienvenidas y comunicaciones masivas.',
    content: `## ¿Qué son las plantillas?

Las plantillas permiten enviar mensajes estandarizados con variables que se reemplazan automáticamente (nombre, importe, fecha, etc.).

## Crear una plantilla

1. Ve a **Configuración** > **Comunicación** > **Plantillas**
2. Haz clic en **Nueva plantilla**
3. Elige el tipo: Email o SMS
4. Escribe el asunto (para email) y el contenido
5. Usa variables: {{nombre}}, {{inmueble}}, {{importe}}, {{fecha_vencimiento}}

## Plantillas predefinidas

Inmova incluye plantillas para:

- Recordatorio de cobro
- Bienvenida al inquilino
- Aviso de renovación de contrato
- Confirmación de cita
- Notificación de incidencia

Puedes personalizarlas con tu branding y tono de voz.

## Envío masivo

Para campañas o avisos, usa el envío masivo seleccionando la plantilla y el grupo de destinatarios (filtro por inmuebles, estado de contrato, etc.).`,
    collection: 'gestionar-cuenta',
    subcollection: 'comunicacion',
    tags: ['plantillas', 'email', 'SMS'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['gc-037', 'gc-038', 'gc-023'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'gc-040',
    slug: 'calendario-agenda-gestion',
    title: 'Calendario y agenda de gestión',
    excerpt:
      'Organiza visitas, inspecciones, citas de firma y tareas con el calendario integrado.',
    content: `## ¿Qué incluye el calendario?

El calendario centraliza:

- **Visitas a inmuebles**: Programadas desde la ficha del inmueble
- **Citas de firma**: Vinculadas a contratos pendientes
- **Inspecciones**: Revisiones periódicas
- **Tareas**: Recordatorios y acciones pendientes

## Crear un evento

1. Ve a **Calendario** (o al widget en el dashboard)
2. Haz clic en la fecha y hora
3. Elige el tipo de evento
4. Asocia a inmueble, contrato o inquilino si aplica
5. Añade invitados (opcional)
6. Guarda el evento

## Vista y filtros

Puedes ver el calendario por día, semana o mes. Filtra por tipo de evento, equipo o inmueble. Los eventos se sincronizan con tu agenda si configuras la integración con Google Calendar o Outlook.

## Recordatorios

Configura recordatorios por email o push antes de cada evento para no perder ninguna cita.`,
    collection: 'gestionar-cuenta',
    subcollection: 'comunicacion',
    tags: ['calendario', 'agenda', 'citas'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['gc-037', 'gc-013', 'gc-006'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
];
