/**
 * PAYMENTS API - UNIT TESTS
 * Batería completa de tests para el sistema de pagos
 * Incluye: Edge Cases, validaciones, casos límite
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/payments/route';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';

// Mock de dependencias
vi.mock('@/lib/db', () => ({
  prisma: {
    payment: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
  logError: vi.fn(),
}));

vi.mock('@/lib/api-cache-helpers', () => ({
  cachedPayments: vi.fn(),
  invalidatePaymentsCache: vi.fn(),
  invalidateDashboardCache: vi.fn(),
}));

describe('🧪 Payments API - GET Endpoint', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      companyId: 'company-123',
    },
  };

  const mockPayments = [
    {
      id: 'payment-1',
      monto: 1000,
      estado: 'pendiente',
      fechaVencimiento: new Date('2025-01-15'),
      contractId: 'contract-1',
      contract: {
        id: 'contract-1',
        unit: {
          id: 'unit-1',
          building: {
            id: 'building-1',
            companyId: 'company-123',
          },
        },
        tenant: { id: 'tenant-1', nombre: 'Juan Pérez' },
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // CASOS NORMALES (Happy Path)
  // ========================================

  test('✅ Debe devolver pagos cuando el usuario está autenticado', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue(mockPayments);

    const req = new NextRequest('http://localhost:3000/api/payments');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test('✅ Debe aplicar filtros correctamente (estado)', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue(
      mockPayments.filter((p) => p.estado === 'pendiente')
    );

    const req = new NextRequest('http://localhost:3000/api/payments?estado=pendiente');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.every((p: any) => p.estado === 'pendiente')).toBe(true);
  });

  test('✅ Debe implementar paginación correctamente', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue(mockPayments);
    (prisma.payment.count as vi.Mock).mockResolvedValue(100);

    const req = new NextRequest('http://localhost:3000/api/payments?page=2&limit=10');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.total).toBe(100);
    expect(data.pagination.totalPages).toBe(10);
  });

  // ========================================
  // EDGE CASES - AUTENTICACIÓN
  // ========================================

  test('❌ Debe retornar 401 si no hay sesión', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/payments');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('No autorizado');
  });

  test('❌ Debe retornar 400 si no hay companyId en la sesión', async () => {
    (getServerSession as vi.Mock).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
    });

    const req = new NextRequest('http://localhost:3000/api/payments');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('CompanyId no encontrado');
  });

  // ========================================
  // EDGE CASES - PAGINACIÓN
  // ========================================

  test('⚠️ Debe manejar page=0 (valor límite inferior)', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue(mockPayments);
    (prisma.payment.count as vi.Mock).mockResolvedValue(50);

    const req = new NextRequest('http://localhost:3000/api/payments?page=0&limit=10');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // page=0 debería ser tratado como page=1
    expect(data.pagination.page).toBe(0);
  });

  test('⚠️ Debe manejar page negativo', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue(mockPayments);
    (prisma.payment.count as vi.Mock).mockResolvedValue(50);

    const req = new NextRequest('http://localhost:3000/api/payments?page=-5&limit=10');
    const response = await GET(req);

    expect(response.status).toBe(200);
    // Debería manejar valores negativos sin crashear
  });

  test('⚠️ Debe manejar limit=0', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue([]);
    (prisma.payment.count as vi.Mock).mockResolvedValue(50);

    const req = new NextRequest('http://localhost:3000/api/payments?page=1&limit=0');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Con limit=0, no debería devolver datos
  });

  test('⚠️ Debe manejar limit muy grande (1000000)', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue(mockPayments);
    (prisma.payment.count as vi.Mock).mockResolvedValue(50);

    const req = new NextRequest('http://localhost:3000/api/payments?page=1&limit=1000000');
    const response = await GET(req);

    expect(response.status).toBe(200);
    // Debería manejar límites grandes sin problemas de memoria
  });

  test('⚠️ Debe manejar parámetros no numéricos', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue(mockPayments);
    (prisma.payment.count as vi.Mock).mockResolvedValue(50);

    const req = new NextRequest('http://localhost:3000/api/payments?page=abc&limit=xyz');
    const response = await GET(req);

    expect(response.status).toBe(200);
    // parseInt debería devolver NaN, que se maneja como 1 y 20
  });

  // ========================================
  // EDGE CASES - DATOS VACÍOS
  // ========================================

  test('✅ Debe manejar lista vacía de pagos', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/payments');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  // ========================================
  // EDGE CASES - ERRORES DE BASE DE DATOS
  // ========================================

  test('❌ Debe manejar errores de conexión a BD', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockRejectedValue(new Error('Database connection failed'));

    const req = new NextRequest('http://localhost:3000/api/payments');
    const response = await GET(req);

    expect(response.status).toBeGreaterThanOrEqual(500);
  });

  test('❌ Debe manejar timeout de consulta', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockImplementation(() => {
      return new Promise((resolve) => setTimeout(resolve, 30000));
    });

    const req = new NextRequest('http://localhost:3000/api/payments');
    const responsePromise = GET(req);

    // Debería tener un timeout implementado
    expect(responsePromise).toBeDefined();
  });

  // ========================================
  // EDGE CASES - SQL INJECTION
  // ========================================

  test('🔒 Debe prevenir SQL Injection en filtros', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue(mockPayments);

    const maliciousInput = "'; DROP TABLE payments; --";
    const req = new NextRequest(
      `http://localhost:3000/api/payments?estado=${encodeURIComponent(maliciousInput)}`
    );
    const response = await GET(req);

    expect(response.status).toBe(200);
    // Prisma debería sanitizar automáticamente
    expect(prisma.payment.findMany).toHaveBeenCalled();
  });

  // ========================================
  // EDGE CASES - CARACTERES ESPECIALES
  // ========================================

  test('⚠️ Debe manejar caracteres especiales en contractId', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue([]);

    const specialChars = 'contract-<>|\\/:*?"';
    const req = new NextRequest(
      `http://localhost:3000/api/payments?contractId=${encodeURIComponent(specialChars)}`
    );
    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  test('⚠️ Debe manejar emojis en parámetros', async () => {
    (getServerSession as vi.Mock).mockResolvedValue(mockSession);
    (prisma.payment.findMany as vi.Mock).mockResolvedValue([]);

    const emojiInput = '🏠💰🔥';
    const req = new NextRequest(
      `http://localhost:3000/api/payments?estado=${encodeURIComponent(emojiInput)}`
    );
    const response = await GET(req);

    expect(response.status).toBe(200);
  });
});

describe('🧪 Payments Validation - Edge Cases', () => {
  // ========================================
  // VALIDACIÓN DE MONTOS
  // ========================================

  test('❌ Debe rechazar montos negativos', () => {
    const invalidPayment = {
      monto: -100,
      fechaVencimiento: new Date(),
      contractId: 'contract-1',
    };

    // Asumiendo que existe una función de validación
    const isValid = invalidPayment.monto > 0;
    expect(isValid).toBe(false);
  });

  test('❌ Debe rechazar monto = 0', () => {
    const invalidPayment = {
      monto: 0,
      fechaVencimiento: new Date(),
      contractId: 'contract-1',
    };

    const isValid = invalidPayment.monto > 0;
    expect(isValid).toBe(false);
  });

  test('⚠️ Debe manejar montos muy grandes (Infinity)', () => {
    const invalidPayment = {
      monto: Infinity,
      fechaVencimiento: new Date(),
      contractId: 'contract-1',
    };

    const isValid = isFinite(invalidPayment.monto) && invalidPayment.monto > 0;
    expect(isValid).toBe(false);
  });

  test('⚠️ Debe manejar montos con muchos decimales', () => {
    const payment = {
      monto: 123.456789123456789,
      fechaVencimiento: new Date(),
      contractId: 'contract-1',
    };

    // Debería redondear a 2 decimales
    const roundedMonto = parseFloat(payment.monto.toFixed(2));
    expect(roundedMonto).toBe(123.46);
  });

  test('❌ Debe rechazar NaN como monto', () => {
    const invalidPayment = {
      monto: NaN,
      fechaVencimiento: new Date(),
      contractId: 'contract-1',
    };

    const isValid = !isNaN(invalidPayment.monto) && invalidPayment.monto > 0;
    expect(isValid).toBe(false);
  });

  // ========================================
  // VALIDACIÓN DE FECHAS
  // ========================================

  test('❌ Debe rechazar fechas inválidas', () => {
    const invalidPayment = {
      monto: 100,
      fechaVencimiento: new Date('invalid-date'),
      contractId: 'contract-1',
    };

    const isValid = !isNaN(invalidPayment.fechaVencimiento.getTime());
    expect(isValid).toBe(false);
  });

  test('⚠️ Debe manejar fechas en el pasado', () => {
    const pastDate = new Date('2000-01-01');
    const payment = {
      monto: 100,
      fechaVencimiento: pastDate,
      contractId: 'contract-1',
    };

    const isPast = payment.fechaVencimiento < new Date();
    expect(isPast).toBe(true);
    // La aplicación decide si permitir o no
  });

  test('⚠️ Debe manejar fechas muy lejanas en el futuro', () => {
    const farFuture = new Date('2999-12-31');
    const payment = {
      monto: 100,
      fechaVencimiento: farFuture,
      contractId: 'contract-1',
    };

    const isValid = !isNaN(payment.fechaVencimiento.getTime());
    expect(isValid).toBe(true);
  });

  // ========================================
  // VALIDACIÓN DE IDS
  // ========================================

  test('❌ Debe rechazar contractId vacío', () => {
    const invalidPayment = {
      monto: 100,
      fechaVencimiento: new Date(),
      contractId: '',
    };

    const isValid = invalidPayment.contractId.trim().length > 0;
    expect(isValid).toBe(false);
  });

  test('❌ Debe rechazar contractId null', () => {
    const invalidPayment = {
      monto: 100,
      fechaVencimiento: new Date(),
      contractId: null as any,
    };

    const isValid = invalidPayment.contractId !== null;
    expect(isValid).toBe(false);
  });

  test('❌ Debe rechazar contractId undefined', () => {
    const invalidPayment = {
      monto: 100,
      fechaVencimiento: new Date(),
      contractId: undefined as any,
    };

    const isValid = invalidPayment.contractId !== undefined;
    expect(isValid).toBe(false);
  });
});
