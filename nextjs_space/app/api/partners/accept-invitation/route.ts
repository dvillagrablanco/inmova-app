import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();
// POST /api/partners/accept-invitation - Aceptar invitación y crear empresa
export async function POST(request: NextRequest) {
  try {
    const { token, userData } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: 'Token es obligatorio' },
        { status: 400 }
      );
    }
    // Buscar la invitación
    const invitation = await prisma.partnerInvitation.findUnique({
      where: { token },
      include: {
        partner: true,
      },
    });
    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }
    // Verificar estado
    if (invitation.estado !== 'PENDING') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue utilizada o ha expirado' },
        { status: 400 }
      );
    }
    // Verificar expiración
    if (new Date() > invitation.expiraFecha) {
      await prisma.partnerInvitation.update({
        where: { id: invitation.id },
        data: { estado: 'EXPIRED' },
      });
      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 400 }
      );
    }
    // Crear la empresa (Company)
    const { nombre, email, password, telefono, direccion } = userData;
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son obligatorios' },
        { status: 400 }
      );
    }
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 }
      );
    }
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    // Crear Company
    const company = await prisma.company.create({
      data: {
        nombre,
        email,
        telefono,
        direccion,
        contactoPrincipal: nombre,
        emailContacto: email,
        estadoCliente: 'activo',
        notasAdmin: `Cliente referido por Partner: ${invitation.partner.nombre}`,
        // Heredar personalización del Partner si existe
        logoUrl: invitation.partner.logo || undefined,
        colorPrimario: invitation.partner.coloresPrimarios 
          ? (invitation.partner.coloresPrimarios as any).primary 
          : undefined,
    // Crear usuario admin para la empresa
    const user = await prisma.user.create({
        name: nombre,
        password: hashedPassword,
        role: 'administrador',
        activo: true,
        companyId: company.id,
    // Crear relación PartnerClient
    const partnerClient = await prisma.partnerClient.create({
        partnerId: invitation.partnerId,
        estado: 'activo',
        origenInvitacion: 'email',
        codigoReferido: token,
    // Actualizar invitación
    await prisma.partnerInvitation.update({
      where: { id: invitation.id },
        estado: 'ACCEPTED',
        aceptadoFecha: new Date(),
    return NextResponse.json({
      message: 'Cuenta creada exitosamente',
      company: {
        id: company.id,
        nombre: company.nombre,
        email: company.email,
      user: {
        id: user.id,
        nombre: user.name,
        email: user.email,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error aceptando invitación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message },
      { status: 500 }
    );
  }
}
// GET /api/partners/accept-invitation?token=xxx - Verificar invitación
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
        partner: {
          select: {
            id: true,
            nombre: true,
            razonSocial: true,
            logo: true,
            coloresPrimarios: true,
          },
        },
    // Verificar estado y expiración
    const isValid = invitation.estado === 'PENDING' && new Date() <= invitation.expiraFecha;
      invitation: {
        email: invitation.email,
        nombre: invitation.nombre,
        mensaje: invitation.mensaje,
        partner: invitation.partner,
        expiraFecha: invitation.expiraFecha,
        estado: invitation.estado,
        isValid,
    logger.error('Error verificando invitación:', error);
