#!/usr/bin/env python3
"""Find all page.tsx files with hardcoded data."""
import re
import os

pages = []
for root, dirs, files in os.walk('app'):
    for f in files:
        if f == 'page.tsx':
            pages.append(os.path.join(root, f))

hardcoded_files = []
for page in sorted(pages):
    with open(page, 'r') as fp:
        content = fp.read()
    
    # Skip files that already fetch from API properly
    uses_api = '/api/' in content and ('fetch(' in content or 'useSWR' in content or 'useQuery' in content)
    
    # Check for hardcoded data patterns
    has_hardcoded = False
    reasons = []
    
    # Pattern 1: useState with hardcoded arrays of 2+ objects
    p1 = re.findall(r'useState\(\[[\s\S]*?\]\)', content)
    for match in p1:
        obj_count = len(re.findall(r'\{', match))
        if obj_count >= 2:
            # Check for real-looking data
            if re.search(r"'[A-Z\u00c0-\u017f][a-z\u00c0-\u017f]+\s+[A-Z\u00c0-\u017f]", match) or \
               re.search(r'"[A-Z\u00c0-\u017f][a-z\u00c0-\u017f]+\s+[A-Z\u00c0-\u017f]', match) or \
               re.search(r"@\w+\.\w+", match) or \
               re.search(r'\+34\s', match):
                has_hardcoded = True
                reasons.append("useState with hardcoded array")
                break
    
    # Pattern 2: const variable = [...] with fake data (not config/enum data)
    const_arrays = re.findall(r'(?:const|let)\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*\[([\s\S]*?)\];', content)
    for var_name, arr_content in const_arrays:
        # Skip config-like arrays (categories, roles, status, etc.)
        skip_names = ['COLORS', 'ROLES', 'CATEGORIES', 'STATUS', 'LEAD_STATUS', 'LEAD_SOURCES', 
                       'levels', 'STEPS', 'steps', 'tabs', 'TABS', 'options', 'OPTIONS', 'faqItems',
                       'documentationSections', 'CATEGORIES', 'menuItems', 'navItems', 'routes',
                       'columns', 'COLUMNS', 'headers', 'HEADERS', 'features', 'FEATURES',
                       'testimonials', 'plans', 'PLANS', 'kpis', 'integrations', 'INTEGRATIONS',
                       'objetivos', 'permisos', 'PERMISOS']
        if var_name in skip_names or var_name.upper() == var_name:
            continue
            
        obj_count = len(re.findall(r'\{', arr_content))
        if obj_count >= 2:
            # Check for Spanish names, emails, phone numbers, addresses
            if re.search(r"['\"](?:Mar[ií]a|Juan|Carlos|Pedro|Ana\s|Jos[eé]|Antonio|Luis|Manuel|Carmen|Laura|Pablo|Miguel|David|Fern|Garc|Lopez|Mart[ií]n|Rodr[ií]guez|Gonz[aá]lez|S[aá]nchez)", arr_content) or \
               re.search(r"['\"][^'\"]*@[^'\"]+\.[^'\"]+['\"]", arr_content) or \
               re.search(r"\+34\s?\d", arr_content) or \
               re.search(r"['\"]C/\s|Calle\s|Avda\.\s|Piso\s", arr_content):
                has_hardcoded = True
                reasons.append(f"const {var_name} with fake data")
    
    # Pattern 3: Inline objects with fake personal data
    inline_data = re.findall(r'const\s+(\w+)\s*=\s*\{[\s\S]*?\};', content)
    for match in inline_data:
        # Get the full match
        idx = content.find(f'const {match} =')
        if idx == -1:
            continue
        # Get the object content (rough)
        bracket_count = 0
        started = False
        end_idx = idx
        for i in range(idx, min(idx + 2000, len(content))):
            if content[i] == '{':
                bracket_count += 1
                started = True
            elif content[i] == '}':
                bracket_count -= 1
            if started and bracket_count == 0:
                end_idx = i + 1
                break
        obj_content = content[idx:end_idx]
        
        if re.search(r"nombre:\s*['\"](?:Mar[ií]a|Juan|Carlos|Pedro|Ana\s|Jos[eé]|Antonio)", obj_content) or \
           re.search(r"email:\s*['\"][^'\"]*@[^'\"]+\.[^'\"]+['\"]", obj_content) or \
           re.search(r"telefono:\s*['\"]", obj_content):
            if match not in ['newCompany', 'formData', 'initialValues']:
                has_hardcoded = True
                reasons.append(f"const {match} with fake personal data")
    
    if has_hardcoded:
        hardcoded_files.append((page, reasons))

print(f"Found {len(hardcoded_files)} files with hardcoded data:\n")
for f, reasons in hardcoded_files:
    print(f"  {f}")
    for r in reasons:
        print(f"    -> {r}")
