#!/usr/bin/env python3
"""Check IA Documental page + recent batches to diagnose failures."""
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
    r = await cdp(ws,"Runtime.evaluate",{"expression":expr,"returnByValue":True,"awaitPromise":True,"timeout":20000})
    return r.get("result",{}).get("value") if r else None

async def nav(ws, url, w=5):
    await cdp(ws,"Page.navigate",{"url":url}); await asyncio.sleep(w)

async def main():
    resp = urllib.request.urlopen(f"{CDP}/json/version")
    browser_ws = json.loads(resp.read())["webSocketDebuggerUrl"]

    async with websockets.connect(browser_ws, max_size=50*1024*1024) as bws:
        ctx = await cdp(bws, "Target.createBrowserContext")
        target = await cdp(bws, "Target.createTarget", {"url":"about:blank","browserContextId":ctx["browserContextId"]})
        target_id = target["targetId"]

    await asyncio.sleep(1)
    tabs = json.loads(urllib.request.urlopen(f"{CDP}/json").read())
    ws_url = next(t for t in tabs if t["id"] == target_id)["webSocketDebuggerUrl"]

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

        # 1. Check all recent batches
        print("="*60)
        print("  BATCHES RECIENTES")
        print("="*60)
        
        batches = await js(ws, """
            (async () => {
                const apis = [
                    '/api/onboarding/documents/upload?action=list',
                    '/api/onboarding/progress',
                ];
                const results = {};
                for (const api of apis) {
                    try {
                        const r = await fetch(api);
                        results[api] = {status: r.status, data: await r.json()};
                    } catch(e) { results[api] = {error: e.message}; }
                }
                return results;
            })()
        """)
        if batches:
            for api, result in batches.items():
                print(f"\n  {api}: HTTP {result.get('status','?')}")
                data = result.get('data')
                if data:
                    print(f"  {json.dumps(data, default=str, ensure_ascii=False)[:500]}")

        # 2. Get the batch from the previous upload
        print("\n" + "="*60)
        print("  BATCH cmmnrox84 (seguro)")
        print("="*60)
        
        batch1 = await js(ws, """
            (async () => {
                const r = await fetch('/api/onboarding/documents/batch/cmmnrox840001now1huyqyi8o');
                return await r.json();
            })()
        """)
        if batch1:
            docs = batch1.get('documents', [])
            for doc in docs:
                print(f"  Doc: {doc.get('originalFilename')} | status={doc.get('status')} | stage={doc.get('processingStage')}")
                print(f"  Error: {doc.get('errorMessage')}")
                print(f"  Category: {doc.get('detectedCategory')} | Analyses: {len(doc.get('analyses',[]))} | Data: {len(doc.get('extractedData',[]))}")

        # 3. Navigate to /onboarding/documents to see the page
        print("\n" + "="*60)
        print("  PÁGINA /onboarding/documents")
        print("="*60)
        
        await nav(ws, f"{BASE}/onboarding/documents", 7)
        
        page = await js(ws, """
            (() => {
                const body = document.body?.innerText || '';
                const h = Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>e.textContent.trim()).slice(0,8);
                const buttons = Array.from(document.querySelectorAll('button')).map(b=>b.textContent.trim()).filter(t=>t.length>0 && t.length<60).slice(0,15);
                const inputs = Array.from(document.querySelectorAll('input[type="file"]')).map(i=>({
                    accept: i.accept, multiple: i.multiple, name: i.name
                }));
                const dropzone = document.querySelector('[class*="dropzone"], [class*="drag"], [class*="upload"]');
                const errors = Array.from(document.querySelectorAll('[role="alert"],.text-destructive')).map(e=>e.textContent.trim().substring(0,150)).filter(t=>t.length>3);
                
                // Find recent batches displayed
                const batchCards = Array.from(document.querySelectorAll('[class*="Card"]')).map(c => {
                    const title = c.querySelector('[class*="CardTitle"],h3,h4')?.textContent?.trim() || '';
                    const desc = c.querySelector('[class*="CardDescription"],p')?.textContent?.trim() || '';
                    const badges = Array.from(c.querySelectorAll('[class*="badge"i]')).map(b=>b.textContent.trim());
                    return {title, desc: desc.substring(0,100), badges};
                }).filter(c => c.title);
                
                return {h, buttons, inputs, hasDropzone: !!dropzone, errors, batchCards: batchCards.slice(0,10), snippet: body.substring(0,800)};
            })()
        """)
        
        if page:
            print(f"  Headings: {page.get('h',[])}")
            print(f"  Buttons: {page.get('buttons',[])}")
            print(f"  File inputs: {page.get('inputs',[])}")
            print(f"  Has dropzone: {page.get('hasDropzone')}")
            if page.get('errors'):
                print(f"  Errors: {page['errors']}")
            if page.get('batchCards'):
                print(f"  Batch cards:")
                for bc in page['batchCards']:
                    print(f"    {bc.get('title')}: {bc.get('desc')} {bc.get('badges')}")
            print(f"\n  Snippet:\n{page.get('snippet','')[:500]}")

        # 4. Check the upload API endpoint
        print("\n" + "="*60)
        print("  CHECK API UPLOAD")
        print("="*60)
        
        api_check = await js(ws, """
            (async () => {
                // Check if upload endpoint exists
                const r = await fetch('/api/onboarding/documents/upload', { method: 'OPTIONS' });
                return {status: r.status, headers: Object.fromEntries(r.headers.entries())};
            })()
        """)
        if api_check:
            print(f"  Upload API: HTTP {api_check.get('status')}")

        # 5. Check env vars (AWS config)
        print("\n" + "="*60)
        print("  CHECK S3 CONFIG")
        print("="*60)
        
        env_check = await js(ws, """
            (async () => {
                const r = await fetch('/api/health');
                const d = await r.json();
                return d;
            })()
        """)
        if env_check:
            print(f"  Health: {json.dumps(env_check, default=str)[:300]}")

        # 6. Check PM2 error logs for document processing
        print("\n" + "="*60)
        print("  ÚLTIMOS LOGS DE ERROR (server)")
        print("="*60)

    print("\n" + "="*60)

if __name__ == "__main__":
    asyncio.run(main())
