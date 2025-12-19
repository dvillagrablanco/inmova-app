/**
 * TESTS DE INTEGRACIÓN - API DE ALQUILER POR HABITACIONES
 * Pruebas end-to-end de prorrateo de suministros con base de datos real
 */

import { prisma } from '@/lib/db';
import {
  calculateUtilityProration,
  UtilityProrationInput,
} from '@/lib/room-rental-service';
import { getServerSession } from 'next-auth';

jest.mock('next-auth');
jest.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));

describe('🔗 Integration Tests - Room Rental API', () => {
  let testCompanyId: string;
  let testBuildingId: string;
  let testRoomIds: string[] = [];

  beforeAll(async () => {
    // Crear compañía de prueba
    const company = await prisma.company.create({
      data: {
        name: 'Room Rental Test Company',
        email: 'roomrental@test.com',
        status: 'active',
      },
    });
    testCompanyId = company.id;

    // Crear edificio tipo coliving
    const building = await prisma.building.create({
      data: {
        nombre: 'Coliving Test',
        direccion: 'Test Coliving Address',
        companyId: testCompanyId,
      },
    });
    testBuildingId = building.id;

    // Crear 3 habitaciones
    const room1 = await prisma.room.create({
      data: {
        roomNumber: 'R101',
        surface: 15,
        currentOccupants: 1,
        maxOccupants: 1,
        monthlyRent: 500,
        buildingId: testBuildingId,
      },
    });

    const room2 = await prisma.room.create({
      data: {
        roomNumber: 'R102',
        surface: 25,
        currentOccupants: 2,
        maxOccupants: 2,
        monthlyRent: 800,
        buildingId: testBuildingId,
      },
    });

    const room3 = await prisma.room.create({
      data: {
        roomNumber: 'R103',
        surface: 10,
        currentOccupants: 1,
        maxOccupants: 1,
        monthlyRent: 400,
        buildingId: testBuildingId,
      },
    });

    testRoomIds = [room1.id, room2.id, room3.id];
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.room.deleteMany({
      where: { buildingId: testBuildingId },
    });
    await prisma.building.deleteMany({
      where: { id: testBuildingId },
    });
    await prisma.company.deleteMany({
      where: { id: testCompanyId },
    });

    await prisma.$disconnect();
  });

  describe('Prorrateo de Suministros - División Equitativa', () => {
    test('✅ Debe prorratear 300€ entre 3 habitaciones equitativamente', async () => {
      const rooms = await prisma.room.findMany({
        where: { buildingId: testBuildingId },
      });

      const input: UtilityProrationInput = {
        totalAmount: 300,
        rooms: rooms.map((r) => ({
          roomId: r.id,
          surface: r.surface,
          occupants: r.currentOccupants,
        })),
        prorationMethod: 'equal',
      };

      const result = await calculateUtilityProration(input);

      expect(result).toHaveLength(3);
      expect(result[0].amount).toBe(100);
      expect(result[1].amount).toBe(100);
      expect(result[2].amount).toBe(100);

      // Verificar que la suma es exacta
      const total = result.reduce((sum, r) => sum + r.amount, 0);
      expect(total).toBe(300);
    });
  });

  describe('Prorrateo de Suministros - Por Superficie', () => {
    test('✅ Debe prorratear 300€ según superficie de cada habitación', async () => {
      const rooms = await prisma.room.findMany({
        where: { buildingId: testBuildingId },
      });

      // Total superficie: 15 + 25 + 10 = 50 m²
      // R101 (15m²) = 30% = 90€
      // R102 (25m²) = 50% = 150€
      // R103 (10m²) = 20% = 60€

      const input: UtilityProrationInput = {
        totalAmount: 300,
        rooms: rooms.map((r) => ({
          roomId: r.id,
          surface: r.surface,
          occupants: r.currentOccupants,
        })),
        prorationMethod: 'by_surface',
      };

      const result = await calculateUtilityProration(input);

      expect(result).toHaveLength(3);

      // Verificar distribución
      const room1Result = result.find((r) => r.roomId === testRoomIds[0]);
      const room2Result = result.find((r) => r.roomId === testRoomIds[1]);
      const room3Result = result.find((r) => r.roomId === testRoomIds[2]);

      expect(room1Result?.amount).toBe(90); // 30% de 300
      expect(room2Result?.amount).toBe(150); // 50% de 300
      expect(room3Result?.amount).toBe(60); // 20% de 300

      // Verificar que la suma es exacta
      const total = result.reduce((sum, r) => sum + r.amount, 0);
      expect(total).toBe(300);
    });
  });

  describe('Prorrateo de Suministros - Por Ocupantes', () => {
    test('✅ Debe prorratear 300€ según número de ocupantes', async () => {
      const rooms = await prisma.room.findMany({
        where: { buildingId: testBuildingId },
      });

      // Total ocupantes: 1 + 2 + 1 = 4
      // R101 (1 ocupante) = 25% = 75€
      // R102 (2 ocupantes) = 50% = 150€
      // R103 (1 ocupante) = 25% = 75€

      const input: UtilityProrationInput = {
        totalAmount: 300,
        rooms: rooms.map((r) => ({
          roomId: r.id,
          surface: r.surface,
          occupants: r.currentOccupants,
        })),
        prorationMethod: 'by_occupants',
      };

      const result = await calculateUtilityProration(input);

      expect(result).toHaveLength(3);

      const room1Result = result.find((r) => r.roomId === testRoomIds[0]);
      const room2Result = result.find((r) => r.roomId === testRoomIds[1]);
      const room3Result = result.find((r) => r.roomId === testRoomIds[2]);

      expect(room1Result?.amount).toBe(75); // 25% de 300
      expect(room2Result?.amount).toBe(150); // 50% de 300
      expect(room3Result?.amount).toBe(75); // 25% de 300
    });
  });

  describe('Creación de Registros de Prorrateo', () => {
    test('✅ Debe guardar un registro de prorrateo en BD', async () => {
      const proration = await prisma.utilityProration.create({
        data: {
          buildingId: testBuildingId,
          month: new Date('2025-01-01'),
          utilityType: 'electricity',
          totalAmount: 300,
          method: 'by_surface',
          breakdown: [
            { roomId: testRoomIds[0], amount: 90, percentage: 30 },
            { roomId: testRoomIds[1], amount: 150, percentage: 50 },
            { roomId: testRoomIds[2], amount: 60, percentage: 20 },
          ],
        },
      });

      expect(proration.id).toBeDefined();
      expect(proration.totalAmount).toBe(300);
      expect(proration.method).toBe('by_surface');
      expect(proration.breakdown).toHaveLength(3);
    });

    test('✅ Debe recuperar historial de prorrateos', async () => {
      const prorations = await prisma.utilityProration.findMany({
        where: { buildingId: testBuildingId },
        orderBy: { month: 'desc' },
      });

      expect(prorations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Casos de Uso Reales', () => {
    test('✅ Caso Real: Factura de luz de 150€ en coliving de 3 habitaciones', async () => {
      const rooms = await prisma.room.findMany({
        where: { buildingId: testBuildingId },
      });

      const input: UtilityProrationInput = {
        totalAmount: 150,
        rooms: rooms.map((r) => ({
          roomId: r.id,
          surface: r.surface,
          occupants: r.currentOccupants,
        })),
        prorationMethod: 'by_surface',
      };

      const result = await calculateUtilityProration(input);

      // Guardar en BD
      await prisma.utilityProration.create({
        data: {
          buildingId: testBuildingId,
          month: new Date('2025-02-01'),
          utilityType: 'electricity',
          totalAmount: 150,
          method: 'by_surface',
          breakdown: result.map((r) => ({
            roomId: r.roomId,
            amount: r.amount,
            percentage: r.percentage,
          })),
        },
      });

      // Verificar que se guardó correctamente
      const saved = await prisma.utilityProration.findFirst({
        where: {
          buildingId: testBuildingId,
          utilityType: 'electricity',
          totalAmount: 150,
        },
      });

      expect(saved).toBeDefined();
      expect(saved?.breakdown).toHaveLength(3);
    });
  });
});
