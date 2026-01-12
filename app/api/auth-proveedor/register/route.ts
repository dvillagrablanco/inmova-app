import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/auth-proveedor/register - Registro de proveedores
export async function POST(req: NextRequest) {
  try {
    const { 
      nombre, 
      tipo, 
      telefono, 
      email, 
      password, 
      direccion,
      companyId 
    } = await req.json();

    // Validaciones
    if (!nombre || !tipo || !telefono || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados' },
        { status: 400 }
      );
    }

    // Verificar que el email no esté registrado
    const proveedorExistente = await prisma.provider.findFirst({
      where: { email },
    });

    if (proveedorExistente) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Si no se proporciona companyId, usar el primero disponible (para demo)
    // En producción, esto debería manejarse de forma diferente
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      const firstCompany = await prisma.company.findFirst();
      if (!firstCompany) {
        return NextResponse.json(
          { error: 'No hay empresas disponibles' },
          { status: 500 }
        );
      }
      targetCompanyId = firstCompany.id;
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
        email,
        direccion,
        password: hashedPassword,
        activo: false, // Requiere aprobación de administrador
        notas: 'Registro pendiente de aprobación',
      },
    });

    logger.info(
      `Nuevo proveedor registrado: ${nuevoProveedor.nombre} (${nuevoProveedor.email})`
    );

    return NextResponse.json({
      success: true,
      message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por parte del administrador.',
      proveedor: {
        id: nuevoProveedor.id,
        nombre: nuevoProveedor.nombre,
        email: nuevoProveedor.email,
      },
    });
  } catch (error) {
    logger.error('Error en registro de proveedor:', error);
    return NextResponse.json(
      { error: 'Error al registrar proveedor' },
      { status: 500 }
    );
  }
}
