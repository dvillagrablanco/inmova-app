#!/usr/bin/env python3
"""
Script para migrar APIs que usan session.user.companyId directo
a usar cookie activeCompanyId como fallback para multi-empresa.

Aplica el patrón:
  const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
  const companyId = cookieCompanyId || session.user.companyId;
"""
import os
import re
import sys

# Archivos ya corregidos manualmente (excluir)
ALREADY_FIXED = {
    'app/api/dashboard/route.ts',
    'app/api/dashboard/export/route.ts',
    'app/api/buildings/route.ts',
    'app/api/buildings/[id]/route.ts',
    'app/api/tenants/route.ts',
    'app/api/contracts/route.ts',
    'app/api/contracts/[id]/route.ts',
    'app/api/payments/route.ts',
    'app/api/payments/[id]/route.ts',
    'app/api/expenses/route.ts',
    'app/api/units/route.ts',
    'app/api/units/[id]/route.ts',
    'app/api/documents/route.ts',
    'app/api/search/route.ts',
    'app/api/company/vertical/route.ts',
    'app/api/calendar/route.ts',
    'app/api/seguros/route.ts',
    'app/api/leads/route.ts',
    'app/api/estadisticas/route.ts',
    'app/api/comercial/dashboard/route.ts',
    'app/api/comercial/spaces/route.ts',
    'app/api/reportes/financieros/route.ts',
    'app/api/maintenance/route.ts',
    'app/api/user/companies/route.ts',
    'app/api/user/switch-company/route.ts',
    'app/api/modules/active/route.ts',
    'app/api/finanzas/summary/route.ts',
    'app/api/accounting/import/route.ts',
}

# APIs que usan resolveCompanyScope ya (excluir)
USES_RESOLVE_SCOPE = set()

def find_api_files(root='app/api'):
    """Find all route.ts files"""
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        for f in filenames:
            if f == 'route.ts':
                files.append(os.path.join(dirpath, f))
    return files

def needs_fix(content, filepath):
    """Check if file uses session.user.companyId without cookie fallback"""
    rel = filepath.replace('\\', '/')
    if rel.startswith('./'):
        rel = rel[2:]
    
    if rel in ALREADY_FIXED:
        return False
    
    # Already uses resolveCompanyScope
    if 'resolveCompanyScope' in content or 'resolveAccountingScope' in content:
        # But check if it ALSO uses session.user.companyId directly
        if 'session.user.companyId' in content or 'session.user?.companyId' in content:
            # Has both - might need the guard fix
            pass
        else:
            return False
    
    # Already uses activeCompanyId cookie
    if 'activeCompanyId' in content:
        return False
    
    # Uses session.user.companyId
    if 'session.user.companyId' in content or 'session.user?.companyId' in content:
        return True
    
    return False

def get_request_param_name(content):
    """Detect the request parameter name (request, req, etc.)"""
    # Look for export async function GET/POST/PUT/DELETE(request/req: NextRequest
    match = re.search(r'export\s+async\s+function\s+(?:GET|POST|PUT|DELETE|PATCH)\s*\(\s*(\w+)\s*[,:)]', content)
    if match:
        return match.group(1)
    return 'request'

def apply_fix(filepath, content):
    """Apply the cookie fallback fix"""
    req_param = get_request_param_name(content)
    
    fixes_applied = 0
    new_content = content
    
    # Pattern 1: Guard pattern - if (!session?.user?.companyId) { return ... 401 }
    # Replace with: check session?.user first, then resolve companyId
    guard_pattern = re.compile(
        r'(if\s*\(\s*!session\?\.\s*user\?\.\s*companyId\s*\)\s*\{[^}]*(?:401|autenticado|autorizado|No\s+auth)[^}]*\})',
        re.IGNORECASE | re.DOTALL
    )
    
    if guard_pattern.search(new_content):
        # Replace guard with session-only check + companyId resolution after
        def replace_guard(match):
            nonlocal fixes_applied
            original = match.group(0)
            # Build replacement: check session.user only, then resolve companyId via cookie
            replacement = f"""if (!session?.user) {{
      return NextResponse.json({{ error: 'No autenticado' }}, {{ status: 401 }});
    }}

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = {req_param}.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {{
      return NextResponse.json({{ error: 'Empresa no definida' }}, {{ status: 400 }});
    }}
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;"""
            fixes_applied += 1
            return replacement
        
        new_content = guard_pattern.sub(replace_guard, new_content, count=1)
    
    # Pattern 2: Direct assignment - const companyId = session.user.companyId;
    # or const companyId = session.user?.companyId;
    assign_pattern = re.compile(
        r'(const\s+companyId\s*=\s*session\.user(?:\?)?\.companyId\s*;)'
    )
    
    if assign_pattern.search(new_content) and '__resolvedCompanyId' not in new_content:
        def replace_assign(match):
            nonlocal fixes_applied
            fixes_applied += 1
            return f"const cookieCompanyId = {req_param}.cookies.get('activeCompanyId')?.value;\n    const companyId = cookieCompanyId || session.user.companyId;"
        
        new_content = assign_pattern.sub(replace_assign, new_content, count=1)
    
    # Clean up: remove double-resolved __resolvedCompanyId if companyId is also used
    # Replace session.user.companyId references that come AFTER our injection
    # with __resolvedCompanyId (only if we injected it)
    
    return new_content, fixes_applied

def main():
    root = 'app/api'
    files = find_api_files(root)
    
    total_fixed = 0
    total_skipped = 0
    fixed_files = []
    
    for filepath in sorted(files):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if not needs_fix(content, filepath):
            total_skipped += 1
            continue
        
        new_content, fixes_applied = apply_fix(filepath, content)
        
        if fixes_applied > 0 and new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            total_fixed += 1
            fixed_files.append(filepath)
            print(f"  ✅ {filepath} ({fixes_applied} fixes)")
        else:
            total_skipped += 1
    
    print(f"\nTotal: {total_fixed} archivos corregidos, {total_skipped} omitidos")
    return fixed_files

if __name__ == '__main__':
    fixed = main()
    if fixed:
        print(f"\nArchivos modificados: {len(fixed)}")
