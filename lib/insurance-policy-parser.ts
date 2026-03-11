// @ts-nocheck
import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_MODEL_PRIMARY } from '@/lib/ai-model-config';
import logger from '@/lib/logger';

export interface InsurancePolicyData {
  policyNumber: string;
  insurer: string;
  mediator?: string;
  policyholder: {
    name: string;
    nif: string;
    address: string;
    phone?: string;
    email?: string;
  };
  insuredProperty: {
    address: string;
    use: string;
    description?: string;
  };
  startDate: string;
  endDate?: string;
  annualPremium?: number;
  coverages: Array<{
    name: string;
    capitalInsured: number;
    deductible?: number;
    notes?: string;
  }>;
  totalCapitalInsured?: number;
  specialClauses?: string[];
  product: string;
}

export async function parseInsurancePolicyPDF(buffer: Buffer): Promise<InsurancePolicyData> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  const text = data.text;

  if (!text || text.length < 50) {
    throw new Error('PDF contains insufficient text for extraction');
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL_PRIMARY,
    max_tokens: 4096,
    system:
      'Eres un experto en seguros. Extrae datos estructurados de pólizas de seguro. Responde SOLO con JSON válido.',
    messages: [
      {
        role: 'user',
        content: `Extrae los datos de esta póliza de seguro en formato JSON con la estructura:
{
  "policyNumber": "string",
  "insurer": "string",
  "mediator": "string",
  "policyholder": { "name": "string", "nif": "string", "address": "string", "phone": "string", "email": "string" },
  "insuredProperty": { "address": "string", "use": "string", "description": "string" },
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD or null",
  "annualPremium": number or null,
  "coverages": [{ "name": "string", "capitalInsured": number, "deductible": number, "notes": "string" }],
  "totalCapitalInsured": number,
  "specialClauses": ["string"],
  "product": "string"
}

Texto de la póliza (primeros 8000 caracteres):
${text.substring(0, 8000)}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let jsonStr = content.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  try {
    return JSON.parse(jsonStr.trim()) as InsurancePolicyData;
  } catch (e) {
    logger.error('[InsurancePolicyParser] Failed to parse Claude JSON', {
      error: (e as Error).message,
      rawLength: content.text.length,
    });
    throw new Error('Failed to parse insurance policy data from PDF');
  }
}
