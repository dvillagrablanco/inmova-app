#!/usr/bin/env python3
"""Check onboarding review page for insurance PDF parsing issues."""
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
        p = os.path.join(SHOTS, f"onb_{n}.png")
        with open(p,"wb") as f: f.write(base64.b64decode(r["data"]))
        print(f"  [Shot] {p}")

async def main():
    REVIEW_URL = f"{BASE}/onboarding/review?batchId=cmmnrox840001now1huyqyi8o"

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
        print("--- LOGIN ---")
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

        # Navigate to review page
        print(f"\n--- REVIEW PAGE ---")
        print(f"URL: {REVIEW_URL}")

        # Intercept API calls
        await js(ws, """
            window.__apiCalls=[];
            const of=window.fetch;
            window.fetch=async function(...a){
                const url=typeof a[0]==='string'?a[0]:a[0]?.url||'';
                const method=a[1]?.method||'GET';
                const r=await of.apply(this,a);
                if(url.includes('onboarding')||url.includes('batch')||url.includes('ocr')||url.includes('document')){
                    const c=r.clone();
                    try{const d=await c.json();window.__apiCalls.push({url,method,status:r.status,data:JSON.stringify(d).substring(0,2000)});}
                    catch{window.__apiCalls.push({url,method,status:r.status,text:'non-json'});}
                }
                return r;
            };
        """)

        await nav(ws, REVIEW_URL, 8)
        await shot(ws, "01_review_loaded")

        # Get page content
        page_data = await js(ws, """
            (() => {
                const body = document.body?.innerText || '';
                const h = Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>e.textContent.trim()).slice(0,10);
                const cards = document.querySelectorAll('[class*="Card"]').length;
                const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]),select,textarea')).map(i => ({
                    name: i.name||i.id||i.placeholder||i.getAttribute('aria-label')||'',
                    type: i.type||i.tagName.toLowerCase(),
                    value: i.value?.substring(0,100)||'',
                    label: i.closest('div,label')?.querySelector('label')?.textContent?.trim()||''
                }));
                const tables = [];
                document.querySelectorAll('table').forEach(t => {
                    const headers = Array.from(t.querySelectorAll('th')).map(h=>h.textContent.trim());
                    const rows = Array.from(t.querySelectorAll('tbody tr')).map(r =>
                        Array.from(r.querySelectorAll('td')).map(c=>c.textContent.trim().substring(0,80))
                    );
                    tables.push({headers, rows: rows.slice(0,5), rowCount: rows.length});
                });
                const alerts = Array.from(document.querySelectorAll('[role="alert"],.text-destructive,.text-red-500'))
                    .map(e=>e.textContent.trim().substring(0,200)).filter(t=>t.length>3);
                const badges = Array.from(document.querySelectorAll('[class*="badge"i],[class*="Badge"]'))
                    .map(b=>b.textContent.trim()).filter(t=>t.length>0).slice(0,15);
                return {h, cards, inputs, tables, alerts, badges, bodyLen: body.length, snippet: body.substring(0,1500)};
            })()
        """)

        if page_data:
            print(f"\n  Headings: {page_data.get('h',[])}")
            print(f"  Cards: {page_data.get('cards',0)}")
            print(f"  Badges: {page_data.get('badges',[])}")
            if page_data.get('alerts'):
                print(f"  Alerts: {page_data['alerts']}")

            print(f"\n  Inputs ({len(page_data.get('inputs',[]))}):")
            for inp in page_data.get('inputs', []):
                name = inp.get('name','') or inp.get('label','')
                val = inp.get('value','')
                print(f"    [{inp.get('type','')}] {name}: '{val}'")

            if page_data.get('tables'):
                for i, t in enumerate(page_data['tables']):
                    print(f"\n  Table {i+1} ({t.get('rowCount',0)} rows):")
                    print(f"    Headers: {t.get('headers',[])}")
                    for row in t.get('rows',[])[:3]:
                        print(f"    -> {row}")

            print(f"\n  Body snippet:\n{page_data.get('snippet','')[:800]}")

        # Check API calls made
        api_calls = await js(ws, "window.__apiCalls || []")
        if api_calls:
            print(f"\n  API calls ({len(api_calls)}):")
            for call in api_calls:
                print(f"    {call.get('method','')} {call.get('url','')} -> {call.get('status','')}")
                if call.get('data'):
                    data_str = call['data']
                    print(f"    Data: {data_str[:300]}")

        # Scroll down to see all content
        await js(ws, "window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(2)
        await shot(ws, "02_review_scrolled")

        # Extract detected fields specifically
        detected = await js(ws, """
            (() => {
                const fields = {};
                document.querySelectorAll('[class*="field"], [class*="form-group"], [class*="space-y"]').forEach(g => {
                    const label = g.querySelector('label')?.textContent?.trim();
                    const input = g.querySelector('input,select,textarea');
                    const value = input?.value || g.querySelector('[class*="text-sm"]')?.textContent?.trim() || '';
                    if (label && value) fields[label] = value;
                });

                // Also try data attributes
                const dataFields = {};
                document.querySelectorAll('[data-field],[data-key]').forEach(el => {
                    const key = el.getAttribute('data-field') || el.getAttribute('data-key');
                    dataFields[key] = el.textContent.trim().substring(0, 200);
                });

                // Also check for parsed document data displayed as key-value pairs
                const kvPairs = [];
                document.querySelectorAll('dt, [class*="font-medium"], [class*="font-semibold"]').forEach(dt => {
                    const dd = dt.nextElementSibling;
                    if (dd) kvPairs.push({key: dt.textContent.trim(), value: dd.textContent.trim().substring(0, 200)});
                });

                return {fields, dataFields, kvPairs: kvPairs.slice(0, 30)};
            })()
        """)

        if detected:
            if detected.get('fields'):
                print(f"\n  Detected form fields:")
                for k, v in detected['fields'].items():
                    print(f"    {k}: {v}")
            if detected.get('kvPairs'):
                print(f"\n  Key-Value pairs on page:")
                for kv in detected['kvPairs']:
                    print(f"    {kv.get('key','')}: {kv.get('value','')}")

        # Check for the batch data via direct API
        print(f"\n--- BATCH API DATA ---")
        batch_data = await js(ws, """
            (async () => {
                try {
                    const r = await fetch('/api/onboarding/batches/cmmnrox840001now1huyqyi8o');
                    return {status: r.status, data: await r.json()};
                } catch(e) {
                    return {error: e.message};
                }
            })()
        """)
        if batch_data:
            print(f"  Status: {batch_data.get('status')}")
            data = batch_data.get('data')
            if data:
                print(f"  Data: {json.dumps(data, indent=2, default=str, ensure_ascii=False)[:2000]}")

    print("\n" + "="*60)

if __name__ == "__main__":
    asyncio.run(main())
