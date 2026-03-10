import type { HelpArticle } from '../types';

export const comoEmpezarArticles: HelpArticle[] = [
  {
    id: 'ce-001',
    slug: 'primeros-pasos-con-inmova',
    title: 'Primeros pasos con Inmova',
    excerpt:
      'Descubre la plataforma Inmova y cómo puede ayudarte a gestionar tus propiedades de forma profesional y eficiente.',
    content: `## ¿Qué es Inmova?

Inmova es una plataforma PropTech diseñada para la gestión integral de propiedades inmobiliarias. Ya seas propietario, gestor, administrador de fincas o inversor, Inmova te permite centralizar toda la información en un solo lugar.

## Funcionalidades principales

- **Gestión de inmuebles**: Registra edificios, unidades y apartamentos con toda su documentación
- **Contratos digitales**: Crea y firma contratos de alquiler con firma digital integrada
- **Cobros automáticos**: Configura pagos recurrentes con Stripe
- **Portal del inquilino**: Ofrece autoservicio a tus inquilinos
- **Incidencias**: Gestiona mantenimiento con clasificación por IA
- **Informes y liquidaciones**: Genera reportes para propietarios e inversores

## Primeros pasos recomendados

1. Configura tu empresa y perfil en **Configuración > Empresa**
2. Añade tu primer edificio o propiedad
3. Registra las unidades disponibles
4. Crea tu primer contrato de alquiler
5. Invita a tu equipo si trabajas con colaboradores

## ¿Necesitas ayuda?

Consulta los artículos específicos según tu modelo de negocio: alquiler propio, gestión integral, habitaciones, coliving o inversión.`,
    collection: 'como-empezar',
    tags: ['inicio', 'overview', 'plataforma', 'primeros pasos'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['ce-002', 'ce-008', 'ce-009'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-002',
    slug: 'como-empezar-si-gestionas-tus-propios-alquileres',
    title: 'Cómo empezar si gestionas tus propios alquileres',
    excerpt:
      'Guía paso a paso para propietarios que gestionan directamente sus inmuebles en alquiler.',
    content: `## Perfil ideal

Si tienes una o varias propiedades en alquiler y las gestionas tú mismo sin intermediarios, Inmova te permite profesionalizar la gestión sin contratar una gestoría.

## Configuración inicial

1. **Crea tu empresa**: En Configuración > Empresa, introduce los datos fiscales de tu actividad
2. **Añade tus propiedades**: Registra cada inmueble con dirección, características y documentación
3. **Configura las unidades**: Si es un edificio, añade cada apartamento; si es vivienda completa, regístrala como unidad única

## Gestión del día a día

- **Contratos**: Usa plantillas predefinidas para crear contratos de alquiler en minutos
- **Firma digital**: Envía el contrato por email para que el inquilino firme online
- **Cobros**: Activa los pagos automáticos con tarjeta o domiciliación bancaria
- **Incidencias**: Recibe y gestiona las solicitudes de mantenimiento desde el portal

## Recomendaciones

- Activa el **portal del inquilino** para que puedan consultar recibos, abrir incidencias y comunicarse contigo
- Configura **alertas** para impagos o vencimientos de contrato
- Revisa los **informes mensuales** para tener visibilidad de tu cartera`,
    collection: 'como-empezar',
    tags: ['propietario', 'alquiler', 'autogestión', 'vivienda'],
    difficulty: 'beginner',
    estimatedReadTime: 7,
    relatedArticles: ['ce-001', 'ce-009', 'ce-011', 'ce-012'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-003',
    slug: 'como-empezar-si-haces-gestion-integral-multi-propietario',
    title: 'Cómo empezar si haces gestión integral multi-propietario',
    excerpt:
      'Configura Inmova para gestionar propiedades de múltiples propietarios con liquidaciones y reportes.',
    content: `## Modelo de gestión integral

Como gestor de propiedades, administras inmuebles de terceros a cambio de una comisión. Inmova te permite gestionar múltiples propietarios, generar liquidaciones y mantener la trazabilidad de cada operación.

## Estructura recomendada

1. **Empresa**: Tu gestoría como empresa principal
2. **Propietarios**: Crea un "propietario" por cada cliente que te encarga propiedades
3. **Inmuebles**: Asocia cada propiedad al propietario correspondiente
4. **Liquidaciones**: Configura el porcentaje o cuota fija de comisión por propiedad

## Flujo de trabajo

- **Alta de nuevo encargo**: Añade el edificio, las unidades y el contrato vigente si existe
- **Cobro de rentas**: Los pagos entran a tu cuenta; Inmova registra cada cobro
- **Liquidación mensual**: Genera el informe de ingresos, gastos y comisión para cada propietario
- **Comunicación**: Usa el portal del propietario para enviar liquidaciones y documentación

## Funciones clave

- **Múltiples usuarios**: Invita a tu equipo con roles (administrador, gestor, contable)
- **Plantillas de contrato**: Personaliza con los datos de tu gestoría
- **Histórico**: Mantén el historial completo de cada propiedad para auditorías`,
    collection: 'como-empezar',
    tags: ['gestoría', 'multi-propietario', 'liquidaciones', 'comisiones'],
    difficulty: 'beginner',
    estimatedReadTime: 8,
    relatedArticles: ['ce-002', 'ce-008', 'ce-014', 'ce-016'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-004',
    slug: 'como-empezar-si-alquilas-por-habitaciones',
    title: 'Cómo empezar si alquilas por habitaciones',
    excerpt:
      'Configura Inmova para gestionar alquileres por habitaciones en una misma vivienda.',
    content: `## Alquiler por habitaciones

Si alquilas habitaciones individuales dentro de una misma vivienda (piso compartido), Inmova te permite registrar cada habitación como unidad independiente con su propio contrato e inquilino.

## Configuración de la vivienda

1. **Edificio**: Crea el edificio con la dirección completa
2. **Unidad**: Registra la vivienda completa (piso o casa) como una unidad
3. **Habitaciones**: Dentro de la unidad, añade cada habitación como "sub-unidad" o habitación individual
4. **Precios**: Asigna el precio de alquiler a cada habitación según tamaño y características

## Gestión de inquilinos

- Cada habitación puede tener su propio **contrato** con fecha de inicio y fin independiente
- Los **pagos** se configuran por habitación; cada inquilino paga solo su parte
- Las **incidencias** pueden asignarse a zonas comunes (cocina, baño) o a habitaciones específicas

## Consideraciones

- **Gastos comunes**: Si hay gastos compartidos (luz, internet), configúralos como gastos de la unidad y reparte entre habitaciones
- **Portal del inquilino**: Cada inquilino verá solo su habitación, contrato y pagos
- **Entradas y salidas**: Gestiona las altas y bajas de forma independiente sin afectar al resto`,
    collection: 'como-empezar',
    tags: ['habitaciones', 'piso compartido', 'alquiler por habitaciones'],
    difficulty: 'beginner',
    estimatedReadTime: 7,
    relatedArticles: ['ce-005', 'ce-009', 'ce-010', 'ce-012'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-005',
    slug: 'como-empezar-con-coliving',
    title: 'Cómo empezar con coliving',
    excerpt:
      'Configura Inmova para operaciones de coliving: paquetes, eventos y matching de inquilinos.',
    content: `## ¿Qué es coliving en Inmova?

El módulo de coliving está diseñado para operadores que ofrecen vivienda compartida con servicios incluidos: wifi, limpieza, eventos comunitarios y espacios comunes.

## Configuración básica

1. **Edificio/Propiedad**: Registra el inmueble de coliving
2. **Habitaciones y zonas comunes**: Define cada habitación y los espacios compartidos
3. **Paquetes**: Crea paquetes de alquiler (básico, premium, con parking, etc.)
4. **Servicios incluidos**: Marca qué incluye cada paquete (limpieza, eventos, coworking)

## Funciones específicas de coliving

- **Matching de inquilinos**: La IA sugiere compatibilidad entre inquilinos según preferencias
- **Eventos**: Programa y comunica eventos comunitarios a los residentes
- **Calendario de entradas/salidas**: Visualiza la ocupación y rotación
- **Pagos todo incluido**: Configura el precio mensual con servicios incluidos

## Primeros pasos

1. Configura tu empresa y el edificio de coliving
2. Añade las habitaciones con fotos y descripciones
3. Crea al menos un paquete de alquiler
4. Activa el portal del inquilino para reservas y autogestión
5. Configura las notificaciones para eventos y novedades`,
    collection: 'como-empezar',
    tags: ['coliving', 'habitaciones', 'paquetes', 'comunidad'],
    difficulty: 'beginner',
    estimatedReadTime: 7,
    relatedArticles: ['ce-004', 'ce-009', 'ce-018'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-006',
    slug: 'como-empezar-como-inversor-inmobiliario',
    title: 'Cómo empezar como inversor inmobiliario',
    excerpt:
      'Usa Inmova para gestionar tu cartera de inversiones inmobiliarias y analizar rentabilidad.',
    content: `## Perfil del inversor

Si inviertes en propiedades para alquilar (buy-to-let) o tienes una cartera de activos inmobiliarios, Inmova te ayuda a centralizar la gestión y analizar el rendimiento.

## Configuración para inversores

1. **Empresa o persona física**: Configura según tu estructura (sociedad, autónomo, etc.)
2. **Propiedades**: Registra cada activo con datos de compra, valoración y características
3. **Contratos vigentes**: Importa o crea los contratos existentes
4. **Gestión delegada**: Si usas gestoría, invítala como usuario para que gestione por ti

## Métricas clave

- **Rentabilidad bruta y neta**: Inmova calcula el yield de cada propiedad
- **Cash flow**: Visualiza ingresos y gastos mensuales
- **Vacancy rate**: Tiempo de vacancia entre inquilinos
- **Gastos de mantenimiento**: Histórico de incidencias y costes

## Flujo recomendado

1. Añade todas tus propiedades a la plataforma
2. Registra los contratos vigentes y fechas de vencimiento
3. Configura alertas para vencimientos y renovaciones
4. Revisa el dashboard de inversiones para decisiones de compra/venta
5. Exporta informes para tu asesor fiscal o gestoría`,
    collection: 'como-empezar',
    tags: ['inversor', 'cartera', 'rentabilidad', 'análisis'],
    difficulty: 'beginner',
    estimatedReadTime: 6,
    relatedArticles: ['ce-001', 'ce-009', 'ce-015'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-007',
    slug: 'como-empezar-como-administrador-de-fincas',
    title: 'Cómo empezar como administrador de fincas',
    excerpt:
      'Configura Inmova para administrar comunidades de propietarios: cuotas, gastos y asambleas.',
    content: `## Administración de fincas

Como administrador de fincas, gestionas comunidades de propietarios: cuotas de comunidad, derramas, asambleas y proveedores. Inmova te permite centralizar esta información junto con la gestión de alquileres si también la ofreces.

## Configuración inicial

1. **Empresa**: Datos de tu administración de fincas
2. **Edificios**: Cada comunidad como un edificio con su CIF y datos registrales
3. **Unidades**: Cada portal o vivienda de la comunidad
4. **Propietarios**: Asocia cada unidad a su propietario o inquilino actual

## Funciones principales

- **Cuotas de comunidad**: Configura la cuota mensual y genera los recibos
- **Gastos comunes**: Registra derramas, reparaciones y gastos extraordinarios
- **Asambleas**: Crea convocatorias, orden del día y actas
- **Votaciones**: Gestiona votaciones online para puntos del día
- **Proveedores**: Mantén el listado de proveedores habituales (ascensores, limpieza, etc.)

## Integración con alquileres

Si además gestionas alquileres de propietarios de la comunidad, Inmova une ambas funciones: el propietario ve sus cuotas de comunidad y los ingresos por alquiler en un mismo panel.`,
    collection: 'como-empezar',
    tags: ['administrador', 'comunidad', 'fincas', 'cuotas'],
    difficulty: 'beginner',
    estimatedReadTime: 8,
    relatedArticles: ['ce-003', 'ce-008', 'ce-009'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-008',
    slug: 'configurar-tu-empresa-y-perfil',
    title: 'Configurar tu empresa y perfil',
    excerpt:
      'Configura los datos de tu empresa, perfil de usuario y preferencias de la plataforma.',
    content: `## Configuración de empresa

La primera vez que accedes a Inmova, debes configurar los datos de tu empresa o actividad.

### Datos obligatorios

- **Nombre o razón social**: Nombre con el que aparecerás en contratos y facturas
- **CIF/NIF**: Identificación fiscal
- **Dirección fiscal**: Para facturación y documentación legal
- **Email y teléfono de contacto**: Para comunicaciones con inquilinos y proveedores

### Dónde configurarlo

1. Ve a **Configuración** (icono de engranaje en el menú)
2. Selecciona **Empresa**
3. Completa todos los campos del formulario
4. Guarda los cambios

## Perfil de usuario

Tu perfil personal incluye:

- Nombre y apellidos
- Email (usado para login)
- Foto de perfil
- Preferencias de notificaciones (email, push, in-app)

## Recomendaciones

- Usa un email profesional para la empresa
- Verifica que el CIF sea correcto antes de generar facturas
- Configura la firma digital si vas a enviar contratos para firma online`,
    collection: 'como-empezar',
    tags: ['configuración', 'empresa', 'perfil', 'datos fiscales'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['ce-001', 'ce-009', 'ce-017'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-009',
    slug: 'anadir-tu-primer-edificio',
    title: 'Añadir tu primer edificio',
    excerpt:
      'Aprende a registrar un edificio o propiedad en Inmova con todos sus datos y documentación.',
    content: `## ¿Qué es un edificio en Inmova?

Un edificio es la entidad que agrupa una o varias unidades habitables. Puede ser un bloque de pisos, una casa unifamiliar, un local comercial o cualquier inmueble que gestiones.

## Pasos para añadir un edificio

1. Ve a **Inmuebles > Edificios**
2. Haz clic en **Añadir edificio**
3. Completa los datos básicos:
   - **Dirección**: Calle, número, código postal, ciudad
   - **Referencia catastral**: Si la tienes
   - **Año de construcción**: Para informes y valoraciones
   - **Tipo**: Residencial, comercial, mixto, etc.

4. Añade documentación (opcional):
   - Cédula de habitabilidad
   - Certificado energético
   - Licencia de primera ocupación

5. Guarda el edificio

## Después de crear el edificio

Una vez creado, podrás:

- Añadir **unidades** (apartamentos, locales, habitaciones)
- Asignar **propietario** si gestionas para terceros
- Subir **fotos** y planos
- Configurar **gastos recurrentes** (IBI, seguros, comunidad)`,
    collection: 'como-empezar',
    tags: ['edificio', 'inmueble', 'propiedad', 'registro'],
    difficulty: 'beginner',
    estimatedReadTime: 5,
    relatedArticles: ['ce-008', 'ce-010', 'ce-011'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-010',
    slug: 'registrar-unidades-y-apartamentos',
    title: 'Registrar unidades y apartamentos',
    excerpt:
      'Cómo añadir y configurar las unidades habitables dentro de un edificio.',
    content: `## ¿Qué es una unidad?

Una unidad es cada espacio habitable o alquilable dentro de un edificio: un piso, un apartamento, una habitación o un local. Cada unidad puede tener su propio contrato e inquilino.

## Crear una unidad

1. Entra en el **edificio** correspondiente
2. Ve a la pestaña **Unidades**
3. Haz clic en **Añadir unidad**
4. Completa los datos:
   - **Nombre o identificador**: Ej. "Piso 1A", "Local bajo"
   - **Tipo**: Vivienda completa, habitación, local
   - **Superficie** en m²
   - **Habitaciones y baños**
   - **Precio de alquiler** (si está disponible)

## Para alquiler por habitaciones

Si el edificio es un piso compartido:

1. Crea la unidad principal (el piso completo)
2. Dentro de la unidad, añade **habitaciones** como sub-unidades
3. Asigna precio y características a cada habitación

## Documentación por unidad

Puedes asociar a cada unidad:

- Certificado energético
- Fotos e imágenes
- Planos
- Estado de conservación

Una vez registradas las unidades, estarás listo para crear contratos y registrar inquilinos.`,
    collection: 'como-empezar',
    tags: ['unidades', 'apartamentos', 'habitaciones', 'registro'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['ce-009', 'ce-011', 'ce-012'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-011',
    slug: 'crear-tu-primer-contrato-de-alquiler',
    title: 'Crear tu primer contrato de alquiler',
    excerpt:
      'Guía paso a paso para crear y enviar un contrato de alquiler con firma digital.',
    content: `## Crear un contrato desde cero

1. Ve a **Contratos > Nuevo contrato**
2. Selecciona la **unidad** a alquilar
3. Elige una **plantilla** (contrato de arrendamiento de vivienda habitual, uso turístico, etc.)
4. Completa los datos del contrato:
   - **Inquilino**: Nombre, DNI, email (o selecciona uno ya registrado)
   - **Fechas**: Inicio y fin del contrato
   - **Precio**: Renta mensual y fianza
   - **Condiciones**: Cláusulas específicas si las hay

5. Revisa el **documento generado** (PDF)
6. Envía para **firma digital** o descárgalo para firma presencial

## Plantillas disponibles

Inmova incluye plantillas según la Ley de Arrendamientos Urbanos (LAU):

- Arrendamiento de vivienda habitual
- Arrendamiento de uso distinto del de vivienda
- Arrendamiento de temporada (si aplica en tu comunidad)

Puedes personalizar las plantillas en Configuración > Plantillas de contrato.

## Firma digital

Si has configurado Signaturit o DocuSign, el inquilino recibirá un email con un enlace para firmar online. Una vez firmado, el contrato quedará archivado automáticamente.`,
    collection: 'como-empezar',
    tags: ['contrato', 'alquiler', 'firma digital', 'plantilla'],
    difficulty: 'beginner',
    estimatedReadTime: 6,
    relatedArticles: ['ce-010', 'ce-012', 'ce-017'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-012',
    slug: 'registrar-un-inquilino',
    title: 'Registrar un inquilino',
    excerpt:
      'Cómo dar de alta un inquilino en la plataforma y asociarlo a un contrato.',
    content: `## Alta de inquilino

Antes de crear un contrato, debes tener al inquilino registrado en Inmova. Puedes hacerlo de dos formas:

### Opción 1: Al crear el contrato

Al crear un nuevo contrato, si el inquilino no existe, puedes introducir sus datos directamente. Inmova creará el registro automáticamente.

### Opción 2: Registro previo

1. Ve a **Inquilinos > Añadir inquilino**
2. Completa los datos:
   - **Nombre y apellidos**
   - **DNI/NIE**
   - **Email** (obligatorio para el portal y comunicaciones)
   - **Teléfono**
   - **Dirección** (opcional, para facturación)

3. Guarda el inquilino

## Asociar inquilino a contrato

Una vez registrado, al crear o editar un contrato podrás seleccionar el inquilino del listado. El contrato quedará vinculado a la unidad y al inquilino.

## Portal del inquilino

Cuando actives el portal del inquilino, cada inquilino recibirá un email con sus credenciales para acceder. Desde el portal podrá:

- Ver sus recibos y estado de pagos
- Abrir incidencias de mantenimiento
- Descargar documentos
- Comunicarse contigo`,
    collection: 'como-empezar',
    tags: ['inquilino', 'registro', 'contrato', 'alta'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['ce-011', 'ce-013', 'ce-018'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-013',
    slug: 'configurar-pagos-automaticos',
    title: 'Configurar pagos automáticos',
    excerpt:
      'Activa el cobro automático de rentas con tarjeta o domiciliación bancaria.',
    content: `## Requisitos previos

Para configurar pagos automáticos necesitas:

- Cuenta de **Stripe** conectada a Inmova
- Contrato de alquiler activo con inquilino registrado
- Email del inquilino para enviar los cargos

## Pasos de configuración

1. **Conecta Stripe**: Ve a Configuración > Pagos > Stripe y sigue el asistente de conexión
2. **Crea un recibo**: Para cada contrato, genera el recibo de la renta mensual
3. **Configura el pago recurrente**: Marca el recibo como "cobro automático"
4. **Solicita el método de pago**: El inquilino recibirá un email para añadir su tarjeta o cuenta bancaria

## Opciones de pago

- **Tarjeta**: El inquilino guarda su tarjeta y se cobra automáticamente cada mes
- **Domiciliación SEPA**: Para cuentas bancarias europeas (proceso de mandato)
- **Fechas de cobro**: Configura el día del mes en que se realizará el cargo

## Gestión de impagos

Inmova te alerta si un pago falla. Puedes:

- Reintentar el cobro manualmente
- Enviar recordatorio al inquilino
- Configurar reintentos automáticos (hasta 3 intentos)

Los impagos quedan registrados en el historial del contrato para tu seguimiento.`,
    collection: 'como-empezar',
    tags: ['pagos', 'Stripe', 'cobro automático', 'domiciliación'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['ce-012', 'ce-016', 'ce-018'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-014',
    slug: 'invitar-usuarios-a-tu-equipo',
    title: 'Invitar usuarios a tu equipo',
    excerpt:
      'Añade colaboradores a tu cuenta con diferentes roles y permisos.',
    content: `## ¿Por qué invitar usuarios?

Si trabajas con un equipo (gestores, administradores, contables), puedes invitarlos a Inmova para que accedan a la información según su rol, sin compartir contraseñas.

## Invitar un usuario

1. Ve a **Configuración > Equipo**
2. Haz clic en **Invitar usuario**
3. Introduce el **email** del nuevo usuario
4. Selecciona el **rol**:
   - **Administrador**: Acceso total a la plataforma
   - **Gestor**: Gestiona inmuebles, contratos e inquilinos (sin configuración)
   - **Contable**: Acceso a facturación, liquidaciones e informes
   - **Soporte**: Solo lectura o gestión de incidencias

5. Envía la invitación

## Aceptar la invitación

El usuario recibirá un email con un enlace. Al hacer clic, creará su contraseña y accederá a Inmova con los permisos asignados.

## Gestionar el equipo

- **Editar rol**: Cambia los permisos de un usuario en cualquier momento
- **Desactivar**: Si un colaborador deja el equipo, desactiva su cuenta (no la elimines si hay historial)
- **Auditoría**: Revisa quién ha hecho qué en Configuración > Registro de actividad`,
    collection: 'como-empezar',
    tags: ['equipo', 'usuarios', 'roles', 'permisos'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['ce-008', 'ce-003'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-015',
    slug: 'personalizar-tu-dashboard',
    title: 'Personalizar tu dashboard',
    excerpt:
      'Configura el panel principal para ver las métricas y accesos que más te interesan.',
    content: `## ¿Qué es el dashboard?

El dashboard es la pantalla principal al acceder a Inmova. Muestra un resumen de tu actividad: propiedades, contratos, pagos pendientes, incidencias abiertas, etc.

## Widgets disponibles

Puedes activar o desactivar los siguientes widgets:

- **Resumen de cartera**: Número de propiedades, ocupación, vacantes
- **Pagos del mes**: Cobros pendientes y realizados
- **Incidencias abiertas**: Mantenimiento pendiente
- **Próximos vencimientos**: Contratos que terminan en los próximos 90 días
- **Actividad reciente**: Últimas acciones en la plataforma
- **Gráfico de ingresos**: Evolución mensual (para inversores y gestores)

## Cómo personalizar

1. Ve al **Dashboard**
2. Haz clic en **Personalizar** (icono de engranaje o "Editar widgets")
3. Arrastra los widgets para cambiar el orden
4. Activa o desactiva los que quieras ver
5. Guarda la configuración

## Atajos rápidos

El dashboard incluye accesos directos a las acciones más frecuentes:

- Añadir propiedad
- Crear contrato
- Registrar pago manual
- Abrir incidencia

Personaliza según tu flujo de trabajo habitual.`,
    collection: 'como-empezar',
    tags: ['dashboard', 'personalización', 'widgets', 'panel'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['ce-001', 'ce-006', 'ce-020'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-016',
    slug: 'conectar-tu-cuenta-bancaria-con-stripe',
    title: 'Conectar tu cuenta bancaria con Stripe',
    excerpt:
      'Configura Stripe para recibir los cobros de alquileres en tu cuenta bancaria.',
    content: `## ¿Qué es Stripe?

Stripe es la pasarela de pagos que utiliza Inmova para cobrar las rentas. Los inquilinos pagan con tarjeta o domiciliación bancaria, y tú recibes el dinero en tu cuenta.

## Proceso de conexión

1. Ve a **Configuración > Pagos > Stripe**
2. Haz clic en **Conectar con Stripe**
3. Serás redirigido a Stripe para crear una cuenta o iniciar sesión
4. Completa la **verificación de identidad** (obligatoria por normativa)
5. Añade tu **cuenta bancaria** donde quieres recibir los ingresos
6. Autoriza la conexión con Inmova

## Configuración de pagos

- **Modo de prueba**: Usa las claves de test para desarrollar sin cobrar real
- **Modo live**: Cambia a las claves de producción cuando estés listo
- **Comisiones**: Stripe cobra una comisión por transacción; consulta sus tarifas

## Seguridad

- Inmova nunca almacena datos de tarjetas
- Stripe cumple con PCI-DSS
- Los pagos se procesan de forma segura

## Sincronización

Una vez conectado, los cobros realizados en Inmova se reflejarán automáticamente en tu cuenta Stripe y en los informes de la plataforma.`,
    collection: 'como-empezar',
    tags: ['Stripe', 'cuenta bancaria', 'pagos', 'conexión'],
    difficulty: 'intermediate',
    estimatedReadTime: 6,
    relatedArticles: ['ce-013', 'ce-008'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-017',
    slug: 'configurar-firma-digital-de-documentos',
    title: 'Configurar firma digital de documentos',
    excerpt:
      'Activa Signaturit o DocuSign para que inquilinos y propietarios firmen contratos online.',
    content: `## ¿Por qué firma digital?

La firma digital permite enviar contratos por email y que el destinatario los firme desde cualquier dispositivo, sin imprimir ni escanear. El documento firmado tiene validez legal (eIDAS).

## Integraciones disponibles

Inmova soporta:

- **Signaturit**: Integración nativa, recomendada para España
- **DocuSign**: Alternativa internacional

## Configuración con Signaturit

1. Crea una cuenta en [Signaturit](https://www.signaturit.com)
2. Obtén las **credenciales API** (Client ID y Secret)
3. En Inmova: **Configuración > Firma digital**
4. Introduce las credenciales y guarda
5. Prueba enviando un contrato de prueba

## Flujo de firma

1. Creas el contrato en Inmova
2. Haces clic en **Enviar para firma**
3. El inquilino recibe un email con enlace
4. Abre el enlace, revisa el documento y firma
5. Tú recibes una notificación cuando está firmado
6. El PDF firmado se archiva automáticamente en el contrato

## Requisitos

- Email válido del firmante
- Conexión a internet
- Navegador actualizado (Chrome, Firefox, Safari, Edge)`,
    collection: 'como-empezar',
    tags: ['firma digital', 'Signaturit', 'DocuSign', 'contratos'],
    difficulty: 'intermediate',
    estimatedReadTime: 5,
    relatedArticles: ['ce-011', 'ce-008'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-018',
    slug: 'activar-el-portal-del-inquilino',
    title: 'Activar el portal del inquilino',
    excerpt:
      'Habilita el portal de autoservicio para que tus inquilinos accedan a recibos, incidencias y documentos.',
    content: `## ¿Qué es el portal del inquilino?

Es un espacio privado donde cada inquilino puede ver su información sin tener que contactarte: recibos, estado de pagos, abrir incidencias, descargar documentos y enviar mensajes.

## Activar el portal

1. Ve a **Configuración > Portales**
2. En **Portal del inquilino**, activa la opción
3. Personaliza (opcional):
   - Logo de tu empresa
   - Mensaje de bienvenida
   - Enlaces de ayuda o contacto

## Dar acceso a los inquilinos

Cuando creas un contrato con un inquilino que tiene email, Inmova puede enviarle automáticamente las credenciales de acceso. O bien:

1. Ve a **Inquilinos**
2. Selecciona el inquilino
3. Haz clic en **Enviar invitación al portal**
4. El inquilino recibe un email con enlace para crear su contraseña

## Qué puede hacer el inquilino

- Ver sus **recibos** y descargarlos en PDF
- Consultar el **estado de pagos** (al día, pendiente, impago)
- **Abrir incidencias** de mantenimiento con fotos
- **Descargar** el contrato y documentos asociados
- **Enviar mensajes** al propietario o gestor
- Actualizar sus **datos de contacto** (opcional)`,
    collection: 'como-empezar',
    tags: ['portal', 'inquilino', 'autoservicio', 'acceso'],
    difficulty: 'beginner',
    estimatedReadTime: 4,
    relatedArticles: ['ce-012', 'ce-013', 'ce-019'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-019',
    slug: 'configurar-notificaciones-y-alertas',
    title: 'Configurar notificaciones y alertas',
    excerpt:
      'Configura qué notificaciones recibir por email o en la app: impagos, vencimientos, incidencias.',
    content: `## Tipos de notificaciones

Inmova puede avisarte de:

- **Pagos**: Cobro realizado, pago fallido, impago
- **Contratos**: Próximo vencimiento, renovación pendiente
- **Incidencias**: Nueva incidencia, cambio de estado, resolución
- **Documentos**: Contrato firmado, documento subido
- **Equipo**: Nuevo usuario invitado, cambio de permisos

## Dónde configurarlo

1. Ve a **Configuración > Notificaciones**
2. Verás una lista de eventos con opciones:
   - **Email**: Recibir correo cuando ocurra
   - **In-app**: Ver notificación dentro de Inmova
   - **Push**: Si usas la app móvil (cuando esté disponible)

3. Activa o desactiva según tus preferencias
4. Guarda los cambios

## Alertas críticas (recomendado activar)

- **Pago fallido**: Para actuar rápido ante impagos
- **Contrato vence en 30 días**: Para planificar renovaciones
- **Nueva incidencia urgente**: Mantenimiento que requiere atención inmediata

## Frecuencia

Puedes elegir para algunas alertas:

- **Inmediato**: Cada evento genera una notificación
- **Resumen diario**: Un email al día con el resumen
- **Desactivado**: No recibir ese tipo de notificación`,
    collection: 'como-empezar',
    tags: ['notificaciones', 'alertas', 'email', 'configuración'],
    difficulty: 'beginner',
    estimatedReadTime: 3,
    relatedArticles: ['ce-018', 'ce-013', 'ce-008'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'ce-020',
    slug: 'video-tour-completo-de-la-plataforma',
    title: 'Video tour completo de la plataforma',
    excerpt:
      'Recorrido en video por todas las secciones principales de Inmova (10 minutos).',
    content: `## Contenido del video tour

Este video recorre las principales funcionalidades de Inmova en aproximadamente 10 minutos. Ideal para nuevos usuarios que quieren una visión general antes de profundizar.

## Secciones que verás

1. **Dashboard**: Panel principal, widgets y atajos
2. **Inmuebles**: Cómo navegar edificios y unidades
3. **Contratos**: Listado, filtros y creación de nuevo contrato
4. **Inquilinos**: Gestión de inquilinos y asociación a contratos
5. **Pagos**: Recibos, cobros y estado de pagos
6. **Incidencias**: Cómo se crean y gestionan las incidencias de mantenimiento
7. **Portales**: Configuración del portal del inquilino
8. **Configuración**: Empresa, equipo, integraciones y preferencias

## Cómo ver el video

- Accede desde **Academy** en el menú del centro de ayuda
- O desde el enlace directo en la bienvenida de nuevos usuarios
- Disponible en español

## Después del video

Una vez visto, te recomendamos seguir con los artículos específicos según tu caso:

- Propietario: "Cómo empezar si gestionas tus propios alquileres"
- Gestor: "Cómo empezar si haces gestión integral multi-propietario"
- Coliving: "Cómo empezar con coliving"

O bien los artículos de configuración: empresa, primer edificio, primer contrato.`,
    collection: 'como-empezar',
    tags: ['video', 'tour', 'tutorial', 'overview'],
    difficulty: 'beginner',
    estimatedReadTime: 10,
    relatedArticles: ['ce-001', 'ce-002', 'ce-008', 'ce-015'],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
    videoUrl: 'https://academy.inmovaapp.com/tour-completo',
  },
];
