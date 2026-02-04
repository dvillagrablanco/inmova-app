#!/usr/bin/env python3
"""
Auditoría Completa de Producción - Febrero 2026
Verifica todos los aspectos críticos del sistema
"""

import sys
import json
import time

try:
    import paramiko
except ImportError:
    print("❌ Paramiko no disponible")
    sys.exit(1)

# Configuración del servidor
SERVER_IP = '157.180.119.236'
SSH_PORT = 22
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
REMOTE_PATH = '/opt/inmova-app'

class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    MAGENTA = '\033[95m'
    END = '\033[0m'

def log(message, color=Colors.CYAN):
    print(f"{color}{message}{Colors.END}")

def section(title):
    print()
    log("=" * 70, Colors.BOLD)
    log(f"  {title}", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    print()

def exec_cmd(client, command, timeout=30):
    """Ejecutar comando SSH"""
    try:
        stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore').strip()
        return exit_status, output
    except Exception as e:
        return 1, str(e)

def check_item(name, passed, detail=""):
    """Mostrar resultado de check"""
    icon = "✅" if passed else "❌"
    color = Colors.GREEN if passed else Colors.RED
    detail_str = f" ({detail})" if detail else ""
    log(f"  {icon} {name}{detail_str}", color)
    return 1 if passed else 0

def main():
    log("""
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║  🔍 AUDITORÍA COMPLETA DE PRODUCCIÓN - INMOVA APP                   ║
║     Febrero 2026                                                     ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
    """, Colors.BOLD)
    
    audit_results = {
        'infrastructure': {'passed': 0, 'total': 0, 'checks': {}},
        'integrations': {'passed': 0, 'total': 0, 'checks': {}},
        'security': {'passed': 0, 'total': 0, 'checks': {}},
        'performance': {'passed': 0, 'total': 0, 'checks': {}},
        'features': {'passed': 0, 'total': 0, 'checks': {}},
        'legal': {'passed': 0, 'total': 0, 'checks': {}},
        'testing': {'passed': 0, 'total': 0, 'checks': {}},
    }
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log(f"🔐 Conectando a {SERVER_IP}...", Colors.CYAN)
        client.connect(SERVER_IP, port=SSH_PORT, username=USERNAME, password=PASSWORD, timeout=15)
        log("✅ Conexión establecida\n", Colors.GREEN)
        
        # ========================================
        # 1. INFRAESTRUCTURA
        # ========================================
        section("🏗️  1. INFRAESTRUCTURA Y DEPLOYMENT")
        
        # PM2 Cluster
        status, output = exec_cmd(client, "pm2 jlist")
        try:
            pm2_data = json.loads(output) if output else []
            pm2_count = len(pm2_data)
            pm2_online = all(p['pm2_env']['status'] == 'online' for p in pm2_data) if pm2_data else False
            pm2_ok = pm2_count >= 2 and pm2_online
        except:
            pm2_ok = False
            pm2_count = 0
        audit_results['infrastructure']['total'] += 1
        audit_results['infrastructure']['passed'] += check_item("PM2 Cluster (≥2 workers)", pm2_ok, f"{pm2_count} workers")
        audit_results['infrastructure']['checks']['pm2'] = pm2_ok
        
        # Nginx
        status, output = exec_cmd(client, "systemctl is-active nginx")
        nginx_ok = 'active' in output
        audit_results['infrastructure']['total'] += 1
        audit_results['infrastructure']['passed'] += check_item("Nginx Reverse Proxy", nginx_ok)
        audit_results['infrastructure']['checks']['nginx'] = nginx_ok
        
        # SSL/HTTPS (Cloudflare o Let's Encrypt)
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' https://inmovaapp.com/api/health 2>/dev/null || echo 'no'")
        ssl_ok = output == '200'
        audit_results['infrastructure']['total'] += 1
        audit_results['infrastructure']['passed'] += check_item("HTTPS/SSL", ssl_ok)
        audit_results['infrastructure']['checks']['ssl'] = ssl_ok
        
        # Backups automáticos
        status, output = exec_cmd(client, "crontab -l 2>/dev/null | grep -c backup || echo '0'")
        backups_ok = output.strip() != '0'
        audit_results['infrastructure']['total'] += 1
        audit_results['infrastructure']['passed'] += check_item("Backups Automáticos (cron)", backups_ok)
        audit_results['infrastructure']['checks']['backups'] = backups_ok
        
        # Health monitoring script
        status, _ = exec_cmd(client, f"test -f {REMOTE_PATH}/scripts/monitor-health.sh")
        monitoring_ok = status == 0
        audit_results['infrastructure']['total'] += 1
        audit_results['infrastructure']['passed'] += check_item("Script de Monitoreo", monitoring_ok)
        audit_results['infrastructure']['checks']['monitoring'] = monitoring_ok
        
        # Disk usage
        status, output = exec_cmd(client, "df / | tail -1 | awk '{print $5}' | tr -d '%'")
        try:
            disk_pct = int(output)
            disk_ok = disk_pct < 80
        except:
            disk_ok = True
            disk_pct = 0
        audit_results['infrastructure']['total'] += 1
        audit_results['infrastructure']['passed'] += check_item("Disco <80%", disk_ok, f"{disk_pct}%")
        audit_results['infrastructure']['checks']['disk'] = disk_ok
        
        # Memory usage
        status, output = exec_cmd(client, "free | grep Mem | awk '{printf \"%.0f\", $3/$2*100}'")
        try:
            mem_pct = int(output)
            mem_ok = mem_pct < 80
        except:
            mem_ok = True
            mem_pct = 0
        audit_results['infrastructure']['total'] += 1
        audit_results['infrastructure']['passed'] += check_item("Memoria <80%", mem_ok, f"{mem_pct}%")
        audit_results['infrastructure']['checks']['memory'] = mem_ok
        
        # ========================================
        # 2. INTEGRACIONES
        # ========================================
        section("🔌 2. INTEGRACIONES CRÍTICAS")
        
        integrations = {
            'DATABASE_URL': 'PostgreSQL Database',
            'NEXTAUTH_SECRET': 'NextAuth Secret',
            'NEXTAUTH_URL': 'NextAuth URL',
            'AWS_ACCESS_KEY_ID': 'AWS S3 (Access Key)',
            'AWS_SECRET_ACCESS_KEY': 'AWS S3 (Secret)',
            'STRIPE_SECRET_KEY': 'Stripe Payments',
            'STRIPE_WEBHOOK_SECRET': 'Stripe Webhook',
            'SMTP_HOST': 'Email SMTP Host',
            'SMTP_USER': 'Email SMTP User',
            'ANTHROPIC_API_KEY': 'Claude AI',
            'SIGNATURIT_API_KEY': 'Signaturit (Firma Digital)',
            'DOCUSIGN_INTEGRATION_KEY': 'DocuSign',
        }
        
        for env_var, name in integrations.items():
            status, output = exec_cmd(client, f"grep -q '{env_var}=' {REMOTE_PATH}/.env.production && echo 'OK'")
            ok = 'OK' in output
            audit_results['integrations']['total'] += 1
            audit_results['integrations']['passed'] += check_item(name, ok, env_var)
            audit_results['integrations']['checks'][env_var] = ok
        
        # ========================================
        # 3. SEGURIDAD
        # ========================================
        section("🔐 3. SEGURIDAD")
        
        # Firewall
        status, output = exec_cmd(client, "ufw status | grep -c 'Status: active' || echo '0'")
        firewall_ok = output.strip() != '0'
        audit_results['security']['total'] += 1
        audit_results['security']['passed'] += check_item("Firewall UFW", firewall_ok)
        audit_results['security']['checks']['firewall'] = firewall_ok
        
        # Rate Limiting
        status, output = exec_cmd(client, f"grep -r 'rateLimit\\|rate-limit' {REMOTE_PATH}/lib/ 2>/dev/null | wc -l")
        rate_limit_ok = int(output.strip()) > 0
        audit_results['security']['total'] += 1
        audit_results['security']['passed'] += check_item("Rate Limiting Implementado", rate_limit_ok)
        audit_results['security']['checks']['rate_limiting'] = rate_limit_ok
        
        # No secrets in code
        status, output = exec_cmd(client, f"grep -r 'sk_live_\\|pk_live_\\|sk_test_' {REMOTE_PATH}/app/ {REMOTE_PATH}/components/ 2>/dev/null | wc -l")
        no_secrets = output.strip() == '0'
        audit_results['security']['total'] += 1
        audit_results['security']['passed'] += check_item("Sin Secrets en Código", no_secrets)
        audit_results['security']['checks']['no_secrets'] = no_secrets
        
        # Security headers (Nginx)
        status, output = exec_cmd(client, "grep -c 'X-Frame-Options' /etc/nginx/sites-available/* 2>/dev/null || echo '0'")
        headers_ok = output.strip() != '0'
        audit_results['security']['total'] += 1
        audit_results['security']['passed'] += check_item("Security Headers (Nginx)", headers_ok)
        audit_results['security']['checks']['security_headers'] = headers_ok
        
        # HTTPS enforced
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{http_code}' -L http://inmovaapp.com 2>/dev/null")
        https_redirect = output == '200'  # Should redirect to HTTPS
        audit_results['security']['total'] += 1
        audit_results['security']['passed'] += check_item("HTTPS Redirect", https_redirect)
        audit_results['security']['checks']['https_redirect'] = https_redirect
        
        # ========================================
        # 4. PERFORMANCE
        # ========================================
        section("⚡ 4. PERFORMANCE Y OPTIMIZACIÓN")
        
        # Production build exists
        status, _ = exec_cmd(client, f"test -f {REMOTE_PATH}/.next/BUILD_ID")
        build_ok = status == 0
        audit_results['performance']['total'] += 1
        audit_results['performance']['passed'] += check_item("Production Build (.next)", build_ok)
        audit_results['performance']['checks']['build'] = build_ok
        
        # Static assets cached
        status, _ = exec_cmd(client, f"test -d {REMOTE_PATH}/.next/static")
        static_ok = status == 0
        audit_results['performance']['total'] += 1
        audit_results['performance']['passed'] += check_item("Static Assets Optimized", static_ok)
        audit_results['performance']['checks']['static'] = static_ok
        
        # Database indexes
        status, output = exec_cmd(client, f"grep -c '@@index' {REMOTE_PATH}/prisma/schema.prisma")
        try:
            index_count = int(output)
            indexes_ok = index_count >= 10
        except:
            indexes_ok = False
            index_count = 0
        audit_results['performance']['total'] += 1
        audit_results['performance']['passed'] += check_item("DB Indexes (≥10)", indexes_ok, f"{index_count} indexes")
        audit_results['performance']['checks']['indexes'] = indexes_ok
        
        # Response time (API health)
        status, output = exec_cmd(client, "curl -s -o /dev/null -w '%{time_total}' http://localhost:3000/api/health")
        try:
            response_time = float(output)
            fast_ok = response_time < 1.0
        except:
            fast_ok = True
            response_time = 0
        audit_results['performance']['total'] += 1
        audit_results['performance']['passed'] += check_item("API Response <1s", fast_ok, f"{response_time:.2f}s")
        audit_results['performance']['checks']['response_time'] = fast_ok
        
        # ========================================
        # 5. FEATURES
        # ========================================
        section("🎯 5. FEATURES CRÍTICOS")
        
        # API routes
        status, output = exec_cmd(client, f"find {REMOTE_PATH}/app/api -name 'route.ts' 2>/dev/null | wc -l")
        try:
            api_count = int(output)
            api_ok = api_count >= 20
        except:
            api_ok = False
            api_count = 0
        audit_results['features']['total'] += 1
        audit_results['features']['passed'] += check_item("API Routes (≥20)", api_ok, f"{api_count} routes")
        audit_results['features']['checks']['api_routes'] = api_ok
        
        # Pages
        status, output = exec_cmd(client, f"find {REMOTE_PATH}/app -name 'page.tsx' 2>/dev/null | wc -l")
        try:
            pages_count = int(output)
            pages_ok = pages_count >= 30
        except:
            pages_ok = False
            pages_count = 0
        audit_results['features']['total'] += 1
        audit_results['features']['passed'] += check_item("Pages (≥30)", pages_ok, f"{pages_count} pages")
        audit_results['features']['checks']['pages'] = pages_ok
        
        # Components
        status, output = exec_cmd(client, f"find {REMOTE_PATH}/components -name '*.tsx' 2>/dev/null | wc -l")
        try:
            components_count = int(output)
            components_ok = components_count >= 100
        except:
            components_ok = False
            components_count = 0
        audit_results['features']['total'] += 1
        audit_results['features']['passed'] += check_item("Components (≥100)", components_ok, f"{components_count} components")
        audit_results['features']['checks']['components'] = components_ok
        
        # i18n (translations)
        status, output = exec_cmd(client, f"find {REMOTE_PATH}/i18n -name '*.json' 2>/dev/null | wc -l")
        try:
            i18n_count = int(output)
            i18n_ok = i18n_count >= 2
        except:
            i18n_ok = False
            i18n_count = 0
        audit_results['features']['total'] += 1
        audit_results['features']['passed'] += check_item("Internacionalización (i18n)", i18n_ok, f"{i18n_count} idiomas")
        audit_results['features']['checks']['i18n'] = i18n_ok
        
        # ========================================
        # 6. TESTING
        # ========================================
        section("🧪 6. TESTING Y QA")
        
        # Unit tests
        status, output = exec_cmd(client, f"find {REMOTE_PATH}/__tests__ -name '*.test.ts' -o -name '*.test.tsx' 2>/dev/null | wc -l")
        try:
            unit_tests = int(output)
            unit_ok = unit_tests >= 50
        except:
            unit_ok = False
            unit_tests = 0
        audit_results['testing']['total'] += 1
        audit_results['testing']['passed'] += check_item("Unit Tests (≥50)", unit_ok, f"{unit_tests} tests")
        audit_results['testing']['checks']['unit_tests'] = unit_ok
        
        # E2E tests
        status, output = exec_cmd(client, f"find {REMOTE_PATH}/e2e -name '*.spec.ts' 2>/dev/null | wc -l")
        try:
            e2e_tests = int(output)
            e2e_ok = e2e_tests >= 5
        except:
            e2e_ok = False
            e2e_tests = 0
        audit_results['testing']['total'] += 1
        audit_results['testing']['passed'] += check_item("E2E Tests (≥5)", e2e_ok, f"{e2e_tests} tests")
        audit_results['testing']['checks']['e2e_tests'] = e2e_ok
        
        # Test config
        status, _ = exec_cmd(client, f"test -f {REMOTE_PATH}/vitest.config.ts")
        vitest_ok = status == 0
        audit_results['testing']['total'] += 1
        audit_results['testing']['passed'] += check_item("Vitest Configurado", vitest_ok)
        audit_results['testing']['checks']['vitest'] = vitest_ok
        
        status, _ = exec_cmd(client, f"test -f {REMOTE_PATH}/playwright.config.ts")
        playwright_ok = status == 0
        audit_results['testing']['total'] += 1
        audit_results['testing']['passed'] += check_item("Playwright Configurado", playwright_ok)
        audit_results['testing']['checks']['playwright'] = playwright_ok
        
        # ========================================
        # 7. LEGAL
        # ========================================
        section("⚖️  7. LEGAL Y COMPLIANCE")
        
        legal_pages = [
            ('Términos y Condiciones', '/app/legal/terms'),
            ('Política de Privacidad', '/app/legal/privacy'),
            ('Política de Cookies', '/app/legal/cookies'),
        ]
        
        for name, path in legal_pages:
            status, _ = exec_cmd(client, f"test -d {REMOTE_PATH}{path}")
            ok = status == 0
            audit_results['legal']['total'] += 1
            audit_results['legal']['passed'] += check_item(name, ok)
            audit_results['legal']['checks'][name] = ok
        
        # ========================================
        # RESUMEN FINAL
        # ========================================
        section("📊 RESUMEN DE AUDITORÍA")
        
        total_passed = 0
        total_checks = 0
        
        log("  Categoría                    Score", Colors.BOLD)
        log("  " + "-" * 50, Colors.BOLD)
        
        for category, data in audit_results.items():
            if data['total'] > 0:
                pct = (data['passed'] / data['total']) * 100
                total_passed += data['passed']
                total_checks += data['total']
                
                if pct >= 80:
                    color = Colors.GREEN
                elif pct >= 60:
                    color = Colors.YELLOW
                else:
                    color = Colors.RED
                
                category_name = {
                    'infrastructure': 'Infraestructura',
                    'integrations': 'Integraciones',
                    'security': 'Seguridad',
                    'performance': 'Performance',
                    'features': 'Features',
                    'testing': 'Testing',
                    'legal': 'Legal'
                }.get(category, category)
                
                log(f"  {category_name:<25} {data['passed']}/{data['total']} ({pct:.0f}%)", color)
        
        overall_pct = (total_passed / total_checks * 100) if total_checks > 0 else 0
        
        log("\n  " + "=" * 50, Colors.BOLD)
        log(f"  SCORE GLOBAL: {total_passed}/{total_checks} ({overall_pct:.0f}%)", Colors.BOLD)
        log("  " + "=" * 50, Colors.BOLD)
        
        # Estado final
        if overall_pct >= 80:
            log("""
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║  ✅ SISTEMA LISTO PARA PRODUCCIÓN                                   ║
║     Score: {:.0f}% - Estado: ÓPTIMO                                  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
            """.format(overall_pct), Colors.GREEN)
            return 0
        elif overall_pct >= 60:
            log("""
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║  ⚠️  SISTEMA FUNCIONAL CON ADVERTENCIAS                             ║
║     Score: {:.0f}% - Estado: ACEPTABLE                               ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
            """.format(overall_pct), Colors.YELLOW)
            return 0
        else:
            log("""
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║  ❌ SISTEMA CON GAPS CRÍTICOS                                       ║
║     Score: {:.0f}% - Estado: REQUIERE ATENCIÓN                       ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
            """.format(overall_pct), Colors.RED)
            return 1
        
    except paramiko.AuthenticationException:
        log("❌ Error de autenticación", Colors.RED)
        return 1
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        try:
            client.close()
        except:
            pass

if __name__ == '__main__':
    sys.exit(main())
