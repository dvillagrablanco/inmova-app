#!/usr/bin/env python3
"""DiliTrust — discover required params + check error messages."""
import sys, json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import requests

BASE = 'https://api-eu2.dilitrust.com/api/v1'
AUTH = ('dvillagra@vidaroinversiones.com', 'Pucela000000#')
H = {'Accept': 'application/json'}

def get(path):
    r = requests.get(f"{BASE}{path}", auth=AUTH, headers=H, timeout=15)
    return r.status_code, r.text[:500]

# Check error messages for 400 endpoints to find required params
print("=== ERROR DETAILS ===\n")
for ep in ['documents', 'companies', 'contracts', 'instances', 'folders', 'shares']:
    code, text = get(f'/{ep}')
    print(f"/{ep} [{code}]: {text}\n")

# Try with instance param
print("=== TRY WITH INSTANCE PARAMS ===\n")
for inst_id in [1, 2, 3, 'default']:
    code, text = get(f'/instances/{inst_id}')
    print(f"/instances/{inst_id} [{code}]: {text[:200]}")
    if code < 400:
        break

# Documents with various params
print("\n=== DOCUMENTS WITH PARAMS ===\n")
params_to_try = [
    '/documents?instance=1',
    '/documents?instanceId=1',
    '/documents?page=1&limit=5',
    '/documents?offset=0&limit=5',
    '/documents/list',
    '/documents/search',
]
for p in params_to_try:
    code, text = get(p)
    print(f"{p} [{code}]: {text[:200]}")

# Check API docs endpoint
print("\n=== API DOCS ===\n")
for p in ['/docs', '/api-docs', '/swagger', '/openapi', '/doc']:
    code, text = get(p)
    if code < 404:
        print(f"{p} [{code}]: {text[:300]}")

print("\nDone.")
