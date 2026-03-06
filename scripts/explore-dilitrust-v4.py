#!/usr/bin/env python3
"""DiliTrust — correct Accept header."""
import sys, json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import requests

BASE = 'https://api-eu2.dilitrust.com/api/v1'
AUTH = ('dvillagra@vidaroinversiones.com', 'Pucela000000#')
H = {'Accept': 'application/json'}

def get(path):
    r = requests.get(f"{BASE}{path}", auth=AUTH, headers=H, timeout=15)
    try:
        return r.status_code, r.json()
    except:
        return r.status_code, r.text[:300]

# Probe key endpoints
endpoints = ['instances', 'documents', 'folders', 'meetings', 'companies', 
             'contracts', 'users', 'tasks', 'signatures', 'reports', 'shares']

print("=== DILITRUST API (application/json) ===\n")
for ep in endpoints:
    code, data = get(f'/{ep}')
    if code < 400:
        count = len(data) if isinstance(data, list) else data.get('total', data.get('count', '?'))
        print(f"✅ /{ep}: {code} | items: {count}")
        if isinstance(data, list) and len(data) > 0:
            print(f"   First: {json.dumps(data[0])[:250]}")
        elif isinstance(data, dict):
            items = data.get('items', data.get('data', data.get('results', [])))
            if isinstance(items, list) and len(items) > 0:
                print(f"   First: {json.dumps(items[0])[:250]}")
            elif not items:
                # Maybe the dict itself is the data
                keys = list(data.keys())[:10]
                print(f"   Keys: {keys}")
    else:
        print(f"{'❌' if code==404 else '⚠️'} /{ep}: {code}")

# Try getting instance list (Board Portal rooms)
print("\n=== INSTANCES DETAIL ===")
code, data = get('/instances')
if code < 400:
    if isinstance(data, list):
        for inst in data[:10]:
            iid = inst.get('id', '?')
            name = inst.get('name', inst.get('title', '?'))
            print(f"  [{iid}] {name}")
            
            # Try getting documents for this instance
            dcode, ddata = get(f'/instances/{iid}/documents')
            if dcode < 400:
                dcount = len(ddata) if isinstance(ddata, list) else ddata.get('total', '?')
                print(f"    Documents: {dcount}")
                if isinstance(ddata, list):
                    for doc in ddata[:3]:
                        print(f"      {doc.get('name', doc.get('title', json.dumps(doc)[:100]))}")

            # Try folders
            fcode, fdata = get(f'/instances/{iid}/folders')
            if fcode < 400:
                fcount = len(fdata) if isinstance(fdata, list) else fdata.get('total', '?')
                print(f"    Folders: {fcount}")
                if isinstance(fdata, list):
                    for fld in fdata[:5]:
                        print(f"      [{fld.get('id','?')}] {fld.get('name', fld.get('title', '?'))}")

print("\nDone.")
