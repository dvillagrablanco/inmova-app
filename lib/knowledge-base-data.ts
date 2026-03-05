/**
 * Base de conocimientos para respuestas automáticas
 */

export interface KnowledgeArticle {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  relatedArticles?: string[];
  keywords: string[];
}

export const knowledgeBase: KnowledgeArticle[] = [
  {
    id: 'kb-001',
    category: 'primeros_pasos',
    title: 'Cómo crear tu primer edificio',
    excerpt: 'Guía paso a paso para registrar tu primera propiedad en INMOVA',
    content: `
# Cómo crear tu primer edificio

## Paso 1: Accede al módulo de Edificios
Desde el menú lateral, haz clic en "Edificios" y luego en el botón "Nuevo Edificio".

## Paso 2: Completa la información básica
- **Nombre del edificio**: Un nombre descriptivo (Ej: "Edificio Alameda")
- **Dirección**: La dirección completa incluyendo código postal
- **Tipo de propiedad**: Residencial, comercial, oficina, etc.

## Paso 3: Define las unidades
Indica cuántas unidades tiene el edificio (apartamentos, locales, etc.) y puedes crearlas automáticamente.

## Paso 4: Información del propietario
Registra los datos del propietario de la propiedad.

## Paso 5: Guarda y finaliza
Revisa toda la información y haz clic en "Crear Edificio". ¡Ya está listo!

**Tip**: Puedes usar el Wizard de creación que te guiará paso a paso.
    `,
    tags: ['edificios', 'primeros pasos', 'tutorial'],
    keywords: ['crear', 'edificio', 'propiedad', 'nuevo', 'registro'],
    relatedArticles: ['kb-002', 'kb-003'],
  },
  {
    id: 'kb-002',
    category: 'primeros_pasos',
    title: 'Cómo registrar un inquilino',
    excerpt: 'Aprende a añadir inquilinos a tu sistema',
    content: `
# Cómo registrar un inquilino

## Información necesaria
Antes de comenzar, ten a mano:
- DNI/NIE del inquilino
- Datos de contacto (email, teléfono)
- Información laboral y económica
- Documentación (DNI, nóminas, etc.)

## Proceso de registro

### 1. Datos personales
Accede a "Inquilinos" > "Nuevo Inquilino" y completa:
- Nombre completo
- DNI/NIE
- Fecha de nacimiento

### 2. Información de contacto
- Email principal
- Teléfono móvil
- Teléfono alternativo (opcional)

### 3. Información laboral
- Situación laboral actual
- Ingresos mensuales
- Empresa (si aplica)

### 4. Documentación
Sube los documentos requeridos:
- DNI/NIE (ambas caras)
- Justificante de ingresos
- Aval bancario (opcional)

## Verificación automática
Nuestro sistema de screening evaluará automáticamente la solvencia del candidato.

**Consejo**: Usa el Wizard de creación para un proceso más guiado.
    `,
    tags: ['inquilinos', 'primeros pasos', 'registro'],
    keywords: ['inquilino', 'registrar', 'nuevo', 'añadir', 'tenant'],
    relatedArticles: ['kb-003', 'kb-006'],
  },
  {
    id: 'kb-003',
    category: 'contratos',
    title: 'Crear y firmar un contrato digital',
    excerpt: 'Guía para generar contratos de alquiler con firma digital',
    content: `
# Crear y firmar un contrato digital

## Ventajas de la firma digital
- Validez legal completa
- Sin necesidad de presencia física
- Proceso rápido (minutos vs días)
- Trazabilidad total

## Pasos para crear un contrato

### 1. Selecciona la plantilla
Accede a "Contratos" > "Nuevo Contrato" y elige la plantilla adecuada:
- Alquiler de vivienda
- Alquiler de local comercial
- Alquiler temporal
- Alquiler por habitaciones

### 2. Completa los datos
Los datos del edificio e inquilino se rellenan automáticamente. Solo necesitas:
- Fecha de inicio
- Duración del contrato
- Renta mensual
- Fianza
- Cláusulas especiales (opcional)

### 3. Revisa y personaliza
Puedes modificar cualquier cláusula o añadir nuevas según tus necesidades.

### 4. Envía para firma
Una vez generado, envía el contrato a todas las partes para firma digital.

### 5. Seguimiento
Recibe notificaciones cuando cada parte firme. El contrato estará disponible en PDF una vez completado.

## Firma digital paso a paso
1. El inquilino recibirá un email con enlace seguro
2. Accederá al contrato y lo podrá revisar
3. Firmará digitalmente con certificado
4. Recibirás notificación automática
5. Descarga el contrato firmado

**Importante**: Los contratos firmados digitalmente tienen la misma validez legal que los manuscritos.
    `,
    tags: ['contratos', 'firma digital', 'legal'],
    keywords: ['contrato', 'firmar', 'digital', 'alquiler', 'lease'],
    relatedArticles: ['kb-002', 'kb-004'],
  },
  {
    id: 'kb-004',
    category: 'pagos',
    title: 'Gestión de pagos y recordatorios',
    excerpt: 'Cómo registrar pagos y configurar recordatorios automáticos',
    content: `
# Gestión de pagos y recordatorios

## Configurar pagos recurrentes

Para alquileres mensuales, puedes configurar pagos automáticos:

1. Ve a "Pagos" > "Configurar pagos recurrentes"
2. Selecciona el contrato
3. Define:
   - Monto mensual
   - Día de cobro
   - Método de pago preferido

## Recordatorios automáticos

### Antes del vencimiento
- 7 días antes: Recordatorio amigable
- 3 días antes: Recordatorio urgente
- Día del vencimiento: Notificación final

### Después del vencimiento
- 1 día después: Primera notificación de retraso
- 3 días después: Segunda notificación
- 7 días después: Notificación de morosidad

## Métodos de pago soportados
- Transferencia bancaria
- Domiciliación bancaria
- Tarjeta de crédito
- Efectivo (registro manual)

## Registrar un pago manualmente

1. Ve a "Pagos" > "Registrar pago"
2. Selecciona el inquilino y concepto
3. Ingresa el monto y fecha
4. Adjunta comprobante (opcional)
5. Guarda

Se generará automáticamente un recibo.

## Gestión de morosidad

El sistema incluye:
- Predicción de riesgo de morosidad
- Alertas tempranas
- Acciones automáticas configurables
- Reportes de seguimiento

**Consejo**: Activa las notificaciones automáticas para reducir la morosidad hasta un 40%.
    `,
    tags: ['pagos', 'morosidad', 'recordatorios'],
    keywords: ['pago', 'cobro', 'recordatorio', 'morosidad', 'rent'],
    relatedArticles: ['kb-003', 'kb-007'],
  },
  {
    id: 'kb-005',
    category: 'mantenimiento',
    title: 'Gestión de incidencias y mantenimiento',
    excerpt: 'Cómo reportar y gestionar incidencias de mantenimiento',
    content: `
# Gestión de incidencias y mantenimiento

## Reportar una incidencia

### Desde el panel de administración
1. Ve a "Mantenimiento" > "Nueva incidencia"
2. Completa:
   - Edificio y unidad afectada
   - Tipo de incidencia (fontanería, electricidad, etc.)
   - Descripción detallada
   - Prioridad (baja, media, alta, urgente)
   - Fotos (opcional pero recomendado)

### Desde el portal del inquilino
Los inquilinos pueden reportar incidencias directamente desde su portal web o app móvil.

## Asignar a proveedores

1. Abre la incidencia
2. Haz clic en "Asignar proveedor"
3. Selecciona de tu lista de proveedores de confianza
4. El proveedor recibirá notificación automática

## Seguimiento

Los proveedores pueden actualizar el estado:
- Pendiente
- En progreso
- Esperando piezas
- Completado

Recibirás notificaciones en cada cambio.

## Mantenimiento preventivo

### Programar mantenimientos recurrentes
1. Ve a "Mantenimiento Preventivo"
2. Crea programa de mantenimiento
3. Define frecuencia (mensual, trimestral, anual)
4. Asigna proveedor
5. El sistema te recordará automáticamente

### Tipos de mantenimiento preventivo recomendados
- Revisión de calderas (anual)
- Inspección de ascensores (según normativa)
- Limpieza de canalones (semestral)
- Revisión eléctrica (bienal)
- Fumigación (según necesidad)

**Tip**: El mantenimiento preventivo reduce costes hasta un 60% vs mantenimiento correctivo.
    `,
    tags: ['mantenimiento', 'incidencias', 'proveedores'],
    keywords: ['mantenimiento', 'incidencia', 'reparación', 'proveedor', 'maintenance'],
    relatedArticles: ['kb-008', 'kb-009'],
  },
  {
    id: 'kb-006',
    category: 'screening',
    title: 'Sistema de screening y verificación',
    excerpt: 'Cómo funciona la evaluación automática de inquilinos',
    content: `
# Sistema de screening y verificación

## ¿Qué evalúa el sistema?

Nuestro sistema de IA analiza múltiples factores:

### 1. Análisis documental
- Validez de documentos de identidad
- Autenticidad de nóminas y justificantes
- Coherencia de la información

### 2. Evaluación económica
- Ratio ingreso/alquiler (recomendado 3x)
- Estabilidad laboral
- Historial de pagos (si disponible)

### 3. Scoring de riesgo
Calcula un score de 0-100:
- 80-100: Riesgo bajo (verde)
- 60-79: Riesgo medio (amarillo)
- 0-59: Riesgo alto (rojo)

## Proceso de verificación

### Automático (inmediato)
- Validación de documentos
- Cálculo de ratios financieros
- Score preliminar

### Manual (opcional)
- Llamadas a referencias laborales
- Verificación con propietarios anteriores
- Informes de solvencia externos

## Solicitar referencias

El sistema puede solicitar automáticamente:
1. Referencias laborales (email a RRHH)
2. Referencias de propietarios anteriores
3. Referencias personales

Las respuestas se integran en el perfil del candidato.

## Toma de decisión

Basándote en:
- Score automático
- Verificaciones manuales
- Tu criterio profesional

Puedes:
- ✅ Aprobar candidato
- ❌ Rechazar candidato
- ⏸️ Solicitar información adicional

**Importante**: El screening es una herramienta de ayuda, la decisión final es siempre tuya.
    `,
    tags: ['screening', 'verificación', 'inquilinos'],
    keywords: ['screening', 'verificación', 'solvencia', 'score', 'tenant screening'],
    relatedArticles: ['kb-002', 'kb-007'],
  },
  {
    id: 'kb-007',
    category: 'predicciones',
    title: 'Predicciones de morosidad con IA',
    excerpt: 'Cómo funciona el sistema de predicción de morosidad',
    content: `
# Predicciones de morosidad con IA

## ¿Cómo funciona?

Nuestro modelo de IA analiza patrones de comportamiento para predecir el riesgo de morosidad antes de que ocurra.

### Factores analizados
1. **Historial de pagos**
   - Puntualidad histórica
   - Pagos parciales o retrasados
   - Tendencias recientes

2. **Comportamiento en la plataforma**
   - Frecuencia de acceso al portal
   - Lectura de notificaciones
   - Respuesta a comunicaciones

3. **Factores externos**
   - Cambios en situación laboral
   - Temporada del año
   - Contexto económico

## Niveles de alerta

### 🟢 Riesgo bajo (0-30%)
- Todo normal
- Pagos puntuales
- Sin acción necesaria

### 🟡 Riesgo medio (31-60%)
- Algunos retrasos menores
- Acción recomendada: recordatorio amigable
- Monitoreo cercano

### 🟠 Riesgo alto (61-80%)
- Patrón de retrasos
- Acción recomendada: contacto directo
- Ofrecer plan de pagos

### 🔴 Riesgo muy alto (81-100%)
- Morosidad inminente
- Acción urgente necesaria
- Considerar acciones legales

## Acciones automáticas

Puedes configurar acciones automáticas:
- Envío de recordatorios anticipados
- Bloqueo de servicios no esenciales
- Alertas al equipo de gestión
- Inicio de protocolos de cobro

## Beneficios

- ⏰ Detecta problemas 2-3 semanas antes
- 📉 Reduce morosidad hasta 40%
- 💰 Ahorra costes de gestión de cobros
- 🤝 Permite intervención temprana y amigable

**Consejo**: Actúa en cuanto veas alertas amarillas, la prevención es clave.
    `,
    tags: ['morosidad', 'IA', 'predicciones'],
    keywords: ['morosidad', 'predicción', 'IA', 'riesgo', 'delinquency'],
    relatedArticles: ['kb-004', 'kb-006'],
  },
  {
    id: 'kb-008',
    category: 'str',
    title: 'Short-Term Rental: Channel Manager',
    excerpt: 'Gestiona alquileres turísticos y sincroniza con Airbnb, Booking, etc.',
    content: `
# Short-Term Rental: Channel Manager

## ¿Qué es un Channel Manager?

Es un sistema que sincroniza tu calendario, precios y disponibilidad entre múltiples plataformas (Airbnb, Booking.com, Vrbo, etc.) en tiempo real.

## Ventajas

✅ **Sin double-bookings**: Sincronización instantánea
✅ **Ahorro de tiempo**: Actualiza una vez, se aplica en todas
✅ **Más reservas**: Visible en múltiples canales
✅ **Gestión centralizada**: Todo en un solo panel

## Canales soportados

- Airbnb
- Booking.com
- Vrbo/HomeAway
- Expedia
- TripAdvisor
- Y más...

## Configuración inicial

### 1. Conectar canales
1. Ve a "STR" > "Channels"
2. Haz clic en "Conectar nuevo canal"
3. Autentica con cada plataforma
4. Confirma permisos

### 2. Sincronizar propiedades
1. Selecciona qué propiedades publicar en cada canal
2. Mapea los campos (nombre, descripción, etc.)
3. Activa sincronización de calendario

### 3. Configurar pricing dinámico
1. Define precios base por temporada
2. Configura reglas de descuento:
   - Estancia mínima
   - Reserva anticipada
   - Last minute
3. Ajustes automáticos por demanda

## Gestión diaria

### Calendario unificado
Ve todas las reservas de todos los canales en un solo calendario.

### Inbox centralizado
Todos los mensajes de huéspedes en una bandeja única.

### Automatizaciones
- Mensajes de bienvenida automáticos
- Instrucciones de check-in/out
- Solicitud de reviews
- Recordatorios de check-out

## Reportes y analytics

- RevPAR (Revenue per Available Room)
- Tasa de ocupación por canal
- ADR (Average Daily Rate)
- Comparativa de rentabilidad

**Tip**: Usa el pricing dinámico para maximizar ingresos en temporada alta y ocupación en temporada baja.
    `,
    tags: ['STR', 'channel manager', 'airbnb'],
    keywords: ['airbnb', 'booking', 'str', 'short term', 'vacation rental'],
    relatedArticles: ['kb-009', 'kb-010'],
  },
  {
    id: 'kb-009',
    category: 'habitaciones',
    title: 'Alquiler por habitaciones: Coliving',
    excerpt: 'Gestiona alquileres por habitaciones con prorrateo automático',
    content: `
# Alquiler por habitaciones: Coliving

## ¿Qué es el alquiler por habitaciones?

Modalidad donde múltiples inquilinos comparten una propiedad, cada uno alquilando una habitación individual.

## Casos de uso

- 🏘️ Coliving
- 🎓 Residencias de estudiantes
- 💼 Viviendas para trabajadores
- 👥 Pisos compartidos

## Configuración

### 1. Crear propiedad para habitaciones
1. Ve a "Room Rental"
2. Crea nueva propiedad o convierte una existente
3. Define:
   - Número de habitaciones
   - Áreas comunes
   - Servicios compartidos

### 2. Configurar habitaciones
Para cada habitación:
- Número/nombre
- Precio mensual
- Características (baño privado, balcón, etc.)
- Fotos

### 3. Definir servicios compartidos
- Agua
- Luz
- Gas
- Internet
- Limpieza

## Prorrateo automático

El sistema calcula automáticamente la parte proporcional de cada inquilino:

### Opciones de prorrateo
1. **Equitativo**: Dividido por igual entre todos
2. **Por m²**: Proporcional al tamaño de habitación
3. **Por ocupación**: Según días ocupados en el mes
4. **Personalizado**: Define tú los porcentajes

### Ejemplo
Total luz mes: 150€
- Habitación A (30%): 45€
- Habitación B (30%): 45€
- Habitación C (40%): 60€

## Gestión de ocupación

### Alta/baja de inquilinos
El sistema ajusta automáticamente:
- Prorrateo de servicios
- Accesos al portal
- Distribución de tareas

### Calendario de limpieza
Asigna tareas rotativas de limpieza de áreas comunes.

## Normas de convivencia

### Publicar normas
1. Define reglas de la casa
2. Horarios de silencio
3. Uso de áreas comunes
4. Políticas de visitas

Visibles en el portal del inquilino.

## Portal específico

Cada inquilino ve:
- Su habitación y contrato
- Sus consumos individuales
- Prorrateo de servicios compartidos
- Calendario de limpieza
- Chat con otros inquilinos (opcional)

**Ventaja**: Reduce conflictos por consumos y mejora la convivencia.
    `,
    tags: ['habitaciones', 'coliving', 'room rental'],
    keywords: ['habitación', 'coliving', 'room', 'shared', 'estudiantes'],
    relatedArticles: ['kb-001', 'kb-008'],
  },
  {
    id: 'kb-010',
    category: 'integraciones',
    title: 'Integraciones contables: Conecta con tu software',
    excerpt: 'Sincroniza INMOVA con Contasimple, A3, Sage, Holded, etc.',
    content: `
# Integraciones contables

## Software soportado

INMOVA se integra con los principales softwares contables:

### Disponibles
- ✅ Contasimple
- ✅ A3 Software
- ✅ Sage
- ✅ Holded
- ✅ Zucchetti
- ✅ Alegra

## ¿Qué se sincroniza?

### Automáticamente
1. **Ingresos por alquileres**
   - Rentas mensuales
   - Fianzas
   - Otros conceptos

2. **Gastos**
   - Mantenimiento
   - Servicios
   - Proveedores

3. **Clientes y proveedores**
   - Alta automática
   - Actualización de datos

## Configurar integración

### Paso a paso

1. **Accede a integraciones**
   - Ve a "Configuración" > "Integraciones"
   - Selecciona tu software contable

2. **Autentica**
   - Introduce credenciales API
   - O conecta vía OAuth

3. **Configura mapeo**
   - Define plan contable
   - Asigna cuentas automáticas:
     - Ingresos por alquiler → Cuenta X
     - Gastos de comunidad → Cuenta Y
     - Etc.

4. **Activa sincronización**
   - Elige frecuencia:
     - Tiempo real
     - Diaria
     - Semanal
     - Manual

## Beneficios

✅ **Sin duplicidad**: No más doble entrada
✅ **Ahorro de tiempo**: Hasta 10 horas/mes
✅ **Menos errores**: Sincronización automática
✅ **Vista 360º**: Datos en tiempo real

## Reconciliación bancaria

Si tu software contable lo soporta:
- Importa extractos bancarios
- Reconcilia automáticamente
- Detecta discrepancias

## Reporting

### Reportes disponibles
- Balance de situación
- Cuenta de resultados
- Flujo de caja
- Rentabilidad por propiedad
- Previsiones

### Exportar datos
Puedes exportar a:
- Excel / CSV
- PDF
- Envío automático al contable

**Consejo**: Si no ves tu software contable, contáctanos. Añadimos nuevas integraciones regularmente.
    `,
    tags: ['integraciones', 'contabilidad', 'sincronización'],
    keywords: ['integración', 'contable', 'contabilidad', 'api', 'sincronizar'],
    relatedArticles: ['kb-004', 'kb-011'],
  },
  {
    id: 'kb-011',
    category: 'cuenta',
    title: 'Cómo cambiar mi plan de suscripción',
    excerpt: 'Actualiza o cambia tu plan de INMOVA en cualquier momento',
    content: `# Cambiar plan de suscripción\n\nVe a **Configuración > Facturación** y selecciona el nuevo plan. El cambio se aplica inmediatamente y se prorratea la diferencia.\n\n## Planes disponibles\n- **Starter** (€35/mes): Hasta 5 propiedades\n- **Profesional** (€59/mes): Hasta 25 propiedades\n- **Business** (€129/mes): Hasta 100 propiedades\n- **Enterprise** (€299/mes): Ilimitado\n\nLos pagos se procesan automáticamente con Stripe.`,
    tags: ['planes', 'suscripción', 'facturación'],
    keywords: ['plan', 'cambiar', 'upgrade', 'suscripción', 'precio', 'pago'],
  },
  {
    id: 'kb-012',
    category: 'cuenta',
    title: 'Cómo configurar mi empresa',
    excerpt: 'Configura los datos fiscales y de contacto de tu empresa',
    content: `# Configurar empresa\n\nVe a **Configuración > Empresa** para rellenar:\n- Razón social y CIF\n- Dirección fiscal\n- Logo de la empresa\n- Datos de contacto\n- Cuenta bancaria para domiciliaciones\n\nEstos datos aparecerán en contratos, facturas y comunicaciones con inquilinos.`,
    tags: ['empresa', 'configuración', 'datos fiscales'],
    keywords: ['empresa', 'configurar', 'CIF', 'logo', 'datos', 'fiscal'],
  },
  {
    id: 'kb-013',
    category: 'primeros_pasos',
    title: 'Cómo crear una unidad (vivienda, local, garaje)',
    excerpt: 'Añade las unidades individuales dentro de un edificio',
    content: `# Crear unidades\n\n1. Ve al edificio donde quieres añadir la unidad\n2. Haz clic en **"Añadir Unidad"**\n3. Selecciona el tipo: Vivienda, Local, Garaje, Trastero, Oficina\n4. Rellena superficie, habitaciones, baños y renta mensual\n5. Guarda\n\nLas unidades disponibles aparecerán automáticamente cuando vayas a crear un contrato.`,
    tags: ['unidades', 'vivienda', 'garaje', 'local'],
    keywords: ['unidad', 'crear', 'vivienda', 'local', 'garaje', 'habitación'],
    relatedArticles: ['kb-001'],
  },
  {
    id: 'kb-014',
    category: 'primeros_pasos',
    title: 'Cómo generar y cobrar el primer recibo',
    excerpt: 'Genera pagos mensuales y cobra automáticamente a tus inquilinos',
    content: `# Cobrar rentas\n\n## Pago manual\n1. Ve a **Pagos** y haz clic en **"Registrar Pago"**\n2. Selecciona el contrato, importe y período\n3. El inquilino recibirá notificación por email\n\n## Cobro automático con Stripe\n1. En el contrato, activa **"Cobro automático"**\n2. El inquilino recibe un enlace para configurar su tarjeta\n3. Cada mes se cobra automáticamente el día indicado\n\n## Recordatorios\nINMOVA envía recordatorios automáticos 3 y 1 días antes del vencimiento.`,
    tags: ['pagos', 'cobro', 'recibo', 'stripe'],
    keywords: ['cobrar', 'pago', 'recibo', 'renta', 'automático', 'stripe'],
    relatedArticles: ['kb-004'],
  },
  {
    id: 'kb-015',
    category: 'gestion',
    title: 'Cómo gestionar un siniestro o incidencia',
    excerpt: 'Registra y haz seguimiento de incidencias de mantenimiento',
    content: `# Gestionar incidencias\n\n1. Ve a **Mantenimiento** y haz clic en **"Nueva Incidencia"**\n2. Selecciona la unidad afectada\n3. Describe el problema y sube fotos\n4. Asigna prioridad (Baja, Media, Alta, Urgente)\n5. Opcionalmente asigna un proveedor\n\nEl inquilino puede reportar incidencias desde su portal. Recibirás notificación automática.\n\n## Seguimiento\nCada incidencia tiene estados: Pendiente → En progreso → Resuelta. Todos los cambios quedan registrados.`,
    tags: ['incidencias', 'mantenimiento', 'siniestros'],
    keywords: ['incidencia', 'avería', 'mantenimiento', 'reparación', 'proveedor'],
    relatedArticles: ['kb-005'],
  },
  {
    id: 'kb-016',
    category: 'gestion',
    title: 'Cómo subir y organizar documentos',
    excerpt: 'Almacena contratos, escrituras, certificados y más',
    content: `# Gestión documental\n\n## Subir documentos\n1. Ve a **Documentos** o a la ficha del edificio/inquilino\n2. Haz clic en **"Subir Documento"**\n3. Selecciona el archivo (PDF, imagen, Word)\n4. Categoriza: Contrato, Escritura, Certificado, Seguro, Otro\n\n## Organización automática\nINMOVA organiza los documentos por edificio, unidad e inquilino. Los contratos firmados se archivan automáticamente.\n\n## Almacenamiento\nEl almacenamiento depende de tu plan (2GB - Ilimitado). Puedes adquirir packs adicionales.`,
    tags: ['documentos', 'archivos', 'almacenamiento'],
    keywords: ['documento', 'subir', 'archivo', 'contrato', 'escritura', 'PDF'],
  },
  {
    id: 'kb-017',
    category: 'cuenta',
    title: 'Cómo añadir usuarios a mi equipo',
    excerpt: 'Invita a gestores, contables y operarios a tu cuenta',
    content: `# Gestión de usuarios\n\nVe a **Administración > Usuarios** y haz clic en **"Invitar Usuario"**.\n\n## Roles disponibles\n- **Administrador**: Acceso total, puede gestionar usuarios y configuración\n- **Gestor**: Gestiona edificios, inquilinos y contratos\n- **Operador**: Solo ve lo asignado (ideal para técnicos de mantenimiento)\n- **Soporte**: Acceso de solo lectura\n\nCada usuario invitado recibe un email con enlace de activación.`,
    tags: ['usuarios', 'equipo', 'roles', 'permisos'],
    keywords: ['usuario', 'invitar', 'equipo', 'rol', 'permiso', 'administrador'],
  },
  {
    id: 'kb-018',
    category: 'gestion',
    title: 'Portal del inquilino: qué puede hacer',
    excerpt: 'Tu inquilino tiene su propio portal para pagos, incidencias y documentos',
    content: `# Portal del inquilino\n\nCada inquilino con email recibe acceso a su portal donde puede:\n\n- **Ver sus recibos** y estado de pagos\n- **Pagar online** con tarjeta (Stripe)\n- **Reportar incidencias** con fotos\n- **Descargar documentos** (contrato, recibos)\n- **Comunicarse** contigo por chat\n\n## Activar el portal\nAl crear un inquilino con email, automáticamente se le envía invitación al portal.\n\nNo necesitas hacer nada más. El inquilino se autogestiona.`,
    tags: ['portal', 'inquilino', 'autoservicio'],
    keywords: ['portal', 'inquilino', 'pagar', 'online', 'incidencia', 'autoservicio'],
  },
  {
    id: 'kb-019',
    category: 'gestion',
    title: 'Cómo funcionan los gastos y la rentabilidad',
    excerpt: 'Registra gastos y visualiza la rentabilidad real de cada propiedad',
    content: `# Gastos y rentabilidad\n\n## Registrar gastos\n1. Ve a **Gastos** y haz clic en **"Nuevo Gasto"**\n2. Selecciona el edificio/unidad\n3. Indica categoría: Mantenimiento, Suministros, Seguros, Comunidad, IBI, etc.\n4. Sube la factura (opcional)\n\n## Ver rentabilidad\nEn el **Dashboard** verás:\n- Ingresos vs Gastos por mes\n- Margen neto por edificio\n- Tasa de ocupación\n- Tasa de morosidad\n\nTodo se calcula automáticamente a partir de los pagos y gastos registrados.`,
    tags: ['gastos', 'rentabilidad', 'finanzas'],
    keywords: ['gasto', 'rentabilidad', 'beneficio', 'IBI', 'comunidad', 'factura'],
  },
  {
    id: 'kb-020',
    category: 'cuenta',
    title: 'Cómo funciona la facturación de INMOVA',
    excerpt: 'Cómo te cobramos y cómo obtener tus facturas',
    content: `# Facturación INMOVA\n\n## Cobro automático\nCada mes Stripe cobra automáticamente el importe de tu plan. Recibirás la factura por email con todos los datos fiscales.\n\n## Ver facturas\nVe a **Configuración > Facturación** para ver el historial de facturas y descargarlas en PDF.\n\n## Cancelar suscripción\nPuedes cancelar en cualquier momento desde Facturación. Tu cuenta permanecerá activa hasta el final del período pagado.\n\n## Soporte de facturación\nContacta en inmovaapp@gmail.com para cualquier consulta sobre facturas o pagos.`,
    tags: ['facturación', 'pago', 'factura'],
    keywords: ['factura', 'cobro', 'cancelar', 'suscripción', 'precio', 'pago'],
    relatedArticles: ['kb-011'],
  },
  {
    id: 'kb-021',
    category: 'primeros_pasos',
    title: 'Primeros 5 minutos: qué hacer después de registrarte',
    excerpt: 'Guía rápida para empezar a usar INMOVA en 5 minutos',
    content: `# Primeros 5 minutos en INMOVA\n\n## Paso 1: Configura tu empresa (1 min)\nVe a Configuración > Empresa y rellena tu razón social y CIF.\n\n## Paso 2: Crea tu primer edificio (1 min)\nHaz clic en Edificios > Nuevo Edificio. Solo necesitas nombre y dirección.\n\n## Paso 3: Añade las unidades (1 min)\nDentro del edificio, añade las viviendas/locales con su renta mensual.\n\n## Paso 4: Registra tu primer inquilino (1 min)\nVe a Inquilinos > Nuevo Inquilino. Con nombre, DNI y email es suficiente.\n\n## Paso 5: Crea el contrato (1 min)\nVe a Contratos > Nuevo Contrato. Selecciona inquilino, unidad, fecha y renta. ¡Listo!\n\nA partir de aquí, INMOVA gestiona automáticamente los pagos, recordatorios y renovaciones.`,
    tags: ['primeros pasos', 'inicio', 'tutorial'],
    keywords: ['empezar', 'inicio', 'primeros', 'pasos', 'tutorial', 'rápido', 'registrar'],
    relatedArticles: ['kb-001', 'kb-002', 'kb-003', 'kb-013', 'kb-014'],
  },
  {
    id: 'kb-022',
    category: 'cuenta',
    title: 'Cómo activar y desactivar módulos',
    excerpt: 'Personaliza qué funcionalidades aparecen en tu sidebar',
    content: `# Gestión de módulos\n\nVe a **Administración > Módulos** para ver todos los módulos disponibles.\n\n## Activar/Desactivar\nCada módulo tiene un interruptor. Al desactivarlo, desaparece del menú lateral y no es accesible.\n\n## Módulos por plan\n- **Starter**: Edificios, Inquilinos, Contratos, Pagos, Mantenimiento\n- **Profesional**: Todo lo anterior + CRM, Reportes, Proveedores, Verticales básicos\n- **Business**: Todo + IA, Automatizaciones, API, Verticales completos\n- **Enterprise**: Todo ilimitado\n\nSi necesitas un módulo que no está en tu plan, puedes hacer upgrade en Configuración > Facturación.`,
    tags: ['módulos', 'configuración', 'personalización'],
    keywords: ['módulo', 'activar', 'desactivar', 'funcionalidad', 'sidebar', 'menú'],
  },
  {
    id: 'kb-023',
    category: 'gestion',
    title: 'Cómo funciona el calendario y los recordatorios',
    excerpt: 'Visualiza vencimientos, revisiones y tareas en un solo calendario',
    content: `# Calendario unificado\n\nEl calendario de INMOVA muestra automáticamente:\n- **Vencimientos de pagos** (en rojo si atrasados)\n- **Fin de contratos** próximos\n- **Revisiones de renta** pendientes\n- **Mantenimientos** programados\n- **Renovaciones de seguros**\n\n## Recordatorios automáticos\nINMOVA envía emails automáticos para:\n- Pagos: 3 días y 1 día antes del vencimiento\n- Contratos: 60 y 30 días antes de expirar\n- Seguros: 30 días antes de renovación\n\nNo necesitas configurar nada. Los recordatorios se activan automáticamente al crear contratos y pagos.`,
    tags: ['calendario', 'recordatorios', 'vencimientos'],
    keywords: ['calendario', 'recordatorio', 'vencimiento', 'alerta', 'notificación', 'aviso'],
  },
  {
    id: 'kb-024',
    category: 'gestion',
    title: 'Cómo importar mis propiedades desde otro software',
    excerpt: 'Migra tus datos desde Excel u otro software de gestión',
    content: `# Importar datos\n\n## Desde Excel/CSV\n1. Ve a **Administración > Importar**\n2. Descarga la plantilla Excel\n3. Rellena tus datos (edificios, unidades, inquilinos)\n4. Sube el archivo\n5. INMOVA importará todo automáticamente\n\n## Desde otro software\nSi vienes de otra plataforma de gestión inmobiliaria, contacta en inmovaapp@gmail.com y te ayudamos con la migración gratuita.\n\n## Datos que puedes importar\n- Edificios y unidades\n- Inquilinos\n- Contratos activos\n- Histórico de pagos`,
    tags: ['importar', 'migración', 'excel'],
    keywords: ['importar', 'migrar', 'Excel', 'CSV', 'datos', 'otro software', 'migración'],
  },
  {
    id: 'kb-025',
    category: 'cuenta',
    title: 'Seguridad y protección de datos',
    excerpt: 'Cómo protegemos tus datos y los de tus inquilinos',
    content: `# Seguridad en INMOVA\n\n## Cifrado\n- Conexión HTTPS/SSL con Cloudflare\n- Datos en tránsito cifrados con TLS 1.3\n- Contraseñas hasheadas con bcrypt\n\n## Cumplimiento\n- RGPD/LOPD: Datos almacenados en la UE\n- Derecho al olvido implementado\n- Exportación de datos disponible\n\n## Acceso\n- Autenticación con 2FA disponible\n- Roles y permisos granulares\n- Registro de auditoría de todas las acciones\n\n## Backups\n- Backups automáticos diarios\n- Retención de 30 días\n\nPara consultas de seguridad: inmovaapp@gmail.com`,
    tags: ['seguridad', 'RGPD', 'privacidad'],
    keywords: ['seguridad', 'RGPD', 'LOPD', 'privacidad', 'cifrado', 'datos', '2FA'],
  },
];

/**
 * Busca artículos relevantes por palabras clave
 */
export function searchArticles(query: string): KnowledgeArticle[] {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(' ').filter(w => w.length > 2);

  return knowledgeBase
    .map(article => {
      let score = 0;

      // Coincidencia en título (peso alto)
      if (article.title.toLowerCase().includes(lowerQuery)) score += 10;
      words.forEach(word => {
        if (article.title.toLowerCase().includes(word)) score += 3;
      });

      // Coincidencia en keywords (peso medio-alto)
      article.keywords.forEach(keyword => {
        if (keyword.includes(lowerQuery)) score += 5;
        words.forEach(word => {
          if (keyword.includes(word)) score += 2;
        });
      });

      // Coincidencia en excerpt (peso medio)
      if (article.excerpt.toLowerCase().includes(lowerQuery)) score += 3;
      words.forEach(word => {
        if (article.excerpt.toLowerCase().includes(word)) score += 1;
      });

      // Coincidencia en tags (peso bajo)
      article.tags.forEach(tag => {
        if (tag.includes(lowerQuery)) score += 2;
      });

      return { ...article, score };
    })
    .filter(article => article.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 resultados
}

/**
 * Obtiene artículos relacionados
 */
export function getRelatedArticles(articleId: string): KnowledgeArticle[] {
  const article = knowledgeBase.find(a => a.id === articleId);
  if (!article || !article.relatedArticles) return [];

  return article.relatedArticles
    .map(id => knowledgeBase.find(a => a.id === id))
    .filter(Boolean) as KnowledgeArticle[];
}

/**
 * Obtiene artículos por categoría
 */
export function getArticlesByCategory(category: string): KnowledgeArticle[] {
  return knowledgeBase.filter(article => article.category === category);
}
