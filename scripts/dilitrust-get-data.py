#!/usr/bin/env python3
"""DiliTrust — get companies, then instances, folders, documents."""
import sys, json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import requests

BASE = 'https://api-eu2.dilitrust.com/api/v1'
AUTH = ('dvillagra@vidaroinversiones.com', 'Pucela000000#')
H = {'Accept': 'application/json'}

def get(path, params=None):
    r = requests.get(f"{BASE}{path}", auth=AUTH, headers=H, params=params, timeout=15)
    try:
        return r.status_code, r.json()
    except:
        return r.status_code, r.text[:400]

# 1. Companies — the 'query' param is the fields to return
print("=== COMPANIES ===")
# Try getting companies with query param listing fields
code, data = get('/companies', params={'query': 'id,name'})
print(f"?query=id,name: {code}")
if code < 400:
    print(json.dumps(data, indent=2)[:500])

# Try JSON fields format
code, data = get('/companies', params={'fields': 'id', 'fields': 'name'})
print(f"?fields: {code}")

# Try without params but different content type
code, data = get('/companies', params={'query': json.dumps({"fields": ["id", "name"]})})
print(f"?query=json: {code}")
if code < 400:
    print(json.dumps(data, indent=2)[:500])

# Try fields as JSON array  
code, data = get('/companies', params={'query': '{"fields":["id","name"]}'})
print(f"?query=json2: {code}")
if code < 400:
    print(json.dumps(data, indent=2)[:500])

# Try simple request to single company
for i in [1, 2, 3, 4, 5]:
    code, data = get(f'/companies/{i}')
    if code < 400:
        print(f"\n✅ Company {i}: {json.dumps(data)[:300]}")
        
        # With this company ID, try instances
        cid = data.get('id', i)
        print(f"\n=== INSTANCES for company {cid} ===")
        icode, idata = get('/instances', params={'companyId': cid})
        print(f"Status: {icode}")
        if icode < 400:
            if isinstance(idata, list):
                for inst in idata[:10]:
                    print(f"  [{inst.get('id')}] {inst.get('name', inst.get('title', '?'))}")
                    
                    # Get folders for this instance
                    fcode, fdata = get('/folders', params={'contentType': 'instance', 'contentId': inst.get('id')})
                    if fcode < 400 and isinstance(fdata, list):
                        print(f"    Folders: {len(fdata)}")
                        for fld in fdata[:5]:
                            print(f"      [{fld.get('id')}] {fld.get('name', '?')}")
                            
                            # Get documents in folder
                            dcode, ddata = get('/documents', params={'contentType': 'folder', 'contentId': fld.get('id')})
                            if dcode < 400 and isinstance(ddata, list):
                                print(f"        Documents: {len(ddata)}")
                                for doc in ddata[:3]:
                                    print(f"          {doc.get('name', doc.get('title', '?'))} ({doc.get('size', '?')} bytes)")
            elif isinstance(idata, dict):
                print(json.dumps(idata)[:300])
        break
    elif code != 404:
        print(f"Company {i}: {code} {json.dumps(data)[:100] if isinstance(data, dict) else data[:100]}")

print("\nDone.")
