'use server';

import { prisma } from '@/lib/db';
import { tenantCreateSchema, unitCreateSchema } from '@/lib/validations';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

const getRequired = (formData: FormData, key: string): string => {
  const value = formData.get(key);
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Campo requerido: ${key}`);
  }
  return value.trim();
};

const getOptional = (formData: FormData, key: string): string | undefined => {
  const value = formData.get(key);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export async function createPropertyAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const payload = {
      buildingId: getRequired(formData, 'buildingId'),
      numero: getRequired(formData, 'numero'),
      tipo: getOptional(formData, 'tipo') ?? 'vivienda',
      estado: getOptional(formData, 'estado') ?? 'disponible',
      superficie: Number(getRequired(formData, 'superficie')),
      rentaMensual: Number(getRequired(formData, 'rentaMensual')),
      habitaciones: getOptional(formData, 'habitaciones')
        ? Number(getOptional(formData, 'habitaciones'))
        : undefined,
      banos: getOptional(formData, 'banos') ? Number(getOptional(formData, 'banos')) : undefined,
      piso: getOptional(formData, 'planta') ?? getOptional(formData, 'piso'),
    };

    const validated = unitCreateSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: 'Datos inválidos al crear propiedad' };
    }

    const unit = await prisma.unit.create({
      data: {
        buildingId: validated.data.buildingId,
        numero: validated.data.numero,
        tipo: validated.data.tipo,
        estado: validated.data.estado,
        superficie: validated.data.superficie ?? 0,
        rentaMensual: validated.data.rentaMensual ?? 0,
        habitaciones: validated.data.habitaciones ?? null,
        banos: validated.data.banos ?? null,
        planta:
          typeof validated.data.piso === 'number'
            ? validated.data.piso
            : typeof validated.data.piso === 'string'
              ? parseInt(validated.data.piso, 10) || null
              : null,
      },
      select: { id: true },
    });

    return { success: true, data: unit };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error creando propiedad' };
  }
}

export async function createTenantAction(
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const companyId = getRequired(formData, 'companyId');
    const nombre = getOptional(formData, 'nombreCompleto') || getRequired(formData, 'nombre');
    const apellidosInput = getOptional(formData, 'apellidos');

    let nombreFinal = nombre;
    let apellidosFinal = apellidosInput;

    if (!apellidosFinal) {
      const partes = nombre.split(' ');
      if (partes.length >= 2) {
        nombreFinal = partes[0];
        apellidosFinal = partes.slice(1).join(' ');
      } else {
        apellidosFinal = nombreFinal;
      }
    }

    const payload = {
      nombre: nombreFinal,
      apellidos: apellidosFinal,
      email: getRequired(formData, 'email'),
      telefono: getRequired(formData, 'telefono'),
      dni: getOptional(formData, 'dni') ?? '',
      fechaNacimiento: getOptional(formData, 'fechaNacimiento'),
      nacionalidad: getOptional(formData, 'nacionalidad'),
      ingresosMensuales: getOptional(formData, 'ingresosMensuales')
        ? Number(getOptional(formData, 'ingresosMensuales'))
        : undefined,
    };

    const validated = tenantCreateSchema.safeParse(payload);
    if (!validated.success) {
      return { success: false, error: 'Datos inválidos al crear inquilino' };
    }

    const tenant = await prisma.tenant.create({
      data: {
        companyId,
        nombreCompleto: `${validated.data.nombre} ${validated.data.apellidos}`.trim(),
        dni: validated.data.dni || '',
        email: validated.data.email,
        telefono: validated.data.telefono,
        fechaNacimiento: validated.data.fechaNacimiento
          ? new Date(validated.data.fechaNacimiento)
          : new Date('1990-01-01'),
        nacionalidad: validated.data.nacionalidad,
        ingresosMensuales: validated.data.ingresosMensuales,
      },
      select: { id: true },
    });

    return { success: true, data: tenant };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error creando inquilino' };
  }
}

export async function assignTenantToPropertyAction(
  formData: FormData
): Promise<ActionResult<{ id: string; tenantId: string | null }>> {
  try {
    const unitId = getRequired(formData, 'unitId');
    const tenantId = getRequired(formData, 'tenantId');

    const unit = await prisma.unit.update({
      where: { id: unitId },
      data: {
        tenantId,
        estado: 'ocupada',
      },
      select: { id: true, tenantId: true },
    });

    return { success: true, data: unit };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error asignando inquilino' };
  }
}
