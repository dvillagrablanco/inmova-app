# Sistema de Agentes IA - INMOVA

## Descripción General

Sistema avanzado de agentes IA especializados para la plataforma INMOVA, diseñado para automatizar y optimizar diversas áreas de la gestión inmobiliaria mediante inteligencia artificial conversacional.

### Versión: 1.0.0
### Powered by: Anthropic Claude 3.5 Sonnet

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Agentes Especializados](#agentes-especializados)
3. [Coordinación entre Agentes](#coordinación-entre-agentes)
4. [APIs y Endpoints](#apis-y-endpoints)
5. [Componentes UI](#componentes-ui)
6. [Guía de Uso](#guía-de-uso)
7. [Configuración y Despliegue](#configuración-y-despliegue)
8. [Métricas y Monitoreo](#métricas-y-monitoreo)
9. [Casos de Uso](#casos-de-uso)
10. [Limitaciones y Consideraciones](#limitaciones-y-consideraciones)

---

## Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│                    Usuario/Cliente                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Interfaz de Usuario (UI)                    │
│  • AgentChat Component                                   │
│  • AgentSelector Component                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   API Layer                              │
│  • /api/agents/chat                                      │
│  • /api/agents/list                                      │
│  • /api/agents/metrics                                   │
│  • /api/agents/handoff                                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Agent Coordinator                           │
│  • Detección de Intención                               │
│  • Selección de Agente                                   │
│  • Gestión de Transferencias                            │
│  • Registro de Métricas                                  │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┼──────────┐
         ▼           ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │ Agente  │ │ Agente  │ │ Agente  │
   │    1    │ │    2    │ │   ...   │
   └─────────┘ └─────────┘ └─────────┘
         │           │          │
         └───────────┼──────────┘
                     ▼
         ┌───────────────────────┐
         │   Claude 3.5 Sonnet   │
         │    (Tool Calling)     │
         └───────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Database (Prisma)   │
         │   • Contratos         │
         │   • Pagos             │
         │   • Mantenimiento     │
         │   • etc.              │
         └───────────────────────┘
```

### Flujo de Procesamiento

1. **Entrada del Usuario**: Mensaje enviado a través de la UI
2. **API Gateway**: Autenticación y validación
3. **Coordinador**: Detecta intención y selecciona agente apropiado
4. **Agente Especializado**: Procesa el mensaje usando Claude + Tool Calling
5. **Ejecución de Herramientas**: Acceso y modificación de datos
6. **Respuesta**: Respuesta estructurada con acciones y sugerencias
7. **Persistencia**: Registro de interacción para métricas

---

## Agentes Especializados

### 1. Agente de Servicio Técnico (Technical Support)

**Responsabilidades:**
- Gestión de solicitudes de mantenimiento
- Diagnóstico de problemas técnicos
- Asignación de proveedores especializados
- Protocolos de emergencia
- Mantenimiento preventivo

**Herramientas Disponibles:**
- `create_maintenance_request`: Crear solicitudes de mantenimiento
- `search_maintenance_requests`: Buscar y filtrar solicitudes
- `get_maintenance_details`: Detalles completos de solicitud
- `diagnose_issue`: Diagnóstico preliminar de problemas
- `assign_provider`: Asignar proveedores a solicitudes
- `get_emergency_contacts`: Contactos de emergencia
- `schedule_preventive_maintenance`: Programar mantenimiento preventivo

**Keywords de Activación:**
mantenimiento, reparación, técnico, emergencia, fuga, avería, etc.

---

### 2. Agente de Atención al Cliente (Customer Service)

**Responsabilidades:**
- Consultas generales
- Gestión de quejas y reclamos
- Información sobre contratos y pagos
- Programación de visitas
- Solicitud de documentos
- Escalación a agentes humanos

**Herramientas Disponibles:**
- `get_user_profile`: Perfil del usuario
- `get_contract_details`: Información de contratos
- `check_payment_status`: Estado de pagos
- `create_complaint`: Registrar quejas
- `schedule_visit`: Programar visitas
- `request_document`: Solicitar documentos
- `get_faq_answer`: Base de conocimientos
- `escalate_to_human_agent`: Escalar a humano
- `search_knowledge_base`: Buscar información

**Keywords de Activación:**
consulta, pregunta, información, ayuda, queja, documento, etc.

---

### 3. Agente de Gestión Comercial (Commercial Management)

**Responsabilidades:**
- Captación y gestión de leads
- Seguimiento de oportunidades comerciales
- Análisis de mercado
- Optimización de precios
- Generación de propuestas
- Análisis del embudo de conversión

**Herramientas Disponibles:**
- `capture_lead`: Capturar nuevos leads
- `search_leads`: Buscar y filtrar leads
- `create_opportunity`: Crear oportunidades
- `get_pipeline_metrics`: Métricas del pipeline
- `analyze_pricing_strategy`: Análisis de precios
- `generate_commercial_proposal`: Generar propuestas
- `track_lead_interaction`: Registrar interacciones
- `analyze_conversion_funnel`: Análisis de conversión

**Keywords de Activación:**
lead, venta, prospecto, cliente, propuesta, comercial, pipeline, etc.

---

### 4. Agente de Análisis Financiero (Financial Analysis)

**Responsabilidades:**
- Análisis de rentabilidad
- Proyecciones de flujo de caja
- Análisis de morosidad
- Optimización de costos
- Reportes financieros
- Detección de riesgos financieros
- Evaluación de inversiones

**Herramientas Disponibles:**
- `analyze_property_profitability`: Análisis de rentabilidad
- `analyze_cashflow`: Análisis de flujo de caja
- `analyze_delinquency`: Análisis de morosidad
- `generate_financial_report`: Reportes financieros
- `detect_financial_risks`: Detección de riesgos
- `calculate_investment_roi`: Cálculo de ROI

**Keywords de Activación:**
financiero, rentabilidad, roi, flujo de caja, morosidad, análisis, etc.

---

### 5. Agente de Legal y Cumplimiento (Legal Compliance)

**Responsabilidades:**
- Revisión de contratos
- Cumplimiento normativo
- Gestión de disputas legales
- Alertas de vencimientos
- Generación de documentos legales
- Auditorías de cumplimiento

**Herramientas Disponibles:**
- `review_contract`: Revisar contratos
- `check_compliance_status`: Estado de cumplimiento
- `create_legal_dispute`: Registrar disputas
- `get_legal_alerts`: Alertas legales
- `generate_legal_document`: Generar documentos
- `search_legal_precedents`: Buscar precedentes
- `audit_compliance`: Auditoría de cumplimiento

**Keywords de Activación:**
legal, contrato, cláusula, disputa, normativa, cumplimiento, etc.

---

## Coordinación entre Agentes

### Detección Automática de Intención

El **AgentCoordinator** analiza cada mensaje para determinar el agente más apropiado:

1. **Análisis de Keywords**: Busca palabras clave asociadas a cada agente
2. **Contexto de Conversación**: Considera el historial reciente
3. **Capacidad de Manejo**: Verifica que el agente puede manejar la consulta
4. **Priorización**: Aplica orden de prioridad (emergencias primero)

### Transferencias (Handoffs)

Los agentes pueden transferir conversaciones cuando:
- El tema sale de su área de especialización
- El usuario lo solicita explícitamente
- La complejidad requiere otro especialista
- Se detecta un tema cruzado

**Ejemplo de Transferencia:**
```typescript
// Usuario pregunta sobre "morosidad en el pago del mantenimiento"
// Agente de Servicio Técnico detecta tema financiero
// Sugiere transferencia al Agente Financiero
```

### Escalación a Humanos

Criterios de escalación automática:
- Casos fuera de capacidad del agente
- Usuario insatisfecho después de múltiples intentos
- Temas legales complejos que requieren abogado
- Situaciones que requieren aprobación superior
- Errores repetidos en el procesamiento

---

## APIs y Endpoints

### POST /api/agents/chat

Endpoint principal para interactuar con agentes.

**Request Body:**
```json
{
  "message": "string",
  "conversationId": "string (opcional)",
  "preferredAgent": "AgentType (opcional)"
}
```

**Response:**
```json
{
  "success": true,
  "response": "string",
  "agentType": "AgentType",
  "status": "success|partial|error",
  "actions": [...],
  "suggestions": [...],
  "toolsUsed": [...],
  "executionTime": 1234,
  "confidence": 0.85,
  "needsEscalation": false,
  "conversationId": "string"
}
```

---

### GET /api/agents/list

Lista todos los agentes disponibles.

**Response:**
```json
{
  "success": true,
  "system": {
    "version": "1.0.0",
    "name": "INMOVA AI Agents System",
    "agents": [...]
  },
  "agents": [...],
  "totalAgents": 5,
  "enabledAgents": 5
}
```

---

### GET /api/agents/metrics

Obtiene métricas de uso y desempeño (requiere permisos de admin).

**Query Parameters:**
- `agentType`: Filtrar por tipo de agente
- `periodDays`: Período de análisis (default: 30)

**Response:**
```json
{
  "success": true,
  "period": {...},
  "globalSummary": {...},
  "insights": {...},
  "metrics": [...]
}
```

---

### POST /api/agents/handoff

Transfiere una conversación entre agentes.

**Request Body:**
```json
{
  "conversationId": "string",
  "fromAgent": "AgentType",
  "toAgent": "AgentType",
  "reason": "string"
}
```

---

## Componentes UI

### AgentChat

Componente principal de chat interactivo.

**Props:**
- `preferredAgent?: AgentType` - Agente preferido
- `onAgentChange?: (agent: AgentType) => void` - Callback al cambiar agente
- `className?: string` - Clases CSS adicionales

**Características:**
- Chat en tiempo real
- Indicadores de typing
- Acciones ejecutadas visualizadas
- Sugerencias interactivas
- Historial de conversación
- Auto-scroll
- Manejo de errores

**Uso:**
```tsx
import AgentChat from '@/components/agents/AgentChat';

<AgentChat 
  preferredAgent="technical_support"
  onAgentChange={(agent) => console.log('Agente cambiado:', agent)}
/>
```

---

### AgentSelector

Selector visual de agentes especializados.

**Props:**
- `selectedAgent?: AgentType` - Agente seleccionado
- `onSelectAgent: (agent: AgentType) => void` - Callback de selección
- `className?: string` - Clases CSS adicionales

**Uso:**
```tsx
import AgentSelector from '@/components/agents/AgentSelector';

<AgentSelector
  selectedAgent={currentAgent}
  onSelectAgent={(agent) => setCurrentAgent(agent)}
/>
```

---

## Guía de Uso

### Integración Básica

```typescript
import { processAgentMessage, AgentType, UserContext } from '@/lib/ai-agents';

// Contexto del usuario
const context: UserContext = {
  userId: 'user-123',
  userType: 'tenant',
  userName: 'Juan Pérez',
  userEmail: 'juan@example.com',
  companyId: 'company-456'
};

// Procesar mensaje
const response = await processAgentMessage(
  'Necesito reportar una fuga de agua en mi departamento',
  context,
  'conv-123', // conversationId opcional
  'technical_support' // agente preferido opcional
);

console.log('Respuesta:', response.message);
console.log('Agente usado:', response.agentType);
console.log('Herramientas usadas:', response.toolsUsed);
```

---

### Uso Avanzado: Crear Agente Personalizado

```typescript
import { BaseAgent } from '@/lib/ai-agents';
import { AgentConfig, AgentResponse, UserContext } from '@/lib/ai-agents/types';

class CustomAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      type: 'custom_agent',
      name: 'Mi Agente Personalizado',
      description: 'Descripción del agente',
      systemPrompt: 'Eres un agente especializado en...',
      capabilities: [...],
      tools: [...],
      enabled: true
    };
    
    super(config);
  }

  async processMessage(
    message: string,
    context: UserContext,
    conversationHistory = []
  ): Promise<AgentResponse> {
    return this.chatWithClaude(message, context, conversationHistory);
  }

  async canHandle(message: string, context: UserContext): Promise<boolean> {
    // Lógica para determinar si puede manejar el mensaje
    return message.toLowerCase().includes('mi-keyword');
  }
}
```

---

## Configuración y Despliegue

### Variables de Entorno Requeridas

```bash
# Anthropic API Key (requerido)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Database (Prisma)
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

### Instalación de Dependencias

```bash
npm install @anthropic-ai/sdk
npm install @prisma/client
```

### Migraciones de Base de Datos

El sistema requiere las siguientes tablas adicionales:

```prisma
model AgentInteraction {
  id              String   @id @default(cuid())
  agentType       String
  userId          String
  companyId       String
  messageInput    String   @db.Text
  messageOutput   String   @db.Text
  successful      Boolean  @default(true)
  escalated       Boolean  @default(false)
  toolsUsed       Json?
  responseTime    Int?
  confidence      Float?
  timestamp       DateTime @default(now())
  metadata        Json?
}

model AgentHandoff {
  id                  String   @id @default(cuid())
  fromAgent           String
  toAgent             String
  reason              String
  userId              String
  companyId           String
  timestamp           DateTime @default(now())
  conversationContext Json?
}
```

---

## Métricas y Monitoreo

### Métricas Disponibles

- **Total de Interacciones**: Número total de mensajes procesados
- **Tasa de Éxito**: % de interacciones exitosas
- **Tiempo de Respuesta Promedio**: Latencia en ms
- **Confianza Promedio**: Score de confianza 0-1
- **Tasa de Escalación**: % de casos escalados a humanos
- **Uso de Herramientas**: Frecuencia de uso por tool
- **Satisfacción del Usuario**: Score de satisfacción (requiere feedback)

### Dashboard de Métricas

Accede a las métricas vía API:

```typescript
const metrics = await getAgentsMetrics('technical_support', 30);

console.log('Métricas últimos 30 días:', metrics);
```

---

## Casos de Uso

### Caso 1: Solicitud de Mantenimiento de Emergencia

**Usuario:** "Hay una fuga de agua en mi baño, es urgente"

**Flujo:**
1. Coordinador detecta emergencia → Agente Técnico
2. Agente identifica tipo: emergencia + fontanería
3. Ejecuta herramientas:
   - `create_maintenance_request` (prioridad urgente)
   - `get_emergency_contacts` (tipo: fuga_agua)
4. Responde con:
   - Solicitud creada
   - Contactos de emergencia
   - Instrucciones inmediatas (cerrar llave de paso)

---

### Caso 2: Consulta de Pagos Atrasados

**Usuario:** "¿Cuánto debo de renta?"

**Flujo:**
1. Coordinador → Agente de Atención al Cliente
2. Agente ejecuta: `check_payment_status`
3. Detecta pagos atrasados
4. Sugiere transferencia → Agente Financiero (opcional)
5. Responde con:
   - Detalle de pagos pendientes
   - Días de atraso
   - Métodos de pago disponibles
   - Posibles consecuencias de mora

---

### Caso 3: Análisis de Rentabilidad de Propiedad

**Usuario:** "¿Qué tan rentable es mi edificio en Polanco?"

**Flujo:**
1. Coordinador → Agente Financiero
2. Agente ejecuta:
   - `analyze_property_profitability`
   - `analyze_cashflow`
3. Genera análisis completo con:
   - NOI y ROI
   - Cap Rate
   - Comparativa con mercado
   - Recomendaciones de optimización

---

## Limitaciones y Consideraciones

### Limitaciones Técnicas

1. **Rate Limits de Anthropic**: Máximo de llamadas por minuto
2. **Token Limits**: Conversaciones muy largas pueden truncarse
3. **Latencia**: Respuestas pueden tomar 2-10 segundos
4. **Precisión**: IA puede cometer errores, validación humana recomendada

### Consideraciones de Seguridad

1. **Autenticación Requerida**: Todos los endpoints requieren sesión válida
2. **Permisos por Rol**: Algunas herramientas requieren permisos específicos
3. **Validación de Datos**: Toda data de usuario es sanitizada
4. **Audit Log**: Todas las interacciones son registradas
5. **PII Protection**: Datos sensibles son manejados según GDPR

### Consideraciones Legales

1. **Disclaimer Legal**: Agente Legal NO reemplaza a un abogado real
2. **Responsabilidad**: Decisiones críticas deben validarse con humanos
3. **Documentos Generados**: Son borradores que requieren revisión legal
4. **Asesoría Financiera**: No constituye asesoría financiera certificada

### Best Practices

1. **Validación Humana**: Para decisiones críticas o de alto impacto
2. **Monitoreo Continuo**: Revisar métricas de escalación regularmente
3. **Feedback Loop**: Implementar sistema de feedback de usuarios
4. **Actualización de Knowledge Base**: Mantener FAQs y precedentes actualizados
5. **Testing**: Probar casos edge antes de deployment

---

## Roadmap Futuro

### Versión 1.1 (Próximos 3 meses)

- [ ] Soporte multiidioma (inglés, portugués)
- [ ] Integración con WhatsApp Business
- [ ] Voice interface (speech-to-text)
- [ ] Análisis de sentimiento en tiempo real
- [ ] Dashboard de métricas en UI

### Versión 2.0 (6-12 meses)

- [ ] Aprendizaje continuo con feedback
- [ ] Agentes adicionales (Marketing, HR, etc.)
- [ ] Integración con sistemas externos (ERP, CRM)
- [ ] Modo colaborativo multi-agente
- [ ] API pública para terceros

---

## Soporte y Contacto

- **Documentación**: `/docs/AI_AGENTS_SYSTEM.md`
- **Issues**: GitHub Issues
- **Email**: dev@inmova.com
- **Slack**: #ai-agents-support

---

## Licencia

Copyright © 2024 INMOVA. Todos los derechos reservados.

---

**Última actualización**: Diciembre 2024
**Versión del documento**: 1.0.0
