import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface ServiceInput {
  companyId: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  icono?: string;
  precioBase: number;
  unidad: string;
  duracion?: number;
  disponible?: boolean;
  proveedorExterno?: string;
  contactoProveedor?: string;
  imagenes?: string[];
  requisitos?: string;
}

export interface ServiceBookingInput {
  serviceId: string;
  tenantId: string;
  companyId: string;
  fechaServicio: Date;
  horaInicio: string;
  duracion: number;
  ubicacion: string;
  precioTotal: number;
  notas?: string;
  instruccionesEspeciales?: string;
}

export interface CheckInOutInput {
  tenantId: string;
  companyId: string;
  unitId: string;
  roomId?: string;
  tipo: 'check_in' | 'check_out';
  metodo: 'digital' | 'presencial' | 'automatico';
  fechaProgramada: Date;
}

export interface SmartLockInput {
  companyId: string;
  buildingId: string;
  unitId?: string;
  roomId?: string;
  nombre: string;
  ubicacion: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  apiEndpoint?: string;
  apiKey?: string;
}

export interface SmartLockAccessInput {
  lockId: string;
  tenantId: string;
  tipoAcceso: 'permanente' | 'temporal' | 'invitado';
  codigoAcceso?: string;
  fechaInicio: Date;
  fechaFin?: Date;
  usosPermitidos?: number;
}

export interface PackageInput {
  companyId: string;
  tenantId: string;
  buildingId: string;
  numeroSeguimiento?: string;
  remitente: string;
  empresa?: string;
  tamano?: string;
  requiereRefrigeracion?: boolean;
  requiereFirma?: boolean;
  fotoComprobante?: string;
  ubicacionAlmacen?: string;
  notas?: string;
}

// =====================
// SERVICIOS PREMIUM
// =====================

export async function createService(input: ServiceInput) {
  try {
    const service = await prisma.colivingService.create({
      data: {
        companyId: input.companyId,
        nombre: input.nombre,
        descripcion: input.descripcion,
        categoria: input.categoria,
        icono: input.icono,
        precioBase: input.precioBase,
        unidad: input.unidad,
        duracion: input.duracion,
        disponible: input.disponible ?? true,
        proveedorExterno: input.proveedorExterno,
        contactoProveedor: input.contactoProveedor,
        imagenes: input.imagenes || [],
        requisitos: input.requisitos,
      },
    });
    return { success: true, service };
  } catch (error) {
    console.error('Error creando servicio:', error);
    return { success: false, error: 'Error al crear servicio' };
  }
}

export async function getServicesByCategory(companyId: string, categoria?: string) {
  try {
    const services = await prisma.colivingService.findMany({
      where: {
        companyId,
        disponible: true,
        ...(categoria ? { categoria } : {}),
      },
      include: {
        _count: {
          select: {
            reservas: true,
          },
        },
      },
    });
    return { success: true, services };
  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    return { success: false, error: 'Error al obtener servicios' };
  }
}

export async function bookService(input: ServiceBookingInput) {
  try {
    // Verificar disponibilidad del servicio
    const service = await prisma.colivingService.findUnique({
      where: { id: input.serviceId },
    });

    if (!service || !service.disponible) {
      return { success: false, error: 'Servicio no disponible' };
    }

    // Crear reserva
    const booking = await prisma.colivingServiceBooking.create({
      data: {
        serviceId: input.serviceId,
        tenantId: input.tenantId,
        companyId: input.companyId,
        fechaServicio: input.fechaServicio,
        horaInicio: input.horaInicio,
        duracion: input.duracion,
        ubicacion: input.ubicacion,
        precioTotal: input.precioTotal,
        notas: input.notas,
        instruccionesEspeciales: input.instruccionesEspeciales,
        estado: 'pendiente',
      },
      include: {
        service: true,
        tenant: {
          select: {
            nombreCompleto: true,
            telefono: true,
            email: true,
          },
        },
      },
    });

    return { success: true, booking };
  } catch (error) {
    console.error('Error reservando servicio:', error);
    return { success: false, error: 'Error al reservar servicio' };
  }
}

export async function updateBookingStatus(
  bookingId: string,
  estado: string,
  valoracion?: number,
  comentario?: string
) {
  try {
    const booking = await prisma.colivingServiceBooking.update({
      where: { id: bookingId },
      data: {
        estado,
        ...(valoracion !== undefined ? { valoracion } : {}),
        ...(comentario ? { comentario } : {}),
      },
    });
    return { success: true, booking };
  } catch (error) {
    console.error('Error actualizando estado de reserva:', error);
    return { success: false, error: 'Error al actualizar estado' };
  }
}

export async function getTenantBookings(tenantId: string) {
  try {
    const bookings = await prisma.colivingServiceBooking.findMany({
      where: { tenantId },
      include: {
        service: true,
      },
      orderBy: {
        fechaServicio: 'desc',
      },
    });
    return { success: true, bookings };
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    return { success: false, error: 'Error al obtener reservas' };
  }
}

// =====================
// CHECK-IN/CHECK-OUT DIGITAL
// =====================

export async function createCheckInOut(input: CheckInOutInput) {
  try {
    const checkInOut = await prisma.colivingCheckInOut.create({
      data: {
        tenantId: input.tenantId,
        companyId: input.companyId,
        unitId: input.unitId,
        roomId: input.roomId,
        tipo: input.tipo,
        metodo: input.metodo,
        fechaProgramada: input.fechaProgramada,
        estado: 'pendiente',
      },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
            telefono: true,
          },
        },
        unit: true,
        room: true,
      },
    });
    return { success: true, checkInOut };
  } catch (error) {
    console.error('Error creando check-in/out:', error);
    return { success: false, error: 'Error al crear check-in/out' };
  }
}

export async function completeCheckIn(
  checkInOutId: string,
  data: {
    documentosVerificados?: boolean;
    firmaDigital?: string;
    codigoAcceso?: string;
    inventarioEntrada?: any;
    fotosEntrada?: string[];
    llaveDigitalEnviada?: boolean;
    llaveDigitalActiva?: boolean;
    notas?: string;
  }
) {
  try {
    const checkInOut = await prisma.colivingCheckInOut.update({
      where: { id: checkInOutId },
      data: {
        ...data,
        fechaReal: new Date(),
        estado: 'completado',
      },
    });
    return { success: true, checkInOut };
  } catch (error) {
    console.error('Error completando check-in:', error);
    return { success: false, error: 'Error al completar check-in' };
  }
}

export async function completeCheckOut(
  checkInOutId: string,
  data: {
    inventarioSalida?: any;
    fotosSalida?: string[];
    notas?: string;
  }
) {
  try {
    const checkInOut = await prisma.colivingCheckInOut.update({
      where: { id: checkInOutId },
      data: {
        ...data,
        fechaReal: new Date(),
        estado: 'completado',
      },
    });

    // Desactivar llave digital si existe
    if (checkInOut.llaveDigitalActiva) {
      // Buscar accesos de SmartLock para este tenant y unidad/room
      const accesos = await prisma.smartLockAccess.findMany({
        where: {
          tenantId: checkInOut.tenantId,
          lock: {
            OR: [
              { unitId: checkInOut.unitId },
              ...(checkInOut.roomId ? [{ roomId: checkInOut.roomId }] : []),
            ],
          },
          activo: true,
        },
      });

      // Desactivar todos los accesos
      for (const acceso of accesos) {
        await prisma.smartLockAccess.update({
          where: { id: acceso.id },
          data: {
            activo: false,
            fechaFin: new Date(),
          },
        });
      }
    }

    return { success: true, checkInOut };
  } catch (error) {
    console.error('Error completando check-out:', error);
    return { success: false, error: 'Error al completar check-out' };
  }
}

export async function getPendingCheckInOuts(companyId: string) {
  try {
    const checkInOuts = await prisma.colivingCheckInOut.findMany({
      where: {
        companyId,
        estado: 'pendiente',
      },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
            telefono: true,
          },
        },
        unit: true,
        room: true,
      },
      orderBy: {
        fechaProgramada: 'asc',
      },
    });
    return { success: true, checkInOuts };
  } catch (error) {
    console.error('Error obteniendo check-ins/outs pendientes:', error);
    return { success: false, error: 'Error al obtener check-ins/outs' };
  }
}

// =====================
// SMARTLOCKS
// =====================

export async function registerSmartLock(input: SmartLockInput) {
  try {
    const lock = await prisma.smartLock.create({
      data: {
        companyId: input.companyId,
        buildingId: input.buildingId,
        unitId: input.unitId,
        roomId: input.roomId,
        nombre: input.nombre,
        ubicacion: input.ubicacion,
        marca: input.marca,
        modelo: input.modelo,
        numeroSerie: input.numeroSerie,
        apiEndpoint: input.apiEndpoint,
        apiKey: input.apiKey,
        estado: 'activo',
        conectado: true,
      },
    });
    return { success: true, lock };
  } catch (error) {
    console.error('Error registrando SmartLock:', error);
    return { success: false, error: 'Error al registrar SmartLock' };
  }
}

export async function createLockAccess(input: SmartLockAccessInput) {
  try {
    // Generar código de acceso si no se proporciona
    let codigoAcceso = input.codigoAcceso;
    if (!codigoAcceso) {
      // Generar código aleatorio de 6 dígitos
      codigoAcceso = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const access = await prisma.smartLockAccess.create({
      data: {
        lockId: input.lockId,
        tenantId: input.tenantId,
        tipoAcceso: input.tipoAcceso,
        codigoAcceso: codigoAcceso,
        fechaInicio: input.fechaInicio,
        fechaFin: input.fechaFin,
        usosPermitidos: input.usosPermitidos,
        activo: true,
      },
      include: {
        lock: true,
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
          },
        },
      },
    });

    return { success: true, access };
  } catch (error) {
    console.error('Error creando acceso a SmartLock:', error);
    return { success: false, error: 'Error al crear acceso' };
  }
}

export async function revokeLockAccess(accessId: string) {
  try {
    const access = await prisma.smartLockAccess.update({
      where: { id: accessId },
      data: {
        activo: false,
        fechaFin: new Date(),
      },
    });
    return { success: true, access };
  } catch (error) {
    console.error('Error revocando acceso:', error);
    return { success: false, error: 'Error al revocar acceso' };
  }
}

export async function recordLockAccess(
  accessId: string,
  success: boolean,
  metodo: string
) {
  try {
    const access = await prisma.smartLockAccess.findUnique({
      where: { id: accessId },
    });

    if (!access) {
      return { success: false, error: 'Acceso no encontrado' };
    }

    const historial = (access.historialAccesos as any[]) || [];
    historial.push({
      fecha: new Date().toISOString(),
      exito: success,
      metodo: metodo,
    });

    const updatedAccess = await prisma.smartLockAccess.update({
      where: { id: accessId },
      data: {
        ultimoAcceso: new Date(),
        usosRealizados: access.usosRealizados + 1,
        historialAccesos: historial,
      },
    });

    // Verificar si se alcanzó el límite de usos
    if (
      access.usosPermitidos &&
      updatedAccess.usosRealizados >= access.usosPermitidos
    ) {
      await prisma.smartLockAccess.update({
        where: { id: accessId },
        data: { activo: false },
      });
    }

    return { success: true, access: updatedAccess };
  } catch (error) {
    console.error('Error registrando acceso:', error);
    return { success: false, error: 'Error al registrar acceso' };
  }
}

export async function getSmartLocksByBuilding(buildingId: string) {
  try {
    const locks = await prisma.smartLock.findMany({
      where: { buildingId },
      include: {
        unit: true,
        room: true,
        accesos: {
          where: {
            activo: true,
          },
          include: {
            tenant: {
              select: {
                nombreCompleto: true,
              },
            },
          },
        },
      },
    });
    return { success: true, locks };
  } catch (error) {
    console.error('Error obteniendo SmartLocks:', error);
    return { success: false, error: 'Error al obtener SmartLocks' };
  }
}

export async function getTenantLockAccess(tenantId: string) {
  try {
    const accesos = await prisma.smartLockAccess.findMany({
      where: {
        tenantId,
        activo: true,
      },
      include: {
        lock: {
          include: {
            unit: true,
            room: true,
          },
        },
      },
    });
    return { success: true, accesos };
  } catch (error) {
    console.error('Error obteniendo accesos del tenant:', error);
    return { success: false, error: 'Error al obtener accesos' };
  }
}

// =====================
// PAQUETERÍA
// =====================

export async function registerPackage(input: PackageInput) {
  try {
    const package_ = await prisma.colivingPackage.create({
      data: {
        companyId: input.companyId,
        tenantId: input.tenantId,
        buildingId: input.buildingId,
        numeroSeguimiento: input.numeroSeguimiento,
        remitente: input.remitente,
        empresa: input.empresa,
        tamano: input.tamano,
        requiereRefrigeracion: input.requiereRefrigeracion ?? false,
        requiereFirma: input.requiereFirma ?? false,
        fotoComprobante: input.fotoComprobante,
        ubicacionAlmacen: input.ubicacionAlmacen,
        notas: input.notas,
        estado: 'pendiente',
        notificado: false,
      },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
            telefono: true,
            email: true,
          },
        },
      },
    });

    return { success: true, package: package_ };
  } catch (error) {
    console.error('Error registrando paquete:', error);
    return { success: false, error: 'Error al registrar paquete' };
  }
}

export async function notifyPackageArrival(packageId: string) {
  try {
    const package_ = await prisma.colivingPackage.update({
      where: { id: packageId },
      data: {
        notificado: true,
      },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
            email: true,
            telefono: true,
          },
        },
      },
    });

    // Aquí se podría integrar con un servicio de notificaciones
    // (SMS, email, push notification, etc.)

    return { success: true, package: package_ };
  } catch (error) {
    console.error('Error notificando llegada de paquete:', error);
    return { success: false, error: 'Error al notificar' };
  }
}

export async function markPackageAsCollected(packageId: string) {
  try {
    const package_ = await prisma.colivingPackage.update({
      where: { id: packageId },
      data: {
        estado: 'recogido',
        fechaRecogida: new Date(),
      },
    });
    return { success: true, package: package_ };
  } catch (error) {
    console.error('Error marcando paquete como recogido:', error);
    return { success: false, error: 'Error al marcar paquete' };
  }
}

export async function getPendingPackages(tenantId: string) {
  try {
    const packages = await prisma.colivingPackage.findMany({
      where: {
        tenantId,
        estado: { in: ['pendiente', 'notificado'] },
      },
      orderBy: {
        fechaLlegada: 'desc',
      },
    });
    return { success: true, packages };
  } catch (error) {
    console.error('Error obteniendo paquetes pendientes:', error);
    return { success: false, error: 'Error al obtener paquetes' };
  }
}

export async function getBuildingPackages(buildingId: string) {
  try {
    const packages = await prisma.colivingPackage.findMany({
      where: {
        buildingId,
        estado: { in: ['pendiente', 'notificado'] },
      },
      include: {
        tenant: {
          select: {
            nombreCompleto: true,
            telefono: true,
          },
        },
      },
      orderBy: {
        fechaLlegada: 'desc',
      },
    });
    return { success: true, packages };
  } catch (error) {
    console.error('Error obteniendo paquetes del edificio:', error);
    return { success: false, error: 'Error al obtener paquetes' };
  }
}
