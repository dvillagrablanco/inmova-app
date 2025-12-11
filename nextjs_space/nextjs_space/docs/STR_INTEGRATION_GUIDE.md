# Guía de Integraciones STR (Short-Term Rental)

## 🌎 Descripción General

El módulo de Integraciones STR permite conectar y sincronizar propiedades con plataformas externas como Airbnb, Booking.com, VRBO, y otros canales de alquiler vacacional.

### Funcionalidades Principales

1. **Conexión Multi-Canal**: Conecta un listing con múltiples plataformas simultáneamente
2. **Sincronización Automática**: Calendario, precios y reservas se sincronizan automáticamente
3. **Importación de Reservas**: Importa reservas existentes desde canales externos
4. **Gestión de Precios**: Actualiza precios dinámicamente en todos los canales
5. **Webhooks**: Recibe notificaciones en tiempo real de cambios externos

---

## 📦 Componentes Implementados

### 1. Servicio de Integración
**Archivo**: `lib/str-channel-integration-service.ts`

Servicio central que maneja todas las operaciones de integración:

```typescript
// Conectar un canal
await connectChannel(companyId, listingId, channel, credentials);

// Sincronizar calendario
await syncCalendar(listingId, channel, startDate, endDate);

// Importar reservas
await importBookings(companyId, listingId, channel);

// Actualizar precios
await updateChannelPrices(listingId, channel, priceUpdates);

// Desconectar canal
await disconnectChannel(listingId, channel);

// Obtener estado
const status = await getChannelStatus(listingId, channel);
```

### 2. API Endpoints

#### Conectar Canal
```
POST /api/str/channels/connect
Body: {
  listingId: string,
  channel: ChannelType,
  credentials: {
    apiKey?: string,
    listingId?: string,
    propertyId?: string
  }
}
```

#### Desconectar Canal
```
POST /api/str/channels/disconnect
Body: {
  listingId: string,
  channel: ChannelType
}
```

#### Estado de Canales
```
GET /api/str/channels/[listingId]/status
Response: {
  listingId: string,
  channels: ChannelStatus[]
}
```

#### Sincronización
```
POST /api/str/channels/[listingId]/sync
Body: {
  channel: ChannelType,
  type: 'calendar' | 'bookings' | 'prices',
  data?: any
}
```

### 3. Interfaz de Usuario

#### Página de Gestión de Canales
**Ruta**: `/str/listings/[id]/channels`

- Vista de todos los canales soportados
- Estado de conexión en tiempo real
- Botones de acción: Conectar, Desconectar, Sincronizar
- Última sincronización y próxima programada
- Sincronización manual por tipo (calendario, precios, reservas)

#### Página de Configuración
**Ruta**: `/str/settings/integrations`

- Configuración general de sincronización
- Gestión de credenciales por canal
- Configuración de webhooks
- Opciones avanzadas

---

## 🔧 Base de Datos

### Modelos Principales

#### STRChannelSync
Almacena la configuración de conexión con cada canal:

```prisma
model STRChannelSync {
  id        String      @id @default(cuid())
  companyId String
  listingId String
  canal     ChannelType
  
  activo     Boolean @default(true)
  apiKey     String?
  externalId String?
  
  sincronizarPrecio     Boolean @default(true)
  sincronizarCalendario Boolean @default(true)
  sincronizarReservas   Boolean @default(true)
  
  ultimaSync  DateTime?
  proximaSync DateTime?
  estadoSync  String    @default("pendiente")
  erroresSync Int       @default(0)
  
  @@unique([listingId, canal])
}
```

#### STRBooking
Almacena reservas importadas desde canales externos:

```prisma
model STRBooking {
  id               String      @id @default(cuid())
  listingId        String
  canal            ChannelType
  reservaExternaId String?     // ID de la reserva en el canal externo
  
  // ... demás campos
}
```

### Canales Soportados

```prisma
enum ChannelType {
  AIRBNB
  BOOKING
  VRBO
  HOMEAWAY
  WEB_PROPIA
  EXPEDIA
  TRIPADVISOR
  OTROS
}
```

---

## 🌐 Modo Demo vs Producción
### Modo Demo (Actual)

Actualmente el sistema opera en **modo demo**, lo que significa:

✅ **Funcionalidades simuladas**:
- Conexión con canales (sin credenciales reales)
- Generación de calendario demo
- Importación de reservas simuladas
- Sincronización de precios local

❌ **No realiza**:
- Conexiones reales a APIs externas
- Envío de datos a plataformas externas
- Recepción de webhooks reales

### Activar Modo Producción
#### 1. Configurar Variables de Entorno

Crea un archivo `.env` con las credenciales de cada canal:

```bash
# Airbnb
AIRBNB_CLIENT_ID=your_client_id
AIRBNB_CLIENT_SECRET=your_client_secret

# Booking.com
BOOKING_API_KEY=your_api_key
BOOKING_HOTEL_ID=your_hotel_id

# VRBO
VRBO_API_KEY=your_api_key

# ... etc
```

#### 2. Implementar Llamadas a APIs Reales

Modifica `str-channel-integration-service.ts` para incluir lógica de API real:

```typescript
if (process.env.NODE_ENV === 'production') {
  // Llamadas a API real
  const response = await fetch(
    `${CHANNEL_CONFIGS[channel].apiUrl}/listings`,
    {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  // ... procesar respuesta
} else {
  // Modo demo: simulación
  await simulateInitialSync(listingId, channel);
}
```

#### 3. Configurar Webhooks

Cada plataforma requiere configurar webhooks en su panel:

**URL del webhook**: `https://tu-dominio.com/api/webhooks/str`

**Eventos a suscribir**:
- Nuevas reservas
- Modificación de reservas
- Cancelaciones
- Nuevas reseñas
- Mensajes de huéspedes

---

## 🔄 Flujo de Sincronización

### 1. Conexión Inicial

```mermaid
graph LR
    A[Usuario] --> B[Ingresa credenciales]
    B --> C[connectChannel()]
    C --> D[Valida conexión]
    D --> E[Crea STRChannelSync]
    E --> F[Sincronización inicial]
    F --> G[Calendario 30 días]
```

### 2. Sincronización Automática

El sistema ejecuta sincronizaciones automáticas cada 24 horas (configurable):

1. **Calendario**: Sincroniza disponibilidad y precios
2. **Reservas**: Importa nuevas reservas y actualizaciones
3. **Precios**: Envía cambios de precio a canales externos

### 3. Sincronización Manual

Los usuarios pueden forzar sincronizaciones en cualquier momento desde la UI:

```typescript
// Usuario hace clic en "Sincronizar Calendario"
POST /api/str/channels/[listingId]/sync
{
  channel: 'AIRBNB',
  type: 'calendar'
}
```

---

## 🚨 Manejo de Errores

### Registro de Errores

Todos los errores se registran usando el sistema de logging:

```typescript
import { logError } from '@/lib/logger';

try {
  // Operación de sincronización
} catch (error) {
  logError(error as Error, {
    context: 'syncCalendar',
    channel: 'AIRBNB',
    listingId
  });
}
```

### Reintentos Automáticos

Cuando falla una sincronización:
1. Se incrementa el contador `erroresSync`
2. Se programa un reintento automático
3. Después de 3 errores consecutivos, se notifica al usuario

### Estados de Sincronización

- `conectado`: Canal activo y funcionando
- `sincronizado`: Última sincronización exitosa
- `sincronizando`: Sincronización en progreso
- `error`: Error en la última sincronización
- `desconectado`: Canal inactivo

---

## 📊 Estadísticas y Monitoreo

### Dashboard de Integraciones

La página `/str/settings/integrations` muestra:

- **Listings activos** con integraciones
- **Canales conectados** total
- **Sincronizaciones activas** en tiempo real
- **Última sincronización** timestamp

### Métricas por Canal

Para cada canal se rastrea:
- Número de sincronizaciones exitosas
- Número de errores
- Tiempo promedio de sincronización
- Número de reservas importadas

---

## 🔒 Seguridad

### Credenciales

- Las API keys se almacenan encriptadas en la base de datos
- Nunca se exponen en logs o respuestas de API
- Cada compañía solo puede ver/modificar sus propias conexiones

### Validación

- Todas las peticiones requieren autenticación (NextAuth)
- Se valida que el listing pertenezca a la compañía del usuario
- Rate limiting en endpoints de sincronización

### Webhooks

- Verificación de firma para webhooks entrantes
- IP whitelist (opcional) para plataformas que lo soportan

---

## 📝 Roadmap Futuro

### Fase 2: Integraciones Reales
- [ ] Implementar APIs reales de Airbnb
- [ ] Implementar APIs reales de Booking.com
- [ ] Implementar APIs reales de VRBO
- [ ] Sistema de webhooks completo

### Fase 3: Funcionalidades Avanzadas
- [ ] Pricing dinámico basado en ocupación
- [ ] Mensajería unificada con huéspedes
- [ ] Respuesta automática a reseñas
- [ ] Reportes de rendimiento por canal
- [ ] A/B testing de precios

### Fase 4: Optimizaciones
- [ ] Cache de datos de sincronización
- [ ] Sincronización incremental (solo cambios)
- [ ] Background jobs con queue
- [ ] Notificaciones push en tiempo real

---

## 📚 Recursos

### Documentación de APIs Externas

- **Airbnb**: [Airbnb API Docs](https://www.airbnb.com/partner)
- **Booking.com**: [Booking.com XML API](https://connect.booking.com/)
- **VRBO**: [VRBO API Documentation](https://www.vrbo.com/info/developer)
- **Expedia**: [Expedia Partner Central](https://www.expediapartnercentral.com/)

### Guías de Implementación

1. [Cómo obtener credenciales de Airbnb](docs/airbnb-setup.md)
2. [Configuración de Booking.com](docs/booking-setup.md)
3. [Webhooks: Guía completa](docs/webhooks-guide.md)

---

## ❓ Preguntas Frecuentes

### ¿Puedo conectar el mismo listing a múltiples canales?

Sí, puedes conectar un listing a todos los canales que necesites. El sistema previene doble-reservas bloqueando automáticamente las fechas en todos los canales conectados.

### ¿Qué pasa si hay un error en la sincronización?

El sistema intenta resinc ronizar automáticamente. Después de 3 intentos fallidos, recibirás una notificación y el canal quedará marcado con estado "error".

### ¿Cómo maneja el sistema las diferencias de precio entre canales?

Puedes configurar un precio base y agregar/reducir un porcentaje específico para cada canal. Por ejemplo: Airbnb +10%, Booking.com +15%.

### ¿Qué sucede si modifico una reserva en un canal externo?

Si los webhooks están configurados, recibirás la actualización inmediatamente. Si no, la próxima sincronización automática actualizará los datos.

---

## 👥 Soporte

Para preguntas o problemas con las integraciones:

1. Revisa esta documentación
2. Consulta los logs en `/str/settings/integrations` > Avanzado
3. Contacta al equipo de soporte con:
   - ID del listing
   - Canal afectado
   - Mensaje de error completo
   - Capturas de pantalla

---

© 2024 Inmova - Sistema de Gestión Inmobiliaria
