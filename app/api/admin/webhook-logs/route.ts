export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const MOCK_LOGS = [
  { id: '1', evento: 'property.created', url: 'https://webhook.inmova.com/prop', method: 'POST', statusCode: 200, requestBody: '{"id":"inv1","name":"Piso"}', responseBody: '{"success":true}', duracion: 145, createdAt: '2026-03-08T10:00:00Z', success: true },
  { id: '2', evento: 'tenant.updated', url: 'https://webhook.inmova.com/tenant', method: 'POST', statusCode: 200, requestBody: '{"id":"t1","email":"t@test.com"}', responseBody: '{"success":true}', duracion: 89, createdAt: '2026-03-08T09:45:00Z', success: true },
  { id: '3', evento: 'payment.received', url: 'https://webhook.inmova.com/pay', method: 'POST', statusCode: 500, requestBody: '{"amount":1200}', responseBody: '{"error":"Internal server error"}', duracion: 5023, createdAt: '2026-03-08T09:30:00Z', success: false },
  { id: '4', evento: 'contract.signed', url: 'https://webhook.inmova.com/contract', method: 'POST', statusCode: 200, requestBody: '{"contractId":"c1"}', responseBody: '{"success":true}', duracion: 234, createdAt: '2026-03-08T09:15:00Z', success: true },
  { id: '5', evento: 'incident.created', url: 'https://webhook.inmova.com/incident', method: 'POST', statusCode: 404, requestBody: '{"id":"i1"}', responseBody: '{"error":"Not found"}', duracion: 120, createdAt: '2026-03-08T09:00:00Z', success: false },
  { id: '6', evento: 'property.created', url: 'https://webhook.inmova.com/prop', method: 'POST', statusCode: 200, requestBody: '{"id":"inv2"}', responseBody: '{"success":true}', duracion: 98, createdAt: '2026-03-07T16:00:00Z', success: true },
  { id: '7', evento: 'tenant.updated', url: 'https://webhook.inmova.com/tenant', method: 'POST', statusCode: 200, requestBody: '{}', responseBody: '{"success":true}', duracion: 76, createdAt: '2026-03-07T15:30:00Z', success: true },
  { id: '8', evento: 'payment.received', url: 'https://webhook.inmova.com/pay', method: 'POST', statusCode: 200, requestBody: '{"amount":800}', responseBody: '{"success":true}', duracion: 156, createdAt: '2026-03-07T15:00:00Z', success: true },
  { id: '9', evento: 'property.created', url: 'https://webhook.inmova.com/prop', method: 'POST', statusCode: 200, requestBody: '{"id":"inv3"}', responseBody: '{"success":true}', duracion: 112, createdAt: '2026-03-07T14:00:00Z', success: true },
  { id: '10', evento: 'incident.created', url: 'https://webhook.inmova.com/incident', method: 'POST', statusCode: 500, requestBody: '{"id":"i2"}', responseBody: '{"error":"Timeout"}', duracion: 30000, createdAt: '2026-03-07T13:00:00Z', success: false },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const evento = req.nextUrl.searchParams.get('evento');
    const status = req.nextUrl.searchParams.get('status');
    const fechaDesde = req.nextUrl.searchParams.get('fechaDesde');
    const fechaHasta = req.nextUrl.searchParams.get('fechaHasta');

    let filtered = [...MOCK_LOGS];
    if (evento) filtered = filtered.filter((l) => l.evento.includes(evento));
    if (status === 'success') filtered = filtered.filter((l) => l.success);
    if (status === 'error') filtered = filtered.filter((l) => !l.success);
    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      filtered = filtered.filter((l) => new Date(l.createdAt) >= desde);
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      filtered = filtered.filter((l) => new Date(l.createdAt) <= hasta);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('[webhook-logs GET]:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
