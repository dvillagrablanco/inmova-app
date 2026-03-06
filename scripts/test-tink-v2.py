#!/usr/bin/env python3
"""Test Tink - fix scopes for provider listing."""
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
    return code, stdout.read().decode('utf-8', errors='ignore').strip(), stderr.read().decode('utf-8', errors='ignore').strip()

_, db_url, _ = run(f'''grep "^DATABASE_URL" {APP}/.env.production | cut -d= -f2-''')

code, out, err = run(f'''cd {APP} && DATABASE_URL="{db_url}" node -e "
require('dotenv').config({{ path: '.env.production' }});
const CID = process.env.TINK_CLIENT_ID;
const CSE = process.env.TINK_CLIENT_SECRET;
const BASE = 'https://api.tink.com';

async function test() {{
  // Try different scopes
  const scopes = [
    'providers:read',
    'providers:read,accounts:read,transactions:read',
    'authorization:read',
  ];
  
  for (const scope of scopes) {{
    console.log('Trying scope:', scope);
    const res = await fetch(BASE + '/api/v1/oauth/token', {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/x-www-form-urlencoded' }},
      body: new URLSearchParams({{
        client_id: CID, client_secret: CSE,
        grant_type: 'client_credentials', scope,
      }}),
    }});
    if (res.ok) {{
      const d = await res.json();
      console.log('  ✅ Token OK for scope:', scope);
      
      // Try providers with this token
      const pRes = await fetch(BASE + '/api/v1/providers/ES', {{
        headers: {{ 'Authorization': 'Bearer ' + d.access_token }},
      }});
      if (pRes.ok) {{
        const providers = await pRes.json();
        const count = Array.isArray(providers) ? providers.length : 0;
        console.log('  ✅ Providers ES:', count);
        
        if (Array.isArray(providers) && count > 0) {{
          // Find bankinter
          const bk = providers.filter(p => JSON.stringify(p).toLowerCase().includes('bankinter'));
          console.log('  Bankinter matches:', bk.length);
          bk.forEach(b => console.log('    -', b.displayName || b.name, '|', b.type, '|', b.status));
          
          // Show first 5
          console.log('  First 5 providers:');
          providers.slice(0,5).forEach(p => console.log('    -', p.displayName || p.name, '|', p.type));
          return;
        }}
      }} else {{
        const e = await pRes.text();
        console.log('  Providers failed:', pRes.status, e.substring(0,150));
      }}
    }} else {{
      const e = await res.text();
      console.log('  ❌ Scope failed:', res.status, e.substring(0,150));
    }}
    console.log();
  }}
  
  // Try Tink V2 API for providers
  console.log('Trying Tink V2 API...');
  const t2Res = await fetch(BASE + '/api/v1/oauth/token', {{
    method: 'POST',
    headers: {{ 'Content-Type': 'application/x-www-form-urlencoded' }},
    body: new URLSearchParams({{
      client_id: CID, client_secret: CSE,
      grant_type: 'client_credentials',
      scope: 'user:create,authorization:grant',
    }}),
  }});
  if (t2Res.ok) {{
    const d = await t2Res.json();
    
    // Create temp user
    console.log('Creating temp user...');
    const uRes = await fetch(BASE + '/api/v1/user/create', {{
      method: 'POST',
      headers: {{
        'Authorization': 'Bearer ' + d.access_token,
        'Content-Type': 'application/json',
      }},
      body: JSON.stringify({{
        external_user_id: 'test_vidaro_' + Date.now(),
        market: 'ES',
        locale: 'es_ES',
      }}),
    }});
    if (uRes.ok) {{
      const user = await uRes.json();
      console.log('  ✅ User created:', user.user_id);
      
      // Generate Tink Link
      const code_res = await fetch(BASE + '/api/v1/oauth/authorization-grant/delegate', {{
        method: 'POST',
        headers: {{
          'Authorization': 'Bearer ' + d.access_token,
          'Content-Type': 'application/x-www-form-urlencoded',
        }},
        body: new URLSearchParams({{
          user_id: user.user_id,
          id_hint: user.user_id,
          scope: 'accounts:read,transactions:read,credentials:write',
        }}),
      }});
      
      if (code_res.ok) {{
        const codeData = await code_res.json();
        const tinkLink = 'https://link.tink.com/1.0/transactions/connect-accounts?client_id=' + CID + '&redirect_uri=https://inmovaapp.com/api/open-banking/tink/callback&market=ES&locale=es_ES&authorization_code=' + codeData.code;
        console.log('  ✅ Tink Link generated!');
        console.log('  URL:', tinkLink);
      }} else {{
        const e = await code_res.text();
        console.log('  Auth grant failed:', code_res.status, e.substring(0,200));
      }}
    }} else {{
      const e = await uRes.text();
      console.log('  User create failed:', uRes.status, e.substring(0,200));
    }}
  }}
}}

test().catch(e => console.log('ERROR:', e.message));
" 2>&1''', t=30)

print(out)
c.close()
