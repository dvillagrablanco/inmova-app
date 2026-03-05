/**
 * RAG Service - Retrieval-Augmented Generation
 * 
 * Indexes documents (contracts, policies, deeds) into vector embeddings
 * and uses them as context for AI responses about specific properties/tenants.
 * 
 * Uses local text search as fallback when OpenAI embeddings are not configured.
 */

import logger from '@/lib/logger';

interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    type: string; // 'contract', 'insurance', 'deed', 'certificate'
    entityId: string;
    entityType: string;
    source: string;
  };
  similarity?: number;
}

// In-memory document store (production would use pgvector or Pinecone)
const documentStore: DocumentChunk[] = [];

/**
 * Index a document for RAG retrieval
 */
export async function indexDocument(
  content: string,
  metadata: DocumentChunk['metadata']
): Promise<void> {
  const id = `${metadata.type}-${metadata.entityId}-${Date.now()}`;
  
  // Split into chunks of ~500 chars for better retrieval
  const chunks = splitIntoChunks(content, 500);
  
  for (let i = 0; i < chunks.length; i++) {
    documentStore.push({
      id: `${id}-${i}`,
      content: chunks[i],
      metadata,
    });
  }

  logger.info(`[RAG] Indexed ${chunks.length} chunks for ${metadata.type}:${metadata.entityId}`);
}

/**
 * Search for relevant documents given a query
 */
export async function searchDocuments(
  query: string,
  options?: { limit?: number; type?: string; entityId?: string }
): Promise<DocumentChunk[]> {
  const { limit = 5, type, entityId } = options || {};

  let candidates = [...documentStore];

  // Filter by type/entity if specified
  if (type) candidates = candidates.filter(d => d.metadata.type === type);
  if (entityId) candidates = candidates.filter(d => d.metadata.entityId === entityId);

  // Simple TF-IDF-like scoring (production would use vector similarity)
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  const scored = candidates.map(doc => {
    const docTerms = doc.content.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      if (docTerms.includes(term)) score += 1;
      // Boost for exact phrase match
      if (docTerms.includes(query.toLowerCase().substring(0, 30))) score += 3;
    }
    return { ...doc, similarity: score / Math.max(queryTerms.length, 1) };
  });

  return scored
    .filter(d => (d.similarity || 0) > 0)
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
    .slice(0, limit);
}

/**
 * Generate AI response with RAG context
 */
export async function generateWithContext(
  question: string,
  options?: { type?: string; entityId?: string }
): Promise<{ answer: string; sources: DocumentChunk[] }> {
  // 1. Retrieve relevant documents
  const sources = await searchDocuments(question, { ...options, limit: 3 });

  if (sources.length === 0) {
    return {
      answer: 'No se encontraron documentos relevantes para responder esta pregunta.',
      sources: [],
    };
  }

  // 2. Build context
  const context = sources.map(s => s.content).join('\n\n---\n\n');

  // 3. Try AI generation
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      system: `Eres un asistente experto en gestión inmobiliaria. Responde basándote SOLO en el contexto proporcionado. Si no hay información suficiente, dilo.`,
      messages: [{
        role: 'user',
        content: `Contexto de documentos:\n${context}\n\nPregunta: ${question}`,
      }],
    });

    const answer = response.content[0].type === 'text' ? response.content[0].text : '';
    return { answer, sources };
  } catch {
    // Fallback: return raw context
    return {
      answer: `Basado en ${sources.length} documentos encontrados:\n\n${sources.map(s => `• ${s.content.substring(0, 200)}...`).join('\n')}`,
      sources,
    };
  }
}

/**
 * Index all insurance documents for a company
 */
export async function indexInsuranceDocuments(companyId: string): Promise<number> {
  try {
    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const insurances = await prisma.insurance.findMany({
      where: { companyId },
      select: {
        id: true,
        numeroPoliza: true,
        aseguradora: true,
        tipo: true,
        cobertura: true,
        sumaAsegurada: true,
        fechaInicio: true,
        fechaVencimiento: true,
        notas: true,
        building: { select: { nombre: true, direccion: true } },
      },
    });

    let indexed = 0;
    for (const ins of insurances) {
      const content = [
        `Póliza ${ins.numeroPoliza} - ${ins.aseguradora}`,
        `Tipo: ${ins.tipo}`,
        `Edificio: ${ins.building?.nombre || ins.building?.direccion}`,
        `Cobertura: ${ins.cobertura}`,
        `Suma asegurada: ${ins.sumaAsegurada}€`,
        `Vigencia: ${ins.fechaInicio?.toISOString().slice(0, 10)} - ${ins.fechaVencimiento?.toISOString().slice(0, 10)}`,
        ins.notas ? `Notas: ${ins.notas}` : '',
      ].filter(Boolean).join('\n');

      await indexDocument(content, {
        type: 'insurance',
        entityId: ins.id,
        entityType: 'Insurance',
        source: `poliza-${ins.numeroPoliza}`,
      });
      indexed++;
    }

    return indexed;
  } catch (err: any) {
    logger.error('[RAG] Error indexing insurances:', err.message);
    return 0;
  }
}

// Utility: split text into chunks
function splitIntoChunks(text: string, maxLength: number): string[] {
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 10);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? '. ' : '') + sentence.trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [text.substring(0, maxLength)];
}
