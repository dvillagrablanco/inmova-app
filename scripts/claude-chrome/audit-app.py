#!/usr/bin/env python3
"""
Auditoría visual completa de Inmova App para Grupo Vidaro.
Usa Chrome DevTools Protocol (CDP) via WebSocket.
"""

import asyncio
import json
import base64
import os
import time
import urllib.request
from datetime import datetime

try:
    import websockets
except ImportError:
    import subprocess
    subprocess.check_call(["pip", "install", "websockets"])
    import websockets

CDP_URL = "http://127.0.0.1:9222"
BASE_URL = "https://inmovaapp.com"
SCREENSHOT_DIR = "/tmp/audit-screenshots"
REPORT_FILE = "/tmp/audit-report.json"

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

findings = []
console_errors = []
network_errors = []
page_results = {}

msg_id = 0

def next_id():
    global msg_id
    msg_id += 1
    return msg_id

def add_finding(severity, page, category, description, detail=""):
    findings.append({
        "severity": severity,
        "page": page,
        "category": category,
        "description": description,
        "detail": detail,
        "timestamp": datetime.now().isoformat()
    })

async def send_cdp(ws, method, params=None):
    mid = next_id()
    msg = {"id": mid, "method": method}
    if params:
        msg["params"] = params
    await ws.send(json.dumps(msg))

    while True:
        resp = await asyncio.wait_for(ws.recv(), timeout=30)
        data = json.loads(resp)
        if data.get("id") == mid:
            if "error" in data:
                return {"error": data["error"]}
            return data.get("result", {})
        if data.get("method") == "Runtime.consoleAPICalled":
            args = data.get("params", {}).get("args", [])
            text = " ".join(a.get("value", str(a.get("description", ""))) for a in args)
            ctype = data.get("params", {}).get("type", "log")
            if ctype == "error":
                console_errors.append(text[:200])
        if data.get("method") == "Network.loadingFailed":
            p = data.get("params", {})
            network_errors.append({
                "url": p.get("requestId", "?"),
                "error": p.get("errorText", "unknown"),
                "type": p.get("type", "?")
            })

async def navigate(ws, url, wait_time=5):
    console_errors.clear()
    network_errors.clear()
    await send_cdp(ws, "Page.navigate", {"url": url})
    await asyncio.sleep(wait_time)
    await send_cdp(ws, "Page.stopLoading")
    await asyncio.sleep(0.5)

async def screenshot(ws, name):
    result = await send_cdp(ws, "Page.captureScreenshot", {
        "format": "png",
        "quality": 80,
        "captureBeyondViewport": False
    })
    if result and "data" in result:
        path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
        with open(path, "wb") as f:
            f.write(base64.b64decode(result["data"]))
        return path
    return None

async def eval_js(ws, expression):
    result = await send_cdp(ws, "Runtime.evaluate", {
        "expression": expression,
        "returnByValue": True,
        "awaitPromise": True,
        "timeout": 10000
    })
    if result and "result" in result:
        return result["result"].get("value")
    return None

async def get_page_info(ws, page_name):
    """Extraer información completa de la página actual."""
    info = {}

    info["url"] = await eval_js(ws, "window.location.href")
    info["title"] = await eval_js(ws, "document.title")

    info["h1"] = await eval_js(ws, """
        Array.from(document.querySelectorAll('h1')).map(e => e.textContent.trim()).join(' | ')
    """)
    info["h2"] = await eval_js(ws, """
        Array.from(document.querySelectorAll('h2')).map(e => e.textContent.trim()).join(' | ')
    """)

    info["errors_visible"] = await eval_js(ws, """
        Array.from(document.querySelectorAll('[role="alert"], .error, .text-red-500, .text-destructive, [data-state="error"]'))
            .map(e => e.textContent.trim().substring(0, 100))
            .filter(t => t.length > 0)
    """)

    info["empty_tables"] = await eval_js(ws, """
        (() => {
            const tables = document.querySelectorAll('table, [role="table"]');
            const empty = [];
            tables.forEach(t => {
                const rows = t.querySelectorAll('tbody tr, [role="row"]');
                if (rows.length === 0) empty.push(t.closest('[class]')?.className?.substring(0,50) || 'table');
            });
            return empty;
        })()
    """)

    info["broken_images"] = await eval_js(ws, """
        Array.from(document.querySelectorAll('img')).filter(i => !i.complete || i.naturalWidth === 0)
            .map(i => i.src?.substring(0, 100) || i.alt || 'img')
    """)

    info["empty_states"] = await eval_js(ws, """
        Array.from(document.querySelectorAll('[class*="empty"], [class*="no-data"], [class*="placeholder"]'))
            .map(e => e.textContent.trim().substring(0, 100))
            .filter(t => t.length > 0)
    """)

    info["forms_count"] = await eval_js(ws, "document.querySelectorAll('form').length")
    info["buttons_count"] = await eval_js(ws, "document.querySelectorAll('button').length")
    info["links_count"] = await eval_js(ws, "document.querySelectorAll('a').length")

    info["text_content_snippet"] = await eval_js(ws, """
        document.body?.innerText?.substring(0, 2000) || ''
    """)

    info["cards_count"] = await eval_js(ws, """
        document.querySelectorAll('[class*="card"], [class*="Card"]').length
    """)

    info["loading_spinners"] = await eval_js(ws, """
        document.querySelectorAll('[class*="spinner"], [class*="loading"], [class*="skeleton"], [role="progressbar"]').length
    """)

    info["console_errors"] = list(console_errors)
    info["network_errors"] = list(network_errors)

    return info

async def audit_page(ws, url, page_name, checks=None):
    """Navegar a una página y auditarla."""
    print(f"\n{'='*60}")
    print(f"  Auditando: {page_name}")
    print(f"  URL: {url}")
    print(f"{'='*60}")

    await navigate(ws, url, wait_time=6)
    await screenshot(ws, page_name.replace("/", "_").replace(" ", "_"))

    info = await get_page_info(ws, page_name)
    page_results[page_name] = info

    actual_url = info.get("url", "")
    print(f"  Titulo: {info.get('title', '?')}")
    print(f"  URL real: {actual_url}")

    if "/login" in actual_url and "/login" not in url:
        add_finding("CRITICAL", page_name, "acceso",
                     "Redirigido a login - sesión no activa o sin permisos",
                     f"URL esperada: {url}, redirigido a: {actual_url}")
        return info

    if info.get("errors_visible"):
        for err in info["errors_visible"]:
            add_finding("HIGH", page_name, "error_visible",
                         f"Error visible en UI: {err[:100]}")

    if info.get("broken_images"):
        for img in info["broken_images"]:
            add_finding("MEDIUM", page_name, "imagen_rota",
                         f"Imagen rota: {img[:100]}")

    if info.get("console_errors"):
        for cerr in info["console_errors"][:5]:
            add_finding("HIGH", page_name, "console_error",
                         f"Error en consola: {cerr[:150]}")

    if info.get("loading_spinners", 0) > 0:
        add_finding("LOW", page_name, "carga_lenta",
                     f"{info['loading_spinners']} spinners/skeletons aún visibles después de 6s")

    if checks:
        for check_fn in checks:
            await check_fn(ws, info, page_name)

    status = "OK" if not any(f["page"] == page_name and f["severity"] in ("CRITICAL", "HIGH") for f in findings) else "ISSUES"
    print(f"  Estado: {status}")

    return info


async def check_dashboard_data(ws, info, page_name):
    """Verificar que el dashboard tiene datos reales."""
    text = info.get("text_content_snippet", "")

    if "Vidaro" not in text and "vidaro" not in text.lower():
        add_finding("HIGH", page_name, "datos",
                     "Dashboard no muestra datos del Grupo Vidaro",
                     f"Texto visible: {text[:200]}")

    kpis = await eval_js(ws, """
        Array.from(document.querySelectorAll('[class*="stat"], [class*="kpi"], [class*="metric"], [class*="Card"] h3, [class*="Card"] p'))
            .map(e => e.textContent.trim())
            .filter(t => /\\d/.test(t))
            .slice(0, 20)
    """)
    if not kpis or len(kpis) == 0:
        add_finding("MEDIUM", page_name, "datos",
                     "No se detectan KPIs numéricos en el dashboard")
    else:
        zeros = [k for k in kpis if k.strip() in ("0", "0€", "€0", "0.00", "$0", "0%")]
        if len(zeros) > len(kpis) * 0.5:
            add_finding("HIGH", page_name, "datos",
                         f"Más del 50% de KPIs son cero ({len(zeros)}/{len(kpis)})",
                         f"KPIs: {kpis}")


async def check_table_data(ws, info, page_name):
    """Verificar que las tablas tienen datos."""
    rows = await eval_js(ws, """
        (() => {
            const tables = document.querySelectorAll('table tbody, [role="table"]');
            let total = 0;
            tables.forEach(t => {
                total += t.querySelectorAll('tr, [role="row"]').length;
            });
            return total;
        })()
    """)

    if rows is not None and rows == 0:
        has_cards = info.get("cards_count", 0) > 0
        if not has_cards:
            add_finding("HIGH", page_name, "datos",
                         "No hay filas en tablas ni cards con datos")

    empty_msg = await eval_js(ws, """
        (() => {
            const empties = document.querySelectorAll('[class*="empty"], [class*="no-result"]');
            return Array.from(empties).map(e => e.textContent.trim().substring(0, 100));
        })()
    """)
    if empty_msg:
        for msg in empty_msg:
            if msg:
                add_finding("MEDIUM", page_name, "datos",
                             f"Mensaje de vacío: {msg}")


async def check_form_fields(ws, info, page_name):
    """Verificar formularios en la página."""
    fields = await eval_js(ws, """
        Array.from(document.querySelectorAll('input, select, textarea')).map(e => ({
            name: e.name || e.id || e.placeholder || 'unnamed',
            type: e.type || e.tagName.toLowerCase(),
            value: e.value?.substring(0, 50) || '',
            required: e.required,
            disabled: e.disabled
        })).filter(f => f.type !== 'hidden')
    """)

    if fields:
        empty_required = [f for f in fields if f.get("required") and not f.get("value")]
        if empty_required:
            names = [f["name"] for f in empty_required]
            add_finding("MEDIUM", page_name, "formulario",
                         f"Campos requeridos vacíos: {', '.join(names[:5])}")


async def check_links_navigation(ws, info, page_name):
    """Verificar enlaces rotos internos."""
    links = await eval_js(ws, """
        Array.from(document.querySelectorAll('a[href]'))
            .map(a => ({href: a.href, text: a.textContent.trim().substring(0, 50)}))
            .filter(l => l.href.includes('inmovaapp.com') || l.href.startsWith('/'))
            .slice(0, 30)
    """)
    return links


async def check_seguros_data(ws, info, page_name):
    """Verificar datos de seguros."""
    text = info.get("text_content_snippet", "")

    polizas = await eval_js(ws, """
        Array.from(document.querySelectorAll('[class*="card"], tr, [role="row"]'))
            .map(e => e.textContent.trim().substring(0, 200))
            .filter(t => /póliza|poliza|seguro|asegurad|cobertura/i.test(t))
    """)

    if not polizas or len(polizas) == 0:
        add_finding("HIGH", page_name, "datos",
                     "No se detectan datos de pólizas/seguros")

    fechas_vencidas = await eval_js(ws, """
        (() => {
            const now = new Date();
            const cells = document.querySelectorAll('td, [class*="date"], [class*="fecha"]');
            const expired = [];
            cells.forEach(c => {
                const text = c.textContent.trim();
                const dateMatch = text.match(/(\\d{1,2})[\\/-](\\d{1,2})[\\/-](\\d{4})/);
                if (dateMatch) {
                    const d = new Date(dateMatch[3], dateMatch[2]-1, dateMatch[1]);
                    if (d < now && d.getFullYear() > 2020) {
                        expired.push(text);
                    }
                }
            });
            return expired;
        })()
    """)
    if fechas_vencidas:
        add_finding("HIGH", page_name, "datos",
                     f"Posibles seguros vencidos detectados: {len(fechas_vencidas)}",
                     f"Fechas: {fechas_vencidas[:5]}")


async def check_financial_coherence(ws, info, page_name):
    """Verificar coherencia de datos financieros."""
    numbers = await eval_js(ws, """
        (() => {
            const nums = [];
            document.querySelectorAll('[class*="amount"], [class*="price"], [class*="total"], [class*="euro"]')
                .forEach(e => {
                    const n = parseFloat(e.textContent.replace(/[^0-9.,\\-]/g, '').replace(',', '.'));
                    if (!isNaN(n)) nums.push({value: n, text: e.textContent.trim().substring(0, 50)});
                });
            return nums;
        })()
    """)

    if numbers:
        negatives = [n for n in numbers if n["value"] < 0]
        if negatives:
            add_finding("MEDIUM", page_name, "coherencia",
                         f"Valores negativos detectados: {len(negatives)}",
                         f"Valores: {[n['text'] for n in negatives[:5]]}")


async def run_login(ws):
    """Login en la aplicación."""
    print("\n" + "="*60)
    print("  LOGIN")
    print("="*60)

    await navigate(ws, f"{BASE_URL}/login", wait_time=4)

    csrf = await eval_js(ws, """
        document.querySelector('input[name="csrfToken"]')?.value || ''
    """)

    await send_cdp(ws, "Runtime.evaluate", {
        "expression": """
            (() => {
                const emailInput = document.querySelector('input[name="email"], input[type="email"]');
                const passInput = document.querySelector('input[name="password"], input[type="password"]');
                if (emailInput) {
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeInputValueSetter.call(emailInput, 'admin@inmova.app');
                    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (passInput) {
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeInputValueSetter.call(passInput, 'Admin123!');
                    passInput.dispatchEvent(new Event('input', { bubbles: true }));
                    passInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                return {email: emailInput?.value, pass: passInput?.value?.length};
            })()
        """,
        "returnByValue": True,
        "awaitPromise": True
    })

    await asyncio.sleep(1)

    await send_cdp(ws, "Runtime.evaluate", {
        "expression": """
            document.querySelector('button[type="submit"]')?.click();
        """,
        "returnByValue": True,
        "awaitPromise": True
    })

    await asyncio.sleep(8)

    current_url = await eval_js(ws, "window.location.href")
    print(f"  URL después de login: {current_url}")

    if "/login" in (current_url or ""):
        error_msg = await eval_js(ws, """
            document.querySelector('[role="alert"], .error, .text-red-500, .text-destructive')?.textContent?.trim() || ''
        """)
        add_finding("CRITICAL", "login", "autenticacion",
                     f"Login falló. Error: {error_msg or 'Redirigido a login'}")
        return False

    await screenshot(ws, "post_login")
    print(f"  Login exitoso. Redirigido a: {current_url}")
    return True


async def main():
    print("=" * 70)
    print("  AUDITORÍA VISUAL COMPLETA - INMOVA APP - GRUPO VIDARO")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Chrome CDP: {CDP_URL}")
    print(f"  App: {BASE_URL}")
    print("=" * 70)

    resp = urllib.request.urlopen(f"{CDP_URL}/json")
    tabs = json.loads(resp.read())
    page_tabs = [t for t in tabs if t.get("type") == "page"]

    if not page_tabs:
        print("ERROR: No hay pestañas disponibles en Chrome")
        return

    ws_url = page_tabs[0]["webSocketDebuggerUrl"]
    print(f"  Conectando a: {ws_url[:60]}...")

    async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
        await send_cdp(ws, "Page.enable")
        await send_cdp(ws, "Runtime.enable")
        await send_cdp(ws, "Console.enable")
        await send_cdp(ws, "Network.enable")

        await send_cdp(ws, "Emulation.setDeviceMetricsOverride", {
            "width": 1920, "height": 1080, "deviceScaleFactor": 1, "mobile": False
        })

        logged_in = await run_login(ws)
        if not logged_in:
            print("\nABORTANDO: No se pudo hacer login.")
            save_report()
            return

        # ============================================================
        # PÁGINAS A AUDITAR PARA GRUPO VIDARO
        # ============================================================

        pages_to_audit = [
            (f"{BASE_URL}/dashboard", "Dashboard Principal", [check_dashboard_data]),
            (f"{BASE_URL}/dashboard/properties", "Propiedades", [check_table_data]),
            (f"{BASE_URL}/dashboard/tenants", "Inquilinos", [check_table_data]),
            (f"{BASE_URL}/dashboard/contracts", "Contratos", [check_table_data]),
            (f"{BASE_URL}/dashboard/buildings", "Edificios", [check_table_data]),
            (f"{BASE_URL}/dashboard/units", "Unidades", [check_table_data]),
            (f"{BASE_URL}/dashboard/insurance", "Seguros", [check_table_data, check_seguros_data]),
            (f"{BASE_URL}/dashboard/payments", "Pagos", [check_table_data, check_financial_coherence]),
            (f"{BASE_URL}/dashboard/maintenance", "Mantenimiento/Incidencias", [check_table_data]),
            (f"{BASE_URL}/dashboard/community", "Comunidades", [check_table_data]),
            (f"{BASE_URL}/dashboard/crm", "CRM", [check_table_data]),
            (f"{BASE_URL}/dashboard/crm/leads", "CRM Leads", [check_table_data]),
            (f"{BASE_URL}/dashboard/crm/activities", "CRM Actividades", [check_table_data]),
            (f"{BASE_URL}/inversiones/oportunidades", "Oportunidades Inversión", [check_table_data]),
            (f"{BASE_URL}/dashboard/documents", "Documentos", [check_table_data]),
            (f"{BASE_URL}/dashboard/reports", "Reportes", []),
            (f"{BASE_URL}/dashboard/settings", "Configuración", [check_form_fields]),
            (f"{BASE_URL}/dashboard/profile", "Perfil", [check_form_fields]),
            (f"{BASE_URL}/dashboard/company", "Empresa", [check_form_fields]),
            (f"{BASE_URL}/valoracion-ia", "Valoración IA", []),
            (f"{BASE_URL}/dashboard/coliving", "Coliving", [check_table_data]),
            (f"{BASE_URL}/admin/monitoring", "Admin Monitoring", []),
        ]

        for url, name, checks in pages_to_audit:
            try:
                await audit_page(ws, url, name, checks)
            except Exception as e:
                add_finding("CRITICAL", name, "error_sistema",
                             f"Error auditando página: {str(e)[:200]}")
                print(f"  ERROR: {e}")

        # Verificar navegación lateral / sidebar
        print(f"\n{'='*60}")
        print("  Verificando coherencia general")
        print(f"{'='*60}")

        await navigate(ws, f"{BASE_URL}/dashboard", wait_time=4)
        sidebar_links = await eval_js(ws, """
            Array.from(document.querySelectorAll('nav a, [class*="sidebar"] a, [class*="Sidebar"] a, aside a'))
                .map(a => ({href: a.href, text: a.textContent.trim()}))
                .filter(l => l.text.length > 0 && l.href.includes('/'))
        """)

        if sidebar_links:
            print(f"  Sidebar links encontrados: {len(sidebar_links)}")
            for link in sidebar_links:
                print(f"    - {link.get('text', '?')}: {link.get('href', '?')}")
        else:
            add_finding("MEDIUM", "navegacion", "ux",
                         "No se detectan links de navegación en sidebar")

    save_report()
    print_summary()


def save_report():
    report = {
        "timestamp": datetime.now().isoformat(),
        "app_url": BASE_URL,
        "total_findings": len(findings),
        "findings": findings,
        "page_results": {k: {kk: vv for kk, vv in v.items() if kk != "text_content_snippet"} for k, v in page_results.items()},
        "screenshots_dir": SCREENSHOT_DIR
    }

    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False, default=str)
    print(f"\nReporte guardado: {REPORT_FILE}")


def print_summary():
    print("\n" + "=" * 70)
    print("  RESUMEN DE AUDITORÍA")
    print("=" * 70)

    critical = [f for f in findings if f["severity"] == "CRITICAL"]
    high = [f for f in findings if f["severity"] == "HIGH"]
    medium = [f for f in findings if f["severity"] == "MEDIUM"]
    low = [f for f in findings if f["severity"] == "LOW"]

    print(f"\n  Total hallazgos: {len(findings)}")
    print(f"    CRITICAL: {len(critical)}")
    print(f"    HIGH:     {len(high)}")
    print(f"    MEDIUM:   {len(medium)}")
    print(f"    LOW:      {len(low)}")

    print(f"\n  Páginas auditadas: {len(page_results)}")

    if critical:
        print(f"\n  {'='*60}")
        print(f"  CRÍTICOS:")
        for f in critical:
            print(f"    [{f['page']}] {f['description']}")
            if f.get("detail"):
                print(f"      -> {f['detail'][:100]}")

    if high:
        print(f"\n  {'='*60}")
        print(f"  ALTOS:")
        for f in high:
            print(f"    [{f['page']}] {f['description']}")
            if f.get("detail"):
                print(f"      -> {f['detail'][:100]}")

    if medium:
        print(f"\n  {'='*60}")
        print(f"  MEDIOS:")
        for f in medium:
            print(f"    [{f['page']}] {f['description']}")

    if low:
        print(f"\n  {'='*60}")
        print(f"  BAJOS:")
        for f in low:
            print(f"    [{f['page']}] {f['description']}")

    pages_ok = [p for p in page_results if not any(
        f["page"] == p and f["severity"] in ("CRITICAL", "HIGH") for f in findings
    )]
    pages_bad = [p for p in page_results if any(
        f["page"] == p and f["severity"] in ("CRITICAL", "HIGH") for f in findings
    )]

    print(f"\n  Páginas OK ({len(pages_ok)}):")
    for p in pages_ok:
        print(f"    [OK] {p}")

    print(f"\n  Páginas con problemas ({len(pages_bad)}):")
    for p in pages_bad:
        issues = [f for f in findings if f["page"] == p and f["severity"] in ("CRITICAL", "HIGH")]
        print(f"    [!!] {p} ({len(issues)} issues)")

    print(f"\n  Screenshots: {SCREENSHOT_DIR}/")
    print(f"  Reporte JSON: {REPORT_FILE}")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
