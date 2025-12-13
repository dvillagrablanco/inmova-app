# Guía de Usuario - INMOVA

## Índice
1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Gestión de Propiedades](#gestión-de-propiedades)
4. [Gestión de Inquilinos](#gestión-de-inquilinos)
5. [Contratos y Pagos](#contratos-y-pagos)
6. [Mantenimiento](#mantenimiento)
7. [Funcionalidades Avanzadas](#funcionalidades-avanzadas)
8. [FAQ](#faq)

---

## Introducción

Bienvenido a **INMOVA**, la plataforma integral de gestión inmobiliaria. Esta guía le ayudará a aprovechar al máximo todas las funcionalidades del sistema.

### ¿Qué es INMOVA?

INMOVA es una plataforma SaaS que unifica en un solo lugar todas las operaciones relacionadas con la gestión de propiedades:

- 🏢 Gestión de edificios y unidades
- 👥 Base de datos de inquilinos
- 📝 Contratos digitales
- 💰 Control de pagos y gastos
- 🔧 Mantenimiento preventivo y correctivo
- 📊 Analytics y reportes
- 🤖 Automatización con IA
- Y mucho más...

---

## Primeros Pasos

### 1. Acceso a la Plataforma

1. Visite https://inmova.app
2. Haga clic en "Login"
3. Ingrese su email y contraseña
4. (Opcional) Active la autenticación de dos factores para mayor seguridad

### 2. Panel de Control (Dashboard)

Al iniciar sesión, accederá al Dashboard principal que muestra:

- **KPIs principales**: Propiedades, ingresos mensuales, tasa de ocupación
- **Alertas**: Contratos por vencer, pagos pendientes, mantenimientos urgentes
- **Actividad reciente**: Últimas acciones realizadas
- **Gráficos**: Evolución de ingresos, ocupación, etc.

### 3. Navegación

**Sidebar (Menú Lateral)**:
- Organizado por módulos (Principal, Finanzas, Operaciones, etc.)
- Acceso rápido a todas las funcionalidades
- Búsqueda global (🔍)

**Header (Cabecera)**:
- Notificaciones (🔔)
- Perfil de usuario
- Selector de empresa (multi-empresa)

---

## Gestión de Propiedades

### Crear un Edificio

1. Navegue a **Edificios** en el menú lateral
2. Haga clic en **"+ Nuevo Edificio"**
3. Complete el formulario:
   - Nombre del edificio
   - Dirección completa
   - Tipo de propiedad (Residencial, Comercial, etc.)
   - Número total de unidades
   - Administrador asignado (opcional)
4. Haga clic en **"Guardar"**

### Gestionar Unidades

1. Desde **Edificios**, seleccione un edificio
2. En la vista de detalle, vaya a la pestaña **"Unidades"**
3. Clic en **"+ Añadir Unidad"**
4. Complete:
   - Número/Nombre de la unidad
   - Piso
   - Habitaciones / Baños / m²
   - Renta mensual
   - Estado (Disponible / Ocupada / Mantenimiento)
5. Guarde la información

**Acciones rápidas en unidades**:
- ✏️ **Editar**: Modificar información
- 👁️ **Ver detalle**: Info completa + historial
- 📝 **Crear contrato**: Asignar inquilino
- 🗑️ **Eliminar**: Requiere confirmación

---

## Gestión de Inquilinos

### Añadir un Inquilino

1. Vaya a **Inquilinos** en el menú
2. Clic en **"+ Nuevo Inquilino"**
3. Complete la información:
   - **Datos personales**: Nombre, email, teléfono, DNI
   - **Datos laborales**: Empresa, ingresos mensuales
   - **Contacto de emergencia** (opcional)
   - **Documentos**: DNI escaneado, comprobantes de ingresos
4. Guarde el registro

### Screening de Inquilinos

Para inquilinos nuevos, puede realizar un **screening completo**:

1. En el detalle del inquilino, clic en **"Iniciar Screening"**
2. El sistema evaluará:
   - ✅ Identidad (DNI)
   - ✅ Situación laboral
   - ✅ Capacidad económica
   - ✅ Referencias
   - ✅ Antecedentes (si aplica)
3. Recibirá un **scoring** (0-100) y un **nivel de riesgo** (A, B, C, D)
4. Revise el informe y tome una decisión

### Funciones avanzadas

- **OCR de documentos**: Escanee DNI automáticamente
- **Historial de contratos**: Vea todos los contratos del inquilino
- **Comunicación**: Envíe emails o SMS directamente
- **Portal del inquilino**: El inquilino puede acceder a su información

---

## Contratos y Pagos

### Crear un Contrato

1. Vaya a **Contratos** → **"+ Nuevo Contrato"**
2. Seleccione:
   - **Unidad**: La unidad a alquilar
   - **Inquilino**: De la base de datos
3. Ingrese términos del contrato:
   - Fecha de inicio
   - Fecha de fin
   - Renta mensual
   - Depósito (fianza)
   - Día de pago (ej: día 5 de cada mes)
4. (Opcional) Adjunte el PDF del contrato firmado
5. Guarde

El sistema automáticamente:
- Genera los **pagos mensuales** programados
- Cambia el estado de la unidad a "Ocupada"
- Envía notificación al inquilino

### Gestión de Pagos

#### Vista de Pagos

1. Navegue a **Pagos**
2. Verá todos los pagos:
   - ✅ **Pagados**: Verde
   - ⏰ **Pendientes**: Amarillo
   - ❌ **Vencidos**: Rojo

#### Registrar un Pago Manual

1. Encuentre el pago pendiente
2. Clic en **"Marcar como Pagado"**
3. Ingrese:
   - Fecha de pago
   - Método (Transferencia, Efectivo, Tarjeta)
   - Comprobante (opcional)
4. Confirme

#### Pagos Automáticos con Stripe

**Para activar pagos recurrentes**:

1. Vaya al detalle del contrato
2. En la sección **"Pagos Recurrentes"**, clic en **"Activar Suscripción"**
3. El inquilino recibirá un email para agregar su tarjeta
4. Una vez configurado, los pagos se cobrarán automáticamente cada mes

**Beneficios**:
- Sin gestión manual
- Pagos puntuales
- Reducción de morosidad
- Trazabilidad completa

### Portal del Inquilino - Pagos

Los inquilinos pueden:
- Ver su historial de pagos
- Pagar con tarjeta directamente desde el portal
- Descargar recibos
- Configurar recordatorios

---

## Mantenimiento

### Solicitudes de Mantenimiento Correctivo

#### Crear una Solicitud

1. Vaya a **Mantenimiento** → Pestaña **"Solicitudes"**
2. Clic en **"+ Nueva Solicitud"**
3. Complete:
   - **Edificio y Unidad**: Ubicación del problema
   - **Título**: Descripción breve (ej: "Fuga en el baño")
   - **Descripción detallada**
   - **Prioridad**: Baja / Media / Alta / Urgente
   - **Categoría**: Fontanería, Electricidad, etc.
   - **Asignar a**: Proveedor o técnico
4. (Opcional) Adjunte fotos
5. Guarde

#### Estados de Solicitud

- **Pendiente**: Recién creada
- **Asignada**: Asignada a un técnico
- **En progreso**: En reparación
- **Completada**: Resuelta
- **Cancelada**: No procede

### Mantenimiento Preventivo

1. Vaya a **Mantenimiento** → Pestaña **"Preventivo"**
2. Clic en **"+ Nuevo Plan"**
3. Configure:
   - **Edificio**
   - **Tipo de mantenimiento** (ej: Revisión anual de caldera)
   - **Frecuencia**: Mensual / Trimestral / Anual
   - **Próxima fecha**
   - **Proveedor asignado**
4. Guarde

El sistema generará automáticamente las tareas según la frecuencia.

### Mantenimiento Pro (Módulo Avanzado)

**Incluye**:
- 🔮 **Predicción de fallos**: IA predice averías antes de que ocurran
- 📊 **Métricas de eficiencia**: Tiempo medio de respuesta, costos, etc.
- 📋 **Inventario de repuestos**: Control de stock de materiales
- 💰 **Presupuestos**: Seguimiento de presupuestos por edificio

---

## Funcionalidades Avanzadas

### 1. Módulo Coliving (Alquiler por Habitaciones)

**Para gestionar coliving o pisos compartidos**:

1. Cree la unidad principal (ej: "Piso compartido C/ Mayor")
2. Vaya a **Alquiler por Habitaciones** → Seleccione la unidad
3. Cree las habitaciones individuales:
   - Habitación 1, Habitación 2, etc.
   - Precio por habitación
4. Cree contratos individuales por habitación
5. **Prorrateo de gastos**:
   - Ingrese los gastos comunes (luz, agua, internet)
   - El sistema los distribuye automáticamente entre habitaciones
6. **Calendario de limpieza**:
   - Genere un calendario rotativo de limpieza
   - Se envía automáticamente a cada inquilino

### 2. STR (Short-Term Rental)

**Para alquileres vacacionales**:

1. Vaya a **STR** → **"Listings"**
2. Cree un listing para cada unidad
3. **Channel Manager**:
   - Conecte con Airbnb, Booking.com, etc.
   - Sincronización automática de disponibilidad
   - Evite dobles reservas
4. **Gestión de reservas**:
   - Calendario unificado
   - Check-in / Check-out automático
   - Pricing dinámico

### 3. Asistente de IA

**Acceso**: 🤖 Botón flotante en la esquina inferior derecha

**Funcionalidades**:
- Responde preguntas sobre el sistema
- Genera reportes personalizados
- Sugiere acciones proactivas
- Análisis de datos por voz

**Ejemplos de comandos**:
- "Muéstrame los pagos pendientes de diciembre"
- "¿Cuál es la tasa de ocupación este mes?"
- "Genera un reporte de mantenimiento del Edificio Central"

### 4. OCR de Documentos

1. Vaya a **OCR**
2. Suba una imagen de:
   - DNI / Pasaporte
   - Contrato
   - Factura
3. El sistema extrae automáticamente los datos
4. Clic en **"Crear Inquilino"** o **"Crear Contrato"** para rellenar formularios automáticamente

### 5. Analytics y BI

**Analytics** (`/analytics`):
- Gráficos interactivos
- Evolución temporal de KPIs
- Comparativas entre edificios

**Business Intelligence** (`/bi`):
- Dashboards personalizables
- Análisis de rentabilidad
- Predicciones de ingresos
- Análisis de morosidad

### 6. Calendario Unificado

**Acceso**: **Calendario** en el menú

**Visualiza en un solo lugar**:
- 💰 Fechas de pago
- 📝 Vencimientos de contratos
- 🔧 Mantenimientos programados
- 👁️ Visitas de candidatos
- 🏗️ Inspecciones
- 📅 Reuniones de comunidad

**Sincronización**: Automática cada hora

### 7. Integraciones Contables

Conecte con su software contable:

1. Vaya a **Contabilidad**
2. En la pestaña **"Integraciones"**, seleccione su proveedor:
   - Zucchetti
   - ContaSimple
   - Sage
   - Holded
   - A3 Software
   - Alegra
3. Configure las credenciales
4. **Funciones**:
   - Sincronizar clientes (inquilinos)
   - Crear facturas automáticamente
   - Registrar pagos
   - Registrar gastos

### 8. Firma Digital

1. Vaya a **Firma Digital**
2. Suba el documento (PDF del contrato)
3. Añada los firmantes (inquilino, propietario)
4. El sistema envía emails con links de firma
5. Reciba el documento firmado digitalmente

---

## Módulos por Rol

### Super Administrador

**Panel**: `/admin/dashboard`

**Funcionalidades exclusivas**:
- Gestión de empresas clientes
- Impersonación ("Login como" cliente)
- Configuración de planes de suscripción
- Estadísticas globales
- Auditoría completa
- Gestión de módulos por cliente

### Administrador

**Acceso a**:
- Todos los módulos de su empresa
- Configuración de empresa
- Gestión de usuarios
- Reportes avanzados
- Facturación B2B (si aplica)

### Gestor

**Acceso a**:
- CRUD de propiedades, inquilinos, contratos
- Mantenimiento
- Pagos
- Reportes básicos
- **No puede**: Eliminar registros, gestionar usuarios

### Operador

**Acceso a**:
- Visualización de datos
- Crear solicitudes de mantenimiento
- Registrar pagos
- **No puede**: Modificar ni eliminar

---

## FAQ

### ¿Cómo cambio mi contraseña?

1. Clic en su avatar (esquina superior derecha)
2. **"Mi Perfil"**
3. **"Cambiar Contraseña"**
4. Ingrese contraseña actual y nueva
5. Guarde

### ¿Cómo añado usuarios a mi equipo?

1. Vaya a **Admin** → **"Usuarios"** (requiere rol de Administrador)
2. Clic en **"+ Nuevo Usuario"**
3. Complete email, nombre, rol
4. Guarde (el usuario recibirá un email de bienvenida)

### ¿Puedo gestionar múltiples empresas?

Sí, si su cuenta tiene acceso multi-empresa:
1. Clic en el selector de empresa (header)
2. Seleccione la empresa
3. La interfaz cambiará al contexto de esa empresa

### ¿Cómo exporto datos?

Desde cualquier listado (Edificios, Contratos, etc.):
1. Clic en el botón **"Exportar"** (📥)
2. Seleccione formato (CSV, Excel, PDF)
3. Descargue el archivo

### ¿Dónde encuentro los recibos de los pagos?

1. **Pagos** → Seleccione el pago
2. En el detalle, clic en **"Descargar Recibo" (PDF)**

O desde el **Portal del Inquilino**, el inquilino puede descargarlos directamente.

### ¿Cómo activo los pagos recurrentes con Stripe?

Ver sección [Pagos Automáticos con Stripe](#pagos-automáticos-con-stripe)

### ¿Puedo personalizar los colores y logo de la plataforma?

Sí (White Label):
1. Vaya a **Admin** → **"Personalización"**
2. Configure:
   - Logotipo
   - Colores primarios/secundarios
   - Nombre de la aplicación
   - Favicon
3. Guarde (los cambios se aplican inmediatamente)

### ¿Cómo contacto con soporte?

- **Chat en vivo**: Botón de chat en la esquina inferior derecha
- **Email**: soporte@inmova.com
- **Base de conocimientos**: `/knowledge-base`

---

## Próximos Pasos

1. ✅ Complete el **onboarding tour** (guía interactiva al iniciar sesión)
2. ✅ Cree su primer edificio y unidad
3. ✅ Añada inquilinos
4. ✅ Genere un contrato
5. ✅ Explore los reportes y analytics
6. ✅ Active integraciones (Stripe, contabilidad)

---

**¿Necesita ayuda?** No dude en contactar con nuestro equipo de soporte.

**Email**: soporte@inmova.com  
**Web**: https://inmova.app

---

**Última actualización**: Diciembre 2025  
**Versión de la Guía**: 1.0
