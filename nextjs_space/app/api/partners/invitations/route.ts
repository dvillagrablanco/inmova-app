import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key-partners';
// Función para verificar el token
function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
}
// POST /api/partners/invitations - Crear invitación
export async function POST(request: NextRequest) {
    // Verificar autenticación
    const decoded = verifyToken(request);
    if (!decoded || !decoded.partnerId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    const partnerId = decoded.partnerId;
    const { email, nombre, telefono, mensaje } = await request.json();
    if (!email) {
        { error: 'Email es obligatorio' },
        { status: 400 }
    // Verificar si ya existe una invitación pendiente para este email
    const existingInvitation = await prisma.partnerInvitation.findFirst({
      where: {
        partnerId,
        email,
        estado: 'PENDING',
      },
    });
    if (existingInvitation) {
        { error: 'Ya existe una invitación pendiente para este email' },
        { status: 409 }
    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    // Fecha de expiración (30 días)
    const expiraFecha = new Date();
    expiraFecha.setDate(expiraFecha.getDate() + 30);
    // Crear invitación
    const invitation = await prisma.partnerInvitation.create({
      data: {
        nombre,
        telefono,
        token,
        mensaje,
        expiraFecha,
    // TODO: Enviar email con el link de invitación
    // const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/partners/accept/${token}`;
    // await sendInvitationEmail(email, invitationLink, mensaje);
    return NextResponse.json({
      message: 'Invitación creada exitosamente',
      invitation,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creando invitación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message },
      { status: 500 }
    );
// GET /api/partners/invitations - Listar invitaciones del Partner
export async function GET(request: NextRequest) {
    const invitaciones = await prisma.partnerInvitation.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
    return NextResponse.json({ invitaciones });
    logger.error('Error obteniendo invitaciones:', error);
