import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const bodySchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().optional(),
  textContent: z.string().optional(),
});

type DocumentType = 'contrato' | 'factura' | 'recibo' | 'seguro' | 'certificado' | 'otro';
type EntityType = 'inquilino' | 'edificio' | 'proveedor' | 'empresa' | 'otro';

interface ClassificationResult {
  documentType: DocumentType;
  entityType: EntityType;
  suggestedTags: string[];
  confidence: number;
  summary: string;
}

function ruleBasedClassify(fileName: string, textContent?: string): ClassificationResult {
  const name = fileName.toLowerCase();
  let documentType: DocumentType = 'otro';
  let entityType: EntityType = 'otro';
  const suggestedTags: string[] = [];

  if (
    name.includes('contrato') ||
    name.includes('lease') ||
    name.includes('arrendamiento') ||
    name.includes('rental')
  ) {
    documentType = 'contrato';
    entityType = 'inquilino';
    suggestedTags.push('contrato', 'arrendamiento');
  } else if (
    name.includes('factura') ||
    name.includes('invoice') ||
    name.includes('fact_')
  ) {
    documentType = 'factura';
    entityType = 'proveedor';
    suggestedTags.push('factura', 'gasto');
  } else if (
    name.includes('recibo') ||
    name.includes('receipt') ||
    name.includes('pago') ||
    name.includes('payment')
  ) {
    documentType = 'recibo';
    entityType = 'inquilino';
    suggestedTags.push('recibo', 'pago');
  } else if (
    name.includes('seguro') ||
    name.includes('insurance') ||
    name.includes('poliza') ||
    name.includes('policy')
  ) {
    documentType = 'seguro';
    entityType = 'edificio';
    suggestedTags.push('seguro', 'poliza');
  } else if (
    name.includes('certificado') ||
    name.includes('certificate') ||
    name.includes('cert_') ||
    name.includes('habilitacion') ||
    name.includes('cedula')
  ) {
    documentType = 'certificado';
    entityType = 'edificio';
    suggestedTags.push('certificado');
  }

  if (documentType === 'otro') {
    suggestedTags.push('documento');
  }

  return {
    documentType,
    entityType,
    suggestedTags,
    confidence: documentType !== 'otro' ? 75 : 50,
    summary: `Documento clasificado por nombre: ${fileName}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.parse(body);
    const { fileName, fileType, textContent } = parsed;

    const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

    if (hasApiKey) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY!,
        });

        const prompt = `Classify this document based on its filename and content. Return ONLY valid JSON with no markdown or extra text, with these exact keys:
{
  "documentType": "contrato"|"factura"|"recibo"|"seguro"|"certificado"|"otro",
  "entityType": "inquilino"|"edificio"|"proveedor"|"empresa"|"otro",
  "suggestedTags": ["string"],
  "confidence": number (0-100),
  "summary": "string"
}

Filename: ${fileName}
File type: ${fileType || 'unknown'}
Content (first 2000 chars): ${(textContent || '').slice(0, 2000)}`;

        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        });

        const textBlock = message.content.find((c) => c.type === 'text');
        const text = textBlock && 'text' in textBlock ? textBlock.text : '';

        let jsonStr = text.trim();
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }

        const result = JSON.parse(jsonStr) as ClassificationResult;

        const validTypes: DocumentType[] = ['contrato', 'factura', 'recibo', 'seguro', 'certificado', 'otro'];
        const validEntities: EntityType[] = ['inquilino', 'edificio', 'proveedor', 'empresa', 'otro'];

        if (!validTypes.includes(result.documentType)) {
          result.documentType = 'otro';
        }
        if (!validEntities.includes(result.entityType)) {
          result.entityType = 'otro';
        }
        if (!Array.isArray(result.suggestedTags)) {
          result.suggestedTags = [];
        }
        result.confidence = Math.min(100, Math.max(0, Number(result.confidence) || 50));
        result.summary = String(result.summary || '').slice(0, 500);

        return NextResponse.json({ success: true, classification: result, source: 'ai' });
      } catch (aiError: unknown) {
        console.warn('[auto-classify] AI classification failed, falling back to rules:', aiError);
        const fallback = ruleBasedClassify(fileName, textContent);
        return NextResponse.json({ success: true, classification: fallback, source: 'rule-based' });
      }
    }

    const classification = ruleBasedClassify(fileName, textContent);
    return NextResponse.json({ success: true, classification, source: 'rule-based' });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('[auto-classify]:', error);
    return NextResponse.json({ error: 'Error clasificando documento' }, { status: 500 });
  }
}
