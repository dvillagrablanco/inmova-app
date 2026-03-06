#!/usr/bin/env python3
"""Explore DiliTrust API — authenticate and list available documents."""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import json

try:
    import requests
except ImportError:
    import subprocess
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'requests'], capture_output=True)
    import requests

BASE_URLS = [
    'https://api-eu2.dilitrust.com/api/v1',
    'https://api-eu2.dilitrust.com',
    'https://api.dilitrust.com/api/v1',
    'https://app.dilitrust.com/api/v1',
]

EMAIL = 'dvillagra@vidaroinversiones.com'
PASSWORD = 'Pucela000000#'

def try_auth(base_url):
    print(f"\n--- Trying {base_url} ---")
    
    # Try different auth endpoints
    auth_endpoints = [
        '/auth/login',
        '/auth/token',
        '/login',
        '/oauth/token',
        '/authenticate',
        '/sessions',
    ]
    
    for endpoint in auth_endpoints:
        url = f"{base_url}{endpoint}"
        
        # Try JSON body
        try:
            r = requests.post(url, json={
                'email': EMAIL, 'password': PASSWORD,
            }, headers={'Content-Type': 'application/json'}, timeout=10)
            print(f"  POST {endpoint} (json email/pwd): {r.status_code}")
            if r.status_code < 400:
                print(f"    Response: {r.text[:500]}")
                return r
            elif r.status_code != 404:
                print(f"    Response: {r.text[:200]}")
        except Exception as e:
            print(f"  POST {endpoint}: Error {str(e)[:80]}")

        # Try with username field
        try:
            r = requests.post(url, json={
                'username': EMAIL, 'password': PASSWORD,
            }, headers={'Content-Type': 'application/json'}, timeout=10)
            print(f"  POST {endpoint} (json username/pwd): {r.status_code}")
            if r.status_code < 400:
                print(f"    Response: {r.text[:500]}")
                return r
            elif r.status_code != 404:
                print(f"    Response: {r.text[:200]}")
        except Exception as e:
            pass

        # Try form-encoded
        try:
            r = requests.post(url, data={
                'email': EMAIL, 'password': PASSWORD,
                'grant_type': 'password',
            }, timeout=10)
            if r.status_code < 400 and r.status_code != 404:
                print(f"  POST {endpoint} (form): {r.status_code}")
                print(f"    Response: {r.text[:500]}")
                return r
        except:
            pass

    # Try Basic Auth on root
    try:
        r = requests.get(base_url, auth=(EMAIL, PASSWORD), timeout=10)
        print(f"  GET / (basic auth): {r.status_code}")
        if r.status_code < 400:
            print(f"    Response: {r.text[:500]}")
            return r
    except Exception as e:
        print(f"  GET / (basic): Error {str(e)[:80]}")
    
    return None

# 1. Check what the API root returns
print("=== EXPLORING DILITRUST API ===\n")

for base in BASE_URLS:
    try:
        r = requests.get(base, timeout=10)
        print(f"GET {base}: {r.status_code}")
        if r.status_code < 500:
            print(f"  {r.text[:300]}")
    except Exception as e:
        print(f"GET {base}: {str(e)[:80]}")

# 2. Try authentication
print("\n=== AUTHENTICATION ===")
for base in BASE_URLS:
    result = try_auth(base)
    if result and result.status_code < 300:
        print(f"\n✅ AUTH SUCCESS on {base}!")
        try:
            token_data = result.json()
            token = token_data.get('token') or token_data.get('access_token') or token_data.get('jwt')
            if token:
                print(f"Token: {str(token)[:50]}...")
                
                # Try to list documents
                headers = {'Authorization': f'Bearer {token}'}
                for path in ['/documents', '/files', '/meetings', '/boards', '/spaces', '/rooms']:
                    try:
                        dr = requests.get(f"{base}{path}", headers=headers, timeout=10)
                        print(f"\n  GET {path}: {dr.status_code}")
                        if dr.status_code < 400:
                            print(f"    {dr.text[:500]}")
                    except:
                        pass
        except:
            pass
        break

print("\nDone.")
