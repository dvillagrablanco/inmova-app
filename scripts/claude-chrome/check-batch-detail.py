#!/usr/bin/env python3
"""Check batch detail via authenticated API."""
import asyncio, json, urllib.request
import websockets

CDP = "http://127.0.0.1:9222"
BASE = "https://inmovaapp.com"
BATCH_ID = "cmmnrox840001now1huyqyi8o"

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

        # Fetch batch data
        data = await js(ws, f"""
            (async () => {{
                const r = await fetch('/api/onboarding/documents/batch/{BATCH_ID}');
                return await r.json();
            }})()
        """)

        print(json.dumps(data, indent=2, default=str, ensure_ascii=False)[:5000])

if __name__ == "__main__":
    asyncio.run(main())
