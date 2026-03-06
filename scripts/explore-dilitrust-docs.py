#!/usr/bin/env python3
"""Explore DiliTrust documents and folders."""
import sys, json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import requests

BASE = 'https://api-eu2.dilitrust.com/api/v1'
AUTH = ('dvillagra@vidaroinversiones.com', 'Pucela000000#')

def get(path, params=None):
    r = requests.get(f"{BASE}{path}", auth=AUTH, params=params, timeout=15)
    return r.status_code, r.json() if r.status_code < 400 else r.text[:300]

# 1. List available resources
print("=== RESOURCES ===")
code, data = get('')
if code == 200 and isinstance(data, dict):
    resources = data.get('resourceNameCollection', [])
    print(f"Available models ({len(resources)}):")
    for r in resources:
        name = r.split('\\')[-1]
        print(f"  - {name}")

# 2. Try documents endpoint
print("\n=== DOCUMENTS ===")
for path in ['/documents', '/document', '/Document']:
    code, data = get(path)
    print(f"GET {path}: {code}")
    if code < 400:
        if isinstance(data, list):
            print(f"  Found {len(data)} documents")
            for d in data[:5]:
                print(f"    {json.dumps(d, indent=2)[:200]}")
        elif isinstance(data, dict):
            items = data.get('hydra:member', data.get('items', data.get('data', [])))
            total = data.get('hydra:totalItems', data.get('total', len(items) if isinstance(items, list) else '?'))
            print(f"  Total: {total}")
            if isinstance(items, list):
                for d in items[:3]:
                    print(f"    {json.dumps(d, indent=2)[:300]}")
        break

# 3. Try folders
print("\n=== FOLDERS ===")
for path in ['/folders', '/folder', '/Folder']:
    code, data = get(path)
    print(f"GET {path}: {code}")
    if code < 400:
        if isinstance(data, dict):
            items = data.get('hydra:member', data.get('items', data.get('data', [])))
            total = data.get('hydra:totalItems', data.get('total', '?'))
            print(f"  Total: {total}")
            if isinstance(items, list):
                for f in items[:5]:
                    name = f.get('name', f.get('title', f.get('label', '?')))
                    fid = f.get('id', f.get('@id', '?'))
                    print(f"    [{fid}] {name}")
        break

# 4. Try spaces/rooms (DiliTrust data rooms)
print("\n=== SPACES/ROOMS ===")
for path in ['/spaces', '/rooms', '/instances', '/Instance']:
    code, data = get(path)
    print(f"GET {path}: {code}")
    if code < 400 and isinstance(data, dict):
        items = data.get('hydra:member', data.get('items', []))
        total = data.get('hydra:totalItems', '?')
        print(f"  Total: {total}")
        if isinstance(items, list):
            for s in items[:5]:
                name = s.get('name', s.get('title', '?'))
                sid = s.get('id', s.get('@id', '?'))
                print(f"    [{sid}] {name}")

# 5. Companies
print("\n=== COMPANIES ===")
code, data = get('/companies')
if code >= 400:
    code, data = get('/Company')
print(f"Status: {code}")
if code < 400 and isinstance(data, dict):
    items = data.get('hydra:member', data.get('items', []))
    for c in items[:5]:
        print(f"  {c.get('name', c.get('title', json.dumps(c)[:100]))}")

# 6. Contracts
print("\n=== CONTRACTS ===")
code, data = get('/contracts')
if code >= 400:
    code, data = get('/Contract')
print(f"Status: {code}")
if code < 400 and isinstance(data, dict):
    items = data.get('hydra:member', data.get('items', []))
    total = data.get('hydra:totalItems', '?')
    print(f"  Total: {total}")
    if isinstance(items, list):
        for c in items[:3]:
            print(f"  {json.dumps(c, indent=2)[:200]}")

print("\nDone.")
