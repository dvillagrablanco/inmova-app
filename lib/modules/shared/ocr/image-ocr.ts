/**
 * Image OCR Service
 * Handles OCR for general images
 */

import { OCROptions, OCRResult, OCRBlock } from './types';
import logger from '@/lib/logger';
import { z } from 'zod';
import { fetchJson } from '@/lib/integrations/http-client';

const ocrResponseSchema = z.object({
  text: z.string(),
  confidence: z.number(),
  blocks: z
    .array(
      z.object({
        text: z.string(),
        confidence: z.number(),
        boundingBox: z.object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number(),
        }),
        type: z.enum(['word', 'line', 'paragraph', 'block']).optional(),
      })
    )
    .optional(),
  metadata: z
    .object({
      language: z.string().optional(),
      orientation: z.number().optional(),
      processingTime: z.number().optional(),
    })
    .optional(),
});

/**
 * Perform OCR on an image
 */
export async function performImageOCR(
  imageBuffer: Buffer,
  options?: OCROptions
): Promise<OCRResult> {
  try {
    logger.info('Performing OCR on image', {
      size: imageBuffer.length,
      language: options?.language || 'auto',
    });

    const ocrApiUrl = process.env.OCR_API_URL;
    if (!ocrApiUrl) {
      throw new Error('OCR_API_URL no configurado');
    }

    const { data } = await fetchJson<z.infer<typeof ocrResponseSchema>>(ocrApiUrl, {
      method: 'POST',
      headers: process.env.OCR_API_KEY
        ? { Authorization: `Bearer ${process.env.OCR_API_KEY}` }
        : undefined,
      body: {
        type: 'image',
        contentBase64: imageBuffer.toString('base64'),
        options,
      },
      timeoutMs: 20_000,
      circuitKey: 'ocr-image',
    });

    const parsed = ocrResponseSchema.parse(data);

    return {
      text: parsed.text,
      confidence: parsed.confidence,
      blocks: parsed.blocks as OCRBlock[] | undefined,
      metadata: parsed.metadata,
    };
  } catch (error: any) {
    logger.error('Error performing image OCR:', error);
    throw error;
  }
}

/**
 * Perform OCR on multiple images
 */
export async function performBatchImageOCR(
  imageBuffers: Buffer[],
  options?: OCROptions
): Promise<OCRResult[]> {
  const results = await Promise.allSettled(
    imageBuffers.map((buffer) => performImageOCR(buffer, options))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    logger.error(`Failed to OCR image ${index}:`, result.reason);
    return {
      text: '',
      confidence: 0,
      metadata: {
        processingTime: 0,
      },
    };
  });
}

/**
 * Preprocess image for better OCR results
 */
export async function preprocessImageForOCR(
  imageBuffer: Buffer
): Promise<Buffer> {
  try {
    logger.info('Preprocessing image for OCR');

    return imageBuffer;
  } catch (error: any) {
    logger.error('Error preprocessing image:', error);
    return imageBuffer;
  }
}
