/**
 * Image OCR Service
 * Handles OCR for general images
 */

import { OCROptions, OCRResult } from './types';
import logger from '@/lib/logger';
import { processImageOCR } from '@/lib/ocr-service';

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

    const language = Array.isArray(options?.language)
      ? options?.language.join('+')
      : options?.language || 'spa+eng';

    const result = await processImageOCR(imageBuffer as any, language);

    return {
      text: result.text,
      confidence: result.confidence / 100,
      metadata: {
        language: result.language,
        processingTime: result.processingTime,
      },
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
