import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockResolveCompanyScope } = vi.hoisted(() => ({
  mockResolveCompanyScope: vi.fn(),
}));

vi.mock('@/lib/company-scope', () => ({
  resolveCompanyScope: mockResolveCompanyScope,
}));

describe('resolveAccountingScope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reutiliza el scope multi-sociedad consistente para contabilidad', async () => {
    mockResolveCompanyScope.mockResolvedValue({
      activeCompanyId: 'vidaro1',
      accessibleCompanyIds: ['vidaro1', 'rovida1', 'viroda1'],
      scopeCompanyIds: ['vidaro1', 'rovida1', 'viroda1'],
      isConsolidated: true,
    });

    const { resolveAccountingScope } = await import('@/lib/accounting-scope');
    const request = new NextRequest(
      'http://localhost:3000/api/accounting/summary?companyId=viroda1'
    );

    const result = await resolveAccountingScope(request, {
      id: 'user-1',
      companyId: 'vidaro1',
      role: 'administrador',
    });

    expect(mockResolveCompanyScope).toHaveBeenCalledOnce();
    expect(result).toEqual({
      companyIds: ['vidaro1', 'rovida1', 'viroda1'],
      activeCompanyId: 'vidaro1',
      isConsolidated: true,
    });
  });

  it('ignora companyId externo cuando el rol no es válido', async () => {
    const { resolveAccountingScope } = await import('@/lib/accounting-scope');
    const request = new NextRequest('http://localhost:3000/api/accounting/summary?companyId=otra');

    const result = await resolveAccountingScope(request, {
      id: 'user-1',
      companyId: 'vidaro1',
      role: 'rol_invalido',
    });

    expect(mockResolveCompanyScope).not.toHaveBeenCalled();
    expect(result).toEqual({
      companyIds: ['vidaro1'],
      activeCompanyId: 'vidaro1',
      isConsolidated: false,
    });
  });
});
