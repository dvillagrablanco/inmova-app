#!/usr/bin/env python3
"""Test Tink connection and list Bankinter providers."""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)

APP = '/opt/inmova-app'

def run(cmd, t=30):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore').strip()
    err = stderr.read().decode('utf-8', errors='ignore').strip()
    return code, out, err

_, db_url, _ = run(f'''grep "^DATABASE_URL" {APP}/.env.production | cut -d= -f2-''')

# Test Tink auth + list Spanish providers
print("=== TEST TINK CONNECTION ===\n")
code, out, err = run(f'''cd {APP} && DATABASE_URL="{db_url}" node -e "
require('dotenv').config({{ path: '.env.production' }});

const TINK_CLIENT_ID = process.env.TINK_CLIENT_ID;
const TINK_CLIENT_SECRET = process.env.TINK_CLIENT_SECRET;
const BASE_URL = 'https://api.tink.com';

console.log('Client ID:', TINK_CLIENT_ID ? TINK_CLIENT_ID.substring(0,12) + '...' : 'MISSING');
console.log('Client Secret:', TINK_CLIENT_SECRET ? 'OK (' + TINK_CLIENT_SECRET.length + ' chars)' : 'MISSING');
console.log();

async function test() {{
  // 1. Get access token
  console.log('1. Getting access token...');
  const tokenRes = await fetch(BASE_URL + '/api/v1/oauth/token', {{
    method: 'POST',
    headers: {{ 'Content-Type': 'application/x-www-form-urlencoded' }},
    body: new URLSearchParams({{
      client_id: TINK_CLIENT_ID,
      client_secret: TINK_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'authorization:grant,user:create',
    }}),
  }});
  
  if (!tokenRes.ok) {{
    const err = await tokenRes.text();
    console.log('   ❌ Auth failed:', tokenRes.status, err.substring(0, 200));
    return;
  }}
  
  const tokenData = await tokenRes.json();
  console.log('   ✅ Token OK (expires in', tokenData.expires_in, 'seconds)');
  console.log();
  
  // 2. List Spanish providers
  console.log('2. Listing Spanish banks (ES market)...');
  const provRes = await fetch(BASE_URL + '/api/v1/providers/ES', {{
    headers: {{ 'Authorization': 'Bearer ' + tokenData.access_token }},
  }});
  
  if (!provRes.ok) {{
    const err = await provRes.text();
    console.log('   ❌ Providers failed:', provRes.status, err.substring(0, 200));
    return;
  }}
  
  const providers = await provRes.json();
  console.log('   Total providers ES:', Array.isArray(providers) ? providers.length : 'unknown format');
  console.log();
  
  // Find Bankinter
  if (Array.isArray(providers)) {{
    const bankinter = providers.filter(p => 
      p.displayName?.toLowerCase().includes('bankinter') ||
      p.name?.toLowerCase().includes('bankinter') ||
      p.financialInstitutionId?.toLowerCase().includes('bankinter')
    );
    
    if (bankinter.length > 0) {{
      console.log('3. BANKINTER found:');
      bankinter.forEach(b => {{
        console.log('   Provider ID:', b.name || b.id);
        console.log('   Display:', b.displayName);
        console.log('   Type:', b.type);
        console.log('   Status:', b.status);
        console.log('   Capabilities:', JSON.stringify(b.capabilities || []));
        console.log();
      }});
    }} else {{
      console.log('3. Bankinter NOT found in providers list');
      console.log('   Showing first 10 providers:');
      providers.slice(0, 10).forEach(p => {{
        console.log('   -', p.displayName || p.name, '|', p.type, '|', p.status);
      }});
    }}
    
    // Count by status
    const active = providers.filter(p => p.status === 'ENABLED').length;
    const total = providers.length;
    console.log('   Active/Total:', active + '/' + total);
  }}
}}

test().catch(e => console.log('ERROR:', e.message));
" 2>&1''', t=30)

print(out)
if err and 'SyntaxWarning' not in err:
    print(f"\nERR: {err[:300]}")

c.close()
