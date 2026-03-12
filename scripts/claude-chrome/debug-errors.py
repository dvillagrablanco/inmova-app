#!/usr/bin/env python3
"""Debug the 2 error pages to get exact error messages."""

import asyncio, json, urllib.request
import websockets

CDP = "http://127.0.0.1:9222"
BASE = "https://inmovaapp.com"

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

async def nav(ws, url, w=5):
    await cdp(ws,"Page.navigate",{"url":url}); await asyncio.sleep(w)

async def debug_page(ws, url, name):
    print(f"\n{'='*60}")
    print(f"  DEBUG: {name} -> {url}")
    print(f"{'='*60}")

    # Capture ALL console output
    await js(ws, """
        window.__allLogs=[];window.__allErrors=[];window.__allWarns=[];
        const ol=console.log,oe=console.error,ow=console.warn;
        console.log=function(){window.__allLogs.push(Array.from(arguments).map(a=>typeof a==='object'?JSON.stringify(a).substring(0,300):String(a).substring(0,300)).join(' '));ol.apply(console,arguments)};
        console.error=function(){window.__allErrors.push(Array.from(arguments).map(a=>typeof a==='object'?JSON.stringify(a).substring(0,300):String(a).substring(0,300)).join(' '));oe.apply(console,arguments)};
        console.warn=function(){window.__allWarns.push(Array.from(arguments).map(a=>typeof a==='object'?JSON.stringify(a).substring(0,300):String(a).substring(0,300)).join(' '));ow.apply(console,arguments)};
        window.addEventListener('error', e => window.__allErrors.push('UNCAUGHT: ' + e.message + ' at ' + e.filename + ':' + e.lineno));
        window.addEventListener('unhandledrejection', e => window.__allErrors.push('UNHANDLED_REJECTION: ' + String(e.reason).substring(0,300)));
    """)

    await nav(ws, url, 8)

    # Also intercept fetch errors
    api_results = await js(ws, """
        (async () => {
            // Try fetching the APIs this page uses
            const apis = [
                '/api/tasks',
                '/api/contratos-gestion',
            ];
            const results = {};
            for (const api of apis) {
                if (document.location.href.includes('tareas') && api.includes('tasks') ||
                    document.location.href.includes('contratos-gestion') && api.includes('contratos')) {
                    try {
                        const r = await fetch(api);
                        const text = await r.text();
                        let data;
                        try { data = JSON.parse(text); } catch { data = text.substring(0, 500); }
                        results[api] = {status: r.status, ok: r.ok, data};
                    } catch(e) {
                        results[api] = {error: e.message};
                    }
                }
            }
            return results;
        })()
    """)

    errors = await js(ws, "window.__allErrors || []") or []
    warns = await js(ws, "window.__allWarns || []") or []
    logs = await js(ws, "window.__allLogs || []") or []

    print(f"\n  Console ERRORS ({len(errors)}):")
    for e in errors[:10]:
        print(f"    🔴 {e}")

    if warns:
        print(f"\n  Console WARNS ({len(warns)}):")
        for w in warns[:5]:
            print(f"    🟡 {w}")

    if api_results:
        print(f"\n  API Results:")
        for api, result in api_results.items():
            print(f"    {api}: {json.dumps(result, default=str)[:200]}")

    # Get the error boundary message
    error_msg = await js(ws, """
        (() => {
            const errorEl = document.querySelector('[class*="error"], [role="alert"]');
            const h1 = document.querySelector('h1,h2')?.textContent?.trim();
            const body = document.body?.innerText?.substring(0, 500);
            return {errorEl: errorEl?.textContent?.trim()?.substring(0,200), h1, body};
        })()
    """)
    if error_msg:
        print(f"\n  Page state:")
        print(f"    H1: {error_msg.get('h1')}")
        print(f"    Body: {error_msg.get('body','')[:300]}")

async def main():
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
        print("Login OK")

        await debug_page(ws, f"{BASE}/tareas", "Tareas")
        await debug_page(ws, f"{BASE}/contratos-gestion", "Contratos de Gestión")

if __name__ == "__main__":
    asyncio.run(main())
