import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();
// POST /api/partners/register - Registro de nuevo Partner
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      nombre,
      razonSocial,
      cif,
      tipo,
      contactoNombre,
      contactoEmail,
      contactoTelefono,
      email,
      password,
    } = data;
    // Validaciones básicas
    if (!nombre || !razonSocial || !cif || !email || !password) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }
    // Verificar si ya existe el Partner
    const existingPartner = await prisma.partner.findFirst({
      where: {
        OR: [
          { email },
          { cif },
          { contactoEmail }
        ]
      }
    });
    if (existingPartner) {
      return NextResponse.json(
        { error: 'Ya existe un Partner con estos datos (email, CIF o contacto)' },
        { status: 409 }
      );
    }
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    // Crear el Partner
    const partner = await prisma.partner.create({
      data: {
        nombre,
        razonSocial,
        cif,
        tipo: tipo || 'OTRO',
        contactoNombre,
        contactoEmail,
        contactoTelefono,
        email,
        password: hashedPassword,
        estado: 'PENDING', // Requiere aprobación
        activo: false,
        comisionPorcentaje: 20.0, // 20% inicial
      },
    });
    // No devolver el password
    const { password: _, ...partnerWithoutPassword } = partner;
    return NextResponse.json({
      message: 'Partner registrado correctamente. Pendiente de aprobación.',
      partner: partnerWithoutPassword,
    }, { status: 201 });
  } catch (error: any) {
    logger.error('Error registrando Partner:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error?.message },
      { status: 500 }
    );
  }
}
