/**
 * Tests para DocumentAssistantAgent
 *
 * Verifica que el agente documental:
 * - Se puede instanciar correctamente
 * - Puede detectar mensajes relacionados con documentos
 * - Está registrado en el coordinador de agentes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserContext } from '@/lib/ai-agents/types';

// Mock de Anthropic ANTES de importar los agentes
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Test response' }],
          stop_reason: 'end_turn',
        }),
      };
      constructor(_config: any) {}
    },
  };
});

// Mock de Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    tenant: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({
        id: 'test-tenant-id',
        nombreCompleto: 'Test User',
        dni: '12345678Z',
        email: 'test@test.com',
      }),
    },
    agentInteraction: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    agentHandoff: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
  getPrismaClient: () => ({ prisma: {
    tenant: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({
        id: 'test-tenant-id',
        nombreCompleto: 'Test User',
        dni: '12345678Z',
        email: 'test@test.com',
      }),
    },
    agentInteraction: {
      create: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    agentHandoff: {
      create: vi.fn().mockResolvedValue({}),
    },
  } }),
}));

// Mock de ai-document-agent-service
vi.mock('@/lib/ai-document-agent-service', () => ({
  isAIConfigured: vi.fn().mockReturnValue(false),
  analyzeDocument: vi.fn(),
  classifyDocument: vi.fn(),
  extractDocumentData: vi.fn().mockResolvedValue({
    fields: [],
    summary: 'Test summary',
    warnings: [],
    sensitiveData: { hasSensitive: false, types: [] },
  }),
}));

// Import después de los mocks
import {
  DocumentAssistantAgent,
  documentAssistantFAQ,
} from '@/lib/ai-agents/document-assistant-agent';
import { listAgents } from '@/lib/ai-agents';

describe('DocumentAssistantAgent', () => {
  let agent: DocumentAssistantAgent;
  let mockContext: UserContext;

  beforeEach(() => {
    agent = new DocumentAssistantAgent();
    mockContext = {
      userId: 'test-user-id',
      userType: 'admin',
      userName: 'Test Admin',
      userEmail: 'admin@test.com',
      companyId: 'test-company-id',
      role: 'admin',
    };
  });

  describe('Instanciación', () => {
    it('debe instanciarse correctamente', () => {
      expect(agent).toBeInstanceOf(DocumentAssistantAgent);
    });

    it('debe tener tipo document_assistant', () => {
      expect(agent.getType()).toBe('document_assistant');
    });

    it('debe estar habilitado por defecto', () => {
      expect(agent.isEnabled()).toBe(true);
    });

    it('debe tener configuración válida', () => {
      const config = agent.getConfig();
      expect(config.name).toBe('Asistente Documental');
      expect(config.type).toBe('document_assistant');
      expect(config.capabilities.length).toBeGreaterThan(0);
      expect(config.tools.length).toBeGreaterThan(0);
    });
  });

  describe('canHandle - Detección de mensajes', () => {
    it('debe detectar mensajes sobre DNI', async () => {
      const result = await agent.canHandle('Tengo un DNI para escanear', mockContext);
      expect(result).toBe(true);
    });

    it('debe detectar mensajes sobre NIE', async () => {
      const result = await agent.canHandle('Necesito analizar un NIE', mockContext);
      expect(result).toBe(true);
    });

    it('debe detectar mensajes sobre contratos', async () => {
      const result = await agent.canHandle('Quiero subir un contrato de alquiler', mockContext);
      expect(result).toBe(true);
    });

    it('debe detectar mensajes sobre alta de inquilino', async () => {
      const result = await agent.canHandle(
        'Necesito dar de alta a un nuevo inquilino',
        mockContext
      );
      expect(result).toBe(true);
    });

    it('debe detectar mensajes sobre análisis de documentos', async () => {
      const result = await agent.canHandle('Analizar este documento PDF', mockContext);
      expect(result).toBe(true);
    });

    it('debe detectar mensajes sobre OCR', async () => {
      const result = await agent.canHandle('Reconocer texto de esta imagen', mockContext);
      expect(result).toBe(true);
    });

    it('no debe detectar mensajes no relacionados', async () => {
      const result = await agent.canHandle(
        '¿Cuántos metros cuadrados tiene la cocina?',
        mockContext
      );
      expect(result).toBe(false);
    });

    it('debe detectar confirmaciones (seguimiento de conversación)', async () => {
      const result = await agent.canHandle('Sí, procede a crear el inquilino', mockContext);
      expect(result).toBe(true);
    });
  });

  describe('FAQ y conocimiento base', () => {
    it('debe tener FAQ de documentos requeridos', () => {
      expect(documentAssistantFAQ.documentosRequeridos).toBeDefined();
      expect(documentAssistantFAQ.documentosRequeridos.pregunta).toContain('documentos');
    });

    it('debe tener FAQ de formato DNI', () => {
      expect(documentAssistantFAQ.formatoDNI).toBeDefined();
      expect(documentAssistantFAQ.formatoDNI.respuesta).toContain('8 números');
    });

    it('debe tener FAQ de proceso de alta', () => {
      expect(documentAssistantFAQ.procesoAlta).toBeDefined();
      expect(documentAssistantFAQ.procesoAlta.respuesta).toContain('Escanea');
    });
  });

  describe('Registro en coordinador', () => {
    it('debe estar registrado en la lista de agentes', () => {
      const agents = listAgents();
      const docAgent = agents.find((a) => a.type === 'document_assistant');
      expect(docAgent).toBeDefined();
      expect(docAgent?.name).toBe('Asistente Documental');
    });

    it('debe estar habilitado en el coordinador', () => {
      const agents = listAgents();
      const docAgent = agents.find((a) => a.type === 'document_assistant');
      expect(docAgent?.enabled).toBe(true);
    });
  });

  describe('Herramientas del agente', () => {
    it('debe tener herramienta para analizar documentos de identidad', () => {
      const config = agent.getConfig();
      const tool = config.tools.find((t) => t.name === 'analyze_identity_document');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty('documentText');
    });

    it('debe tener herramienta para analizar contratos', () => {
      const config = agent.getConfig();
      const tool = config.tools.find((t) => t.name === 'analyze_rental_contract');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.properties).toHaveProperty('contractText');
    });

    it('debe tener herramienta para crear inquilino desde documento', () => {
      const config = agent.getConfig();
      const tool = config.tools.find((t) => t.name === 'create_tenant_from_document');
      expect(tool).toBeDefined();
      expect(tool?.inputSchema.required).toContain('nombreCompleto');
      expect(tool?.inputSchema.required).toContain('dni');
    });

    it('debe tener herramienta para validar documentos', () => {
      const config = agent.getConfig();
      const tool = config.tools.find((t) => t.name === 'validate_tenant_documents');
      expect(tool).toBeDefined();
    });

    it('debe tener herramienta para buscar inquilinos existentes', () => {
      const config = agent.getConfig();
      const tool = config.tools.find((t) => t.name === 'get_existing_tenants');
      expect(tool).toBeDefined();
    });

    it('debe tener herramienta para clasificar documentos', () => {
      const config = agent.getConfig();
      const tool = config.tools.find((t) => t.name === 'classify_uploaded_document');
      expect(tool).toBeDefined();
    });
  });

  describe('Capacidades del agente', () => {
    it('debe tener capacidad de analizar DNI', () => {
      const config = agent.getConfig();
      const capability = config.capabilities.find((c) => c.id === 'analyze_dni');
      expect(capability).toBeDefined();
      expect(capability?.category).toBe('Documentos de Identidad');
    });

    it('debe tener capacidad de analizar contratos', () => {
      const config = agent.getConfig();
      const capability = config.capabilities.find((c) => c.id === 'analyze_contract');
      expect(capability).toBeDefined();
      expect(capability?.category).toBe('Contratos');
    });

    it('debe tener capacidad de crear inquilino desde documento', () => {
      const config = agent.getConfig();
      const capability = config.capabilities.find((c) => c.id === 'create_tenant_from_doc');
      expect(capability).toBeDefined();
      expect(capability?.category).toBe('Alta Automática');
    });
  });
});
