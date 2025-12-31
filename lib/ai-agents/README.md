# Sistema de Agentes IA - INMOVA

Sistema avanzado de agentes IA especializados para gestión inmobiliaria.

## 🚀 Inicio Rápido

```typescript
import { processAgentMessage } from '@/lib/ai-agents';

const context = {
  userId: 'user-123',
  userType: 'tenant',
  userName: 'Juan Pérez',
  userEmail: 'juan@example.com',
  companyId: 'company-456'
};

const response = await processAgentMessage(
  'Necesito reportar una fuga de agua',
  context
);
```

## 🤖 Agentes Disponibles

1. **Servicio Técnico**: Mantenimiento y reparaciones
2. **Atención al Cliente**: Consultas y soporte
3. **Gestión Comercial**: Ventas y leads
4. **Análisis Financiero**: Rentabilidad y finanzas
5. **Legal y Cumplimiento**: Contratos y normativa

## 📚 Documentación Completa

Ver: `/docs/AI_AGENTS_SYSTEM.md`

## 🔧 Configuración

```bash
# Requerido
ANTHROPIC_API_KEY=sk-ant-xxxxx
DATABASE_URL=postgresql://...
```

## 📦 Estructura

```
lib/ai-agents/
├── types.ts                          # Tipos TypeScript
├── base-agent.ts                     # Clase base de agentes
├── agent-coordinator.ts              # Coordinador central
├── technical-support-agent.ts        # Agente de soporte técnico
├── customer-service-agent.ts         # Agente de atención al cliente
├── commercial-management-agent.ts    # Agente comercial
├── financial-analysis-agent.ts       # Agente financiero
├── legal-compliance-agent.ts         # Agente legal
└── index.ts                          # Exportaciones

app/api/agents/
├── chat/route.ts                     # POST /api/agents/chat
├── list/route.ts                     # GET /api/agents/list
├── metrics/route.ts                  # GET /api/agents/metrics
└── handoff/route.ts                  # POST /api/agents/handoff

components/agents/
├── AgentChat.tsx                     # Componente de chat
└── AgentSelector.tsx                 # Selector de agentes
```

## 🎯 Características

- ✅ 5 agentes especializados
- ✅ Coordinación inteligente
- ✅ Tool calling con Claude 3.5 Sonnet
- ✅ Transferencias entre agentes
- ✅ Escalación a humanos
- ✅ Métricas y monitoreo
- ✅ APIs REST completas
- ✅ Componentes UI listos para usar

## 🔒 Seguridad

- Autenticación requerida en todos los endpoints
- Validación de permisos por rol
- Audit log de todas las interacciones
- Sanitización de datos de entrada
- Cumplimiento GDPR

## 📊 Monitoreo

```typescript
import { getAgentsMetrics } from '@/lib/ai-agents';

const metrics = await getAgentsMetrics('technical_support', 30);
```

## 🤝 Contribuir

Este es un sistema interno de INMOVA. Para soporte o mejoras, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Powered by**: Anthropic Claude 3.5 Sonnet  
**Licencia**: Propietario - INMOVA
