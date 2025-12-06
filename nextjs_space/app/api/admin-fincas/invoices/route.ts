import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { addMonths } from 'date-fns';

export const dynamic = 'force-dynamic';
/**
 * GET /api/admin-fincas/invoices
 * Obtiene todas las facturas de comunidades
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('communityId');
    const estado = searchParams.get('estado');
    const where: any = {
      companyId: session.user.companyId,
    };
    if (communityId) {
      where.communityId = communityId;
    if (estado) {
      where.estado = estado;
    const invoices = await prisma.communityInvoice.findMany({
      where,
      include: {
        community: {
          select: {
            id: true,
            nombreComunidad: true,
            direccion: true,
          },
        },
      },
      orderBy: {
        fechaEmision: 'desc',
    });
    return NextResponse.json(invoices);
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Error al obtener facturas' },
      { status: 500 }
    );
  }
}
 * POST /api/admin-fincas/invoices
 * Crea una nueva factura de comunidad
export async function POST(request: NextRequest) {
    const body = await request.json();
    const {
      communityId,
      periodo,
      honorarios,
      gastosGestion,
      otrosConceptos,
      iva: ivaRate = 21,
    } = body;
    // Validar campos requeridos
    if (!communityId || !periodo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    // Verificar que la comunidad existe y pertenece a la compañía
    const community = await prisma.communityManagement.findFirst({
      where: {
        id: communityId,
        companyId: session.user.companyId,
    if (!community) {
        { error: 'Comunidad no encontrada' },
        { status: 404 }
    // Generar número de facturaúnicamente
    const year = new Date().getFullYear();
    const count = await prisma.communityInvoice.count({
    const numeroFactura = `FC-${year}-${(count + 1).toString().padStart(4, '0')}`;
    // Calcular importes
    const hon = honorarios || 0;
    const gastos = gastosGestion || 0;
    const otros = Array.isArray(otrosConceptos)
      ? otrosConceptos.reduce((sum, item) => sum + (item.importe || 0), 0)
      : 0;
    const baseImponible = hon + gastos + otros;
    const iva = baseImponible * (ivaRate / 100);
    const totalFactura = baseImponible + iva;
    // Fecha de vencimiento: 30 días desde emisión
    const fechaEmision = new Date();
    const fechaVencimiento = addMonths(fechaEmision, 1);
    const invoice = await prisma.communityInvoice.create({
      data: {
        communityId,
        numeroFactura,
        fechaEmision,
        fechaVencimiento,
        periodo,
        honorarios: hon,
        gastosGestion: gastos,
        otrosConceptos: otrosConceptos || [],
        baseImponible,
        iva,
        totalFactura,
        estado: 'borrador',
        community: true,
    return NextResponse.json(invoice, { status: 201 });
    logger.error('Error creating invoice:', error);
      { error: 'Error al crear factura' },
