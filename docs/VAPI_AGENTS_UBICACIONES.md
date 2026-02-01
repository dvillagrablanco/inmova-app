# 🤖 Ubicación de Agentes IA en Inmova

## 📞 Número de Contacto Principal

**Teléfono USA**: `+1 (XXX) XXX-XXXX` *(pendiente de configurar en Twilio)*

Cuando un usuario llama a este número, es atendido por **Ana (Recepcionista Virtual)** quien deriva al agente especializado según la necesidad.

---

## 👩‍💻 Ana - Recepcionista Virtual

**Función**: Agente principal que recibe todas las llamadas entrantes y deriva al especialista adecuado.

**Ubicaciones en la App**:
- `/dashboard` - Dashboard principal
- `/dashboard/ayuda` - Página de ayuda central
- Widget flotante global (todas las páginas)

**Deriva a**:
| Si el usuario menciona... | Deriva a... |
|--------------------------|-------------|
| Comprar, inversión, busco piso | Elena (Ventas) |
| Inquilino, pago, contrato | María (Soporte) |
| Avería, emergencia, reparación | Carlos (Incidencias) |
| Valorar, cuánto vale, tasar | Patricia (Valoraciones) |
| Vender mi piso, alquilar mi propiedad | Roberto (Captación) |
| Habitación, coliving, compartir | Laura (Coliving) |
| Comunidad, vecinos, junta | Antonio (Comunidades) |

---

## 👩‍💼 Elena - Asesora Comercial

**Especialidad**: Ventas inmobiliarias, captación de leads, inversión.

**Ubicaciones en la App**:
- `/dashboard/properties` - Listado de propiedades
- `/dashboard/properties/[id]` - Detalle de propiedad
- Página de propiedades públicas
- CRM de leads

**Horario**: L-V 9:00-21:00, S 10:00-14:00

**Funciones IA**:
- Búsqueda de propiedades
- Programar visitas
- Crear leads en CRM
- Enviar información por email

---

## 👩‍🔧 María - Atención al Cliente

**Especialidad**: Soporte a inquilinos, consultas sobre contratos y pagos.

**Ubicaciones en la App**:
- `/dashboard/tenants` - Gestión de inquilinos
- `/dashboard/contracts` - Contratos
- `/dashboard/payments` - Pagos y recibos
- `/dashboard/messages` - Centro de mensajes

**Horario**: L-V 8:00-20:00

**Funciones IA**:
- Consultar estado de pagos
- Crear solicitudes de mantenimiento
- Información de contrato
- Actualizar datos personales
- Registrar reclamaciones

---

## 👨‍🔧 Carlos - Técnico de Incidencias

**Especialidad**: Gestión y triaje de averías, emergencias 24/7.

**Ubicaciones en la App**:
- `/dashboard/maintenance` - Centro de incidencias
- Widget de emergencia (botón rojo)
- Formulario de reporte de averías

**Horario**: 24/7 para emergencias, L-V 8:00-20:00 general

**Funciones IA**:
- Crear incidencias (clasificación automática)
- Asignar técnicos
- Consultar estado de incidencias
- Escalar a supervisor
- Activar servicio de emergencia

---

## 👩‍💻 Patricia - Tasadora Inmobiliaria

**Especialidad**: Valoraciones, análisis de mercado, ROI.

**Ubicaciones en la App**:
- `/dashboard/herramientas` - Herramientas de valoración
- `/dashboard/analytics` - Análisis y reportes
- Calculadora de rentabilidad
- Sección de valoraciones

**Horario**: L-V 9:00-19:00

**Funciones IA**:
- Valoración inicial de propiedad
- Datos de mercado por zona
- Cálculo de ROI
- Programar tasación profesional
- Comparar con propiedades similares

---

## 👨‍💼 Roberto - Captador de Propiedades

**Especialidad**: Captación de inmuebles para venta/alquiler.

**Ubicaciones en la App**:
- `/dashboard/properties/new` - Añadir propiedad
- `/(dashboard)/dashboard-propietarios` - Portal de propietarios
- Formulario de "Quiero vender/alquilar"

**Horario**: L-V 9:00-21:00

**Funciones IA**:
- Registrar nueva propiedad
- Programar visita de captación
- Enviar propuesta de servicios
- Verificar estado legal de propiedad

---

## 👩‍🎨 Laura - Especialista Coliving

**Especialidad**: Espacios compartidos, matching de residentes.

**Ubicaciones en la App**:
- `/(dashboard)/coliving` - Gestión de coliving
- `/(dashboard)/media-estancia` - Media estancia
- Búsqueda de habitaciones
- Calendario de eventos

**Horario**: L-V 10:00-20:00

**Funciones IA**:
- Buscar habitaciones disponibles
- Crear perfil de residente
- Consultar eventos de comunidad
- Programar visita a espacio

---

## 👨‍⚖️ Antonio - Administrador de Fincas

**Especialidad**: Comunidades de propietarios, juntas, cuotas.

**Ubicaciones en la App**:
- `/dashboard/community` - Gestión de comunidades
- `/(dashboard)/admin-fincas` - Administración de fincas
- `/(dashboard)/traditional-rental/communities` - Comunidades (alquiler tradicional)

**Horario**: L-V 9:00-18:00

**Funciones IA**:
- Información de comunidad
- Estado de cuentas
- Consultar deuda de propietario
- Solicitar certificados
- Reportar problemas en zonas comunes
- Info de próxima junta
- Proponer temas para junta

---

## 📱 Integración en la App

### Widget Global (GlobalContactWidget)

Aparece en **todas las páginas** del dashboard como un botón flotante en la esquina inferior derecha. Se adapta automáticamente al contexto de la página:

```tsx
// En layout principal
import { GlobalContactWidget } from '@/components/vapi';

export default function DashboardLayout({ children }) {
  return (
    <div>
      {children}
      <GlobalContactWidget />
    </div>
  );
}
```

### Botón de Ayuda Contextual

Se puede añadir en cualquier sección para mostrar el agente apropiado:

```tsx
import { ContextualHelpButton } from '@/components/vapi';

// En página de incidencias
<ContextualHelpButton 
  agentType="incidents"
  context="¿Tienes una avería? Carlos te ayuda"
/>

// En página de propiedades
<ContextualHelpButton 
  agentType="sales"
  context="¿Interesado en esta propiedad?"
/>
```

### Botón de Asistente Específico

Para acceso directo a un agente concreto:

```tsx
import { VapiAssistantButton } from '@/components/vapi';

// Botón normal
<VapiAssistantButton agentType="valuations" />

// Botón flotante
<VapiAssistantButton agentType="incidents" variant="floating" />
```

---

## 🔧 Configuración de Twilio (Pendiente)

Para completar la integración:

1. **Comprar número USA en Twilio**:
   - Ir a: https://console.twilio.com/us1/develop/phone-numbers/manage/search
   - Tipo: Toll-Free (recomendado)
   - Capacidades: Voice + SMS

2. **Configurar webhook de voz**:
   ```
   Voice URL: https://inmovaapp.com/api/vapi/webhook
   Method: POST
   ```

3. **Actualizar variables de entorno**:
   ```bash
   NEXT_PUBLIC_VAPI_PHONE_NUMBER=+1XXXXXXXXXX
   TWILIO_PHONE_NUMBER_USA=+1XXXXXXXXXX
   ```

4. **Configurar en Vapi Dashboard**:
   - Crear asistente "Ana - Recepcionista"
   - Asignar el número de teléfono

---

## 📊 Resumen de Asignaciones

| Sección App | Agente Principal | Backup |
|-------------|------------------|--------|
| Dashboard principal | Ana (Recepcionista) | - |
| Propiedades | Elena (Ventas) | Roberto |
| Inquilinos/Contratos | María (Soporte) | Ana |
| Pagos | María (Soporte) | Ana |
| Incidencias | Carlos (Técnico) | María |
| Herramientas | Patricia (Valoraciones) | Elena |
| Propietarios | Roberto (Captación) | Elena |
| Coliving | Laura (Coliving) | María |
| Comunidades | Antonio (Comunidades) | María |
| Ayuda/Contacto | Ana (Recepcionista) | Todos |

---

**Última actualización**: 1 de Febrero de 2026
