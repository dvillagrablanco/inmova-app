#!/usr/bin/env python3
"""
Análisis exhaustivo de TODOS los errores encontrados en la inspección
"""
import json
from collections import defaultdict

# Leer resultados
with open('/workspace/exhaustive-inspection-final.json', 'r') as f:
    data = json.load(f)

print("="*80)
print("📊 ANÁLISIS EXHAUSTIVO DE ERRORES - 59 PÁGINAS")
print("="*80)

# Categorías de errores
errors_by_category = {
    'botones_faltantes': [],
    'paginas_404_timeout': [],
    'errores_401': [],
    'problemas_estructura': [],
    'errores_red': [],
    'problemas_ux': []
}

# Analizar cada página
for page in data['pages']:
    page_name = page['name']
    page_url = page['url']
    http_status = page['httpStatus']
    errors = page.get('errors', [])
    buttons = page.get('buttons', [])
    has_h1 = page.get('hasH1', False)
    has_nav = page.get('hasNavigation', False)
    has_footer = page.get('hasFooter', False)
    
    # 1. Botones faltantes
    for button in buttons:
        if not button['found']:
            errors_by_category['botones_faltantes'].append({
                'page': page_name,
                'url': page_url,
                'button': button['selector'],
                'severity': 'media'
            })
    
    # 2. Páginas 404/timeout
    if http_status is None or http_status >= 400:
        has_timeout = any(e.get('type') == 'navigation' for e in errors)
        errors_by_category['paginas_404_timeout'].append({
            'page': page_name,
            'url': page_url,
            'status': http_status or 'TIMEOUT',
            'has_timeout': has_timeout,
            'severity': 'alta'
        })
    
    # 3. Errores 401 (autenticación)
    errors_401 = [e for e in errors if e.get('statusCode') == 401]
    if errors_401:
        errors_by_category['errores_401'].append({
            'page': page_name,
            'url': page_url,
            'count': len(errors_401),
            'apis': [e.get('url', 'N/A') for e in errors_401 if e.get('type') == 'network'],
            'severity': 'baja' if '/dashboard' in page_url or '/admin' in page_url else 'media'
        })
    
    # 4. Problemas de estructura (H1, nav, footer)
    if not has_h1:
        errors_by_category['problemas_estructura'].append({
            'page': page_name,
            'url': page_url,
            'issue': 'Sin H1',
            'severity': 'media'
        })
    if not has_nav and page_url not in ['/unauthorized']:
        errors_by_category['problemas_estructura'].append({
            'page': page_name,
            'url': page_url,
            'issue': 'Sin navegación',
            'severity': 'baja'
        })
    
    # 5. Otros errores de red
    network_errors = [e for e in errors if e.get('type') == 'network' and e.get('statusCode') not in [401, 403]]
    if network_errors:
        for err in network_errors:
            errors_by_category['errores_red'].append({
                'page': page_name,
                'url': page_url,
                'error_url': err.get('url', 'N/A'),
                'status': err.get('statusCode', 'N/A'),
                'severity': 'media'
            })

# IMPRIMIR RESULTADOS

print("\n" + "="*80)
print("1️⃣ BOTONES FALTANTES")
print("="*80)
if errors_by_category['botones_faltantes']:
    print(f"\n❌ Total: {len(errors_by_category['botones_faltantes'])} botones faltantes\n")
    for i, err in enumerate(errors_by_category['botones_faltantes'], 1):
        print(f"{i}. [{err['severity'].upper()}] {err['page']}")
        print(f"   URL: {err['url']}")
        print(f"   Botón faltante: '{err['button']}'")
        print()
else:
    print("\n✅ No se encontraron botones faltantes")

print("\n" + "="*80)
print("2️⃣ PÁGINAS CON 404/TIMEOUT")
print("="*80)
if errors_by_category['paginas_404_timeout']:
    print(f"\n❌ Total: {len(errors_by_category['paginas_404_timeout'])} páginas con problemas\n")
    
    # Agrupar por status
    by_status = defaultdict(list)
    for err in errors_by_category['paginas_404_timeout']:
        by_status[str(err['status'])].append(err)
    
    for status in sorted(by_status.keys()):
        pages = by_status[status]
        print(f"\n📌 Status: {status} ({len(pages)} páginas)")
        for i, err in enumerate(pages, 1):
            print(f"   {i}. {err['page']} → {err['url']}")
else:
    print("\n✅ Todas las páginas responden correctamente")

print("\n" + "="*80)
print("3️⃣ ERRORES 401 (Autenticación)")
print("="*80)
if errors_by_category['errores_401']:
    print(f"\n⚠️ Total: {len(errors_by_category['errores_401'])} páginas con errores 401\n")
    for i, err in enumerate(errors_by_category['errores_401'], 1):
        print(f"{i}. [{err['severity'].upper()}] {err['page']} ({err['count']} errores)")
        print(f"   URL: {err['url']}")
        if err['apis']:
            print(f"   APIs afectadas:")
            for api in err['apis']:
                print(f"      - {api}")
        print()
else:
    print("\n✅ No se encontraron errores 401")

print("\n" + "="*80)
print("4️⃣ PROBLEMAS DE ESTRUCTURA HTML")
print("="*80)
if errors_by_category['problemas_estructura']:
    print(f"\n⚠️ Total: {len(errors_by_category['problemas_estructura'])} problemas\n")
    
    # Agrupar por tipo
    by_issue = defaultdict(list)
    for err in errors_by_category['problemas_estructura']:
        by_issue[err['issue']].append(err)
    
    for issue_type in sorted(by_issue.keys()):
        pages = by_issue[issue_type]
        print(f"\n📌 {issue_type} ({len(pages)} páginas)")
        for i, err in enumerate(pages, 1):
            print(f"   {i}. {err['page']} → {err['url']}")
else:
    print("\n✅ Todas las páginas tienen estructura correcta")

print("\n" + "="*80)
print("5️⃣ OTROS ERRORES DE RED")
print("="*80)
if errors_by_category['errores_red']:
    print(f"\n⚠️ Total: {len(errors_by_category['errores_red'])} errores de red\n")
    for i, err in enumerate(errors_by_category['errores_red'][:10], 1):  # Primeros 10
        print(f"{i}. [{err['severity'].upper()}] {err['page']}")
        print(f"   Error: {err['error_url']} → Status {err['status']}")
        print()
else:
    print("\n✅ No se encontraron errores de red adicionales")

# RESUMEN FINAL
print("\n" + "="*80)
print("📊 RESUMEN EJECUTIVO")
print("="*80)

total_issues = (
    len(errors_by_category['botones_faltantes']) +
    len(errors_by_category['paginas_404_timeout']) +
    len(errors_by_category['errores_401']) +
    len(errors_by_category['problemas_estructura']) +
    len(errors_by_category['errores_red'])
)

print(f"""
Total de issues encontrados (excluyendo error JS global): {total_issues}

Desglose por categoría:
  🔘 Botones faltantes: {len(errors_by_category['botones_faltantes'])}
  📄 Páginas 404/timeout: {len(errors_by_category['paginas_404_timeout'])}
  🔐 Errores 401: {len(errors_by_category['errores_401'])}
  🏗️ Problemas estructura: {len(errors_by_category['problemas_estructura'])}
  🌐 Errores de red: {len(errors_by_category['errores_red'])}

Prioridades:
  🔴 Alta: {len([e for e in errors_by_category['paginas_404_timeout'] if e['severity'] == 'alta'])} issues
  🟡 Media: {len([e for e in errors_by_category['botones_faltantes'] if e['severity'] == 'media']) + len([e for e in errors_by_category['problemas_estructura'] if e['severity'] == 'media'])} issues
  🟢 Baja: {len([e for e in errors_by_category['errores_401'] if e['severity'] == 'baja'])} issues
""")

# Guardar resumen en JSON
summary = {
    'total_issues': total_issues,
    'categories': {
        'botones_faltantes': len(errors_by_category['botones_faltantes']),
        'paginas_404_timeout': len(errors_by_category['paginas_404_timeout']),
        'errores_401': len(errors_by_category['errores_401']),
        'problemas_estructura': len(errors_by_category['problemas_estructura']),
        'errores_red': len(errors_by_category['errores_red'])
    },
    'details': errors_by_category
}

with open('/workspace/errores-categorizados.json', 'w') as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print("\n✅ Resultados guardados en: /workspace/errores-categorizados.json")
print("="*80)
