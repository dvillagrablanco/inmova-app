#!/usr/bin/env python3
"""Explore DiliTrust — use basic auth + JSON-LD format."""
import sys, json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import requests

BASE = 'https://api-eu2.dilitrust.com/api/v1'
AUTH = ('dvillagra@vidaroinversiones.com', 'Pucela000000#')
HEADERS = {'Accept': 'application/ld+json'}

def get(path):
    try:
        r = requests.get(f"{BASE}{path}", auth=AUTH, headers=HEADERS, timeout=15)
        if r.status_code < 400:
            try:
                return r.status_code, r.json()
            except:
                return r.status_code, r.text[:300]
        return r.status_code, r.text[:300]
    except Exception as e:
        return 0, str(e)[:100]

# Probe all resource endpoints from the model list
resources = [
    'instances', 'documents', 'folders', 'meetings', 'companies',
    'contracts', 'individuals', 'shares', 'tasks', 'reports',
    'signatures', 'users', 'mandates', 'delegations', 'litigations',
    'transactions', 'costs', 'votes',
]

print("=== PROBING ALL ENDPOINTS (Basic Auth + JSON-LD) ===\n")

found = []
for res in resources:
    code, data = get(f'/{res}')
    status = '✅' if code < 400 else '❌' if code == 404 else '⚠️'
    
    count = '?'
    if isinstance(data, dict):
        count = data.get('hydra:totalItems', data.get('total', len(data.get('hydra:member', data.get('items', [])))))
    elif isinstance(data, list):
        count = len(data)
    
    print(f"  {status} /{res}: {code} (count: {count})")
    
    if code < 400:
        found.append(res)
        if isinstance(data, dict):
            items = data.get('hydra:member', data.get('items', []))
            if isinstance(items, list) and len(items) > 0:
                print(f"     Sample: {json.dumps(items[0], indent=2)[:250]}")

# Also try with page param for 400/500 errors
print("\n=== RETRY WITH PARAMS ===")
for res in ['documents', 'folders', 'instances']:
    code, data = get(f'/{res}?page=1&itemsPerPage=5')
    if code < 400:
        count = data.get('hydra:totalItems', '?') if isinstance(data, dict) else '?'
        print(f"  ✅ /{res}?page=1: {code} (count: {count})")
        if isinstance(data, dict):
            items = data.get('hydra:member', [])
            for item in items[:3]:
                print(f"     {json.dumps(item)[:200]}")
        found.append(res)
    else:
        print(f"  {code} /{res}?page=1: {data[:150] if isinstance(data, str) else ''}")

print(f"\n=== FOUND {len(found)} WORKING ENDPOINTS: {found} ===")
print("\nDone.")
