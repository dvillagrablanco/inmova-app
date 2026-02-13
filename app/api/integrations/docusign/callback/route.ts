/**
 * DocuSign OAuth Callback
 * 
 * Recibe el consent grant de DocuSign y confirma la autorización.
 * Este endpoint se llama UNA VEZ cuando el usuario autoriza la app.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/integraciones?docusign=error&message=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (code) {
    // Consent grant exitoso - el code confirma que el usuario autorizó la app
    // Con JWT auth no necesitamos intercambiar el code, solo confirmar
    return NextResponse.redirect(
      new URL('/admin/integraciones?docusign=success', req.url)
    );
  }

  return NextResponse.redirect(
    new URL('/admin/integraciones?docusign=unknown', req.url)
  );
}
