#!/usr/bin/env python3
"""
Test visual: Open Banking PSD2 Connection Wizard
Uses CDP Input.dispatchMouseEvent for proper Radix UI interaction.
"""

import asyncio, json, base64, os, urllib.request
import websockets

CDP_URL = "http://127.0.0.1:9222"
BASE_URL = "https://inmovaapp.com"
SHOTS = "/tmp/audit-screenshots"
os.makedirs(SHOTS, exist_ok=True)

msg_id = 0
def nid():
    global msg_id; msg_id += 1; return msg_id

async def cdp(ws, method, params=None):
    mid = nid()
    await ws.send(json.dumps({"id": mid, "method": method, **({"params": params} if params else {})}))
    while True:
        data = json.loads(await asyncio.wait_for(ws.recv(), timeout=30))
        if data.get("id") == mid: return data.get("result", {})

async def js(ws, expr):
    r = await cdp(ws, "Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True, "timeout": 15000})
    return r.get("result", {}).get("value") if r else None

async def nav(ws, url, wait=5):
    await cdp(ws, "Page.navigate", {"url": url}); await asyncio.sleep(wait)

async def shot(ws, name):
    r = await cdp(ws, "Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
    if r and "data" in r:
        p = os.path.join(SHOTS, f"ob_{name}.png")
        with open(p, "wb") as f: f.write(base64.b64decode(r["data"]))
        print(f"  [Shot] {p}")


async def real_click(ws, x, y):
    """Simulate real mouse click via CDP Input events."""
    for event_type in ["mousePressed", "mouseReleased"]:
        await cdp(ws, "Input.dispatchMouseEvent", {
            "type": event_type,
            "x": x, "y": y,
            "button": "left",
            "clickCount": 1
        })
    await asyncio.sleep(0.3)


async def click_element(ws, selector, index=0):
    """Get element position and real-click it."""
    pos = await js(ws, f"""
        (() => {{
            const els = document.querySelectorAll('{selector}');
            if (els.length <= {index}) return null;
            const el = els[{index}];
            el.scrollIntoView({{block: 'center'}});
            const rect = el.getBoundingClientRect();
            return {{x: rect.x + rect.width/2, y: rect.y + rect.height/2, text: el.textContent?.trim()?.substring(0,60)}};
        }})()
    """)
    if not pos:
        print(f"  Element not found: {selector}[{index}]")
        return False
    print(f"  Clicking ({pos['x']:.0f}, {pos['y']:.0f}): '{pos.get('text','')}'")
    await real_click(ws, pos["x"], pos["y"])
    return True


async def select_radix_option(ws, trigger_selector, trigger_index, option_text):
    """Open Radix Select and pick an option using real mouse events."""
    print(f"\n  --- Select: {option_text} ---")

    # Click trigger with real mouse event
    ok = await click_element(ws, trigger_selector, trigger_index)
    if not ok:
        return False
    await asyncio.sleep(1)

    # Wait for portal content to render
    for attempt in range(5):
        count = await js(ws, "document.querySelectorAll('[role=\"option\"]').length")
        if count and count > 0:
            break
        await asyncio.sleep(0.5)

    # List options
    options = await js(ws, """
        Array.from(document.querySelectorAll('[role="option"]'))
            .map(i => ({text: i.textContent.trim(), idx: Array.from(i.parentElement.children).indexOf(i)}))
    """)
    print(f"  Options ({len(options or [])}):")
    if options:
        for o in options:
            print(f"    - '{o.get('text')}'")

    # Find and click the target option with real mouse event
    target = option_text.lower()
    pos = await js(ws, f"""
        (() => {{
            const items = document.querySelectorAll('[role="option"]');
            for (const item of items) {{
                if (item.textContent.trim().toLowerCase().includes('{target}')) {{
                    item.scrollIntoView({{block: 'center'}});
                    const rect = item.getBoundingClientRect();
                    return {{x: rect.x + rect.width/2, y: rect.y + rect.height/2, text: item.textContent.trim()}};
                }}
            }}
            return null;
        }})()
    """)

    if pos:
        print(f"  Selecting ({pos['x']:.0f}, {pos['y']:.0f}): '{pos['text']}'")
        await real_click(ws, pos["x"], pos["y"])
        await asyncio.sleep(0.5)
        return True
    else:
        print(f"  '{option_text}' NOT FOUND in options")
        return False


async def click_button_text(ws, text):
    """Click button by text using real mouse event."""
    target = text.lower()
    pos = await js(ws, f"""
        (() => {{
            const buttons = document.querySelectorAll('button');
            for (const btn of buttons) {{
                const t = btn.textContent.trim().toLowerCase();
                if (t.includes('{target}') && !btn.disabled) {{
                    btn.scrollIntoView({{block: 'center'}});
                    const rect = btn.getBoundingClientRect();
                    return {{x: rect.x + rect.width/2, y: rect.y + rect.height/2, text: btn.textContent.trim(), disabled: false}};
                }}
                if (t.includes('{target}') && btn.disabled) {{
                    return {{disabled: true, text: btn.textContent.trim()}};
                }}
            }}
            return null;
        }})()
    """)
    if not pos:
        print(f"  Button '{text}' not found")
        return False
    if pos.get("disabled"):
        print(f"  Button DISABLED: '{pos['text']}'")
        return False
    print(f"  Clicking button ({pos['x']:.0f}, {pos['y']:.0f}): '{pos['text']}'")
    await real_click(ws, pos["x"], pos["y"])
    return True


async def main():
    print("="*60)
    print("  TEST OPEN BANKING - PSD2 WIZARD")
    print("="*60)

    resp = urllib.request.urlopen(f"{CDP_URL}/json/version")
    ver = json.loads(resp.read())
    browser_ws = ver["webSocketDebuggerUrl"]

    async with websockets.connect(browser_ws, max_size=50*1024*1024) as bws:
        ctx = await cdp(bws, "Target.createBrowserContext")
        ctx_id = ctx.get("browserContextId")
        target = await cdp(bws, "Target.createTarget", {"url": "about:blank", "browserContextId": ctx_id})
        target_id = target.get("targetId")

    await asyncio.sleep(1)
    resp = urllib.request.urlopen(f"{CDP_URL}/json")
    tabs = json.loads(resp.read())
    tab = next((t for t in tabs if t.get("id") == target_id), None)
    ws_url = tab["webSocketDebuggerUrl"]

    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        await cdp(ws, "Page.enable")
        await cdp(ws, "Runtime.enable")
        await cdp(ws, "Network.enable")
        await cdp(ws, "Emulation.setDeviceMetricsOverride",
                  {"width": 1920, "height": 1080, "deviceScaleFactor": 1, "mobile": False})

        # ===== LOGIN =====
        print("\n[1] LOGIN")
        await nav(ws, f"{BASE_URL}/login", 4)
        await js(ws, """
            (() => {
                const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                const e = document.querySelector('input[name="email"], input[type="email"]');
                const p = document.querySelector('input[name="password"], input[type="password"]');
                if(e){set.call(e,'admin@inmova.app');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
                if(p){set.call(p,'Admin123!');p.dispatchEvent(new Event('input',{bubbles:true}));p.dispatchEvent(new Event('change',{bubbles:true}));}
            })()
        """)
        await asyncio.sleep(1)
        await click_element(ws, 'button[type="submit"]')
        await asyncio.sleep(8)
        url = await js(ws, "window.location.href")
        if "/login" in (url or "/login"):
            print("  LOGIN FAILED"); return
        print(f"  OK -> {url}")

        # ===== OPEN BANKING =====
        print("\n[2] /open-banking")
        await nav(ws, f"{BASE_URL}/open-banking", 7)

        # Setup fetch interceptor
        await js(ws, """
            window.__errors=[];
            const oe=console.error;
            console.error=function(){window.__errors.push(Array.from(arguments).join(' ').substring(0,300));oe.apply(console,arguments)};
            window.__fetchLog=[];
            const of=window.fetch;
            window.fetch=async function(...a){
                const url=typeof a[0]==='string'?a[0]:a[0]?.url||'';
                const method=a[1]?.method||'GET';
                window.__fetchLog.push({url,method,time:Date.now()});
                try{
                    const r=await of.apply(this,a);
                    if(url.includes('nordigen')||url.includes('open-banking')||url.includes('banking')||url.includes('companies')){
                        const c=r.clone();
                        try{const d=await c.json();window.__lastApiResponse={url,status:r.status,ok:r.ok,data:d};}
                        catch(e){window.__lastApiResponse={url,status:r.status,ok:r.ok};}
                    }
                    return r;
                }catch(e){window.__lastApiResponse={url,error:e.message};throw e;}
            };
        """)

        await shot(ws, "01_loaded")

        # Verify wizard
        info = await js(ws, """
            (() => {
                const cb = document.querySelectorAll('button[role="combobox"]');
                return {
                    comboboxes: Array.from(cb).map(c => c.textContent.trim()),
                    wizardVisible: !!document.querySelector('[class*="CardTitle"]')
                };
            })()
        """)
        print(f"  Comboboxes: {info.get('comboboxes')}")

        # ===== STEP 1: SELECT BANKINTER =====
        print("\n[3] PASO 1: Seleccionar Bankinter")

        # The wizard's bank select is the one with "Seleccione un banco"
        comboboxes = info.get("comboboxes", [])
        bank_idx = next((i for i, t in enumerate(comboboxes) if "banco" in t.lower() or "seleccione" in t.lower()), len(comboboxes)-1)

        ok = await select_radix_option(ws, 'button[role="combobox"]', bank_idx, "Bankinter")
        await asyncio.sleep(1)
        await shot(ws, "02_bank_selected")

        if not ok:
            print("\n  Intentando via keyboard dispatch...")
            # Fallback: programmatic value change
            await js(ws, """
                (() => {
                    const triggers = document.querySelectorAll('button[role="combobox"]');
                    for (const t of triggers) {
                        if (t.textContent.includes('banco') || t.textContent.includes('Seleccione')) {
                            // Try dispatching keyboard events
                            t.focus();
                            t.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true, cancelable: true, pointerId: 1}));
                        }
                    }
                })()
            """)
            await asyncio.sleep(1)
            count = await js(ws, "document.querySelectorAll('[role=\"option\"]').length")
            print(f"  After pointerdown: {count} options")

            if not count or count == 0:
                # Try aria-expanded approach
                await js(ws, """
                    (() => {
                        const triggers = document.querySelectorAll('button[role="combobox"]');
                        for (const t of triggers) {
                            if (t.textContent.includes('banco') || t.textContent.includes('Seleccione')) {
                                t.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
                            }
                        }
                    })()
                """)
                await asyncio.sleep(1)
                count = await js(ws, "document.querySelectorAll('[role=\"option\"]').length")
                print(f"  After Enter key: {count} options")

            if not count or count == 0:
                # Last resort: check all elements that could be options
                all_items = await js(ws, """
                    (() => {
                        const items = document.querySelectorAll('[role="listbox"] *, [data-radix-select-viewport] *, [data-radix-popper-content-wrapper] *');
                        return Array.from(new Set(Array.from(items).map(i => i.tagName + ':' + i.textContent.trim().substring(0,50)))).slice(0,20);
                    })()
                """)
                print(f"  Portal items: {all_items}")

                # Check if SelectContent even rendered
                select_content = await js(ws, """
                    (() => {
                        const sc = document.querySelector('[data-radix-popper-content-wrapper]');
                        if (!sc) return 'No popper wrapper found';
                        return {html: sc.innerHTML.substring(0,500), visible: sc.offsetHeight > 0};
                    })()
                """)
                print(f"  SelectContent: {select_content}")

            options = await js(ws, "Array.from(document.querySelectorAll('[role=\"option\"]')).map(i=>i.textContent.trim())")
            if options and len(options) > 0:
                print(f"  Options now visible: {options}")
                ok = await select_radix_option(ws, 'button[role="combobox"]', bank_idx, "Bankinter")

        # Verify selection
        selected_bank = await js(ws, f"""
            document.querySelectorAll('button[role="combobox"]')[{bank_idx}]?.textContent?.trim()
        """)
        print(f"\n  Bank trigger text after selection: '{selected_bank}'")

        # ===== CLICK SIGUIENTE =====
        print("\n[4] Click Siguiente")
        await click_button_text(ws, "siguiente")
        await asyncio.sleep(2)
        await shot(ws, "03_step2")

        # ===== STEP 2: SELECT COMPANY =====
        print("\n[5] PASO 2: Seleccionar Empresa")

        # Check what comboboxes are now visible
        step2 = await js(ws, """
            (() => {
                const cb = document.querySelectorAll('button[role="combobox"]');
                const texts = Array.from(cb).map(c => c.textContent.trim());
                const body = document.body?.innerText?.substring(0, 500);
                const pasos = body.match(/Paso \\d/g);
                return {comboboxes: texts, pasos};
            })()
        """)
        print(f"  Comboboxes: {step2.get('comboboxes')}")
        print(f"  Pasos visibles: {step2.get('pasos')}")

        # Companies API response
        api_resp = await js(ws, "window.__lastApiResponse")
        if api_resp:
            print(f"  Last API: {api_resp.get('url')} -> {api_resp.get('status')} (ok: {api_resp.get('ok')})")
            if api_resp.get('data'):
                companies_data = api_resp['data']
                if isinstance(companies_data, dict):
                    print(f"  Companies data keys: {list(companies_data.keys())}")
                    if 'companies' in companies_data:
                        for c in companies_data['companies'][:5]:
                            print(f"    - {c.get('nombre', c.get('name', '?'))} (id: {c.get('id', '?')})")

        # Find and select company
        comboboxes2 = step2.get("comboboxes", [])
        company_idx = len(comboboxes2) - 1
        for i, t in enumerate(comboboxes2):
            if "empresa" in t.lower() or "sociedad" in t.lower() or "seleccione" in t.lower() or "cargando" in t.lower():
                company_idx = i

        ok2 = await select_radix_option(ws, 'button[role="combobox"]', company_idx, "Rovida")
        await asyncio.sleep(1)
        await shot(ws, "04_company_selected")

        # ===== CLICK SIGUIENTE =====
        print("\n[6] Click Siguiente")
        await click_button_text(ws, "siguiente")
        await asyncio.sleep(2)
        await shot(ws, "05_step3")

        # ===== STEP 3: CONECTAR =====
        print("\n[7] PASO 3: Conectar")

        step3 = await js(ws, """
            (() => {
                const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
                    text: b.textContent.trim(),
                    disabled: b.disabled
                })).filter(b => b.text.toLowerCase().includes('conectar'));
                const auth = document.body?.innerText?.includes('Autorización');
                return {connectButtons: buttons, authVisible: auth};
            })()
        """)
        print(f"  Connect buttons: {step3.get('connectButtons')}")
        print(f"  Auth section visible: {step3.get('authVisible')}")

        clicked = await click_button_text(ws, "conectar con")
        if not clicked:
            clicked = await click_button_text(ws, "conectar")

        await asyncio.sleep(6)
        await shot(ws, "06_after_connect")

        # ===== CHECK RESULT =====
        print("\n[8] RESULTADO")

        result = await js(ws, """
            (() => {
                const url = window.location.href;
                const errors = window.__errors || [];
                const toasts = Array.from(document.querySelectorAll('[data-sonner-toast]'))
                    .map(t => ({text: t.textContent.trim(), type: t.getAttribute('data-type')}));
                const alerts = Array.from(document.querySelectorAll('[role="alert"], .text-red-500, .text-destructive'))
                    .map(e => e.textContent.trim().substring(0, 200))
                    .filter(t => t.length > 0 && !t.includes('PSD2'));
                const apiResp = window.__lastApiResponse;
                const body = document.body?.innerText?.substring(0, 500);
                return {url, errors, toasts, alerts, apiResp, body};
            })()
        """)

        print(f"\n  URL: {result.get('url')}")
        print(f"  Toasts: {result.get('toasts', [])}")
        print(f"  Alerts: {result.get('alerts', [])}")
        print(f"  Console errors: {result.get('errors', [])[:3]}")

        api = result.get("apiResp")
        if api:
            print(f"\n  API Response:")
            print(f"    URL: {api.get('url')}")
            print(f"    Status: {api.get('status')}")
            print(f"    OK: {api.get('ok')}")
            if api.get("data"):
                print(f"    Data: {json.dumps(api['data'], indent=2, default=str)[:500]}")
            if api.get("error"):
                print(f"    Error: {api['error']}")

        await asyncio.sleep(3)
        await shot(ws, "07_final")

    print("\n" + "="*60)
    print("  TEST COMPLETADO")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
