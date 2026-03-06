#!/usr/bin/env python3
"""Test DocuSign end-to-end: approve operator request and send envelope."""
import sys, json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(hostname='157.180.119.236', username='root',
          password='hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
          port=22, timeout=30)

def run(cmd, t=60):
    stdin, stdout, stderr = c.exec_command(cmd, timeout=t)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='ignore').strip()

APP = '/opt/inmova-app'

# Get the pending request ID
print("=== 1. Get pending operator request ===")
out = run(f'''cd {APP} && DATABASE_URL="$(grep "^DATABASE_URL" .env.production | cut -d= -f2-)" node -e "
const {{ PrismaClient }} = require('@prisma/client');
const p = new PrismaClient();
p.operatorSignatureRequest.findFirst({{ where: {{ status: 'pending_review' }}, orderBy: {{ createdAt: 'desc' }} }}).then(r => {{
  if (r) console.log(JSON.stringify({{ id: r.id, operator: r.operatorName, status: r.status, documentUrl: r.documentUrl, signatories: r.signatories }}));
  else console.log('NO_PENDING');
  p.$disconnect();
}}).catch(e => {{ console.log('ERR:', e.message); p.$disconnect(); }});
" 2>&1''')
print(out)

if 'NO_PENDING' in out or 'ERR' in out:
    print("No pending requests. Done.")
    c.close()
    sys.exit(0)

req_data = json.loads(out)
req_id = req_data['id']
print(f"\nRequest ID: {req_id}")
print(f"Operator: {req_data['operator']}")
print(f"Document URL: {req_data['documentUrl']}")

# Test: Try to create a DocuSign envelope directly
print("\n=== 2. Test DocuSign envelope creation ===")
out = run(f'''cd {APP} && DATABASE_URL="$(grep "^DATABASE_URL" .env.production | cut -d= -f2-)" node -e "
require('dotenv').config({{ path: '.env.production' }});
const ds = require('docusign-esign');

async function test() {{
  const client = new ds.ApiClient();
  client.setOAuthBasePath('account-d.docusign.com');
  const pk = (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\\\n/g, '\\n');
  
  // Get token
  const auth = await client.requestJWTUserToken(
    process.env.DOCUSIGN_INTEGRATION_KEY,
    process.env.DOCUSIGN_USER_ID,
    ['signature', 'impersonation'],
    Buffer.from(pk, 'utf8'),
    3600
  );
  console.log('Token OK');
  
  client.setBasePath(process.env.DOCUSIGN_BASE_PATH);
  client.addDefaultHeader('Authorization', 'Bearer ' + auth.body.access_token);
  
  const envelopesApi = new ds.EnvelopesApi(client);
  
  // Create a simple test envelope with a minimal PDF
  const doc = new ds.Document();
  // Minimal PDF base64
  const pdfContent = 'JVBERi0xLjAKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSA+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNjMgMDAwMDAgbiAKMDAwMDAwMDEyMCAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDQgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjIwNgolJUVPRg==';
  doc.documentBase64 = pdfContent;
  doc.name = 'Test Contrato Alamo';
  doc.fileExtension = 'pdf';
  doc.documentId = '1';
  
  const signer = new ds.Signer();
  signer.email = 'dvillagra@vidaroinversiones.com';
  signer.name = 'David Villagra';
  signer.recipientId = '1';
  signer.routingOrder = '1';
  const signHere = new ds.SignHere();
  signHere.documentId = '1';
  signHere.pageNumber = '1';
  signHere.xPosition = '100';
  signHere.yPosition = '100';
  signer.tabs = new ds.Tabs();
  signer.tabs.signHereTabs = [signHere];
  
  const recipients = new ds.Recipients();
  recipients.signers = [signer];
  
  const envelope = new ds.EnvelopeDefinition();
  envelope.emailSubject = 'Test Firma Contrato Alamo - Inmova (DEMO)';
  envelope.emailBlurb = 'Test de firma digital via DocuSign demo.';
  envelope.recipients = recipients;
  envelope.documents = [doc];
  envelope.status = 'sent';
  
  const result = await envelopesApi.createEnvelope(process.env.DOCUSIGN_ACCOUNT_ID, {{ envelopeDefinition: envelope }});
  console.log('ENVELOPE CREATED:', result.envelopeId);
  console.log('STATUS:', result.status);
}}

test().catch(e => console.log('ERROR:', e.message));
" 2>&1''', t=30)
print(out)

c.close()
print("\nDone.")
