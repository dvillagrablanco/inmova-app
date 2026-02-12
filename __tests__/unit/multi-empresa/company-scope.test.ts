/**
 * Tests unitarios para el sistema multi-empresa
 * Verifica que la resolución de companyId funciona correctamente
 */
import { describe, it, expect } from 'vitest';
import { getActiveCompanyId } from '@/lib/company-scope';

// Mock de NextRequest
function createMockRequest(options: {
  cookieCompanyId?: string;
  headerCompanyId?: string;
  queryCompanyId?: string;
  url?: string;
}) {
  const url = options.url || 'http://localhost:3000/api/test';
  const searchParams = new URL(url).searchParams;
  if (options.queryCompanyId) {
    // Rebuild URL with query param
  }

  return {
    cookies: {
      get: (name: string) => {
        if (name === 'activeCompanyId' && options.cookieCompanyId) {
          return { value: options.cookieCompanyId };
        }
        return undefined;
      },
    },
    headers: {
      get: (name: string) => {
        if (name === 'x-company-id') return options.headerCompanyId || null;
        return null;
      },
    },
    url: options.queryCompanyId ? `${url}?companyId=${options.queryCompanyId}` : url,
  } as any;
}

describe('getActiveCompanyId', () => {
  it('prioriza queryParam sobre todo', () => {
    const req = createMockRequest({
      queryCompanyId: 'query-company',
      cookieCompanyId: 'cookie-company',
      headerCompanyId: 'header-company',
    });
    expect(getActiveCompanyId(req, 'session-company')).toBe('query-company');
  });

  it('usa header si no hay queryParam', () => {
    const req = createMockRequest({
      headerCompanyId: 'header-company',
      cookieCompanyId: 'cookie-company',
    });
    expect(getActiveCompanyId(req, 'session-company')).toBe('header-company');
  });

  it('usa cookie si no hay queryParam ni header', () => {
    const req = createMockRequest({
      cookieCompanyId: 'cookie-company',
    });
    expect(getActiveCompanyId(req, 'session-company')).toBe('cookie-company');
  });

  it('usa sessionCompanyId como último fallback', () => {
    const req = createMockRequest({});
    expect(getActiveCompanyId(req, 'session-company')).toBe('session-company');
  });

  it('retorna null si no hay ningún companyId', () => {
    const req = createMockRequest({});
    expect(getActiveCompanyId(req, null)).toBeNull();
  });

  it('retorna null si todo es undefined', () => {
    const req = createMockRequest({});
    expect(getActiveCompanyId(req, undefined)).toBeNull();
  });

  it('cookie tiene prioridad sobre session (clave para switch-company)', () => {
    const req = createMockRequest({
      cookieCompanyId: 'nueva-empresa-tras-switch',
    });
    expect(getActiveCompanyId(req, 'empresa-vieja-del-jwt')).toBe('nueva-empresa-tras-switch');
  });
});

describe('JWT refresh behavior', () => {
  it('auth-options.ts debe tener lógica de refresh de companyId', async () => {
    // Verificar que el archivo auth-options contiene la lógica de refresh
    const fs = await import('fs');
    const content = fs.readFileSync('lib/auth-options.ts', 'utf-8');

    expect(content).toContain('companyRefreshedAt');
    expect(content).toContain('REFRESH_INTERVAL_MS');
    expect(content).toContain('freshUser');
  });

  it('CompanySelector debe llamar a updateSession', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('components/layout/CompanySelector.tsx', 'utf-8');

    expect(content).toContain('updateSession');
    expect(content).toContain('useSession');
  });
});

describe('APIs usan cookie fallback', () => {
  const fs = require('fs');
  const path = require('path');

  // APIs críticas que DEBEN tener el cookie fallback
  const criticalAPIs = [
    'app/api/dashboard/route.ts',
    'app/api/buildings/route.ts',
    'app/api/tenants/route.ts',
    'app/api/contracts/route.ts',
    'app/api/payments/route.ts',
    'app/api/company/vertical/route.ts',
    'app/api/search/route.ts',
    'app/api/documents/route.ts',
    'app/api/calendar/route.ts',
    'app/api/leads/route.ts',
    'app/api/seguros/route.ts',
    'app/api/comercial/spaces/route.ts',
    'app/api/comercial/dashboard/route.ts',
    'app/api/estadisticas/route.ts',
  ];

  for (const api of criticalAPIs) {
    it(`${api} usa cookie o resolveCompanyScope`, () => {
      if (!fs.existsSync(api)) return; // Skip if file doesn't exist
      const content = fs.readFileSync(api, 'utf-8');
      const usesScope =
        content.includes('resolveCompanyScope') || content.includes('resolveAccountingScope');
      const usesCookie = content.includes('activeCompanyId');
      expect(usesScope || usesCookie).toBe(true);
    });
  }
});
