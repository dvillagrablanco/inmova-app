/**
 * API Route: Obtener Traducciones
 * 
 * GET /api/i18n/[locale]
 * 
 * Sirve las traducciones para el locale especificado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidLocale, type Locale } from '@/lib/i18n-config';
import { getTranslations } from '@/lib/i18n-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { locale: string } }
) {
  try {
    const locale = params.locale;

    if (!isValidLocale(locale)) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    const translations = await getTranslations(locale as Locale);

    return NextResponse.json({
      locale,
      translations,
    }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // Cache 1h
      },
    });

  } catch (error: any) {
    console.error('Error loading translations:', error);
    return NextResponse.json(
      { error: 'Error loading translations' },
      { status: 500 }
    );
  }
}
