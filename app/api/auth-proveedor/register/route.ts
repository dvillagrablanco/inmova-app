import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// POST /api/auth-proveedor/register - Registro de proveedores
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { nombre, tipo, telefono, email, password, direccion, companyId, companyCode } =
      await req.json();

    // Validaciones
    if (!nombre || !tipo || !telefono || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados' },
        { status: 400 }
      );
    }

    if (!companyId && !companyCode) {
      return NextResponse.json(
        { error: 'Debes indicar la empresa (código o identificador).' },
        { status: 400 }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Verificar que el email no esté registrado
    const proveedorExistente = await prisma.provider.findFirst({
      where: { email: normalizedEmail },
    });

    if (proveedorExistente) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    let targetCompanyId = companyId;
    if (!targetCompanyId && companyCode) {
      const company = await prisma.company.findFirst({
        where: {
          activo: true,
          esEmpresaPrueba: false,
          OR: [
            { cif: String(companyCode).trim() },
            { nombre: { contains: String(companyCode).trim(), mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      targetCompanyId = company?.id;
    }

    if (!targetCompanyId) {
      return NextResponse.json(
        { error: 'Empresa no encontrada para el código indicado' },
        { status: 404 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear proveedor (inicialmente inactivo, requiere aprobación)
    const nuevoProveedor = await prisma.provider.create({
      data: {
        companyId: targetCompanyId,
        nombre,
        tipo,
        telefono,
        email: normalizedEmail,
        direccion,
        password: hashedPassword,
        activo: false, // Requiere aprobación de administrador
        notas: 'Registro pendiente de aprobación',
      },
    });

    logger.info(`Nuevo proveedor registrado: ${nuevoProveedor.nombre} (${nuevoProveedor.email})`);

    return NextResponse.json({
      success: true,
      message:
        'Registro exitoso. Tu cuenta está pendiente de aprobación por parte del administrador.',
      proveedor: {
        id: nuevoProveedor.id,
        nombre: nuevoProveedor.nombre,
        email: nuevoProveedor.email,
      },
    });
  } catch (error) {
    logger.error('Error en registro de proveedor:', error);
    return NextResponse.json({ error: 'Error al registrar proveedor' }, { status: 500 });
  }
}
