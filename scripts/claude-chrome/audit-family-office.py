#!/usr/bin/env python3
"""
Auditoría Family Office - Verificar datos reales de BD en cada página.
Extrae KPIs, tablas, cifras y verifica coherencia.
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
        with open(os.path.join(SHOTS, f"fo_{n}.png"),"wb") as f: f.write(base64.b64decode(r["data"]))

async def extract_page_data(ws, name):
    """Extract all meaningful data from current page."""
    data = await js(ws, """
        (() => {
            const body = document.body?.innerText || '';
            
            // KPIs: cards con valor numérico
            const kpis = [];
            document.querySelectorAll('[class*="Card"]').forEach(card => {
                const title = card.querySelector('[class*="CardTitle"], h3, h4')?.textContent?.trim() || '';
                const valueEl = card.querySelector('[class*="text-2xl"], [class*="text-3xl"], [class*="text-4xl"], [class*="font-bold"]');
                const value = valueEl?.textContent?.trim() || '';
                const desc = card.querySelector('[class*="CardDescription"], [class*="text-muted"], p')?.textContent?.trim() || '';
                if (title && (value || desc)) kpis.push({title, value, desc});
            });
            
            // Tablas
            const tables = [];
            document.querySelectorAll('table').forEach(t => {
                const headers = Array.from(t.querySelectorAll('thead th, thead td')).map(h => h.textContent.trim());
                const rows = Array.from(t.querySelectorAll('tbody tr')).map(r => 
                    Array.from(r.querySelectorAll('td')).map(c => c.textContent.trim().substring(0,60))
                );
                if (headers.length > 0 || rows.length > 0) tables.push({headers, rowCount: rows.length, firstRows: rows.slice(0,3)});
            });
            
            // Cifras €
            const euros = (body.match(/[\\d.,]+\\s*€/g) || []).slice(0, 25);
            
            // Porcentajes
            const pcts = (body.match(/[\\d.,]+\\s*%/g) || []).slice(0, 15);
            
            // Headings
            const h = Array.from(document.querySelectorAll('h1,h2,h3')).map(e => e.textContent.trim()).slice(0,8);
            
            // Gráficos (SVG/Canvas)
            const charts = document.querySelectorAll('svg[class*="recharts"], canvas, [class*="chart"], [class*="Chart"]').length;
            
            // Mensajes vacío/error
            const empty = (body.match(/(no hay|sin datos|vacío|no se encontr|empty|0 resultado)/gi) || []);
            const errors = (body.match(/(error|algo salió mal|500|falló)/gi) || []);
            
            // Nombres de sociedades/empresas mencionadas
            const sociedades = [];
            ['Vidaro', 'Rovida', 'Viroda', 'VIBLA', 'MDF', 'Inmova'].forEach(name => {
                if (body.includes(name)) sociedades.push(name);
            });
            
            // Badges/estados
            const badges = Array.from(document.querySelectorAll('[class*="badge"], [class*="Badge"]'))
                .map(b => b.textContent.trim()).filter(t => t.length > 0 && t.length < 40).slice(0, 10);
            
            return {
                h, kpis: kpis.slice(0,12), tables, euros, pcts, charts, 
                empty, errors, sociedades, badges,
                bodyLen: body.length,
                snippet: body.substring(0, 300)
            };
        })()
    """)
    return data or {}

async def audit_fo_page(ws, url, name):
    """Audit a single Family Office page."""
    print(f"\n{'='*70}")
    print(f"  {name}")
    print(f"  {url}")
    print(f"{'='*70}")
    
    await nav(ws, url, 7)
    await shot(ws, name.replace(" ","_").replace("/","_").lower())
    
    actual = await js(ws, "window.location.href") or ""
    if "/login" in actual:
        print("  !! REDIRIGIDO A LOGIN")
        return None
    
    data = await extract_page_data(ws, name)
    
    # Print analysis
    print(f"  Headings: {data.get('h',[])}") 
    print(f"  Sociedades mencionadas: {data.get('sociedades',[])}")
    
    kpis = data.get('kpis', [])
    if kpis:
        print(f"  KPIs ({len(kpis)}):")
        for k in kpis:
            val = k.get('value','')
            title = k.get('title','')
            if val: print(f"    {title}: {val}")
    
    tables = data.get('tables', [])
    if tables:
        for i, t in enumerate(tables):
            print(f"  Tabla {i+1}: {t.get('rowCount',0)} filas | Headers: {t.get('headers',[])}") 
            for row in t.get('firstRows', [])[:2]:
                print(f"    -> {row}")
    
    euros = data.get('euros', [])
    if euros:
        print(f"  Cifras €: {euros[:10]}")
    
    pcts = data.get('pcts', [])
    if pcts:
        print(f"  Porcentajes: {pcts[:8]}")
    
    if data.get('badges'):
        print(f"  Badges: {data['badges']}")
    
    print(f"  Gráficos: {data.get('charts',0)}")
    
    # Analysis flags
    issues = []
    
    if data.get('errors'):
        issues.append(f"ERRORES visibles: {data['errors']}")
    
    if data.get('empty'):
        issues.append(f"Mensajes vacío: {data['empty']}")
    
    if not kpis and not tables and not euros and data.get('charts', 0) == 0:
        issues.append("Sin datos detectables (ni KPIs, ni tablas, ni cifras)")
    
    # Check for placeholder/fake data patterns
    all_values = ' '.join([k.get('value','') for k in kpis])
    if all_values.count('0') > len(all_values) * 0.5 and len(all_values) > 5:
        issues.append(f"Muchos valores en cero: {all_values[:100]}")
    
    has_real_data = bool(euros) or any(t.get('rowCount',0) > 0 for t in tables) or bool(kpis)
    has_vidaro = 'Vidaro' in data.get('sociedades', [])
    
    if has_real_data and has_vidaro:
        status = "OK - Datos reales de Vidaro"
    elif has_real_data:
        status = "OK - Datos presentes (sin mención explícita Vidaro)"
    elif data.get('charts', 0) > 0:
        status = "PARCIAL - Gráficos sin datos numéricos extraíbles"
    else:
        status = "SIN DATOS"
    
    if issues:
        status += f" | Issues: {len(issues)}"
        for iss in issues:
            print(f"  !! {iss}")
    
    print(f"  >>> ESTADO: {status}")
    return {"name": name, "status": status, "issues": issues, "has_data": has_real_data, 
            "has_vidaro": has_vidaro, "kpi_count": len(kpis), "table_rows": sum(t.get('rowCount',0) for t in tables),
            "euro_count": len(euros), "chart_count": data.get('charts',0)}

async def main():
    print("="*70)
    print("  AUDITORÍA FAMILY OFFICE - DATOS REALES BD")
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
        
        # Family Office pages
        pages = [
            (f"{BASE}/inversiones", "Dashboard Inversiones"),
            (f"{BASE}/inversiones/comparativa", "Comparativa Sociedades"),
            (f"{BASE}/inversiones/comparativa-edificios", "Comparativa Edificios"),
            (f"{BASE}/inversiones/yield", "Yield Tracker"),
            (f"{BASE}/inversiones/mapa", "Mapa Patrimonio"),
            (f"{BASE}/inversiones/benchmark", "Benchmark Mercado"),
            (f"{BASE}/inversiones/distribuciones", "Distribuciones PE"),
            (f"{BASE}/inversiones/pe-import", "Importar PE (MdF)"),
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
            (f"{BASE}/dashboard/ejecutivo", "Vista Ejecutiva"),
        ]
        
        results = []
        for url, name in pages:
            try:
                r = await audit_fo_page(ws, url, name)
                if r: results.append(r)
            except Exception as e:
                print(f"  ERROR: {e}")
                results.append({"name": name, "status": f"ERROR: {e}", "has_data": False})
        
    # SUMMARY
    print(f"\n{'='*70}")
    print(f"  RESUMEN FAMILY OFFICE - DATOS BD")
    print(f"{'='*70}")
    
    ok = [r for r in results if "OK" in r.get("status","")]
    partial = [r for r in results if "PARCIAL" in r.get("status","")]
    no_data = [r for r in results if "SIN DATOS" in r.get("status","")]
    errors = [r for r in results if "ERROR" in r.get("status","")]
    with_issues = [r for r in results if r.get("issues")]
    with_vidaro = [r for r in results if r.get("has_vidaro")]
    
    print(f"\n  Páginas auditadas: {len(results)}")
    print(f"  Con datos reales: {len(ok)} ({len(with_vidaro)} mencionan Vidaro)")
    print(f"  Parciales: {len(partial)}")
    print(f"  Sin datos: {len(no_data)}")
    print(f"  Con errores: {len(errors)}")
    print(f"  Con issues: {len(with_issues)}")
    
    print(f"\n  --- CON DATOS REALES ({len(ok)}) ---")
    for r in ok:
        extra = f" | KPIs:{r.get('kpi_count',0)} Tablas:{r.get('table_rows',0)}filas €:{r.get('euro_count',0)}"
        vidaro = " [Vidaro]" if r.get("has_vidaro") else ""
        print(f"  [OK] {r['name']}{vidaro}{extra}")
    
    if partial:
        print(f"\n  --- PARCIALES ({len(partial)}) ---")
        for r in partial:
            print(f"  [~] {r['name']} | Charts:{r.get('chart_count',0)}")
    
    if no_data:
        print(f"\n  --- SIN DATOS ({len(no_data)}) ---")
        for r in no_data:
            print(f"  [!] {r['name']}")
    
    if with_issues:
        print(f"\n  --- ISSUES ---")
        for r in with_issues:
            for iss in r.get("issues",[]):
                print(f"  [{r['name']}] {iss}")
    
    # Data coherence
    total_euros = sum(r.get("euro_count",0) for r in results)
    total_rows = sum(r.get("table_rows",0) for r in results)
    total_kpis = sum(r.get("kpi_count",0) for r in results)
    
    print(f"\n  --- TOTALES ---")
    print(f"  Cifras € encontradas: {total_euros}")
    print(f"  Filas de tabla: {total_rows}")
    print(f"  KPIs: {total_kpis}")
    
    print("="*70)

if __name__ == "__main__":
    asyncio.run(main())
