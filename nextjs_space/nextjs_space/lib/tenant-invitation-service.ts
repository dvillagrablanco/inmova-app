import { prisma } from './db';
import bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';

/**
 * Genera un código de invitación único
 */
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Crea una invitación para un inquilino
 */
export async function createTenantInvitation(
  tenantId: string,
  createdBy: string,
  expirationDays: number = 7
) {
  // Verificar que el inquilino existe
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { company: true }
  });

  if (!tenant) {
    throw new Error('Inquilino no encontrado');
  }

  // Verificar si ya existe una invitación pendiente
  const existingInvitation = await prisma.tenantInvitation.findFirst({
    where: {
      tenantId,
      status: 'pendiente',
      expiresAt: { gt: new Date() }
    }
  });

  if (existingInvitation) {
    return existingInvitation;
  }

  // Generar código único
  let invitationCode = generateInvitationCode();
  let isUnique = false;
  
  while (!isUnique) {
    const existing = await prisma.tenantInvitation.findUnique({
      where: { invitationCode }
    });
    if (!existing) {
      isUnique = true;
    } else {
      invitationCode = generateInvitationCode();
    }
  }

  // Crear la invitación
  const invitation = await prisma.tenantInvitation.create({
    data: {
      companyId: tenant.companyId,
      tenantId,
      email: tenant.email,
      invitationCode,
      expiresAt: addDays(new Date(), expirationDays),
      createdBy
    },
    include: {
      tenant: true,
      company: true
    }
  });

  return invitation;
}

/**
 * Valida un código de invitación
 */
export async function validateInvitationCode(code: string) {
  const invitation = await prisma.tenantInvitation.findUnique({
    where: { invitationCode: code },
    include: {
      tenant: true,
      company: true
    }
  });

  if (!invitation) {
    return { valid: false, error: 'Código de invitación no válido' };
  }

  if (invitation.status !== 'pendiente') {
    return { valid: false, error: 'Esta invitación ya ha sido utilizada' };
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.tenantInvitation.update({
      where: { id: invitation.id },
      data: { status: 'expirada' }
    });
    return { valid: false, error: 'El código de invitación ha expirado' };
  }

  return { valid: true, invitation };
}

/**
 * Acepta una invitación y configura la contraseña del inquilino
 */
export async function acceptInvitation(
  code: string,
  password: string
) {
  const validation = await validateInvitationCode(code);
  
  if (!validation.valid || !validation.invitation) {
    throw new Error(validation.error);
  }

  const { invitation } = validation;

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Actualizar el inquilino con la contraseña
  const updatedTenant = await prisma.tenant.update({
    where: { id: invitation.tenantId },
    data: { password: hashedPassword }
  });

  // Marcar la invitación como aceptada
  await prisma.tenantInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'aceptada',
      acceptedAt: new Date()
    }
  });

  return updatedTenant;
}

/**
 * Genera un token para recuperación de contraseña
 */
export async function createPasswordResetToken(email: string) {
  // Buscar el inquilino por email
  const tenant = await prisma.tenant.findUnique({
    where: { email }
  });

  if (!tenant) {
    // Por seguridad, no revelar si el email existe
    return null;
  }

  // Generar token único
  const token = `${tenant.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  // Crear el token en la base de datos
  const resetToken = await prisma.passwordResetToken.create({
    data: {
      tenantId: tenant.id,
      token,
      expiresAt: addDays(new Date(), 1) // 24 horas
    }
  });

  return {
    token: resetToken.token,
    tenant
  };
}

/**
 * Valida un token de recuperación de contraseña
 */
export async function validateResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { tenant: true }
  });

  if (!resetToken) {
    return { valid: false, error: 'Token no válido' };
  }

  if (resetToken.used) {
    return { valid: false, error: 'Este token ya ha sido utilizado' };
  }

  if (new Date() > resetToken.expiresAt) {
    return { valid: false, error: 'El token ha expirado' };
  }

  return { valid: true, resetToken };
}

/**
 * Restablece la contraseña usando un token válido
 */
export async function resetPassword(
  token: string,
  newPassword: string
) {
  const validation = await validateResetToken(token);
  
  if (!validation.valid || !validation.resetToken) {
    throw new Error(validation.error);
  }

  const { resetToken } = validation;

  // Hash de la nueva contraseña
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Actualizar la contraseña del inquilino
  await prisma.tenant.update({
    where: { id: resetToken.tenantId },
    data: { password: hashedPassword }
  });

  // Marcar el token como usado
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: {
      used: true,
      usedAt: new Date()
    }
  });

  return true;
}
