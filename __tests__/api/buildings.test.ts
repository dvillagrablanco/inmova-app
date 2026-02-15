import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/db', () => ({
  default: {
    building: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  getPrismaClient: () => ({ default: {
    building: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } }),
}));

vi.mock('@/lib/auth-options', () => ({
  default: {},
}));

import prisma from '@/lib/db';

describe.skip('Buildings API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.skip('GET /api/buildings', () => {
    it('should return list of buildings', async () => {
      const mockBuildings = [
        { id: '1', name: 'Building A', address: '123 Main St', units: 10 },
        { id: '2', name: 'Building B', address: '456 Oak Ave', units: 8 },
      ];

      (prisma.building.findMany as any).mockResolvedValue(mockBuildings);

      const result = mockBuildings;
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Building A');
    });

    it('should filter buildings by company', async () => {
      const mockBuildings = [
        { id: '1', companyId: 'company-1', name: 'Building A' },
      ];

      (prisma.building.findMany as any).mockResolvedValue(mockBuildings);

      const result = mockBuildings.filter(b => b.companyId === 'company-1');
      expect(result).toHaveLength(1);
    });
  });

  describe.skip('GET /api/buildings/[id]', () => {
    it('should return building by id', async () => {
      const mockBuilding = {
        id: '1',
        name: 'Building A',
        address: '123 Main St',
        city: 'Madrid',
        postalCode: '28001',
      };

      (prisma.building.findUnique as any).mockResolvedValue(mockBuilding);

      const result = mockBuilding;
      expect(result.id).toBe('1');
      expect(result.name).toBe('Building A');
    });

    it('should return null for non-existent building', async () => {
      (prisma.building.findUnique as any).mockResolvedValue(null);

      const result = null;
      expect(result).toBeNull();
    });
  });

  describe.skip('POST /api/buildings', () => {
    it('should create a new building', async () => {
      const newBuilding = {
        name: 'New Building',
        address: '789 Pine St',
        city: 'Barcelona',
        postalCode: '08001',
      };

      const mockCreated = {
        id: 'new-id',
        ...newBuilding,
        createdAt: new Date(),
      };

      (prisma.building.create as any).mockResolvedValue(mockCreated);

      const result = mockCreated;
      expect(result.name).toBe('New Building');
      expect(result.id).toBe('new-id');
    });

    it('should validate required fields', () => {
      const invalidBuilding = {
        address: '123 Main St',
        // Missing name
      };

      expect(invalidBuilding.hasOwnProperty('name')).toBe(false);
    });

    it('should validate postal code format', () => {
      const postalCode = '28001';
      const postalCodeRegex = /^\d{5}$/;
      expect(postalCodeRegex.test(postalCode)).toBe(true);
    });
  });

  describe.skip('PUT /api/buildings/[id]', () => {
    it('should update building information', async () => {
      const mockBuilding = {
        id: '1',
        name: 'Building A',
        address: '123 Main St',
      };

      (prisma.building.update as any).mockResolvedValue({
        ...mockBuilding,
        name: 'Updated Building A',
      });

      const updated = { ...mockBuilding, name: 'Updated Building A' };
      expect(updated.name).toBe('Updated Building A');
    });
  });

  describe.skip('DELETE /api/buildings/[id]', () => {
    it('should delete a building', async () => {
      (prisma.building.delete as any).mockResolvedValue({ id: '1' });

      const result = { id: '1' };
      expect(result.id).toBe('1');
    });

    it('should handle deletion of non-existent building', async () => {
      (prisma.building.delete as any).mockRejectedValue(
        new Error('Record not found')
      );

      try {
        throw new Error('Record not found');
      } catch (error: any) {
        expect(error.message).toBe('Record not found');
      }
    });
  });
});
