#!/usr/bin/env python3
"""
Auditoría PROFUNDA - Inmova App - Grupo Vidaro.
Examina contenido real de cada página, datos, coherencia y páginas adicionales.
"""

import asyncio
import json
import base64
import os
import urllib.request
from datetime import datetime
import websockets

CDP_URL = "http://127.0.0.1:9222"
BASE_URL = "https://inmovaapp.com"
SCREENSHOT_DIR = "/tmp/audit-screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

findings = []
msg_id = 0

def next_id():
    global msg_id
    msg_id += 1
    return msg_id

def finding(sev, page, cat, desc, detail=""):
    findings.append({"severity": sev, "page": page, "category": cat,
                      "description": desc, "detail": detail})
    tag = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🔵"}.get(sev, "⚪")
    print(f"  {tag} [{sev}] {desc}")
    if detail:
        print(f"     -> {detail[:120]}")

async def cdp(ws, method, params=None):
    mid = next_id()
    msg = {"id": mid, "method": method}
    if params:
        msg["params"] = params
    await ws.send(json.dumps(msg))
    while True:
        resp = await asyncio.wait_for(ws.recv(), timeout=30)
        data = json.loads(resp)
        if data.get("id") == mid:
            return data.get("result", {})

async def nav(ws, url, wait=5):
    await cdp(ws, "Page.navigate", {"url": url})
    await asyncio.sleep(wait)

async def js(ws, expr):
    r = await cdp(ws, "Runtime.evaluate",
                  {"expression": expr, "returnByValue": True, "awaitPromise": True, "timeout": 10000})
    return r.get("result", {}).get("value") if r else None

async def shot(ws, name):
    r = await cdp(ws, "Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
    if r and "data" in r:
        p = os.path.join(SCREENSHOT_DIR, f"deep_{name}.png")
        with open(p, "wb") as f:
            f.write(base64.b64decode(r["data"]))

async def login(ws):
    print("LOGIN...")
    await nav(ws, f"{BASE_URL}/login", 4)
    await cdp(ws, "Runtime.evaluate", {"expression": """
        (() => {
            const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            const e = document.querySelector('input[name="email"], input[type="email"]');
            const p = document.querySelector('input[name="password"], input[type="password"]');
            if(e){set.call(e,'admin@inmova.app'); e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));}
            if(p){set.call(p,'Admin123!'); p.dispatchEvent(new Event('input',{bubbles:true})); p.dispatchEvent(new Event('change',{bubbles:true}));}
        })()
    """, "returnByValue": True, "awaitPromise": True})
    await asyncio.sleep(1)
    await cdp(ws, "Runtime.evaluate", {"expression": "document.querySelector('button[type=\"submit\"]')?.click()", "returnByValue": True})
    await asyncio.sleep(8)
    url = await js(ws, "window.location.href")
    ok = "/login" not in (url or "/login")
    print(f"  -> {'OK' if ok else 'FALLO'}: {url}")
    return ok

async def get_full_text(ws):
    return await js(ws, "document.body?.innerText?.substring(0, 5000) || ''") or ""

async def get_console_errors(ws):
    return await js(ws, """
        window.__consoleErrors || []
    """) or []

async def audit_deep_page(ws, url, name):
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"  {url}")
    print(f"{'='*60}")

    await cdp(ws, "Runtime.evaluate", {"expression": """
        window.__consoleErrors = [];
        const origErr = console.error;
        console.error = function() { window.__consoleErrors.push(Array.from(arguments).join(' ').substring(0,200)); origErr.apply(console, arguments); };
    """, "returnByValue": True})

    await nav(ws, url, 6)
    await shot(ws, name.replace("/", "_").replace(" ", "_").lower())

    actual = await js(ws, "window.location.href") or ""
    text = await get_full_text(ws)
    cerrs = await get_console_errors(ws)

    if "/login" in actual and "/login" not in url:
        finding("CRITICAL", name, "acceso", "Redirigido a login - sin sesión", f"De {url} a {actual}")
        return {"redirected": True, "text": ""}

    http_status = await js(ws, """
        (() => {
            const h1 = document.querySelector('h1')?.textContent?.trim() || '';
            if (h1.includes('404') || document.title.includes('404')) return 404;
            if (h1.includes('500') || h1.includes('Error')) return 500;
            return 200;
        })()
    """)
    if http_status == 404:
        finding("HIGH", name, "pagina", "Página retorna 404")
        return {"status": 404, "text": text}
    if http_status == 500:
        finding("CRITICAL", name, "pagina", "Página retorna error 500", text[:200])
        return {"status": 500, "text": text}

    if cerrs:
        for e in cerrs[:3]:
            finding("HIGH", name, "console_error", f"Error consola: {e[:150]}")

    return {"status": 200, "text": text, "url": actual}


async def main():
    print("="*70)
    print("  AUDITORÍA PROFUNDA - GRUPO VIDARO")
    print(f"  {datetime.now().isoformat()}")
    print("="*70)

    resp = urllib.request.urlopen(f"{CDP_URL}/json")
    tabs = json.loads(resp.read())
    pages = [t for t in tabs if t.get("type") == "page"]
    ws_url = pages[0]["webSocketDebuggerUrl"]

    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        await cdp(ws, "Page.enable")
        await cdp(ws, "Runtime.enable")
        await cdp(ws, "Network.enable")
        await cdp(ws, "Emulation.setDeviceMetricsOverride",
                  {"width": 1920, "height": 1080, "deviceScaleFactor": 1, "mobile": False})

        if not await login(ws):
            print("LOGIN FALLÓ")
            return

        # ===== DASHBOARD PRINCIPAL =====
        r = await audit_deep_page(ws, f"{BASE_URL}/dashboard", "Dashboard")
        text = r.get("text", "")

        vidaro_mentions = text.lower().count("vidaro")
        print(f"  Menciones 'Vidaro': {vidaro_mentions}")

        kpis = await js(ws, """
            (() => {
                const items = [];
                document.querySelectorAll('[class*="card"], [class*="Card"]').forEach(card => {
                    const label = card.querySelector('h3, h4, p, span')?.textContent?.trim() || '';
                    const value = card.querySelector('[class*="text-2xl"], [class*="text-3xl"], [class*="font-bold"]')?.textContent?.trim() || '';
                    if (label && value) items.push({label, value});
                });
                return items;
            })()
        """)
        if kpis:
            print(f"  KPIs encontrados: {len(kpis)}")
            for k in kpis[:10]:
                print(f"    - {k.get('label','?')}: {k.get('value','?')}")
        else:
            finding("MEDIUM", "Dashboard", "datos", "No se detectan KPIs con labels+valores")

        # ===== PROPIEDADES =====
        r = await audit_deep_page(ws, f"{BASE_URL}/dashboard/properties", "Propiedades")
        text = r.get("text", "")

        prop_count = await js(ws, """
            document.querySelectorAll('table tbody tr, [data-testid*="property"], [class*="card"]').length
        """)
        print(f"  Elementos propiedad: {prop_count}")

        prop_data = await js(ws, """
            (() => {
                const rows = document.querySelectorAll('table tbody tr');
                return Array.from(rows).slice(0,5).map(r => r.textContent.trim().substring(0,150));
            })()
        """)
        if prop_data:
            for p in prop_data:
                print(f"    - {p[:100]}")

        # ===== INQUILINOS =====
        r = await audit_deep_page(ws, f"{BASE_URL}/dashboard/tenants", "Inquilinos")
        tenant_data = await js(ws, """
            (() => {
                const rows = document.querySelectorAll('table tbody tr');
                return Array.from(rows).slice(0,5).map(r => r.textContent.trim().substring(0,150));
            })()
        """)
        if tenant_data:
            print(f"  Inquilinos: {len(tenant_data)}")
            for t in tenant_data:
                print(f"    - {t[:100]}")
        else:
            finding("MEDIUM", "Inquilinos", "datos", "No se detectan filas de inquilinos en tabla")

        # ===== CONTRATOS =====
        r = await audit_deep_page(ws, f"{BASE_URL}/dashboard/contracts", "Contratos")
        text = r.get("text", "")

        contract_data = await js(ws, """
            (() => {
                const rows = document.querySelectorAll('table tbody tr');
                return Array.from(rows).slice(0,5).map(r => r.textContent.trim().substring(0,200));
            })()
        """)
        if contract_data:
            print(f"  Contratos: {len(contract_data)}")
            for c in contract_data:
                print(f"    - {c[:120]}")

            expired = [c for c in contract_data if "vencid" in c.lower() or "expirad" in c.lower() or "finaliz" in c.lower()]
            if expired:
                finding("HIGH", "Contratos", "datos", f"{len(expired)} contratos posiblemente vencidos", str(expired[:2]))

        # ===== EDIFICIOS =====
        r = await audit_deep_page(ws, f"{BASE_URL}/dashboard/buildings", "Edificios")
        text = r.get("text", "")
        building_el = await js(ws, """
            document.querySelectorAll('table tbody tr, [class*="card"], [class*="Card"], [class*="building"]').length
        """)
        print(f"  Elementos edificio: {building_el}")
        if (building_el or 0) == 0:
            finding("HIGH", "Edificios", "datos", "Página de edificios vacía para Grupo Vidaro",
                     f"Contenido: {text[:200]}")

        # ===== UNIDADES =====
        r = await audit_deep_page(ws, f"{BASE_URL}/dashboard/units", "Unidades")
        text = r.get("text", "")
        units_el = await js(ws, """
            document.querySelectorAll('table tbody tr, [class*="card"], [class*="Card"], [class*="unit"]').length
        """)
        print(f"  Elementos unidad: {units_el}")
        if (units_el or 0) == 0:
            finding("HIGH", "Unidades", "datos", "Página de unidades vacía para Grupo Vidaro",
                     f"Contenido: {text[:200]}")

        # ===== SEGUROS =====
        r = await audit_deep_page(ws, f"{BASE_URL}/dashboard/insurance", "Seguros")
        text = r.get("text", "")
        seg_el = await js(ws, """
            document.querySelectorAll('table tbody tr, [class*="card"], [class*="insurance"], [class*="poliza"]').length
        """)
        print(f"  Elementos seguro: {seg_el}")
        print(f"  Texto (300ch): {text[:300]}")
        if (seg_el or 0) == 0 and "póliza" not in text.lower() and "seguro" not in text.lower():
            finding("HIGH", "Seguros", "datos", "No hay datos de seguros/pólizas visibles",
                     "El Grupo Vidaro tiene pólizas cargadas en S3 pero no aparecen en la UI")

        # ===== PAGOS =====
        r = await audit_deep_page(ws, f"{BASE_URL}/dashboard/payments", "Pagos")
        text = r.get("text", "")
        pay_el = await js(ws, """
            document.querySelectorAll('table tbody tr, [class*="card"], [class*="payment"]').length
        """)
        print(f"  Elementos pago: {pay_el}")
        print(f"  Texto (300ch): {text[:300]}")

        # ===== PÁGINAS INVERSIONES / FAMILY OFFICE (SIDEBAR) =====
        investment_pages = [
            (f"{BASE_URL}/inversiones", "Inversiones Dashboard"),
            (f"{BASE_URL}/inversiones/comparativa", "Comparativa Sociedades"),
            (f"{BASE_URL}/inversiones/comparativa-edificios", "Comparativa Edificios"),
            (f"{BASE_URL}/inversiones/yield", "Yield Tracker"),
            (f"{BASE_URL}/inversiones/mapa", "Mapa Patrimonio"),
            (f"{BASE_URL}/inversiones/benchmark", "Benchmark Mercado"),
            (f"{BASE_URL}/inversiones/distribuciones", "Distribuciones PE"),
            (f"{BASE_URL}/inversiones/pe-import", "Importar PE (MdF)"),
            (f"{BASE_URL}/inversiones/pyl-sociedades", "P&L Sociedades"),
            (f"{BASE_URL}/inversiones/grupo", "Estructura del Grupo"),
            (f"{BASE_URL}/inversiones/activos", "Activos del Grupo"),
            (f"{BASE_URL}/inversiones/hipotecas", "Hipotecas"),
            (f"{BASE_URL}/inversiones/fiscal", "Fiscal Grupo"),
            (f"{BASE_URL}/inversiones/fiscal/modelos", "Modelos Tributarios"),
            (f"{BASE_URL}/inversiones/modelo-720", "Modelo 720"),
            (f"{BASE_URL}/inversiones/fiscal/simulador", "Simulador Fiscal"),
            (f"{BASE_URL}/inversiones/tesoreria", "Tesorería 12m"),
            (f"{BASE_URL}/inversiones/pyl", "P&L Consolidado"),
            (f"{BASE_URL}/inversiones/fianzas", "Fianzas"),
            (f"{BASE_URL}/inversiones/export", "Export Gestoría"),
        ]

        extra_pages = [
            (f"{BASE_URL}/hoy", "Mi Día"),
            (f"{BASE_URL}/dashboard/ejecutivo", "Vista Ejecutiva"),
            (f"{BASE_URL}/alertas", "Alertas"),
            (f"{BASE_URL}/vencimientos", "Vencimientos"),
            (f"{BASE_URL}/proveedores", "Proveedores"),
            (f"{BASE_URL}/incidencias", "Incidencias"),
            (f"{BASE_URL}/tareas", "Tareas"),
            (f"{BASE_URL}/calendario", "Calendario"),
            (f"{BASE_URL}/documentos", "Documentos (nuevo)"),
            (f"{BASE_URL}/plantillas", "Plantillas"),
            (f"{BASE_URL}/firma-digital", "Firma Digital"),
            (f"{BASE_URL}/legal", "Compliance"),
            (f"{BASE_URL}/contratos-gestion", "Contratos de Gestión"),
        ]

        all_extra = investment_pages + extra_pages

        for url, name in all_extra:
            r = await audit_deep_page(ws, url, name)
            text = r.get("text", "")

            if r.get("redirected"):
                continue

            has_data = await js(ws, """
                (() => {
                    const tables = document.querySelectorAll('table tbody tr');
                    const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
                    const charts = document.querySelectorAll('canvas, svg, [class*="chart"], [class*="Chart"], [class*="recharts"]');
                    return {tables: tables.length, cards: cards.length, charts: charts.length};
                })()
            """)
            if has_data:
                print(f"  Datos: tablas={has_data.get('tables',0)}, cards={has_data.get('cards',0)}, gráficos={has_data.get('charts',0)}")

            if text and len(text.strip()) < 100:
                finding("MEDIUM", name, "contenido", "Página con muy poco contenido", text[:100])

            if "error" in text.lower()[:500] or "500" in text[:100]:
                finding("HIGH", name, "error", "Posible error visible en página", text[:200])

            if "próximamente" in text.lower() or "coming soon" in text.lower() or "en desarrollo" in text.lower():
                finding("LOW", name, "estado", "Página marcada como 'en desarrollo' o 'próximamente'")

    # RESUMEN FINAL
    print("\n" + "="*70)
    print("  RESUMEN AUDITORÍA PROFUNDA")
    print("="*70)

    by_sev = {}
    for f in findings:
        by_sev.setdefault(f["severity"], []).append(f)

    total = len(findings)
    print(f"\n  Total hallazgos: {total}")
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        items = by_sev.get(sev, [])
        print(f"    {sev}: {len(items)}")

    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        items = by_sev.get(sev, [])
        if items:
            print(f"\n  --- {sev} ---")
            for f in items:
                print(f"  [{f['page']}] ({f['category']}) {f['description']}")
                if f.get("detail"):
                    print(f"    -> {f['detail'][:150]}")

    report = {"timestamp": datetime.now().isoformat(), "findings": findings}
    with open("/tmp/audit-deep-report.json", "w") as fp:
        json.dump(report, fp, indent=2, ensure_ascii=False)
    print(f"\n  Reporte: /tmp/audit-deep-report.json")
    print(f"  Screenshots: {SCREENSHOT_DIR}/")
    print("="*70)


if __name__ == "__main__":
    asyncio.run(main())
