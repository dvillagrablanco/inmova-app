#!/usr/bin/env python3
"""DiliTrust — use OpenAPI docs + x-module header."""
import sys, json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import requests

BASE = 'https://api-eu2.dilitrust.com/api/v1'
AUTH = ('dvillagra@vidaroinversiones.com', 'Pucela000000#')

def get(path, headers=None, params=None):
    h = {'Accept': 'application/json'}
    if headers:
        h.update(headers)
    r = requests.get(f"{BASE}{path}", auth=AUTH, headers=h, params=params, timeout=15)
    try:
        return r.status_code, r.json()
    except:
        return r.status_code, r.text[:400]

# 1. Get OpenAPI paths to find available endpoints
print("=== OPENAPI PATHS ===")
code, docs = get('/docs')
if code == 200 and isinstance(docs, dict):
    paths = docs.get('paths', {})
    print(f"Total paths: {len(paths)}")
    for p in sorted(paths.keys())[:30]:
        methods = list(paths[p].keys())
        print(f"  {', '.join(m.upper() for m in methods)} {p}")
    if len(paths) > 30:
        print(f"  ... and {len(paths) - 30} more")

# 2. Try instances with x-module header
print("\n=== INSTANCES WITH x-module ===")
for module in ['board-portal', 'board_portal', 'bp', 'lem', 'clm', 'governance', 'data-room', 'dataroom']:
    code, data = get('/instances', headers={'x-module': module})
    if code < 400:
        print(f"✅ x-module={module}: {code}")
        if isinstance(data, list):
            print(f"   Instances: {len(data)}")
            for inst in data[:5]:
                print(f"   [{inst.get('id', '?')}] {inst.get('name', inst.get('title', json.dumps(inst)[:100]))}")
        elif isinstance(data, dict):
            print(f"   {json.dumps(data)[:300]}")
        break
    else:
        err = data if isinstance(data, str) else json.dumps(data)[:100]
        print(f"  x-module={module}: {code}")

# 3. Try companies with fields param
print("\n=== COMPANIES ===")
code, data = get('/companies', params={'fields': 'id,name'})
print(f"Status: {code}")
if code < 400:
    items = data if isinstance(data, list) else data.get('items', data.get('data', []))
    print(f"Items: {len(items) if isinstance(items, list) else '?'}")
    if isinstance(items, list):
        for c in items[:5]:
            print(f"  {json.dumps(c)[:150]}")

# 4. Try contracts with fields
print("\n=== CONTRACTS ===")
code, data = get('/contracts', params={'fields': 'id,name,status'})
print(f"Status: {code}")
if code < 400:
    items = data if isinstance(data, list) else data.get('items', data.get('data', []))
    print(f"Items: {len(items) if isinstance(items, list) else '?'}")
    if isinstance(items, list):
        for c in items[:3]:
            print(f"  {json.dumps(c)[:200]}")

print("\nDone.")
