#!/usr/bin/env python3
"""
Limpia TODOS los datos mock/hardcodeados de las páginas de la app.
Reemplaza arrays con objetos hardcodeados por arrays vacíos.

Patrones que detecta y limpia:
1. useState<Type[]>([{...}, {...}]) → useState<Type[]>([])
2. useState([{...}, {...}]) → useState([])
3. const varName: Type[] = [{...}] → const varName: Type[] = []
4. const varName = [{...}] → const varName = [] (solo si tiene id:)

Excluye: landing/, legal/, ejemplo-ux, docs/, faq, test-auth
"""

import os
import re
import sys

DRY_RUN = '--dry-run' in sys.argv
APP_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'app')

# Directories to skip (these legitimately have static content)
SKIP_DIRS = {'landing', 'legal', 'ejemplo-ux', 'guia-ux', 'api-docs', 'api-docs.disabled',
             'test-auth', 'api', '__tests__', 'node_modules', '.next'}
SKIP_FILES = set()

# Pages where static data is legitimate (config pages, forms with dropdowns, etc.)
LEGITIMATE_STATIC = {
    'dashboard/herramientas',  # Calculator tools - static by nature
    'developers/samples',      # Code samples - static
    'developers/status',       # Status page
    'landing/',                # All landing pages
    'admin/integraciones',     # Integration config - static list of providers
    'admin/integraciones-compartidas', # Same
    'admin/integraciones-plataforma',  # Same
    'configuracion/integraciones',     # Same
    'str/settings/integrations',       # Same
    'configuracion/',          # Config pages with static options
    'pagos/configuracion',     # Payment provider config
    'firma-digital/configuracion', # Signature provider config
    'contabilidad/integraciones',  # Accounting provider config
}

# Variable names that are UI config, NOT business data (should NOT be cleaned)
UI_CONFIG_VARS = {
    'ROLES', 'roles', 'CATEGORIAS', 'CATEGORIES', 'categories', 'categorias',
    'EVENT_TYPES', 'eventTypes', 'PRIORIDADES', 'prioridades',
    'RATING_TYPES', 'ratingTypes', 'filterOptions', 'quickActions',
    'QUICK_ACTIONS', 'amenitiesList', 'phases', 'badges',
    'EXPERIENCE_OPTIONS', 'configSections', 'modulos', 'MODULES',
    'AVAILABLE_EVENTS', 'AUDIENCE_SEGMENTS', 'TEMPLATE_CATEGORIES',
    'ONBOARDING_STEPS', 'CATEGORIAS_PAGO', 'AVAILABLE_TEMPLATES',
    'INFORMES_DISPONIBLES', 'ALERTAS_NORMATIVAS', 'QA_CHECKLIST',
    'paymentProviders', 'signatureProviders', 'accountingProviders',
    'bankIntegrations', 'portals', 'financeModules', 'reportTemplates',
    'integrationCategories', 'allIntegrations', 'automationFeatures',
    'ESPACIOS_DISPONIBLES', 'defaultConfigs', 'smartContracts',
    'CARACTERISTICAS', 'EMAIL_TEMPLATES', 'POLITICAS',
}

def should_skip(filepath):
    rel = filepath.replace(APP_DIR + '/', '')
    parts = rel.split('/')
    if any(p in SKIP_DIRS for p in parts):
        return True
    for legit in LEGITIMATE_STATIC:
        if rel.startswith(legit):
            return True
    return False

def find_and_clean_mock_arrays(content, filepath):
    """Find arrays with hardcoded objects and replace with empty arrays."""
    changes = []
    new_content = content
    
    # Pattern 1: useState<Type[]>([{...objects...}])
    # Match the opening, then find the balanced closing
    pattern_usestate = re.compile(
        r'(useState(?:<[^>]+>)?\s*\()\s*(\[[\s\S]*?\])\s*(\))',
    )
    
    for match in reversed(list(pattern_usestate.finditer(content))):
        array_content = match.group(2).strip()
        # Check if array has objects with properties (not just empty or simple values)
        if re.search(r'\{\s*\w+\s*:', array_content) and len(array_content) > 30:
            # Has objects - check it's mock data (has id, name, etc.)
            if re.search(r"id:\s*['\"]", array_content) or re.search(r"(nombre|name|title|label|phase|type):\s*['\"]", array_content):
                prefix = match.group(1)
                suffix = match.group(3)
                replacement = f"{prefix}[]{suffix}"
                start, end = match.start(), match.end()
                new_content = new_content[:start] + replacement + new_content[end:]
                # Extract variable name from context
                line_start = content.rfind('\n', 0, match.start()) + 1
                context = content[line_start:match.start()]
                var_match = re.search(r'\[(\w+)', context)
                var_name = var_match.group(1) if var_match else '?'
                changes.append(f"useState → []: {var_name}")
    
    # Pattern 2: const varName: Type[] = [{...objects...}]
    # or const varName = [{...objects...}]
    pattern_const = re.compile(
        r'(const\s+\w+\s*(?::\s*\w+(?:\[\])?\s*)?=\s*)\s*(\[[\s\S]*?\])\s*(;)',
    )
    
    for match in reversed(list(pattern_const.finditer(new_content))):
        array_content = match.group(2).strip()
        if re.search(r'\{\s*\w+\s*:', array_content) and len(array_content) > 50:
            if re.search(r"id:\s*['\"]", array_content):
                var_match = re.search(r'const\s+(\w+)', match.group(1))
                var_name = var_match.group(1) if var_match else '?'
                # Skip UI config variables
                if var_name in UI_CONFIG_VARS:
                    continue
                prefix = match.group(1)
                suffix = match.group(3)
                replacement = f"{prefix}[]{suffix}"
                start, end = match.start(), match.end()
                new_content = new_content[:start] + replacement + new_content[end:]
                changes.append(f"const → []: {var_name}")
    
    return new_content, changes

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content, changes = find_and_clean_mock_arrays(content, filepath)
    
    if changes and not DRY_RUN:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
    
    return changes

# Main
print(f"{'[DRY RUN] ' if DRY_RUN else ''}Scanning all page.tsx files for mock data...\n")

total_files = 0
total_changes = 0
changed_files = []

for root, dirs, files in os.walk(APP_DIR):
    # Skip excluded directories
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    
    for fname in files:
        if fname != 'page.tsx':
            continue
        
        filepath = os.path.join(root, fname)
        if should_skip(filepath):
            continue
        
        total_files += 1
        changes = process_file(filepath)
        
        if changes:
            rel_path = filepath.replace(APP_DIR + '/', '')
            changed_files.append(rel_path)
            total_changes += len(changes)
            print(f"  {'WOULD FIX' if DRY_RUN else 'FIXED'}: {rel_path}")
            for c in changes:
                print(f"    - {c}")

print(f"\n{'[DRY RUN] ' if DRY_RUN else ''}Results:")
print(f"  Files scanned: {total_files}")
print(f"  Files {'to fix' if DRY_RUN else 'fixed'}: {len(changed_files)}")
print(f"  Mock arrays {'found' if DRY_RUN else 'cleaned'}: {total_changes}")
