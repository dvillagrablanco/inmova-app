#!/usr/bin/env python3
"""Test Tink Link generation with actor_client_id fix."""
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
    return stdout.read().decode('utf-8', errors='ignore').strip()

_, db_url, _ = c.exec_command(f'''grep "^DATABASE_URL" {APP}/.env.production | cut -d= -f2-''', timeout=5)
db_url = db_url.read().decode().strip()

out = run(f'''cd {APP} && DATABASE_URL="{db_url}" node -e "
require('dotenv').config({{ path: '.env.production' }});
const CID = process.env.TINK_CLIENT_ID;
const CSE = process.env.TINK_CLIENT_SECRET;
const BASE = 'https://api.tink.com';

async function test() {{
  // Get client token
  const res = await fetch(BASE + '/api/v1/oauth/token', {{
    method: 'POST',
    headers: {{ 'Content-Type': 'application/x-www-form-urlencoded' }},
    body: new URLSearchParams({{
      client_id: CID, client_secret: CSE,
      grant_type: 'client_credentials',
      scope: 'user:create,authorization:grant',
    }}),
  }});
  const {{ access_token }} = await res.json();
  console.log('Token OK');
  
  // Create user
  const uRes = await fetch(BASE + '/api/v1/user/create', {{
    method: 'POST',
    headers: {{ 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' }},
    body: JSON.stringify({{ external_user_id: 'vidaro_bankinter_' + Date.now(), market: 'ES', locale: 'es_ES' }}),
  }});
  const user = await uRes.json();
  console.log('User:', user.user_id || JSON.stringify(user));
  
  if (!user.user_id) return;
  
  // Delegate auth with actor_client_id
  const dRes = await fetch(BASE + '/api/v1/oauth/authorization-grant/delegate', {{
    method: 'POST',
    headers: {{ 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/x-www-form-urlencoded' }},
    body: new URLSearchParams({{
      user_id: user.user_id,
      id_hint: 'vidaro-bankinter',
      actor_client_id: CID,
      scope: 'accounts:read,transactions:read,credentials:write',
    }}),
  }});
  
  if (dRes.ok) {{
    const dData = await dRes.json();
    console.log('Auth code OK');
    
    const link = 'https://link.tink.com/1.0/transactions/connect-accounts' +
      '?client_id=' + CID +
      '&redirect_uri=' + encodeURIComponent('https://inmovaapp.com/api/open-banking/tink/callback') +
      '&market=ES' +
      '&locale=es_ES' +
      '&authorization_code=' + dData.code;
    
    console.log();
    console.log('=== TINK LINK PARA CONECTAR BANKINTER ===');
    console.log(link);
    console.log();
    console.log('Abre este enlace en el navegador para conectar tu cuenta de Bankinter.');
  }} else {{
    const e = await dRes.text();
    console.log('Delegate failed:', dRes.status, e.substring(0, 300));
  }}
}}

test().catch(e => console.log('ERROR:', e.message));
" 2>&1''', t=30)

print(out)
c.close()
