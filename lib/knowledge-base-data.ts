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
];

/**
 * Busca artículos relevantes por palabras clave
 */
export function searchArticles(query: string): KnowledgeArticle[] {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(' ').filter((w) => w.length > 2);

  return knowledgeBase
    .map((article) => {
      let score = 0;

      // Coincidencia en título (peso alto)
      if (article.title.toLowerCase().includes(lowerQuery)) score += 10;
      words.forEach((word) => {
        if (article.title.toLowerCase().includes(word)) score += 3;
      });

      // Coincidencia en keywords (peso medio-alto)
      article.keywords.forEach((keyword) => {
        if (keyword.includes(lowerQuery)) score += 5;
        words.forEach((word) => {
          if (keyword.includes(word)) score += 2;
        });
      });

      // Coincidencia en excerpt (peso medio)
      if (article.excerpt.toLowerCase().includes(lowerQuery)) score += 3;
      words.forEach((word) => {
        if (article.excerpt.toLowerCase().includes(word)) score += 1;
      });

      // Coincidencia en tags (peso bajo)
      article.tags.forEach((tag) => {
        if (tag.includes(lowerQuery)) score += 2;
      });

      return { ...article, score };
    })
    .filter((article) => article.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 resultados
}

/**
 * Obtiene artículos relacionados
 */
export function getRelatedArticles(articleId: string): KnowledgeArticle[] {
  const article = knowledgeBase.find((a) => a.id === articleId);
  if (!article || !article.relatedArticles) return [];

  return article.relatedArticles
    .map((id) => knowledgeBase.find((a) => a.id === id))
    .filter(Boolean) as KnowledgeArticle[];
}

/**
 * Obtiene artículos por categoría
 */
export function getArticlesByCategory(category: string): KnowledgeArticle[] {
  return knowledgeBase.filter((article) => article.category === category);
}
