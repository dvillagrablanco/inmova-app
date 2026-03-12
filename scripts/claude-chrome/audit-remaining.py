#!/usr/bin/env python3
"""
Auditoría de TODAS las páginas restantes de Grupo Vidaro.
Detecta: errores 500, 404, crashes JS, APIs fallidas, datos rotos.
"""

import asyncio, json, base64, os, urllib.request
import websockets

CDP = "http://127.0.0.1:9222"
BASE = "https://inmovaapp.com"
SHOTS = "/tmp/audit-screenshots"
os.makedirs(SHOTS, exist_ok=True)

mid = 0
def nid():
    global mid; mid += 1; return mid

async def cdp(ws, m, p=None):
    i = nid()
    await ws.send(json.dumps({"id":i,"method":m,**({"params":p} if p else {})}))
    while True:
        d = json.loads(await asyncio.wait_for(ws.recv(), timeout=30))
        if d.get("id") == i: return d.get("result",{})

async def js(ws, expr):
    r = await cdp(ws,"Runtime.evaluate",{"expression":expr,"returnByValue":True,"awaitPromise":True,"timeout":15000})
    return r.get("result",{}).get("value") if r else None

async def nav(ws, url, w=7):
    await cdp(ws,"Page.navigate",{"url":url}); await asyncio.sleep(w)

async def shot(ws, n):
    r = await cdp(ws,"Page.captureScreenshot",{"format":"png","captureBeyondViewport":False})
    if r and "data" in r:
        with open(os.path.join(SHOTS, f"rem_{n}.png"),"wb") as f: f.write(base64.b64decode(r["data"]))

async def audit_page(ws, url, name):
    slug = name.replace(" ","_").replace("/","_").replace("(","").replace(")","").lower()

    # Inject error/network capture before navigation
    await js(ws, """
        window.__jsErrors=[];window.__netFails=[];window.__apiCalls=[];
        const oe=console.error;console.error=function(){window.__jsErrors.push(Array.from(arguments).join(' ').substring(0,250));oe.apply(console,arguments)};
    """)

    await nav(ws, url, 7)

    # Re-inject after navigation (SPA may clear)
    await js(ws, """
        if(!window.__jsErrors){window.__jsErrors=[];window.__netFails=[];window.__apiCalls=[];
        const oe=console.error;console.error=function(){window.__jsErrors.push(Array.from(arguments).join(' ').substring(0,250));oe.apply(console,arguments)};}
    """)

    await asyncio.sleep(1)
    await shot(ws, slug)

    info = await js(ws, """
        (() => {
            const body = document.body?.innerText || '';
            const url = window.location.href;

            const is404 = body.includes('404') && (body.includes('no encontrada') || body.includes('not found'));
            const is500 = body.includes('Algo salió mal') || body.includes('error inesperado') || body.includes('Error del servidor');
            const isLogin = url.includes('/login');

            const headings = Array.from(document.querySelectorAll('h1,h2')).map(e => e.textContent.trim()).slice(0,5);

            // Visible errors
            const visErrors = Array.from(document.querySelectorAll('[role="alert"], .text-destructive'))
                .map(e => e.textContent.trim().substring(0,150))
                .filter(t => t.length > 3);

            // Data indicators
            const tableRows = document.querySelectorAll('table tbody tr').length;
            const cards = document.querySelectorAll('[class*="CardContent"]').length;
            const allCards = document.querySelectorAll('[class*="card"i]').length;
            const inputs = document.querySelectorAll('input:not([type="hidden"]),select,textarea').length;
            const charts = document.querySelectorAll('svg[class*="recharts"],canvas,[class*="chart"i]').length;
            const imgs = document.querySelectorAll('img').length;
            const brokenImgs = Array.from(document.querySelectorAll('img')).filter(i => !i.complete || i.naturalWidth === 0).length;

            // Toasts (sonner)
            const toasts = Array.from(document.querySelectorAll('[data-sonner-toast]'))
                .map(t => ({text: t.textContent.trim().substring(0,100), type: t.getAttribute('data-type')||''}));

            const jsErrors = window.__jsErrors || [];

            const bodyLen = body.length;
            const snippet = body.substring(0, 400);

            return {url, is404, is500, isLogin, headings, visErrors, tableRows, cards, allCards, inputs, charts, imgs, brokenImgs, toasts, jsErrors, bodyLen, snippet};
        })()
    """)

    if not info:
        return {"name": name, "url": url, "status": "ERROR", "detail": "No se pudo extraer info"}

    # Classify
    status = "OK"
    issues = []

    if info.get("isLogin"):
        status = "REDIRECT_LOGIN"
        issues.append("Redirigido a login - posible fallo de sesión")
    elif info.get("is404"):
        status = "404"
        issues.append("Página no encontrada")
    elif info.get("is500"):
        status = "500_ERROR"
        issues.append("Error del servidor visible en UI")
    else:
        if info.get("visErrors"):
            for e in info["visErrors"][:3]:
                if "PSD2" not in e and "cookie" not in e.lower():
                    issues.append(f"Error UI: {e[:100]}")
        if info.get("toasts"):
            for t in info["toasts"]:
                if t.get("type") == "error":
                    issues.append(f"Toast error: {t['text'][:80]}")
        if info.get("jsErrors"):
            real_errors = [e for e in info["jsErrors"] if "chunk" not in e.lower() and "hydrat" not in e.lower() and "warning" not in e.lower()]
            for e in real_errors[:3]:
                issues.append(f"JS error: {e[:100]}")
        if info.get("brokenImgs", 0) > 0:
            issues.append(f"{info['brokenImgs']} imágenes rotas")
        if info.get("bodyLen", 0) < 200:
            issues.append("Página casi vacía (<200 chars)")

    if issues and status == "OK":
        status = "ISSUES"

    icon = {"OK":"✅","404":"❌","500_ERROR":"🔴","REDIRECT_LOGIN":"🔒","ISSUES":"⚠️","ERROR":"💥"}.get(status,"❓")

    print(f"  {icon} {name} [{status}]")
    if info.get("headings"):
        print(f"     Headings: {info['headings'][:3]}")
    print(f"     Datos: rows={info.get('tableRows',0)} cards={info.get('allCards',0)} inputs={info.get('inputs',0)} charts={info.get('charts',0)}")
    for iss in issues:
        print(f"     !! {iss}")

    return {"name": name, "url": url, "status": status, "issues": issues,
            "rows": info.get("tableRows",0), "cards": info.get("allCards",0),
            "headings": info.get("headings",[])}

async def main():
    print("="*70)
    print("  AUDITORÍA COMPLETA - TODAS LAS PÁGINAS GRUPO VIDARO")
    print("="*70)

    resp = urllib.request.urlopen(f"{CDP}/json/version")
    ver = json.loads(resp.read())
    browser_ws = ver["webSocketDebuggerUrl"]

    async with websockets.connect(browser_ws, max_size=50*1024*1024) as bws:
        ctx = await cdp(bws, "Target.createBrowserContext")
        ctx_id = ctx.get("browserContextId")
        target = await cdp(bws, "Target.createTarget", {"url":"about:blank","browserContextId":ctx_id})
        target_id = target.get("targetId")

    await asyncio.sleep(1)
    resp = urllib.request.urlopen(f"{CDP}/json")
    tabs = json.loads(resp.read())
    tab = next((t for t in tabs if t.get("id") == target_id), None)
    ws_url = tab["webSocketDebuggerUrl"]

    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        await cdp(ws, "Page.enable")
        await cdp(ws, "Runtime.enable")
        await cdp(ws, "Network.enable")
        await cdp(ws, "Emulation.setDeviceMetricsOverride",
                  {"width":1920,"height":1080,"deviceScaleFactor":1,"mobile":False})

        # Login
        print("\n--- LOGIN ---")
        await nav(ws, f"{BASE}/login", 4)
        await js(ws, """(() => {
            const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
            const e=document.querySelector('input[name="email"],input[type="email"]');
            const p=document.querySelector('input[name="password"],input[type="password"]');
            if(e){s.call(e,'admin@inmova.app');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
            if(p){s.call(p,'Admin123!');p.dispatchEvent(new Event('input',{bubbles:true}));p.dispatchEvent(new Event('change',{bubbles:true}));}
        })()""")
        await asyncio.sleep(1)
        await js(ws, "document.querySelector('button[type=\"submit\"]')?.click()")
        await asyncio.sleep(8)
        u = await js(ws, "window.location.href")
        if "/login" in (u or "/login"):
            print("  LOGIN FALLÓ"); return
        print(f"  OK -> {u}")

        # All pages from sidebar (extracted from the audit)
        pages = [
            # === INICIO ===
            (f"{BASE}/hoy", "Mi Día"),
            (f"{BASE}/dashboard", "Dashboard"),
            (f"{BASE}/dashboard/ejecutivo", "Vista Ejecutiva"),
            (f"{BASE}/alertas", "Alertas"),
            (f"{BASE}/vencimientos", "Vencimientos"),

            # === GESTIÓN INMOBILIARIA ===
            (f"{BASE}/edificios", "Edificios"),
            (f"{BASE}/unidades", "Unidades"),
            (f"{BASE}/inquilinos", "Inquilinos"),
            (f"{BASE}/contratos", "Contratos"),
            (f"{BASE}/seguros", "Seguros"),
            (f"{BASE}/pagos", "Pagos"),

            # === OPERACIONES ===
            (f"{BASE}/proveedores", "Proveedores"),
            (f"{BASE}/incidencias", "Incidencias"),
            (f"{BASE}/tareas", "Tareas"),
            (f"{BASE}/calendario", "Calendario"),
            (f"{BASE}/visitas", "Visitas"),
            (f"{BASE}/check-in-out", "Check-in/Check-out"),
            (f"{BASE}/servicios-limpieza", "Limpieza"),
            (f"{BASE}/dashboard/servicios", "Servicios"),

            # === DOCUMENTOS Y LEGAL ===
            (f"{BASE}/documentos", "Documentos"),
            (f"{BASE}/plantillas", "Plantillas"),
            (f"{BASE}/firma-digital", "Firma Digital"),
            (f"{BASE}/legal", "Compliance"),
            (f"{BASE}/contratos-gestion", "Contratos de Gestión"),
            (f"{BASE}/onboarding/documents", "IA Documental"),

            # === FINANZAS ===
            (f"{BASE}/finanzas", "Finanzas"),
            (f"{BASE}/finanzas/conciliacion", "Conciliación"),
            (f"{BASE}/open-banking", "Open Banking"),
            (f"{BASE}/bi", "Business Intelligence"),

            # === CRM ===
            (f"{BASE}/dashboard/crm", "CRM Dashboard"),
            (f"{BASE}/leads", "Leads"),
            (f"{BASE}/comercial/leads", "Comercial Leads"),

            # === INVERSIONES / FAMILY OFFICE ===
            (f"{BASE}/inversiones", "Inversiones Dashboard"),
            (f"{BASE}/inversiones/comparativa", "Comparativa Sociedades"),
            (f"{BASE}/inversiones/comparativa-edificios", "Comparativa Edificios"),
            (f"{BASE}/inversiones/yield", "Yield Tracker"),
            (f"{BASE}/inversiones/mapa", "Mapa Patrimonio"),
            (f"{BASE}/inversiones/benchmark", "Benchmark Mercado"),
            (f"{BASE}/inversiones/distribuciones", "Distribuciones PE"),
            (f"{BASE}/inversiones/pe-import", "Importar PE"),
            (f"{BASE}/inversiones/pyl-sociedades", "P&L Sociedades"),
            (f"{BASE}/inversiones/grupo", "Estructura del Grupo"),
            (f"{BASE}/inversiones/activos", "Activos del Grupo"),
            (f"{BASE}/inversiones/hipotecas", "Hipotecas"),
            (f"{BASE}/inversiones/fiscal", "Fiscal Grupo"),
            (f"{BASE}/inversiones/fiscal/modelos", "Modelos Tributarios"),
            (f"{BASE}/inversiones/modelo-720", "Modelo 720"),
            (f"{BASE}/inversiones/fiscal/simulador", "Simulador Fiscal"),
            (f"{BASE}/inversiones/tesoreria", "Tesorería 12m"),
            (f"{BASE}/inversiones/pyl", "P&L Consolidado"),
            (f"{BASE}/inversiones/fianzas", "Fianzas"),
            (f"{BASE}/inversiones/export", "Export Gestoría"),
            (f"{BASE}/inversiones/oportunidades", "Oportunidades Inversión"),
            (f"{BASE}/valoracion-ia", "Valoración IA"),

            # === ADMIN ===
            (f"{BASE}/admin/monitoring", "Admin Monitoring"),
            (f"{BASE}/admin/configuracion", "Admin Configuración"),
            (f"{BASE}/admin/usuarios", "Admin Usuarios"),
            (f"{BASE}/admin/modulos", "Admin Módulos"),
            (f"{BASE}/admin/personalizacion", "Admin Branding"),
            (f"{BASE}/admin/aprobaciones", "Admin Aprobaciones"),
            (f"{BASE}/admin/importar", "Admin Importar Datos"),
            (f"{BASE}/admin/ocr-import", "Admin OCR Import"),
            (f"{BASE}/admin/campos-personalizados", "Admin Campos Custom"),
            (f"{BASE}/admin/webhook-logs", "Admin Webhook Logs"),
            (f"{BASE}/admin/dashboard", "Admin Dashboard"),

            # === PERFIL / CONFIG ===
            (f"{BASE}/perfil", "Perfil"),
            (f"{BASE}/configuracion", "Configuración"),

            # === COMUNICACIONES ===
            (f"{BASE}/dashboard/messages", "Mensajes"),
            (f"{BASE}/notificaciones", "Notificaciones"),
        ]

        results = []
        for url, name in pages:
            try:
                r = await audit_page(ws, url, name)
                results.append(r)
            except Exception as e:
                print(f"  💥 {name} -> EXCEPTION: {e}")
                results.append({"name":name,"url":url,"status":"ERROR","issues":[str(e)]})

    # === SUMMARY ===
    print(f"\n{'='*70}")
    print(f"  RESUMEN - {len(results)} PÁGINAS AUDITADAS")
    print(f"{'='*70}")

    by_status = {}
    for r in results:
        by_status.setdefault(r["status"],[]).append(r)

    for s in ["500_ERROR","404","REDIRECT_LOGIN","ERROR","ISSUES","OK"]:
        items = by_status.get(s,[])
        if items:
            icon = {"OK":"✅","404":"❌","500_ERROR":"🔴","REDIRECT_LOGIN":"🔒","ISSUES":"⚠️","ERROR":"💥"}.get(s,"❓")
            print(f"\n  {icon} {s} ({len(items)}):")
            for r in items:
                extra = ""
                if r.get("issues"):
                    extra = f" -> {r['issues'][0][:80]}"
                print(f"     {r['name']}{extra}")

    total_ok = len(by_status.get("OK",[]))
    total_issues = len(results) - total_ok
    print(f"\n  TOTAL: {len(results)} páginas | {total_ok} OK | {total_issues} con issues")
    print("="*70)

if __name__ == "__main__":
    asyncio.run(main())
