#!/usr/bin/env python3
"""DiliTrust — get fields schema + try different param formats."""
import sys, json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import requests

BASE = 'https://api-eu2.dilitrust.com/api/v1'
AUTH = ('dvillagra@vidaroinversiones.com', 'Pucela000000#')
H = {'Accept': 'application/json'}

def get(path, params=None, extra_headers=None):
    h = dict(H)
    if extra_headers:
        h.update(extra_headers)
    r = requests.get(f"{BASE}{path}", auth=AUTH, headers=h, params=params, timeout=15)
    try:
        return r.status_code, r.json()
    except:
        return r.status_code, r.text[:400]

# 1. Get available fields
print("=== FIELDS ===")
code, data = get('/fields')
if code < 400:
    if isinstance(data, list):
        print(f"Fields: {len(data)}")
        for f in data[:20]:
            print(f"  {json.dumps(f)[:150]}")
    elif isinstance(data, dict):
        print(f"Keys: {list(data.keys())[:15]}")
        for k, v in list(data.items())[:10]:
            print(f"  {k}: {json.dumps(v)[:100]}")
else:
    print(f"  {code}: {data[:200] if isinstance(data, str) else json.dumps(data)[:200]}")

# 2. OpenAPI — get document endpoint schema
print("\n=== DOCUMENT ENDPOINT PARAMS ===")
code, docs = get('/docs')
if code == 200 and isinstance(docs, dict):
    doc_path = docs.get('paths', {}).get('/api/v1/documents', {})
    if 'get' in doc_path:
        params = doc_path['get'].get('parameters', [])
        print(f"GET /documents parameters ({len(params)}):")
        for p in params:
            print(f"  {p.get('name')} [{p.get('in')}] required={p.get('required', False)} — {p.get('description', '')[:80]}")
    
    # Check companies params
    comp_path = docs.get('paths', {}).get('/api/v1/companies', {})
    if 'get' in comp_path:
        params = comp_path['get'].get('parameters', [])
        print(f"\nGET /companies parameters ({len(params)}):")
        for p in params:
            print(f"  {p.get('name')} [{p.get('in')}] required={p.get('required', False)} — {p.get('description', '')[:80]}")

    # Folders
    fold_path = docs.get('paths', {}).get('/api/v1/folders', {})
    if 'get' in fold_path:
        params = fold_path['get'].get('parameters', [])
        print(f"\nGET /folders parameters ({len(params)}):")
        for p in params:
            print(f"  {p.get('name')} [{p.get('in')}] required={p.get('required', False)} — {p.get('description', '')[:80]}")

    # Instances
    inst_path = docs.get('paths', {}).get('/api/v1/instances', {})
    if 'get' in inst_path:
        params = inst_path['get'].get('parameters', [])
        print(f"\nGET /instances parameters ({len(params)}):")
        for p in params:
            print(f"  {p.get('name')} [{p.get('in')}] required={p.get('required', False)} — {p.get('description', '')[:80]}")

# 3. Try with x-module in CAPS + different values based on docs
print("\n=== INSTANCES WITH MODULE HEADERS ===")
for mod in ['BoardPortal', 'LegalEntityManagement', 'CLM', 'ContractManagement', 'DataRoom', 'LEM', 'BP', 'BOARD_PORTAL', 'LEGAL_ENTITY_MANAGEMENT', 'CONTRACT_MANAGEMENT']:
    code, data = get('/instances', extra_headers={'X-Module': mod})
    if code < 400:
        print(f"✅ X-Module={mod}: {code}")
        print(f"   {json.dumps(data)[:300]}")
        break
    elif code != 500:
        print(f"  X-Module={mod}: {code}")

# 4. Try auth token properly (from OpenAPI)
print("\n=== AUTH TOKEN ===")
r = requests.get(f"{BASE}/auth/token", auth=AUTH, headers=H, timeout=10)
print(f"GET /auth/token: {r.status_code} {r.text[:300]}")

r = requests.post(f"{BASE}/auth/token", auth=AUTH, headers={'Content-Type': 'application/json', 'Accept': 'application/json'}, json={'assertion': 'password'}, timeout=10)
print(f"POST /auth/token: {r.status_code} {r.text[:300]}")

print("\nDone.")
