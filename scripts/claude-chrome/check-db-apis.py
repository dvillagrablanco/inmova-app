#!/usr/bin/env python3
"""
Verificación directa de APIs para comprobar si hay datos en BD.
Login + fetch cada API que alimenta las 10 páginas con 'No hay'.
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
    r = await cdp(ws,"Runtime.evaluate",{"expression":expr,"returnByValue":True,"awaitPromise":True,"timeout":20000})
    return r.get("result",{}).get("value") if r else None

async def nav(ws, url, w=5):
    await cdp(ws,"Page.navigate",{"url":url}); await asyncio.sleep(w)

async def shot(ws, n):
    r = await cdp(ws,"Page.captureScreenshot",{"format":"png","captureBeyondViewport":False})
    if r and "data" in r:
        with open(os.path.join(SHOTS, f"dbcheck_{n}.png"),"wb") as f: f.write(base64.b64decode(r["data"]))

async def fetch_api(ws, api_url, label):
    """Fetch an API from within the authenticated browser session."""
    result = await js(ws, f"""
        (async () => {{
            try {{
                const res = await fetch('{api_url}');
                const status = res.status;
                const ok = res.ok;
                let data;
                const text = await res.text();
                try {{ data = JSON.parse(text); }} catch {{ data = text.substring(0, 500); }}
                return {{status, ok, data, type: typeof data}};
            }} catch(e) {{
                return {{error: e.message}};
            }}
        }})()
    """)
    return result

async def main():
    print("="*70)
    print("  VERIFICACIÓN DATOS BD - APIs PRODUCCIÓN")
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
        await cdp(ws, "Emulation.setDeviceMetricsOverride",
                  {"width":1920,"height":1080,"deviceScaleFactor":1,"mobile":False})

        # Login
        print("\n--- LOGIN ---")
        await nav(ws, f"{BASE}/login", 4)
        await js(ws, """
            (() => {
                const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
                const e=document.querySelector('input[name="email"],input[type="email"]');
                const p=document.querySelector('input[name="password"],input[type="password"]');
                if(e){s.call(e,'admin@inmova.app');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
                if(p){s.call(p,'Admin123!');p.dispatchEvent(new Event('input',{bubbles:true}));p.dispatchEvent(new Event('change',{bubbles:true}));}
            })()
        """)
        await asyncio.sleep(1)
        await js(ws, "document.querySelector('button[type=\"submit\"]')?.click()")
        await asyncio.sleep(8)
        u = await js(ws, "window.location.href")
        if "/login" in (u or "/login"):
            print("  LOGIN FALLÓ"); return
        print(f"  OK -> {u}")

        # ============================================================
        # CHECK EACH API
        # ============================================================

        checks = [
            # 1. Dashboard
            {
                "page": "Dashboard Principal",
                "apis": [
                    ("/api/dashboard", "Dashboard main"),
                    ("/api/dashboard/stats", "Dashboard stats"),
                    ("/api/payments?status=pending&limit=5", "Pagos pendientes"),
                    ("/api/contracts?status=activo&limit=5", "Contratos activos"),
                ],
            },
            # 2. Alertas
            {
                "page": "Alertas",
                "apis": [
                    ("/api/alertas", "Alertas"),
                    ("/api/alerts", "Alerts (alt)"),
                    ("/api/notifications", "Notificaciones"),
                ],
            },
            # 3. Proveedores
            {
                "page": "Proveedores",
                "apis": [
                    ("/api/providers", "Providers"),
                    ("/api/proveedores", "Proveedores (alt)"),
                ],
            },
            # 4. Incidencias
            {
                "page": "Incidencias",
                "apis": [
                    ("/api/incidencias", "Incidencias"),
                    ("/api/maintenance", "Maintenance"),
                    ("/api/maintenance-requests", "MaintenanceRequests"),
                ],
            },
            # 5. Visitas
            {
                "page": "Visitas",
                "apis": [
                    ("/api/visitas", "Visitas"),
                    ("/api/visits", "Visits"),
                ],
            },
            # 6. Limpieza
            {
                "page": "Limpieza",
                "apis": [
                    ("/api/cleaning", "Cleaning"),
                    ("/api/servicios-limpieza", "Limpieza"),
                    ("/api/cleaning-services", "CleaningServices"),
                ],
            },
            # 7. Compliance/Legal
            {
                "page": "Compliance/Legal",
                "apis": [
                    ("/api/legal", "Legal"),
                    ("/api/compliance", "Compliance"),
                    ("/api/legal/documents", "Legal docs"),
                ],
            },
            # 8. Hipotecas
            {
                "page": "Hipotecas",
                "apis": [
                    ("/api/investment/mortgages", "Mortgages investment"),
                    ("/api/mortgages", "Mortgages"),
                    ("/api/hipotecas", "Hipotecas"),
                ],
            },
            # 9. Admin Monitoring
            {
                "page": "Admin Monitoring",
                "apis": [
                    ("/api/admin/monitoring", "Admin monitoring"),
                    ("/api/health", "Health"),
                    ("/api/health/detailed", "Health detailed"),
                ],
            },
            # 10. CRM
            {
                "page": "CRM",
                "apis": [
                    ("/api/crm/leads", "CRM leads"),
                    ("/api/crm/leads?limit=10", "CRM leads limited"),
                    ("/api/crm/activities", "CRM activities"),
                ],
            },
        ]

        results = {}

        for check in checks:
            page = check["page"]
            print(f"\n{'='*60}")
            print(f"  {page}")
            print(f"{'='*60}")

            page_result = {"apis": {}, "diagnosis": ""}
            found_data = False
            found_api = False

            for api_url, label in check["apis"]:
                full_url = f"{BASE}{api_url}"
                r = await fetch_api(ws, full_url, label)

                if not r:
                    print(f"  [{label}] -> NULL response")
                    page_result["apis"][label] = {"status": None, "error": "null response"}
                    continue

                status = r.get("status", "?")
                ok = r.get("ok", False)
                data = r.get("data")
                error = r.get("error")

                if error:
                    print(f"  [{label}] -> ERROR: {error}")
                    page_result["apis"][label] = {"status": "error", "error": error}
                    continue

                # Analyze response
                data_count = 0
                data_summary = ""

                if isinstance(data, list):
                    data_count = len(data)
                    data_summary = f"Array[{data_count}]"
                    if data_count > 0:
                        first = data[0]
                        if isinstance(first, dict):
                            data_summary += f" keys={list(first.keys())[:5]}"
                elif isinstance(data, dict):
                    if "data" in data and isinstance(data["data"], list):
                        data_count = len(data["data"])
                        data_summary = f"{{data: Array[{data_count}]}}"
                        if data_count > 0 and isinstance(data["data"][0], dict):
                            data_summary += f" keys={list(data['data'][0].keys())[:5]}"
                    elif "error" in data:
                        data_summary = f"ERROR: {data['error']}"
                    else:
                        data_keys = list(data.keys())[:8]
                        data_summary = f"Object keys={data_keys}"
                        # Check if any values have data
                        for k, v in data.items():
                            if isinstance(v, list) and len(v) > 0:
                                data_count += len(v)
                            elif isinstance(v, (int, float)) and v > 0:
                                data_count += 1
                elif isinstance(data, str):
                    data_summary = f"String({len(data)}ch): {data[:100]}"
                
                found_api = True
                if data_count > 0:
                    found_data = True

                icon = "✅" if ok and data_count > 0 else "⚠️" if ok else "❌"
                print(f"  {icon} [{label}] HTTP {status} | {data_summary}")

                # Print sample data for debugging
                if data_count > 0 and isinstance(data, (list, dict)):
                    sample = data[:2] if isinstance(data, list) else (data.get("data", [])[:2] if isinstance(data.get("data"), list) else None)
                    if sample:
                        for s in sample:
                            if isinstance(s, dict):
                                compact = {k: str(v)[:40] for k, v in list(s.items())[:6]}
                                print(f"       {compact}")

                page_result["apis"][label] = {"status": status, "ok": ok, "count": data_count, "summary": data_summary}

            # Diagnosis
            if found_data:
                page_result["diagnosis"] = "HAY DATOS EN BD - El 'No hay' de la UI puede ser un fallo de renderizado"
            elif found_api and not found_data:
                page_result["diagnosis"] = "API RESPONDE PERO SIN DATOS - La BD está vacía para esta empresa"
            else:
                page_result["diagnosis"] = "APIs NO ENCONTRADAS O ERROR - Revisar rutas"
            
            print(f"\n  >>> DIAGNÓSTICO: {page_result['diagnosis']}")
            results[page] = page_result

        # ============================================================
        # Also check: exact counts from key tables
        # ============================================================
        print(f"\n{'='*60}")
        print(f"  CONTEO DIRECTO DE TABLAS BD")
        print(f"{'='*60}")

        table_counts = await js(ws, """
            (async () => {
                const apis = [
                    {name: 'Providers', url: '/api/providers'},
                    {name: 'MaintenanceRequests', url: '/api/incidencias'},
                    {name: 'CRM Leads', url: '/api/crm/leads'},
                    {name: 'Contracts (activos)', url: '/api/contracts?status=activo'},
                    {name: 'Payments', url: '/api/payments?limit=5'},
                    {name: 'Buildings', url: '/api/buildings'},
                    {name: 'Units', url: '/api/units?limit=5'},
                    {name: 'Tenants', url: '/api/tenants?limit=5'},
                ];
                const results = {};
                for (const api of apis) {
                    try {
                        const r = await fetch(api.url);
                        const d = await r.json();
                        let count = 0;
                        if (Array.isArray(d)) count = d.length;
                        else if (d.data && Array.isArray(d.data)) count = d.data.length;
                        else if (d.total) count = d.total;
                        else if (d.meta?.total) count = d.meta.total;
                        results[api.name] = {status: r.status, count};
                    } catch(e) {
                        results[api.name] = {error: e.message};
                    }
                }
                return results;
            })()
        """)

        if table_counts:
            for name, info in table_counts.items():
                if info.get("error"):
                    print(f"  ❌ {name}: ERROR - {info['error']}")
                elif info.get("count", 0) > 0:
                    print(f"  ✅ {name}: {info['count']} registros (HTTP {info.get('status')})")
                else:
                    print(f"  ⚠️  {name}: 0 registros (HTTP {info.get('status')})")

        # ============================================================
        # Deep check Dashboard page content
        # ============================================================
        print(f"\n{'='*60}")
        print(f"  DEEP CHECK: Dashboard Principal")
        print(f"{'='*60}")

        await nav(ws, f"{BASE}/dashboard", 7)
        await shot(ws, "dashboard_deep")

        dashboard_deep = await js(ws, """
            (() => {
                const cards = [];
                document.querySelectorAll('[class*="Card"]').forEach(card => {
                    const title = card.querySelector('[class*="CardTitle"], h3, h4, [class*="text-sm"][class*="font-medium"]')?.textContent?.trim() || '';
                    const bigNum = card.querySelector('[class*="text-2xl"], [class*="text-3xl"], [class*="text-4xl"]')?.textContent?.trim() || '';
                    const desc = card.querySelector('[class*="text-xs"], [class*="text-muted"]')?.textContent?.trim() || '';
                    const allText = card.textContent?.trim()?.substring(0, 200);
                    if (title || bigNum) cards.push({title, bigNum, desc, text: allText});
                });
                
                const sections = [];
                document.querySelectorAll('h2, h3').forEach(h => {
                    const next = h.nextElementSibling;
                    const isEmpty = next?.textContent?.includes('Vacío') || next?.textContent?.includes('No hay') || next?.textContent?.includes('Sin datos');
                    sections.push({heading: h.textContent.trim(), hasEmpty: isEmpty || false});
                });
                
                return {cards: cards.slice(0, 15), sections};
            })()
        """)

        if dashboard_deep:
            print(f"  Cards ({len(dashboard_deep.get('cards',[]))}):")
            for c in dashboard_deep.get('cards', []):
                t = c.get('title', '?')
                v = c.get('bigNum', '-')
                d = c.get('desc', '')
                if t or v != '-':
                    print(f"    {t}: {v} ({d})")

            sections = dashboard_deep.get('sections', [])
            if sections:
                print(f"  Sections:")
                for s in sections:
                    icon = "⚠️" if s.get('hasEmpty') else "✅"
                    print(f"    {icon} {s.get('heading')} {'[VACÍO]' if s.get('hasEmpty') else ''}")

        # ============================================================
        # Deep check Admin Monitoring
        # ============================================================
        print(f"\n{'='*60}")
        print(f"  DEEP CHECK: Admin Monitoring")
        print(f"{'='*60}")

        await nav(ws, f"{BASE}/admin/monitoring", 7)
        await shot(ws, "monitoring_deep")

        monitoring_deep = await js(ws, """
            (() => {
                const body = document.body?.innerText?.substring(0, 2000) || '';
                const hasError = body.includes('Algo salió mal') || body.includes('error');
                const hasData = body.includes('System') || body.includes('Memory') || body.includes('uptime');
                const cards = [];
                document.querySelectorAll('[class*="Card"]').forEach(card => {
                    cards.push(card.textContent?.trim()?.substring(0, 100));
                });
                return {hasError, hasData, cards: cards.slice(0, 8), snippet: body.substring(0, 500)};
            })()
        """)
        if monitoring_deep:
            print(f"  Has error: {monitoring_deep.get('hasError')}")
            print(f"  Has data: {monitoring_deep.get('hasData')}")
            print(f"  Cards: {len(monitoring_deep.get('cards',[]))}")
            for c in monitoring_deep.get('cards', [])[:5]:
                print(f"    -> {c}")
            if not monitoring_deep.get('hasData'):
                print(f"  Snippet: {monitoring_deep.get('snippet','')[:300]}")

    # ============================================================
    # FINAL SUMMARY
    # ============================================================
    print(f"\n{'='*70}")
    print(f"  RESUMEN FINAL - DIAGNÓSTICO BD")
    print(f"{'='*70}")

    for page, r in results.items():
        diag = r.get("diagnosis", "?")
        icon = "✅" if "HAY DATOS" in diag else "📭" if "VACÍA" in diag else "❌"
        print(f"  {icon} {page}: {diag}")
        for label, api_info in r.get("apis", {}).items():
            status = api_info.get("status", "?")
            count = api_info.get("count", 0)
            summary = api_info.get("summary", api_info.get("error", ""))
            if count > 0:
                print(f"       ✅ {label}: {count} registros")
            elif status == 200 or api_info.get("ok"):
                print(f"       📭 {label}: 0 registros (API OK)")
            else:
                print(f"       ❌ {label}: HTTP {status} | {summary[:80]}")

    print(f"\n{'='*70}")


if __name__ == "__main__":
    asyncio.run(main())
