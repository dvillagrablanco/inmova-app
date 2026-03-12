#!/usr/bin/env python3
"""
Auditoría FINAL con rutas correctas - Inmova App - Grupo Vidaro.
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

def nid():
    global msg_id; msg_id += 1; return msg_id

def finding(sev, page, cat, desc, detail=""):
    findings.append({"severity": sev, "page": page, "category": cat, "description": desc, "detail": detail})
    tag = {"CRITICAL":"🔴","HIGH":"🟠","MEDIUM":"🟡","LOW":"🔵"}.get(sev,"⚪")
    print(f"  {tag} [{sev}] {desc}")
    if detail: print(f"     -> {detail[:150]}")

async def cdp(ws, method, params=None):
    mid = nid()
    await ws.send(json.dumps({"id": mid, "method": method, **({"params": params} if params else {})}))
    while True:
        data = json.loads(await asyncio.wait_for(ws.recv(), timeout=30))
        if data.get("id") == mid: return data.get("result", {})

async def nav(ws, url, wait=6):
    await cdp(ws, "Page.navigate", {"url": url}); await asyncio.sleep(wait)

async def js(ws, expr):
    r = await cdp(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True, "timeout": 15000})
    return r.get("result", {}).get("value") if r else None

async def shot(ws, name):
    r = await cdp(ws, "Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
    if r and "data" in r:
        with open(os.path.join(SCREENSHOT_DIR, f"final_{name}.png"), "wb") as f:
            f.write(base64.b64decode(r["data"]))

async def login(ws):
    await nav(ws, f"{BASE_URL}/login", 4)
    await cdp(ws, "Runtime.evaluate", {"expression": """
        (() => {
            const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            const e = document.querySelector('input[name="email"], input[type="email"]');
            const p = document.querySelector('input[name="password"], input[type="password"]');
            if(e){set.call(e,'admin@inmova.app');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
            if(p){set.call(p,'Admin123!');p.dispatchEvent(new Event('input',{bubbles:true}));p.dispatchEvent(new Event('change',{bubbles:true}));}
        })()
    """, "returnByValue": True})
    await asyncio.sleep(1)
    await cdp(ws, "Runtime.evaluate", {"expression":"document.querySelector('button[type=\"submit\"]')?.click()","returnByValue":True})
    await asyncio.sleep(8)
    url = await js(ws, "window.location.href")
    return "/login" not in (url or "/login")

async def deep_inspect(ws, url, name):
    """Inspección profunda de una página."""
    print(f"\n{'='*60}")
    print(f"  {name} -> {url}")
    print(f"{'='*60}")

    await cdp(ws, "Runtime.evaluate", {"expression": """
        window.__ce=[];const oe=console.error;console.error=function(){window.__ce.push(Array.from(arguments).join(' ').substring(0,200));oe.apply(console,arguments)};
    """, "returnByValue": True})

    await nav(ws, url, 7)
    await shot(ws, name.replace(" ","_").replace("/","_").lower())

    actual = await js(ws, "window.location.href") or ""
    if "/login" in actual and "/login" not in url:
        finding("CRITICAL", name, "sesion", "Redirigido a login")
        return

    is404 = await js(ws, "document.body?.innerText?.includes('404') && document.body?.innerText?.includes('no encontrada')")
    if is404:
        finding("HIGH", name, "ruta", f"Página 404 - No existe", f"URL: {url}")
        return

    is_error = await js(ws, "document.body?.innerText?.includes('Algo salió mal') || document.body?.innerText?.includes('error inesperado')")
    if is_error:
        finding("HIGH", name, "error", "Error en la página ('Algo salió mal')")
        return

    cerrs = await js(ws, "window.__ce") or []
    for e in cerrs[:3]:
        if "chunk" not in e.lower() and "hydrat" not in e.lower():
            finding("HIGH", name, "console", f"Error consola: {e[:120]}")

    # Extraer datos generales
    data = await js(ws, """
        (() => {
            const body = document.body?.innerText || '';
            const h1 = Array.from(document.querySelectorAll('h1,h2')).map(e=>e.textContent.trim()).slice(0,5);
            const tableRows = document.querySelectorAll('table tbody tr, [role="row"]').length;
            const cards = document.querySelectorAll('[class*="CardContent"], [class*="card-content"]').length;
            const allCards = document.querySelectorAll('[class*="card"], [class*="Card"]').length;
            const buttons = document.querySelectorAll('button').length;
            const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea').length;
            const imgs = document.querySelectorAll('img').length;
            const brokenImgs = Array.from(document.querySelectorAll('img')).filter(i=>!i.complete||i.naturalWidth===0).length;
            const badges = Array.from(document.querySelectorAll('[class*="badge"], [class*="Badge"]')).map(b=>b.textContent.trim()).slice(0,10);
            const emptyMsg = body.match(/(no hay|sin datos|no se encontr|vacío|empty|no results|sin resultados)/gi) || [];
            const numbers = body.match(/\\d+[.,]?\\d*\\s*€/g) || [];
            return {h1, tableRows, cards, allCards, buttons, inputs, imgs, brokenImgs, badges, emptyMsg, numbers: numbers.slice(0,15), bodyLen: body.length, bodySnippet: body.substring(0,800)};
        })()
    """)

    if not data:
        finding("HIGH", name, "carga", "No se pudo extraer datos de la página")
        return

    print(f"  Headings: {data.get('h1',[])}") 
    print(f"  Filas tabla: {data.get('tableRows',0)} | Cards: {data.get('cards',0)} ({data.get('allCards',0)} total) | Botones: {data.get('buttons',0)}")
    print(f"  Inputs: {data.get('inputs',0)} | Imgs: {data.get('imgs',0)} (rotas: {data.get('brokenImgs',0)})")
    print(f"  Badges: {data.get('badges',[])}")
    print(f"  Cantidades €: {data.get('numbers',[])}")

    if data.get("emptyMsg"):
        finding("MEDIUM", name, "vacio", f"Mensajes de vacío: {data['emptyMsg']}")

    if data.get("brokenImgs", 0) > 0:
        finding("MEDIUM", name, "imagenes", f"{data['brokenImgs']} imágenes rotas")

    body = data.get("bodySnippet", "")

    return data, body


async def main():
    print("="*70)
    print("  AUDITORÍA FINAL - RUTAS CORRECTAS - GRUPO VIDARO")
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
            print("LOGIN FALLÓ"); return

        # ============================================================
        # RUTAS CORRECTAS - GRUPO VIDARO
        # ============================================================
        pages_audit = [
            # Core
            (f"{BASE_URL}/dashboard", "Dashboard Principal"),
            (f"{BASE_URL}/hoy", "Mi Día"),
            (f"{BASE_URL}/dashboard/ejecutivo", "Vista Ejecutiva"),
            (f"{BASE_URL}/alertas", "Alertas"),
            (f"{BASE_URL}/vencimientos", "Vencimientos"),

            # Gestión Inmobiliaria (rutas reales en español)
            (f"{BASE_URL}/edificios", "Edificios"),
            (f"{BASE_URL}/unidades", "Unidades"),
            (f"{BASE_URL}/dashboard/properties", "Propiedades"),
            (f"{BASE_URL}/inquilinos", "Inquilinos"),
            (f"{BASE_URL}/dashboard/contracts", "Contratos"),
            (f"{BASE_URL}/seguros", "Seguros"),
            (f"{BASE_URL}/pagos", "Pagos"),

            # Operaciones
            (f"{BASE_URL}/proveedores", "Proveedores"),
            (f"{BASE_URL}/incidencias", "Incidencias"),
            (f"{BASE_URL}/tareas", "Tareas"),
            (f"{BASE_URL}/calendario", "Calendario"),
            (f"{BASE_URL}/visitas", "Visitas"),
            (f"{BASE_URL}/check-in-out", "Check-in/Check-out"),
            (f"{BASE_URL}/servicios-limpieza", "Limpieza"),

            # Documentos y Legal
            (f"{BASE_URL}/documentos", "Documentos"),
            (f"{BASE_URL}/plantillas", "Plantillas"),
            (f"{BASE_URL}/firma-digital", "Firma Digital"),
            (f"{BASE_URL}/legal", "Compliance"),
            (f"{BASE_URL}/contratos-gestion", "Contratos de Gestión"),

            # Inversiones / Family Office
            (f"{BASE_URL}/inversiones", "Inversiones Dashboard"),
            (f"{BASE_URL}/inversiones/comparativa", "Comparativa Sociedades"),
            (f"{BASE_URL}/inversiones/comparativa-edificios", "Comparativa Edificios"),
            (f"{BASE_URL}/inversiones/yield", "Yield Tracker"),
            (f"{BASE_URL}/inversiones/mapa", "Mapa Patrimonio"),
            (f"{BASE_URL}/inversiones/benchmark", "Benchmark Mercado"),
            (f"{BASE_URL}/inversiones/distribuciones", "Distribuciones PE"),
            (f"{BASE_URL}/inversiones/pe-import", "Importar PE"),
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
            (f"{BASE_URL}/inversiones/oportunidades", "Oportunidades Inversión"),
            (f"{BASE_URL}/valoracion-ia", "Valoración IA"),

            # Admin
            (f"{BASE_URL}/admin/monitoring", "Admin Monitoring"),
            (f"{BASE_URL}/dashboard/settings", "Configuración"),
            (f"{BASE_URL}/dashboard/profile", "Perfil"),
            (f"{BASE_URL}/dashboard/company", "Empresa"),

            # CRM
            (f"{BASE_URL}/dashboard/crm", "CRM"),
            (f"{BASE_URL}/dashboard/crm/leads", "CRM Leads"),
            (f"{BASE_URL}/dashboard/crm/activities", "CRM Actividades"),
        ]

        results = {}
        for url, name in pages_audit:
            try:
                r = await deep_inspect(ws, url, name)
                if r:
                    results[name] = r[0]
            except Exception as e:
                finding("CRITICAL", name, "error", f"Excepción: {str(e)[:120]}")
                print(f"  ERROR: {e}")

    # ============================================================
    # ANÁLISIS DE COHERENCIA CRUZADA
    # ============================================================
    print(f"\n{'='*70}")
    print("  ANÁLISIS DE COHERENCIA CRUZADA")
    print(f"{'='*70}")

    edificios_cards = results.get("Edificios", {}).get("allCards", 0)
    unidades_cards = results.get("Unidades", {}).get("allCards", 0)
    propiedades_rows = results.get("Propiedades", {}).get("tableRows", 0) + results.get("Propiedades", {}).get("allCards", 0)
    inquilinos_data = results.get("Inquilinos", {}).get("tableRows", 0) + results.get("Inquilinos", {}).get("allCards", 0)
    contratos_data = results.get("Contratos", {}).get("tableRows", 0) + results.get("Contratos", {}).get("allCards", 0)
    seguros_data = results.get("Seguros", {}).get("tableRows", 0) + results.get("Seguros", {}).get("allCards", 0)
    pagos_data = results.get("Pagos", {}).get("tableRows", 0) + results.get("Pagos", {}).get("allCards", 0)

    print(f"\n  Recuento de datos:")
    print(f"    Edificios:    {edificios_cards} cards")
    print(f"    Unidades:     {unidades_cards} cards")
    print(f"    Propiedades:  {propiedades_rows} items")
    print(f"    Inquilinos:   {inquilinos_data} items")
    print(f"    Contratos:    {contratos_data} items")
    print(f"    Seguros:      {seguros_data} items")
    print(f"    Pagos:        {pagos_data} items")

    if edificios_cards > 0 and unidades_cards == 0:
        finding("HIGH", "Coherencia", "datos", f"Hay {edificios_cards} edificios pero 0 unidades - incoherente")

    if propiedades_rows > 0 and inquilinos_data == 0:
        finding("MEDIUM", "Coherencia", "datos", f"Hay {propiedades_rows} propiedades pero 0 inquilinos visible")

    if contratos_data > 0 and pagos_data == 0:
        finding("MEDIUM", "Coherencia", "datos", f"Hay {contratos_data} contratos pero 0 pagos visibles")

    if propiedades_rows > 0 and seguros_data == 0:
        finding("MEDIUM", "Coherencia", "datos", f"Hay {propiedades_rows} propiedades pero 0 seguros - verificar cobertura")

    # RESUMEN FINAL
    print(f"\n{'='*70}")
    print("  RESUMEN FINAL AUDITORÍA - GRUPO VIDARO")
    print(f"{'='*70}")

    by_sev = {}
    for f in findings:
        by_sev.setdefault(f["severity"], []).append(f)

    print(f"\n  Páginas auditadas: {len(pages_audit)}")
    print(f"  Total hallazgos: {len(findings)}")
    for sev in ["CRITICAL","HIGH","MEDIUM","LOW"]:
        print(f"    {sev}: {len(by_sev.get(sev,[]))}")

    for sev in ["CRITICAL","HIGH","MEDIUM","LOW"]:
        items = by_sev.get(sev, [])
        if items:
            print(f"\n  --- {sev} ---")
            for f in items:
                print(f"  [{f['page']}] ({f['category']}) {f['description']}")
                if f.get("detail"):
                    print(f"    -> {f['detail'][:150]}")

    # Guardar reporte
    report = {
        "timestamp": datetime.now().isoformat(),
        "pages_audited": len(pages_audit),
        "total_findings": len(findings),
        "by_severity": {s: len(v) for s, v in by_sev.items()},
        "findings": findings,
        "data_counts": {
            "edificios": edificios_cards, "unidades": unidades_cards,
            "propiedades": propiedades_rows, "inquilinos": inquilinos_data,
            "contratos": contratos_data, "seguros": seguros_data, "pagos": pagos_data
        }
    }
    with open("/tmp/audit-final-report.json", "w") as fp:
        json.dump(report, fp, indent=2, ensure_ascii=False)

    print(f"\n  Reporte: /tmp/audit-final-report.json")
    print(f"  Screenshots: {SCREENSHOT_DIR}/")
    print("="*70)


if __name__ == "__main__":
    asyncio.run(main())
