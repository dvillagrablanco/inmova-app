import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';
import { generateProviderToken, setProviderAuthCookie } from '@/lib/provider-auth';

export const dynamic = 'force-dynamic';

// POST /api/auth-proveedor/login - Login para proveedores
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 });
    }

    // Buscar proveedor por email
    const proveedor = await prisma.provider.findFirst({
      where: { email },
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!proveedor) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Verificar que el proveedor está activo
    if (!proveedor.activo) {
      return NextResponse.json(
        { error: 'Cuenta inactiva. Contacta con administración.' },
        { status: 403 }
      );
    }

    // Verificar contraseña
    if (!proveedor.password) {
      return NextResponse.json(
        { error: 'Cuenta sin configurar. Contacta con administración.' },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, proveedor.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Actualizar último acceso
    await prisma.provider.update({
      where: { id: proveedor.id },
      data: { ultimoAcceso: new Date() },
    });

    // Generar token JWT
    const token = generateProviderToken({
      providerId: proveedor.id,
      email: proveedor.email || '',
      companyId: proveedor.companyId,
      nombre: proveedor.nombre,
    });

    // Establecer cookie httpOnly
    setProviderAuthCookie(token);

    // Devolver datos del proveedor (sin password)
    const { password: _, ...proveedorSinPassword } = proveedor;

    return NextResponse.json({
      success: true,
      proveedor: proveedorSinPassword,
      message: 'Inicio de sesión exitoso',
    });
  } catch (error) {
    logger.error('Error en login de proveedor:', error);
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}
