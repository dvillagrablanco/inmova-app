// Test DocuSign envelope creation directly on server
// Run: cd /opt/inmova-app && node scripts/test-ds-envelope.js

require('dotenv').config({ path: '.env.production' });
const ds = require('docusign-esign');

async function test() {
  const client = new ds.ApiClient();
  client.setOAuthBasePath('account-d.docusign.com');
  const pk = (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  
  console.log('Integration Key:', process.env.DOCUSIGN_INTEGRATION_KEY ? 'OK' : 'MISSING');
  console.log('User ID:', process.env.DOCUSIGN_USER_ID ? 'OK' : 'MISSING');
  console.log('Account ID:', process.env.DOCUSIGN_ACCOUNT_ID ? 'OK' : 'MISSING');
  console.log('Base Path:', process.env.DOCUSIGN_BASE_PATH);
  console.log('Private Key length:', pk.length);
  
  // Get token
  console.log('\nGetting JWT token...');
  const auth = await client.requestJWTUserToken(
    process.env.DOCUSIGN_INTEGRATION_KEY,
    process.env.DOCUSIGN_USER_ID,
    ['signature', 'impersonation'],
    Buffer.from(pk, 'utf8'),
    3600
  );
  console.log('Token OK:', auth.body.access_token.substring(0, 30) + '...');
  
  // Setup API client
  client.setBasePath(process.env.DOCUSIGN_BASE_PATH);
  client.addDefaultHeader('Authorization', 'Bearer ' + auth.body.access_token);
  
  const envelopesApi = new ds.EnvelopesApi(client);
  
  // Create minimal test PDF (blank page)
  const pdfBase64 = 'JVBERi0xLjAKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSA+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNjMgMDAwMDAgbiAKMDAwMDAwMDEyMCAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDQgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjIwNgolJUVPRg==';
  
  // Build envelope
  const doc = new ds.Document();
  doc.documentBase64 = pdfBase64;
  doc.name = 'Test Contrato Alamo - Inmova';
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
  signHere.xPosition = '200';
  signHere.yPosition = '400';
  
  signer.tabs = new ds.Tabs();
  signer.tabs.signHereTabs = [signHere];
  
  const recipients = new ds.Recipients();
  recipients.signers = [signer];
  
  const envelope = new ds.EnvelopeDefinition();
  envelope.emailSubject = 'Test Firma Contrato Álamo - Inmova (DEMO)';
  envelope.emailBlurb = 'Este es un test de firma digital via DocuSign. Por favor firma el documento.';
  envelope.recipients = recipients;
  envelope.documents = [doc];
  envelope.status = 'sent';
  
  console.log('\nCreating envelope...');
  const result = await envelopesApi.createEnvelope(process.env.DOCUSIGN_ACCOUNT_ID, { envelopeDefinition: envelope });
  
  console.log('\n✅ ENVELOPE CREATED SUCCESSFULLY!');
  console.log('Envelope ID:', result.envelopeId);
  console.log('Status:', result.status);
  console.log('Email will be sent to: dvillagra@vidaroinversiones.com');
  console.log('\nCheck your email in 1-2 minutes.');
}

test().catch(e => {
  console.error('\n❌ ERROR:', e.message);
  if (e.response && e.response.body) {
    console.error('Response:', JSON.stringify(e.response.body, null, 2));
  }
  process.exit(1);
});
