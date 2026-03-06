#!/usr/bin/env python3
"""Explore DiliTrust API v2 — find correct endpoint format."""
import sys, json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import requests

BASE = 'https://api-eu2.dilitrust.com/api/v1'
AUTH = ('dvillagra@vidaroinversiones.com', 'Pucela000000#')

def get(path, params=None):
    try:
        r = requests.get(f"{BASE}{path}", auth=AUTH, params=params, timeout=15)
        return r.status_code, r.json() if r.status_code < 400 and r.headers.get('content-type','').startswith('application/') else r.text[:400]
    except Exception as e:
        return 0, str(e)[:100]

# 1. Get auth token first (maybe needed for some endpoints)
print("=== AUTH TOKEN ===")
try:
    r = requests.post(f"{BASE}/auth/token", auth=AUTH, json={'email': 'dvillagra@vidaroinversiones.com', 'password': 'Pucela000000#'}, timeout=10)
    print(f"POST /auth/token: {r.status_code} {r.text[:300]}")
except Exception as e:
    print(f"Error: {e}")

# Try getting token via authentication_tokens
print()
r = requests.post(f"{BASE}/authentication_tokens", json={'email': 'dvillagra@vidaroinversiones.com', 'password': 'Pucela000000#'}, headers={'Content-Type': 'application/json'}, timeout=10)
print(f"POST /authentication_tokens: {r.status_code}")
if r.status_code < 400:
    print(f"  {r.text[:500]}")
    try:
        token_data = r.json()
        token = token_data.get('token')
        if token:
            print(f"\n✅ Got token: {token[:50]}...")
            # Use token for further requests
            headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/ld+json'}
            
            # List instances
            print("\n=== INSTANCES ===")
            ir = requests.get(f"{BASE}/instances", headers=headers, timeout=15)
            print(f"GET /instances: {ir.status_code}")
            if ir.status_code < 400:
                idata = ir.json()
                items = idata if isinstance(idata, list) else idata.get('hydra:member', idata.get('items', []))
                print(f"  Count: {len(items) if isinstance(items, list) else '?'}")
                if isinstance(items, list):
                    for inst in items[:10]:
                        print(f"  [{inst.get('id', '?')}] {inst.get('name', inst.get('title', json.dumps(inst)[:100]))}")
            
            # List documents 
            print("\n=== DOCUMENTS ===")
            for p in ['/documents', '/documents?page=1', '/document/list']:
                dr = requests.get(f"{BASE}{p}", headers=headers, timeout=15)
                print(f"GET {p}: {dr.status_code}")
                if dr.status_code < 400:
                    ddata = dr.json()
                    items = ddata if isinstance(ddata, list) else ddata.get('hydra:member', ddata.get('items', []))
                    total = ddata.get('hydra:totalItems', len(items) if isinstance(items, list) else '?')
                    print(f"  Total: {total}")
                    if isinstance(items, list):
                        for d in items[:5]:
                            print(f"    {json.dumps(d, indent=2)[:250]}")
                    break
            
            # Folders
            print("\n=== FOLDERS ===")
            fr = requests.get(f"{BASE}/folders", headers=headers, timeout=15)
            print(f"GET /folders: {fr.status_code}")
            if fr.status_code < 400:
                fdata = fr.json()
                items = fdata if isinstance(fdata, list) else fdata.get('hydra:member', [])
                total = fdata.get('hydra:totalItems', len(items) if isinstance(items, list) else '?')
                print(f"  Total: {total}")
                if isinstance(items, list):
                    for f in items[:10]:
                        print(f"    [{f.get('id', '?')}] {f.get('name', f.get('title', '?'))}")
            
            # Meetings
            print("\n=== MEETINGS ===")
            mr = requests.get(f"{BASE}/meetings", headers=headers, timeout=15)
            print(f"GET /meetings: {mr.status_code}")
            if mr.status_code < 400:
                mdata = mr.json()
                items = mdata if isinstance(mdata, list) else mdata.get('hydra:member', [])
                print(f"  Count: {len(items) if isinstance(items, list) else '?'}")
                if isinstance(items, list):
                    for m in items[:5]:
                        print(f"    {m.get('title', m.get('name', json.dumps(m)[:100]))}")

    except Exception as e:
        print(f"Token parse error: {e}")
else:
    print(f"  {r.text[:300]}")

print("\nDone.")
