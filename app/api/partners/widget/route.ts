import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/partners/widget?code=xxx
 * Returns embeddable HTML/JS widget for partner's website
 * The widget shows a contact form that creates referrals automatically
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || 'default';
  const theme = searchParams.get('theme') || 'light';
  const baseUrl = process.env.NEXTAUTH_URL || 'https://inmovaapp.com';

  const widgetHTML = `
<!DOCTYPE html>
<html>
<head><style>
  .inmova-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 400px; margin: 0 auto; }
  .inmova-widget * { box-sizing: border-box; }
  .inmova-widget h3 { margin: 0 0 8px; font-size: 18px; color: ${theme === 'dark' ? '#fff' : '#111'}; }
  .inmova-widget p { margin: 0 0 16px; font-size: 14px; color: ${theme === 'dark' ? '#aaa' : '#666'}; }
  .inmova-widget input, .inmova-widget textarea { width: 100%; padding: 10px 12px; border: 1px solid ${theme === 'dark' ? '#444' : '#ddd'}; border-radius: 6px; font-size: 14px; margin-bottom: 10px; background: ${theme === 'dark' ? '#222' : '#fff'}; color: ${theme === 'dark' ? '#fff' : '#111'}; }
  .inmova-widget button { width: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .inmova-widget button:hover { background: #4338ca; }
  .inmova-widget .powered { text-align: center; margin-top: 12px; font-size: 11px; color: #999; }
  .inmova-widget .success { text-align: center; padding: 30px; color: #16a34a; }
</style></head>
<body>
<div class="inmova-widget" id="inmova-form">
  <h3>Solicita información</h3>
  <p>Te contactaremos sin compromiso</p>
  <input type="text" id="iw-nombre" placeholder="Tu nombre *" required>
  <input type="email" id="iw-email" placeholder="Tu email *" required>
  <input type="tel" id="iw-telefono" placeholder="Teléfono">
  <textarea id="iw-mensaje" rows="2" placeholder="¿En qué te podemos ayudar?"></textarea>
  <button onclick="inmovaSubmit()">Enviar solicitud</button>
  <div class="powered">Powered by <a href="${baseUrl}" target="_blank" style="color:#4f46e5;">INMOVA</a></div>
</div>
<div class="inmova-widget success" id="inmova-success" style="display:none">
  <h3>✅ ¡Enviado!</h3>
  <p>Nos pondremos en contacto contigo pronto.</p>
</div>
<script>
async function inmovaSubmit() {
  const d = { partnerCode: '${code}', nombre: document.getElementById('iw-nombre').value, email: document.getElementById('iw-email').value, telefono: document.getElementById('iw-telefono').value, mensaje: document.getElementById('iw-mensaje').value };
  if (!d.nombre || !d.email) { alert('Nombre y email son obligatorios'); return; }
  try {
    const r = await fetch('${baseUrl}/api/partners/referrals', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(d) });
    if (r.ok) { document.getElementById('inmova-form').style.display='none'; document.getElementById('inmova-success').style.display='block'; }
    else { const e = await r.json(); alert(e.error || 'Error'); }
  } catch(e) { alert('Error de conexión'); }
}
</script>
</body>
</html>`;

  // Also return as embeddable script
  const embedScript = `<script>
(function(){
  var d=document,s=d.createElement('iframe');
  s.src='${baseUrl}/api/partners/widget?code=${code}&theme=${theme}';
  s.style='width:100%;max-width:420px;height:380px;border:none;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.1)';
  s.allow='';
  var t=d.getElementById('inmova-widget-container');
  if(t)t.appendChild(s);
  else d.body.appendChild(s);
})();
</script>`;

  // If requested as script, return embed code
  if (searchParams.get('format') === 'embed') {
    return NextResponse.json({
      success: true,
      embedCode: `<div id="inmova-widget-container"></div>\n${embedScript}`,
      iframeUrl: `${baseUrl}/api/partners/widget?code=${code}&theme=${theme}`,
    });
  }

  // Default: return the widget HTML
  return new NextResponse(widgetHTML, {
    headers: {
      'Content-Type': 'text/html',
      'X-Frame-Options': 'ALLOWALL',
    },
  });
}
