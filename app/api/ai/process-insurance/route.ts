/**
 * POST /api/ai/process-insurance
 *
 * Recibe un PDF de póliza de seguro, extrae datos con OCR/IA,
 * y la vincula al edificio/unidad correspondiente.
 * Genera análisis IA de coberturas vs mercado.
 *
 * Extrae: nº póliza, aseguradora, tomador, prima anual, coberturas,
 * capitales asegurados, franquicias, fecha inicio/vencimiento.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const INSURANCE_PROMPT = `Eres un experto en seguros inmobiliarios españoles. Analiza esta póliza de seguro y extrae TODOS los datos.

Responde SOLO con JSON válido:
{
  "numero_poliza": "string",
  "aseguradora": "Mapfre|AXA|Zurich|Allianz|Generali|Mutua Madrileña|etc",
  "tomador": {
    "nombre": "nombre del tomador",
    "nif": "CIF/NIF"
  },
  "tipo_seguro": "hogar|comunidad|local_comercial|multirriesgo_edificio|responsabilidad_civil",

  "inmueble": {
    "direccion": "dirección completa",
    "edificio": "nombre del edificio si se identifica",
    "unidad": "piso/local si aplica"
  },

  "vigencia": {
    "fecha_inicio": "YYYY-MM-DD",
    "fecha_vencimiento": "YYYY-MM-DD",
    "renovacion_automatica": true
  },

  "prima": {
    "anual": number,
    "forma_pago": "anual|semestral|trimestral|mensual"
  },

  "coberturas": [
    {
      "tipo": "incendio|agua|robo|responsabilidad_civil|daños_electricos|cristales|etc",
      "capital_asegurado": number,
      "franquicia": number,
      "incluida": true
    }
  ],

  "capitales_principales": {
    "continente": number,
    "contenido": number,
    "responsabilidad_civil": number
  },

  "analisis_ia": {
    "coberturas_adecuadas": true,
    "prima_razonable": true,
    "recomendaciones": ["string"],
    "coberturas_faltantes": ["string"],
    "prima_estimada_mercado": number,
    "observaciones": "string"
  },

  "resumen": "string"
}

ANALIZA las coberturas y da tu opinión profesional:
- ¿La prima es razonable para el tipo de inmueble y zona?
- ¿Faltan coberturas importantes? (agua, incendio, RC, daños eléctricos, cristales)
- ¿Los capitales asegurados son suficientes para el valor del inmueble?
- ¿La franquicia es excesiva?
- Referencia: prima típica vivienda España ~200-400€/año, local ~300-600€/año, edificio ~1000-3000€/año`;

async function extractText(buffer: Buffer): Promise<string> {
  const { spawn } = await import('child_process');
  const { writeFile, readFile, unlink, readdir } = await import('fs/promises');
  const { join } = await import('path');
  const os = await import('os');

  const tmpDir = os.tmpdir();
  const ts = Date.now();
  const pdfPath = join(tmpDir, `ins_${ts}.pdf`);
  await writeFile(pdfPath, buffer);

  let text = '';
  try {
    text = await new Promise<string>((resolve) => {
      const proc = spawn('pdftotext', ['-l', '15', pdfPath, '-']);
      let out = '';
      proc.stdout.on('data', (d: Buffer) => { out += d.toString(); });
      proc.on('close', () => { resolve(out); });
      proc.on('error', () => { resolve(''); });
    });
  } catch { /* */ }

  if (text.replace(/\s+/g, ' ').trim().length > 300) {
    await unlink(pdfPath).catch(() => {});
    return text;
  }

  const imgPrefix = join(tmpDir, `iimg_${ts}`);
  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn('pdftoppm', ['-png', '-f', '1', '-l', '10', '-r', '200', pdfPath, imgPrefix]);
      proc.on('close', (code: number) => { if (code === 0) resolve(); else reject(); });
      proc.on('error', reject);
    });

    const files = await readdir(tmpDir);
    const imgs = files.filter(f => f.startsWith(`iimg_${ts}`) && f.endsWith('.png')).sort();

    let ocrText = '';
    for (const img of imgs) {
      const imgPath = join(tmpDir, img);
      const t = await new Promise<string>((resolve) => {
        const proc = spawn('tesseract', [imgPath, 'stdout', '-l', 'spa']);
        let out = '';
        proc.stdout.on('data', (d: Buffer) => { out += d.toString(); });
        proc.on('close', () => { resolve(out); });
        proc.on('error', () => { resolve(''); });
      });
      if (t.trim()) ocrText += `\n${t}`;
      await unlink(imgPath).catch(() => {});
    }
    text = ocrText;
  } catch { /* */ }

  await unlink(pdfPath).catch(() => {});
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const pastedText = formData.get('text') as string | null;

    let text = pastedText || '';
    let fileName = 'poliza-texto';

    if (file) {
      fileName = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      text = await extractText(buffer);
    }

    if (text.trim().length < 100) {
      return NextResponse.json({ error: 'No se pudo extraer texto' }, { status: 422 });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `${INSURANCE_PROMPT}\n\nArchivo: ${fileName}\n\nTexto:\n${text.substring(0, 12000)}`,
      }],
    });

    const content = response.content.find((c: any) => c.type === 'text') as any;
    const raw = content?.text || '';

    let extracted: any = {};
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) extracted = JSON.parse(m[0]);
    } catch { extracted = { raw, parseError: true }; }

    return NextResponse.json({ success: true, data: { extracted, fileName } });
  } catch (error: any) {
    logger.error('[Process Insurance]:', error);
    return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
  }
}
