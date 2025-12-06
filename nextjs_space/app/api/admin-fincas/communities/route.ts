import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
/**
 * GET /api/admin-fincas/communities
 * Obtiene todas las comunidades gestionadas por el administrador de fincas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const communities = await prisma.communityManagement.findMany({
      where: {
        companyId: session.user.companyId,
        activa: true,
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            numeroUnidades: true,
          },
        },
        _count: {
            facturas: true,
            movimientosCaja: true,
            informes: true,
      orderBy: {
        createdAt: 'desc',
    });
    return NextResponse.json(communities);
  } catch (error) {
    logger.error('Error fetching communities:', error);
    return NextResponse.json(
      { error: 'Error al obtener comunidades' },
      { status: 500 }
    );
  }
}
 * POST /api/admin-fincas/communities
 * Crea una nueva comunidad gestionada
export async function POST(request: NextRequest) {
    const body = await request.json();
    const {
      buildingId,
      nombreComunidad,
      cif,
      direccion,
      codigoPostal,
      ciudad,
      provincia,
      honorariosFijos,
      honorariosPorcentaje,
    } = body;
    // Validar campos requeridos
    if (!buildingId || !nombreComunidad || !direccion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    // Verificar que el edificio pertenece a la compañía
    const building = await prisma.building.findFirst({
        id: buildingId,
    if (!building) {
        { error: 'Edificio no encontrado' },
        { status: 404 }
    // Verificar si ya existe una comunidad para este edificio
    const existing = await prisma.communityManagement.findUnique({
      where: { buildingId },
    if (existing) {
        { error: 'Ya existe una comunidad para este edificio' },
    const community = await prisma.communityManagement.create({
      data: {
        buildingId,
        nombreComunidad,
        cif,
        direccion,
        codigoPostal,
        ciudad,
        provincia,
        honorariosFijos,
        honorariosPorcentaje,
        building: true,
    return NextResponse.json(community, { status: 201 });
    logger.error('Error creating community:', error);
      { error: 'Error al crear comunidad' },
