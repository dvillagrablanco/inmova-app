import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}));

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));

vi.mock('@/lib/logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe('GET /api/catastro/consulta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', companyId: 'vidaro1', role: 'super_admin' },
    });
  });

  it('normaliza referencias catastrales con espacios y guiones antes de consultar', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () =>
        '<consulta><ldt>CL MANUEL SILVELA 5 28010 MADRID (MADRID)</ldt><nm>MADRID</nm><np>MADRID</np><dp>28010</dp><luso>Residencial</luso><sfc>1700</sfc><ant>1945</ant></consulta>',
    } as Response);

    const { GET } = await import('@/app/api/catastro/consulta/route');

    const response = await GET(
      new NextRequest('http://localhost:3000/api/catastro/consulta?rc=0858104-VK4705H%200001AB')
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('RC=0858104VK4705H'),
      expect.any(Object)
    );
    expect(payload.referenciaCatastral).toBe('0858104VK4705H0001AB');

    fetchMock.mockRestore();
  });
});
