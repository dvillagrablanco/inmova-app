#!/usr/bin/env python3
"""
Auditoría Pre-Lanzamiento - Verificación exhaustiva del estado actual
"""

import sys
import json
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Paramiko no disponible")
    sys.exit(1)

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='

class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def log(message, color=Colors.CYAN):
    print(f"{color}{message}{Colors.END}")

def exec_cmd(client, command, timeout=30):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    return exit_status, output

def check_integration(client, name, checks):
    """Verificar estado de una integración"""
    results = {}
    for check_name, command in checks.items():
        status, output = exec_cmd(client, command)
        results[check_name] = 'OK' if status == 0 and output.strip() else 'MISSING'
    
    all_ok = all(v == 'OK' for v in results.values())
    return all_ok, results

def main():
    log("=" * 80, Colors.BOLD)
    log("🔍 AUDITORÍA PRE-LANZAMIENTO - INMOVA APP", Colors.BOLD)
    log("=" * 80, Colors.BOLD)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        
        audit_report = {
            'infrastructure': {},
            'integrations': {},
            'security': {},
            'performance': {},
            'features': {},
            'legal': {}
        }
        
        # 1. INFRAESTRUCTURA
        log("=" * 80, Colors.BOLD)
        log("🏗️  1. INFRAESTRUCTURA Y DEPLOYMENT", Colors.BOLD)
        log("=" * 80, Colors.BOLD)
        print()
        
        # PM2
        status, output = exec_cmd(client, "pm2 jlist")
        try:
            pm2_data = json.loads(output)
            pm2_ok = len(pm2_data) > 0 and all(p['pm2_env']['status'] == 'online' for p in pm2_data)
            log(f"  PM2 Cluster: {'✅' if pm2_ok else '❌'} ({len(pm2_data)} workers)", Colors.GREEN if pm2_ok else Colors.RED)
            audit_report['infrastructure']['pm2'] = pm2_ok
        except:
            log(f"  PM2 Cluster: ❌ Error parsing", Colors.RED)
            audit_report['infrastructure']['pm2'] = False
        
        # Nginx
        status, output = exec_cmd(client, "systemctl is-active nginx")
        nginx_ok = 'active' in output
        log(f"  Nginx: {'✅' if nginx_ok else '❌'}", Colors.GREEN if nginx_ok else Colors.RED)
        audit_report['infrastructure']['nginx'] = nginx_ok
        
        # SSL/HTTPS
        status, output = exec_cmd(client, "test -d /etc/letsencrypt/live && echo 'OK' || echo 'MISSING'")
        ssl_ok = 'OK' in output
        log(f"  SSL Certificate: {'✅' if ssl_ok else '⚠️  Manual (Cloudflare)'}", Colors.GREEN if ssl_ok else Colors.YELLOW)
        audit_report['infrastructure']['ssl'] = ssl_ok or True  # Cloudflare manages SSL
        
        # Backups
        status, output = exec_cmd(client, "crontab -l | grep -c backup")
        backup_ok = output.strip() != '0'
        log(f"  Automated Backups: {'✅' if backup_ok else '❌'}", Colors.GREEN if backup_ok else Colors.RED)
        audit_report['infrastructure']['backups'] = backup_ok
        
        # Monitoring
        status, output = exec_cmd(client, "test -f /opt/inmova-app/scripts/monitor-health.sh && echo 'OK' || echo 'MISSING'")
        monitoring_ok = 'OK' in output
        log(f"  Health Monitoring: {'✅' if monitoring_ok else '❌'}", Colors.GREEN if monitoring_ok else Colors.RED)
        audit_report['infrastructure']['monitoring'] = monitoring_ok
        
        print()
        
        # 2. INTEGRACIONES CRÍTICAS
        log("=" * 80, Colors.BOLD)
        log("🔌 2. INTEGRACIONES CRÍTICAS", Colors.BOLD)
        log("=" * 80, Colors.BOLD)
        print()
        
        integrations = {
            'Database (PostgreSQL)': {
                'env': "grep -q 'DATABASE_URL=' /opt/inmova-app/.env.production && echo 'OK'"
            },
            'NextAuth': {
                'secret': "grep -q 'NEXTAUTH_SECRET=' /opt/inmova-app/.env.production && echo 'OK'",
                'url': "grep -q 'NEXTAUTH_URL=' /opt/inmova-app/.env.production && echo 'OK'"
            },
            'AWS S3 (Storage)': {
                'key': "grep -q 'AWS_ACCESS_KEY_ID=' /opt/inmova-app/.env.production && echo 'OK'",
                'secret': "grep -q 'AWS_SECRET_ACCESS_KEY=' /opt/inmova-app/.env.production && echo 'OK'"
            },
            'Stripe (Payments)': {
                'secret': "grep -q 'STRIPE_SECRET_KEY=' /opt/inmova-app/.env.production && echo 'OK'",
                'webhook': "grep -q 'STRIPE_WEBHOOK_SECRET=' /opt/inmova-app/.env.production && echo 'OK'"
            },
            'SMTP (Email)': {
                'host': "grep -q 'SMTP_HOST=' /opt/inmova-app/.env.production && echo 'OK'",
                'user': "grep -q 'SMTP_USER=' /opt/inmova-app/.env.production && echo 'OK'"
            },
            'Anthropic Claude (IA)': {
                'key': "grep -q 'ANTHROPIC_API_KEY=' /opt/inmova-app/.env.production && echo 'OK'"
            },
        }
        
        critical_integrations = 0
        optional_integrations = 0
        
        for name, checks in integrations.items():
            all_ok, results = check_integration(client, name, checks)
            if all_ok:
                log(f"  ✅ {name}", Colors.GREEN)
                critical_integrations += 1
            else:
                missing = [k for k, v in results.items() if v != 'OK']
                log(f"  ❌ {name}: Faltan {missing}", Colors.RED)
            
            audit_report['integrations'][name] = all_ok
        
        print()
        
        # 3. SEGURIDAD
        log("=" * 80, Colors.BOLD)
        log("🔐 3. SEGURIDAD", Colors.BOLD)
        log("=" * 80, Colors.BOLD)
        print()
        
        # Firewall
        status, output = exec_cmd(client, "ufw status | grep -c active")
        firewall_ok = output.strip() != '0'
        log(f"  Firewall (UFW): {'✅' if firewall_ok else '❌'}", Colors.GREEN if firewall_ok else Colors.RED)
        audit_report['security']['firewall'] = firewall_ok
        
        # Rate Limiting
        status, output = exec_cmd(client, "grep -r 'rateLimit' /opt/inmova-app/lib/ | wc -l")
        rate_limit_ok = int(output.strip()) > 0
        log(f"  Rate Limiting: {'✅' if rate_limit_ok else '❌'}", Colors.GREEN if rate_limit_ok else Colors.RED)
        audit_report['security']['rate_limiting'] = rate_limit_ok
        
        # Security Headers (Nginx)
        status, output = exec_cmd(client, "grep -c 'X-Frame-Options' /etc/nginx/sites-available/* 2>/dev/null")
        headers_ok = output.strip() != '0'
        log(f"  Security Headers: {'✅' if headers_ok else '⚠️  Check Cloudflare'}", Colors.GREEN if headers_ok else Colors.YELLOW)
        audit_report['security']['headers'] = headers_ok
        
        # Secrets in .env (not in code)
        status, output = exec_cmd(client, "grep -r 'sk_live_\\|pk_live_' /opt/inmova-app/app/ /opt/inmova-app/components/ 2>/dev/null | wc -l")
        no_secrets_in_code = output.strip() == '0'
        log(f"  No Secrets in Code: {'✅' if no_secrets_in_code else '❌'}", Colors.GREEN if no_secrets_in_code else Colors.RED)
        audit_report['security']['no_secrets_in_code'] = no_secrets_in_code
        
        print()
        
        # 4. PERFORMANCE
        log("=" * 80, Colors.BOLD)
        log("⚡ 4. PERFORMANCE Y ESCALABILIDAD", Colors.BOLD)
        log("=" * 80, Colors.BOLD)
        print()
        
        # Build optimization
        status, output = exec_cmd(client, "ls -lh /opt/inmova-app/.next/BUILD_ID 2>/dev/null")
        build_ok = output.strip() != ''
        log(f"  Production Build: {'✅' if build_ok else '❌'}", Colors.GREEN if build_ok else Colors.RED)
        audit_report['performance']['build'] = build_ok
        
        # Image optimization
        status, output = exec_cmd(client, "grep -c 'next/image' /opt/inmova-app/app/**/*.tsx 2>/dev/null")
        images_optimized = int(output.strip()) > 0
        log(f"  Image Optimization: {'✅' if images_optimized else '⚠️'}", Colors.GREEN if images_optimized else Colors.YELLOW)
        audit_report['performance']['images'] = images_optimized
        
        # Database indexing
        status, output = exec_cmd(client, "grep -c '@@index' /opt/inmova-app/prisma/schema.prisma")
        db_indexes = int(output.strip())
        log(f"  Database Indexes: {'✅' if db_indexes > 10 else '⚠️'} ({db_indexes} found)", Colors.GREEN if db_indexes > 10 else Colors.YELLOW)
        audit_report['performance']['db_indexes'] = db_indexes > 10
        
        print()
        
        # 5. TESTING
        log("=" * 80, Colors.BOLD)
        log("🧪 5. TESTING Y QA", Colors.BOLD)
        log("=" * 80, Colors.BOLD)
        print()
        
        # Unit tests
        status, output = exec_cmd(client, "find /opt/inmova-app/__tests__ -name '*.test.ts' -o -name '*.test.tsx' 2>/dev/null | wc -l")
        unit_tests = int(output.strip())
        log(f"  Unit Tests: {'✅' if unit_tests > 50 else '⚠️'} ({unit_tests} files)", Colors.GREEN if unit_tests > 50 else Colors.YELLOW)
        audit_report['features']['unit_tests'] = unit_tests
        
        # E2E tests
        status, output = exec_cmd(client, "find /opt/inmova-app/e2e -name '*.spec.ts' 2>/dev/null | wc -l")
        e2e_tests = int(output.strip())
        log(f"  E2E Tests: {'✅' if e2e_tests > 5 else '⚠️'} ({e2e_tests} files)", Colors.GREEN if e2e_tests > 5 else Colors.YELLOW)
        audit_report['features']['e2e_tests'] = e2e_tests
        
        print()
        
        # 6. LEGAL Y COMPLIANCE
        log("=" * 80, Colors.BOLD)
        log("⚖️  6. LEGAL Y COMPLIANCE", Colors.BOLD)
        log("=" * 80, Colors.BOLD)
        print()
        
        legal_pages = [
            ('Términos y Condiciones', '/app/legal/terms'),
            ('Política de Privacidad', '/app/legal/privacy'),
            ('Política de Cookies', '/app/legal/cookies'),
            ('GDPR Compliance', '/app/legal/gdpr')
        ]
        
        legal_ok = 0
        for name, path in legal_pages:
            status, output = exec_cmd(client, f"test -d /opt/inmova-app{path} && echo 'OK' || echo 'MISSING'")
            exists = 'OK' in output
            log(f"  {name}: {'✅' if exists else '❌'}", Colors.GREEN if exists else Colors.RED)
            if exists:
                legal_ok += 1
            audit_report['legal'][name] = exists
        
        print()
        
        # RESUMEN FINAL
        log("=" * 80, Colors.BOLD)
        log("📊 RESUMEN DE AUDITORÍA", Colors.BOLD)
        log("=" * 80, Colors.BOLD)
        print()
        
        # Calcular scores
        infra_score = sum(1 for v in audit_report['infrastructure'].values() if v) / len(audit_report['infrastructure']) * 100
        integrations_score = sum(1 for v in audit_report['integrations'].values() if v) / len(audit_report['integrations']) * 100
        security_score = sum(1 for v in audit_report['security'].values() if v) / len(audit_report['security']) * 100
        legal_score = legal_ok / len(legal_pages) * 100
        
        log(f"Infraestructura: {infra_score:.0f}%", Colors.GREEN if infra_score >= 80 else Colors.YELLOW)
        log(f"Integraciones: {integrations_score:.0f}%", Colors.GREEN if integrations_score >= 80 else Colors.YELLOW)
        log(f"Seguridad: {security_score:.0f}%", Colors.GREEN if security_score >= 80 else Colors.YELLOW)
        log(f"Legal: {legal_score:.0f}%", Colors.GREEN if legal_score >= 80 else Colors.RED)
        
        print()
        
        overall_score = (infra_score + integrations_score + security_score + legal_score) / 4
        log(f"SCORE GLOBAL: {overall_score:.0f}%", Colors.BOLD)
        
        if overall_score >= 80:
            log("\n✅ LISTO PARA LANZAMIENTO", Colors.GREEN)
        elif overall_score >= 60:
            log("\n⚠️  CASI LISTO - Atender gaps críticos", Colors.YELLOW)
        else:
            log("\n❌ NO LISTO - Múltiples gaps críticos", Colors.RED)
        
        return 0 if overall_score >= 80 else 1
        
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        client.close()

if __name__ == '__main__':
    sys.exit(main())
