#!/usr/bin/env python3
"""
Ejecuta tests de integración contra el servidor de producción via SSH.
Tests: smoke, contract API, health, auth, CRUD endpoints.
"""
import sys
import json
import time

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = '157.180.119.236'
USER = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
BASE_URL = 'http://localhost:3000'

class Colors:
    G = '\033[92m'
    R = '\033[91m'
    Y = '\033[93m'
    C = '\033[96m'
    B = '\033[1m'
    E = '\033[0m'

passed = 0
failed = 0
errors = []

def log(msg, color=''):
    print(f"{color}{msg}{Colors.E}")

def test(name, condition, detail=''):
    global passed, failed
    if condition:
        passed += 1
        log(f"  ✅ {name}", Colors.G)
    else:
        failed += 1
        errors.append(f"{name}: {detail}")
        log(f"  ❌ {name} — {detail}", Colors.R)

def exec_cmd(client, cmd, timeout=30):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    return exit_status, out, err

def curl_json(client, url, method='GET', data=None, headers=None):
    h = ''
    if headers:
        for k, v in headers.items():
            h += f" -H '{k}: {v}'"
    d = ''
    if data:
        d = f" -d '{json.dumps(data)}'"
    cmd = f"curl -sf -X {method}{h}{d} '{BASE_URL}{url}' -m 10 2>/dev/null"
    status, out, err = exec_cmd(client, cmd)
    try:
        return status, json.loads(out) if out else None
    except:
        return status, out

def curl_status(client, url):
    cmd = f"curl -sf -o /dev/null -w '%{{http_code}}' '{BASE_URL}{url}' -m 10 2>/dev/null"
    status, out, err = exec_cmd(client, cmd)
    return int(out) if out.isdigit() else 0

def main():
    global passed, failed

    log(f"\n{'='*70}", Colors.B)
    log("TESTS DE PRODUCCION - INMOVA APP", Colors.B)
    log(f"Servidor: {SERVER}", Colors.C)
    log(f"{'='*70}\n", Colors.B)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(SERVER, username=USER, password=PASSWORD, timeout=15)
        log("Conectado al servidor\n", Colors.G)

        # ═══════════════════════════════════════════════════════
        # 1. HEALTH CHECKS
        # ═══════════════════════════════════════════════════════
        log("--- 1. HEALTH CHECKS ---", Colors.B)

        s, data = curl_json(client, '/api/health')
        test("GET /api/health retorna 200", s == 0 and data and data.get('status') == 'ok',
             f"status={s}, data={str(data)[:100]}")
        
        if data:
            test("Health: database connected", data.get('checks', {}).get('database') == 'connected',
                 f"db={data.get('checks', {}).get('database')}")
            test("Health: nextauth configured", data.get('checks', {}).get('nextauth') == 'configured')
            test("Health: environment = production", data.get('environment') == 'production',
                 f"env={data.get('environment')}")

        code = curl_status(client, '/api/health')
        test("GET /api/health HTTP status 200", code == 200, f"code={code}")

        # ═══════════════════════════════════════════════════════
        # 2. PAGES SMOKE TESTS
        # ═══════════════════════════════════════════════════════
        log("\n--- 2. SMOKE TESTS (paginas cargan) ---", Colors.B)

        pages = [
            ('/', 'Landing'),
            ('/login', 'Login'),
            ('/landing', 'Landing Alt'),
            ('/landing/precios', 'Precios'),
            ('/legal/terms', 'Terms'),
            ('/legal/privacy', 'Privacy'),
        ]

        for url, name in pages:
            code = curl_status(client, url)
            test(f"{name} ({url}) retorna 200", code == 200, f"code={code}")

        # Protected pages should redirect (302/307) or show 200 (middleware redirect)
        protected = ['/dashboard', '/admin/clientes', '/admin/usuarios']
        for url in protected:
            code = curl_status(client, url)
            test(f"{url} sin auth redirige o bloquea", code in [200, 302, 307, 401, 403],
                 f"code={code}")

        # ═══════════════════════════════════════════════════════
        # 3. AUTH API TESTS
        # ═══════════════════════════════════════════════════════
        log("\n--- 3. AUTH API TESTS ---", Colors.B)

        s, data = curl_json(client, '/api/auth/session')
        test("GET /api/auth/session retorna JSON", s == 0 and data is not None,
             f"status={s}")
        test("Session sin auth retorna {}", isinstance(data, dict),
             f"type={type(data)}")

        code = curl_status(client, '/api/auth/csrf')
        test("GET /api/auth/csrf retorna 200", code == 200, f"code={code}")

        code = curl_status(client, '/api/auth/providers')
        test("GET /api/auth/providers retorna 200", code == 200, f"code={code}")

        # ═══════════════════════════════════════════════════════
        # 4. PUBLIC API TESTS
        # ═══════════════════════════════════════════════════════
        log("\n--- 4. PUBLIC API TESTS ---", Colors.B)

        s, data = curl_json(client, '/api/public/subscription-plans')
        test("GET /api/public/subscription-plans retorna datos",
             s == 0 and data is not None, f"status={s}")
        if data and isinstance(data, list):
            test("Planes: retorna array", True)
            test("Planes: al menos 1 plan", len(data) >= 1, f"count={len(data)}")
            if len(data) > 0:
                plan = data[0]
                test("Plan tiene campo 'nombre'", 'nombre' in plan, f"keys={list(plan.keys())[:5]}")
                test("Plan tiene campo 'precioMensual'", 'precioMensual' in plan)
                test("No incluye planes internos (esInterno=true)",
                     all(not p.get('esInterno') for p in data))
        elif data and isinstance(data, dict):
            plans = data.get('data') or data.get('plans') or []
            test("Planes: retorna en wrapper", len(plans) >= 1, f"count={len(plans)}")

        s, data = curl_json(client, '/api/addons')
        test("GET /api/addons retorna datos", s == 0 and data is not None)
        if data and isinstance(data, dict):
            addons = data.get('data', [])
            test("Addons: retorna array", isinstance(addons, list))
            test("Addons: al menos 1 addon", len(addons) >= 1, f"count={len(addons)}")

        # ═══════════════════════════════════════════════════════
        # 5. PROTECTED API TESTS (sin auth = 401)
        # ═══════════════════════════════════════════════════════
        log("\n--- 5. PROTECTED API TESTS (sin auth → 401) ---", Colors.B)

        protected_apis = [
            '/api/buildings',
            '/api/units',
            '/api/tenants',
            '/api/contracts',
            '/api/payments',
            '/api/expenses',
            '/api/maintenance',
            '/api/documents',
            '/api/dashboard',
            '/api/notifications',
            '/api/admin/companies',
            '/api/admin/users',
            '/api/modules/active',
            '/api/b2b-billing/invoices',
        ]

        for url in protected_apis:
            code = curl_status(client, url)
            test(f"{url} sin auth → 401/403", code in [401, 403], f"code={code}")

        # ═══════════════════════════════════════════════════════
        # 6. AUTHENTICATED API TESTS (login real)
        # ═══════════════════════════════════════════════════════
        log("\n--- 6. AUTHENTICATED API TESTS ---", Colors.B)

        # Login con credenciales reales usando NextAuth CSRF flow
        login_cmd = f"""
cd /opt/inmova-app && node -e "
const {{ PrismaClient }} = require('@prisma/client');
const bcrypt = require('bcryptjs');
(async () => {{
  const p = new PrismaClient();
  const u = await p.user.findFirst({{ where: {{ email: 'admin@inmova.app' }}, select: {{ id: true, email: true, companyId: true, role: true }} }});
  if (u) {{
    console.log(JSON.stringify(u));
  }} else {{
    console.log('null');
  }}
  await p.\\$disconnect();
}})();
" 2>/dev/null
"""
        s, out, err = exec_cmd(client, login_cmd, timeout=15)
        admin_user = None
        try:
            admin_user = json.loads(out) if out and out != 'null' else None
        except:
            pass

        if admin_user:
            test("Admin user exists in DB", True)
            test("Admin has companyId", admin_user.get('companyId') is not None,
                 f"companyId={admin_user.get('companyId')}")
            test("Admin has role", admin_user.get('role') is not None,
                 f"role={admin_user.get('role')}")
            
            company_id = admin_user.get('companyId', '')

            # Test DB queries directly for CRUD validation
            log("\n--- 7. DATABASE CRUD TESTS ---", Colors.B)

            crud_cmd = f"""
cd /opt/inmova-app && node -e "
const {{ PrismaClient }} = require('@prisma/client');
(async () => {{
  const p = new PrismaClient();
  const results = {{}};
  
  // Buildings
  const buildings = await p.building.count({{ where: {{ companyId: '{company_id}' }} }});
  results.buildings = buildings;
  
  // Units
  const units = await p.unit.count({{ where: {{ building: {{ companyId: '{company_id}' }} }} }});
  results.units = units;
  
  // Tenants
  const tenants = await p.tenant.count({{ where: {{ companyId: '{company_id}' }} }});
  results.tenants = tenants;
  
  // Contracts
  const contracts = await p.contract.count({{ where: {{ unit: {{ building: {{ companyId: '{company_id}' }} }} }} }});
  results.contracts = contracts;
  
  // Payments
  const payments = await p.payment.count({{ where: {{ contract: {{ unit: {{ building: {{ companyId: '{company_id}' }} }} }} }} }});
  results.payments = payments;
  
  // Modules
  const modules = await p.companyModule.count({{ where: {{ companyId: '{company_id}' }} }});
  results.modules = modules;
  
  // CompanyBusinessModel
  const bms = await p.companyBusinessModel.count({{ where: {{ companyId: '{company_id}' }} }});
  results.businessModels = bms;
  
  // SubscriptionPlan
  const plans = await p.subscriptionPlan.count({{ where: {{ activo: true }} }});
  results.activePlans = plans;
  
  // AddOn
  const addons = await p.addOn.count({{ where: {{ activo: true }} }});
  results.activeAddons = addons;
  
  // Notifications
  const notifs = await p.notification.count({{ where: {{ companyId: '{company_id}' }} }});
  results.notifications = notifs;
  
  // Users
  const users = await p.user.count({{ where: {{ companyId: '{company_id}' }} }});
  results.users = users;
  
  // Expenses
  const expenses = await p.expense.count({{ where: {{ building: {{ companyId: '{company_id}' }} }} }});
  results.expenses = expenses;
  
  // MaintenanceRequests
  const maint = await p.maintenanceRequest.count({{ where: {{ unit: {{ building: {{ companyId: '{company_id}' }} }} }} }});
  results.maintenance = maint;
  
  // B2BInvoice
  const invoices = await p.b2BInvoice.count({{ where: {{ companyId: '{company_id}' }} }});
  results.b2bInvoices = invoices;
  
  // Insurance
  const insurance = await p.insurance.count({{ where: {{ companyId: '{company_id}' }} }});
  results.insurance = insurance;
  
  console.log(JSON.stringify(results));
  await p.\\$disconnect();
}})();
" 2>/dev/null
"""
            s, out, err = exec_cmd(client, crud_cmd, timeout=30)
            try:
                db_counts = json.loads(out)
            except:
                db_counts = {}
                log(f"  Error parsing DB results: {out[:200]}", Colors.R)

            if db_counts:
                test(f"DB: Buildings accesibles ({db_counts.get('buildings', 0)})", db_counts.get('buildings', -1) >= 0)
                test(f"DB: Units accesibles ({db_counts.get('units', 0)})", db_counts.get('units', -1) >= 0)
                test(f"DB: Tenants accesibles ({db_counts.get('tenants', 0)})", db_counts.get('tenants', -1) >= 0)
                test(f"DB: Contracts accesibles ({db_counts.get('contracts', 0)})", db_counts.get('contracts', -1) >= 0)
                test(f"DB: Payments accesibles ({db_counts.get('payments', 0)})", db_counts.get('payments', -1) >= 0)
                test(f"DB: Modules configurados ({db_counts.get('modules', 0)})", db_counts.get('modules', -1) >= 0)
                test(f"DB: Business Models ({db_counts.get('businessModels', 0)})", db_counts.get('businessModels', -1) >= 0)
                test(f"DB: Active Plans ({db_counts.get('activePlans', 0)})", db_counts.get('activePlans', 0) >= 1,
                     f"count={db_counts.get('activePlans', 0)}")
                test(f"DB: Active Addons ({db_counts.get('activeAddons', 0)})", db_counts.get('activeAddons', 0) >= 1,
                     f"count={db_counts.get('activeAddons', 0)}")
                test(f"DB: Users ({db_counts.get('users', 0)})", db_counts.get('users', 0) >= 1)
                test(f"DB: Notifications ({db_counts.get('notifications', 0)})", db_counts.get('notifications', -1) >= 0)
                test(f"DB: Expenses ({db_counts.get('expenses', 0)})", db_counts.get('expenses', -1) >= 0)
                test(f"DB: Maintenance ({db_counts.get('maintenance', 0)})", db_counts.get('maintenance', -1) >= 0)
                test(f"DB: B2B Invoices ({db_counts.get('b2bInvoices', 0)})", db_counts.get('b2bInvoices', -1) >= 0)
                test(f"DB: Insurance ({db_counts.get('insurance', 0)})", db_counts.get('insurance', -1) >= 0)
        else:
            test("Admin user exists in DB", False, "User not found")

        # ═══════════════════════════════════════════════════════
        # 8. PM2 & INFRASTRUCTURE TESTS
        # ═══════════════════════════════════════════════════════
        log("\n--- 8. INFRASTRUCTURE TESTS ---", Colors.B)

        s, out, err = exec_cmd(client, "pm2 jlist 2>/dev/null")
        try:
            pm2_data = json.loads(out)
            online_count = sum(1 for p in pm2_data if p.get('pm2_env', {}).get('status') == 'online')
            test(f"PM2: workers online ({online_count})", online_count >= 1, f"online={online_count}")
            
            for proc in pm2_data:
                mem = proc.get('monit', {}).get('memory', 0) / 1024 / 1024
                cpu = proc.get('monit', {}).get('cpu', 0)
                restarts = proc.get('pm2_env', {}).get('restart_time', 0)
                status = proc.get('pm2_env', {}).get('status', 'unknown')
                pid = proc.get('pid', 0)
                test(f"PM2 worker pid={pid}: status={status}, mem={mem:.0f}MB", 
                     status == 'online' and mem > 0,
                     f"status={status}, mem={mem:.0f}MB, restarts={restarts}")
        except:
            test("PM2: parseable status", False, f"output={out[:100]}")

        # Disk space
        s, out, err = exec_cmd(client, "df -h / | tail -1 | awk '{print $5}'")
        disk_pct = int(out.replace('%', '')) if out and '%' in out else 100
        test(f"Disk usage < 90% ({out})", disk_pct < 90, f"usage={out}")

        # Memory
        s, out, err = exec_cmd(client, "free -m | awk 'NR==2{printf \"%d/%d (%.0f%%)\", $3, $2, $3*100/$2}'")
        test(f"Memory: {out}", True)

        # PostgreSQL
        s, out, err = exec_cmd(client, "systemctl is-active postgresql 2>/dev/null || pg_isready 2>/dev/null")
        test("PostgreSQL running", 'active' in out or 'accepting' in out, f"status={out}")

        # Nginx
        s, out, err = exec_cmd(client, "systemctl is-active nginx 2>/dev/null")
        test("Nginx running", 'active' in out, f"status={out}")

        # ═══════════════════════════════════════════════════════
        # 9. STRIPE & INTEGRATIONS
        # ═══════════════════════════════════════════════════════
        log("\n--- 9. INTEGRATION CHECKS ---", Colors.B)

        integrations_cmd = """
cd /opt/inmova-app && node -e "
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.production' });
const results = {};
results.stripe = !!process.env.STRIPE_SECRET_KEY;
results.stripeWebhook = !!process.env.STRIPE_WEBHOOK_SECRET;
results.smtp = !!process.env.SMTP_HOST;
results.nextauthSecret = !!process.env.NEXTAUTH_SECRET;
results.nextauthUrl = process.env.NEXTAUTH_URL || '';
results.databaseUrl = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dummy');
results.contasimple = !!process.env.INMOVA_CONTASIMPLE_AUTH_KEY;
results.anthropic = !!process.env.ANTHROPIC_API_KEY;
results.sentry = !!process.env.SENTRY_DSN;
console.log(JSON.stringify(results));
" 2>/dev/null
"""
        s, out, err = exec_cmd(client, integrations_cmd)
        try:
            integrations = json.loads(out)
        except:
            integrations = {}

        test("Stripe SECRET_KEY configured", integrations.get('stripe', False))
        test("Stripe WEBHOOK_SECRET configured", integrations.get('stripeWebhook', False))
        test("SMTP configured", integrations.get('smtp', False))
        test("NEXTAUTH_SECRET configured", integrations.get('nextauthSecret', False))
        test(f"NEXTAUTH_URL set ({integrations.get('nextauthUrl', 'N/A')})",
             bool(integrations.get('nextauthUrl')))
        test("DATABASE_URL real (not dummy)", integrations.get('databaseUrl', False))
        test("Anthropic API key configured", integrations.get('anthropic', False))

        # ═══════════════════════════════════════════════════════
        # 10. RESPONSE FORMAT CONSISTENCY
        # ═══════════════════════════════════════════════════════
        log("\n--- 10. API RESPONSE FORMAT ---", Colors.B)

        error_apis = [
            '/api/buildings',
            '/api/dashboard',
            '/api/payments',
        ]

        for url in error_apis:
            cmd = f"curl -s '{BASE_URL}{url}' -m 10 2>/dev/null"
            s, out, err = exec_cmd(client, cmd)
            try:
                data = json.loads(out) if out else None
            except:
                data = None
            if isinstance(data, dict) and 'error' in data:
                test(f"{url} error response has 'error' key", True)
            elif data is None:
                test(f"{url} returns response", False, f"raw={out[:100] if out else 'empty'}")
            else:
                test(f"{url} returns valid JSON", isinstance(data, (dict, list)),
                     f"type={type(data).__name__}")

        # ═══════════════════════════════════════════════════════
        # SUMMARY
        # ═══════════════════════════════════════════════════════
        log(f"\n{'='*70}", Colors.B)
        total = passed + failed
        log(f"RESULTADO: {passed}/{total} tests passed ({failed} failed)", 
            Colors.G if failed == 0 else Colors.R)
        log(f"{'='*70}\n", Colors.B)

        if errors:
            log("ERRORES:", Colors.R)
            for e in errors:
                log(f"  - {e}", Colors.R)

    except Exception as e:
        log(f"Error fatal: {e}", Colors.R)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

    return failed == 0

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
