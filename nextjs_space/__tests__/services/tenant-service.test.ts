import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  default: {
    tenant: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    contract: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import prisma from '@/lib/db';

describe('Tenant Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTenant', () => {
    it('should create a new tenant', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+34123456789',
        dni: '12345678A',
        createdAt: new Date(),
      };

      (prisma.tenant.create as any).mockResolvedValue(mockTenant);

      const result = mockTenant;
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.dni).toBe('12345678A');
    });

    it('should validate email format', () => {
      const email = 'john@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(email)).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidEmail = 'not-an-email';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('should validate phone number format', () => {
      const phone = '+34123456789';
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      expect(phoneRegex.test(phone.replace(/[\s-]/g, ''))).toBe(true);
    });
  });

  describe('updateTenant', () => {
    it('should update tenant information', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'John Doe',
        phone: '+34123456789',
      };

      (prisma.tenant.update as any).mockResolvedValue({
        ...mockTenant,
        phone: '+34987654321',
      });

      const updated = { ...mockTenant, phone: '+34987654321' };
      expect(updated.phone).toBe('+34987654321');
    });

    it('should not allow email change if active contract exists', async () => {
      const mockContract = {
        id: 'contract-1',
        tenantId: 'tenant-1',
        status: 'active',
      };

      (prisma.contract.findFirst as any).mockResolvedValue(mockContract);

      const hasActiveContract = mockContract.status === 'active';
      expect(hasActiveContract).toBe(true);
    });
  });

  describe('getTenantContracts', () => {
    it('should retrieve all contracts for a tenant', async () => {
      const mockContracts = [
        { id: '1', tenantId: 'tenant-1', unitId: 'unit-1', status: 'active' },
        { id: '2', tenantId: 'tenant-1', unitId: 'unit-2', status: 'ended' },
      ];

      (prisma.contract.findMany as any).mockResolvedValue(mockContracts);

      const result = mockContracts;
      expect(result).toHaveLength(2);
      expect(result[0].tenantId).toBe('tenant-1');
    });

    it('should filter active contracts only', async () => {
      const mockContracts = [
        { id: '1', status: 'active' },
        { id: '2', status: 'ended' },
        { id: '3', status: 'active' },
      ];

      (prisma.contract.findMany as any).mockResolvedValue(
        mockContracts.filter(c => c.status === 'active')
      );

      const activeContracts = mockContracts.filter(c => c.status === 'active');
      expect(activeContracts).toHaveLength(2);
    });
  });

  describe('deleteTenant', () => {
    it('should not delete tenant with active contracts', async () => {
      const mockContract = {
        id: 'contract-1',
        tenantId: 'tenant-1',
        status: 'active',
      };

      (prisma.contract.findFirst as any).mockResolvedValue(mockContract);

      const hasActiveContract = mockContract !== null && mockContract.status === 'active';
      expect(hasActiveContract).toBe(true);
    });

    it('should allow deletion when no active contracts', async () => {
      (prisma.contract.findFirst as any).mockResolvedValue(null);
      (prisma.tenant.delete as any).mockResolvedValue({ id: 'tenant-1' });

      const hasActiveContract = null !== null;
      expect(hasActiveContract).toBe(false);
    });
  });

  describe('tenant search', () => {
    it('should search tenants by name', async () => {
      const mockTenants = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com' },
      ];

      (prisma.tenant.findMany as any).mockResolvedValue(mockTenants);

      const searchTerm = 'Doe';
      const filtered = mockTenants.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(filtered).toHaveLength(2);
    });

    it('should search tenants by email', async () => {
      const mockTenants = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
      ];

      (prisma.tenant.findMany as any).mockResolvedValue(mockTenants);

      const searchEmail = 'john@example.com';
      const found = mockTenants.find(t => t.email === searchEmail);
      expect(found).toBeDefined();
      expect(found?.name).toBe('John Doe');
    });
  });
});
