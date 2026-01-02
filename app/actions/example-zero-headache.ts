/**
 * 🚑 EJEMPLO DE SERVER ACTION CON PROTOCOLO ZERO-HEADACHE
 * 
 * Este archivo muestra las mejores prácticas para Server Actions resilientes.
 * Copia y adapta este patrón para todas tus acciones críticas.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  captureError,
  ErrorTypes,
  withErrorHandling,
  ValidationError,
  BusinessError,
} from '@/lib/error-handling';

// ============================================
// 1️⃣ DEFINIR SCHEMA DE VALIDACIÓN
// ============================================

const createContractSchema = z.object({
  propertyId: z.string().min(1, 'Propiedad requerida'),
  tenantId: z.string().min(1, 'Inquilino requerido'),
  startDate: z.date(),
  endDate: z.date(),
  monthlyRent: z.number().positive('El alquiler debe ser mayor a 0'),
  deposit: z.number().nonnegative('El depósito no puede ser negativo'),
});

type CreateContractInput = z.infer<typeof createContractSchema>;

// ============================================
// 2️⃣ IMPLEMENTACIÓN CON ERROR HANDLING
// ============================================

/**
 * OPCIÓN A: Con wrapper `withErrorHandling` (recomendado para acciones simples)
 */
export const createContractSimple = withErrorHandling(
  async (input: CreateContractInput) => {
    // Autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new BusinessError('Debes iniciar sesión para crear contratos', 'UNAUTHORIZED');
    }

    // Validación
    const data = createContractSchema.parse(input);

    // Lógica de negocio
    const contract = await prisma.contract.create({
      data: {
        ...data,
        companyId: session.user.companyId,
        createdBy: session.user.id,
      },
    });

    // Revalidar cache
    revalidatePath('/dashboard/contracts');

    return { success: true, contract };
  },
  {
    errorType: ErrorTypes.CONTRACT_CREATION_FAILED,
    action: 'create_contract',
    userFriendlyMessage: 'No pudimos crear el contrato. Por favor, inténtalo de nuevo en unos minutos.',
  }
);

/**
 * OPCIÓN B: Manual con try/catch (recomendado para acciones complejas)
 */
export async function createContractManual(input: CreateContractInput) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new BusinessError('Debes iniciar sesión para crear contratos', 'UNAUTHORIZED');
    }

    // 2. Validación
    const validationResult = createContractSchema.safeParse(input);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.errors);
    }
    const data = validationResult.data;

    // 3. Lógica de negocio: Verificar que propiedad y tenant existen
    const [property, tenant] = await Promise.all([
      prisma.property.findUnique({
        where: { id: data.propertyId },
        select: { id: true, companyId: true },
      }),
      prisma.user.findUnique({
        where: { id: data.tenantId },
        select: { id: true, role: true },
      }),
    ]);

    if (!property) {
      throw new BusinessError('La propiedad no existe', 'PROPERTY_NOT_FOUND');
    }

    if (property.companyId !== session.user.companyId) {
      throw new BusinessError('No tienes permiso para esta propiedad', 'FORBIDDEN');
    }

    if (!tenant || tenant.role !== 'inquilino') {
      throw new BusinessError('El inquilino no es válido', 'INVALID_TENANT');
    }

    // 4. Verificar que no haya contratos activos para la misma propiedad
    const existingContract = await prisma.contract.findFirst({
      where: {
        propertyId: data.propertyId,
        status: { in: ['active', 'pending'] },
      },
    });

    if (existingContract) {
      throw new BusinessError(
        'La propiedad ya tiene un contrato activo',
        'PROPERTY_ALREADY_CONTRACTED'
      );
    }

    // 5. Crear contrato
    const contract = await prisma.contract.create({
      data: {
        ...data,
        companyId: session.user.companyId,
        createdBy: session.user.id,
        status: 'pending',
      },
      include: {
        property: true,
        tenant: true,
      },
    });

    // 6. Revalidar cache
    revalidatePath('/dashboard/contracts');
    revalidatePath('/dashboard/properties');

    // 7. Log de éxito (opcional)
    console.log('✅ Contrato creado exitosamente:', {
      contractId: contract.id,
      userId: session.user.id,
    });

    return {
      success: true,
      contract,
    };
  } catch (error) {
    // Manejo de errores específicos
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: 'Datos inválidos',
        details: error.toUserMessage(),
      };
    }

    if (error instanceof BusinessError) {
      // Errores de negocio no van a Sentry (no son bugs)
      return {
        success: false,
        error: error.message,
      };
    }

    // Error inesperado: capturar en Sentry
    captureError(error, {
      errorType: ErrorTypes.CONTRACT_CREATION_FAILED,
      context: {
        userId: (await getServerSession(authOptions))?.user?.id,
        action: 'create_contract_manual',
        metadata: {
          propertyId: input.propertyId,
          tenantId: input.tenantId,
        },
      },
    });

    // Respuesta amigable al usuario
    return {
      success: false,
      error: 'No pudimos crear el contrato. Nuestro equipo ha sido notificado. Por favor, inténtalo de nuevo en unos minutos.',
    };
  }
}

// ============================================
// 3️⃣ EJEMPLO DE ACCIÓN DE PAGO (CRÍTICA)
// ============================================

const processPaymentSchema = z.object({
  contractId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['card', 'transfer', 'cash']),
});

export async function processPayment(input: z.infer<typeof processPaymentSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new BusinessError('No autenticado', 'UNAUTHORIZED');
    }

    // Validación
    const data = processPaymentSchema.parse(input);

    // Simulación de procesamiento de pago
    // En producción, esto sería Stripe, Redsys, etc.
    const payment = await prisma.payment.create({
      data: {
        contractId: data.contractId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        status: 'completed',
        paidAt: new Date(),
      },
    });

    revalidatePath('/dashboard/payments');

    return {
      success: true,
      payment,
    };
  } catch (error) {
    // CRÍTICO: Pagos SIEMPRE van a Sentry
    captureError(error, {
      errorType: ErrorTypes.PAYMENT_FAILED,
      context: {
        userId: (await getServerSession(authOptions))?.user?.id,
        action: 'process_payment',
        metadata: {
          contractId: input.contractId,
          amount: input.amount,
        },
      },
      severity: 'critical', // Máxima prioridad
    });

    return {
      success: false,
      error: 'No pudimos procesar el pago. Por favor, contacta con soporte.',
    };
  }
}

// ============================================
// 4️⃣ EJEMPLO DE ACCIÓN NO CRÍTICA
// ============================================

/**
 * Acciones opcionales (ej: subir avatar) no deben romper la UI
 */
export async function uploadAvatar(file: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new BusinessError('No autenticado');
    }

    // Lógica de upload
    // ...

    return {
      success: true,
      avatarUrl: 'https://...',
    };
  } catch (error) {
    // No es crítico, solo log warning
    captureError(error, {
      errorType: ErrorTypes.FILE_UPLOAD_FAILED,
      context: {
        userId: (await getServerSession(authOptions))?.user?.id,
        action: 'upload_avatar',
      },
      severity: 'low', // Baja prioridad
    });

    // Usuario puede continuar sin avatar
    return {
      success: false,
      error: 'No pudimos subir la imagen. Puedes intentarlo más tarde.',
    };
  }
}

// ============================================
// 5️⃣ CHECKLIST DE IMPLEMENTACIÓN
// ============================================

/**
 * ✅ CHECKLIST PARA CADA SERVER ACTION:
 * 
 * 1. [ ] ¿Está envuelta en try/catch?
 * 2. [ ] ¿Valida inputs con Zod?
 * 3. [ ] ¿Verifica autenticación?
 * 4. [ ] ¿Verifica permisos (ownership)?
 * 5. [ ] ¿Captura errores con captureError() o withErrorHandling()?
 * 6. [ ] ¿Incluye contexto (userId, metadata)?
 * 7. [ ] ¿Retorna mensaje amigable al usuario?
 * 8. [ ] ¿Revalida cache si modifica datos?
 * 9. [ ] ¿Es crítica? → severity: 'critical'
 * 10. [ ] ¿Log de éxito para debugging?
 */
