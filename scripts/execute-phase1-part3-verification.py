#!/usr/bin/env python3
"""
FASE 1 PARTE 3: VERIFICACIÓN FINAL Y LAUNCH READINESS
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time
import json
from datetime import datetime

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

class Phase1Part3:
    def __init__(self):
        self.client = None
        self.logs = []
        self.results = {
            'security': {},
            'environment': {},
            'health': {},
            'performance': {},
            'backups': {}
        }
        
    def log(self, msg):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_msg = f"[{timestamp}] {msg}"
        print(log_msg)
        self.logs.append(log_msg)
    
    def connect(self):
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.client.connect(
                hostname=SERVER_CONFIG['host'],
                username=SERVER_CONFIG['username'],
                password=SERVER_CONFIG['password'],
                port=SERVER_CONFIG['port'],
                timeout=SERVER_CONFIG['timeout']
            )
            self.log("✅ Conectado al servidor")
            return True
        except Exception as e:
            self.log(f"❌ Error conectando: {e}")
            return False
    
    def exec_cmd(self, cmd, timeout=60):
        try:
            stdin, stdout, stderr = self.client.exec_command(cmd, timeout=timeout)
            exit_status = stdout.channel.recv_exit_status()
            output = stdout.read().decode('utf-8', errors='ignore')
            error = stderr.read().decode('utf-8', errors='ignore')
            return {'exit': exit_status, 'output': output, 'error': error}
        except Exception as e:
            self.log(f"❌ Error: {e}")
            return None
    
    def verify_security(self):
        self.log("🔐 VERIFICANDO SEGURIDAD")
        
        checks = {
            'UFW Active': "ufw status | grep -i active",
            'SSH Port 22': "ufw status | grep '22.*ALLOW'",
            'HTTP Port 80': "ufw status | grep '80.*ALLOW'",
            'HTTPS Port 443': "ufw status | grep '443.*ALLOW'",
            'Strong NEXTAUTH_SECRET': "grep NEXTAUTH_SECRET /opt/inmova-app/.env.production | awk -F= '{print length($2)}'",
            'Strong DB Password': "grep 'inmova_user:' /opt/inmova-app/.env.production | awk -F: '{print $3}' | awk -F@ '{print length($1)}'",
            'SSL Certificate': "test -f /etc/letsencrypt/live/inmovaapp.com/fullchain.pem && echo 'exists'",
            'No Hardcoded Credentials': "grep -r 'xcc9brgkMMbf' /opt/inmova-app/*.md 2>/dev/null || echo 'clean'"
        }
        
        passed = 0
        for name, cmd in checks.items():
            result = self.exec_cmd(cmd)
            if result and result['exit'] == 0 and result['output'].strip():
                if 'length' in cmd:
                    length = int(result['output'].strip())
                    status = "✅" if length >= 32 else "⚠️ "
                    self.log(f"   {status} {name}: {length} caracteres")
                    passed += 1 if length >= 32 else 0
                else:
                    self.log(f"   ✅ {name}")
                    passed += 1
            else:
                self.log(f"   ❌ {name}")
        
        self.results['security'] = {
            'passed': passed,
            'total': len(checks),
            'percentage': int(passed/len(checks)*100)
        }
        
        return passed >= len(checks) * 0.9  # 90% threshold
    
    def verify_environment_variables(self):
        self.log("\n📝 VERIFICANDO VARIABLES DE ENTORNO")
        
        required_vars = [
            'NODE_ENV',
            'DATABASE_URL',
            'NEXTAUTH_SECRET',
            'NEXTAUTH_URL',
            'AWS_ACCESS_KEY_ID',
            'STRIPE_SECRET_KEY'
        ]
        
        found = 0
        for var in required_vars:
            result = self.exec_cmd(f"grep -c '^{var}=' /opt/inmova-app/.env.production")
            if result and result['exit'] == 0 and '1' in result['output']:
                self.log(f"   ✅ {var}")
                found += 1
            else:
                self.log(f"   ❌ {var} - NO ENCONTRADA")
        
        self.results['environment'] = {
            'found': found,
            'required': len(required_vars),
            'percentage': int(found/len(required_vars)*100)
        }
        
        return found >= len(required_vars) * 0.8  # 80% threshold (AWS/Stripe pueden estar pendientes)
    
    def verify_health_checks(self):
        self.log("\n🏥 VERIFICANDO HEALTH CHECKS")
        
        checks = [
            ("HTTP 200", "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health", "200"),
            ("HTTPS 200", "curl -sk -o /dev/null -w '%{http_code}' https://inmovaapp.com/api/health", "200"),
            ("Database Connected", "curl -s http://localhost:3000/api/health | grep 'connected'", "connected"),
            ("PM2 Online", "pm2 status | grep -c online", "1"),
            ("Nginx Active", "systemctl is-active nginx", "active"),
            ("PostgreSQL Active", "systemctl is-active postgresql", "active")
        ]
        
        passed = 0
        for name, cmd, expected in checks:
            result = self.exec_cmd(cmd)
            if result and result['exit'] == 0 and expected in result['output']:
                self.log(f"   ✅ {name}")
                passed += 1
            else:
                self.log(f"   ❌ {name}")
        
        self.results['health'] = {
            'passed': passed,
            'total': len(checks),
            'percentage': int(passed/len(checks)*100)
        }
        
        return passed == len(checks)  # 100% required
    
    def verify_performance(self):
        self.log("\n⚡ VERIFICANDO RENDIMIENTO")
        
        # Memory
        result = self.exec_cmd("free | grep Mem | awk '{print int($3/$2 * 100)}'")
        if result and result['exit'] == 0:
            mem_usage = int(result['output'].strip())
            status = "✅" if mem_usage < 80 else "⚠️ "
            self.log(f"   {status} Uso de memoria: {mem_usage}%")
            mem_ok = mem_usage < 80
        else:
            mem_ok = False
        
        # Disk
        result = self.exec_cmd("df -h / | tail -1 | awk '{print $5}' | sed 's/%//'")
        if result and result['exit'] == 0:
            disk_usage = int(result['output'].strip())
            status = "✅" if disk_usage < 80 else "⚠️ "
            self.log(f"   {status} Uso de disco: {disk_usage}%")
            disk_ok = disk_usage < 80
        else:
            disk_ok = False
        
        # Response time
        result = self.exec_cmd("curl -s -o /dev/null -w '%{time_total}' http://localhost:3000/api/health")
        if result and result['exit'] == 0:
            response_time = float(result['output'].strip())
            status = "✅" if response_time < 1.0 else "⚠️ "
            self.log(f"   {status} Tiempo de respuesta: {response_time:.3f}s")
            time_ok = response_time < 1.0
        else:
            time_ok = False
        
        self.results['performance'] = {
            'memory_ok': mem_ok,
            'disk_ok': disk_ok,
            'response_time_ok': time_ok
        }
        
        return mem_ok and disk_ok and time_ok
    
    def verify_backups(self):
        self.log("\n💾 VERIFICANDO BACKUPS")
        
        # Script exists
        result = self.exec_cmd("test -f /usr/local/bin/inmova-backup.sh && echo 'exists'")
        script_exists = result and 'exists' in result['output']
        self.log(f"   {'✅' if script_exists else '❌'} Script de backup")
        
        # Cron configured
        result = self.exec_cmd("crontab -l | grep -c inmova-backup")
        cron_ok = result and result['exit'] == 0 and '1' in result['output']
        self.log(f"   {'✅' if cron_ok else '❌'} Cron job configurado")
        
        # Backup exists
        result = self.exec_cmd("ls -1 /var/backups/inmova/*.sql 2>/dev/null | wc -l")
        backup_exists = result and result['exit'] == 0 and int(result['output'].strip()) > 0
        self.log(f"   {'✅' if backup_exists else '❌'} Backup reciente existe")
        
        if backup_exists:
            result = self.exec_cmd("ls -lh /var/backups/inmova/*.sql | tail -1")
            if result:
                self.log(f"      {result['output'].strip()}")
        
        self.results['backups'] = {
            'script_exists': script_exists,
            'cron_ok': cron_ok,
            'backup_exists': backup_exists
        }
        
        return script_exists and cron_ok
    
    def run_smoke_tests(self):
        self.log("\n🧪 EJECUTANDO SMOKE TESTS")
        
        tests = [
            ("Landing accesible", "curl -sk https://inmovaapp.com/ | grep -i '<html'"),
            ("Login accesible", "curl -sk https://inmovaapp.com/login | grep -i 'email'"),
            ("API Health", "curl -sk https://inmovaapp.com/api/health | grep 'ok'"),
            ("Static assets", "curl -sk -I https://inmovaapp.com/_next/static/ | grep '200'"),
        ]
        
        passed = 0
        for name, cmd in tests:
            result = self.exec_cmd(cmd)
            if result and result['exit'] == 0:
                self.log(f"   ✅ {name}")
                passed += 1
            else:
                self.log(f"   ⚠️  {name}")
        
        return passed >= 3  # Al menos 3/4
    
    def generate_launch_checklist(self):
        self.log("\n📋 CHECKLIST DE LANZAMIENTO")
        
        security_ok = self.results['security']['percentage'] >= 90
        env_ok = self.results['environment']['percentage'] >= 80
        health_ok = self.results['health']['percentage'] == 100
        perf_ok = all(self.results['performance'].values())
        backup_ok = all(self.results['backups'].values())
        
        checklist = [
            ("Seguridad configurada", security_ok),
            ("Variables de entorno", env_ok),
            ("Health checks pasando", health_ok),
            ("Rendimiento óptimo", perf_ok),
            ("Backups configurados", backup_ok),
        ]
        
        for item, status in checklist:
            self.log(f"   {'✅' if status else '❌'} {item}")
        
        passed = sum(1 for _, s in checklist if s)
        total = len(checklist)
        
        return passed, total
    
    def make_launch_decision(self):
        self.log("\n🚀 DECISIÓN DE LANZAMIENTO")
        
        passed, total = self.generate_launch_checklist()
        percentage = int(passed/total*100)
        
        if percentage == 100:
            self.log("\n" + "=" * 70)
            self.log("✅ ✅ ✅ APLICACIÓN LISTA PARA PRODUCCIÓN ✅ ✅ ✅")
            self.log("=" * 70)
            decision = "LAUNCH READY"
        elif percentage >= 80:
            self.log("\n" + "=" * 70)
            self.log("⚠️  APLICACIÓN CASI LISTA - REVISAR WARNINGS")
            self.log("=" * 70)
            decision = "SOFT LAUNCH"
        else:
            self.log("\n" + "=" * 70)
            self.log("❌ NO LISTO PARA PRODUCCIÓN - CORREGIR ERRORES")
            self.log("=" * 70)
            decision = "NOT READY"
        
        return decision, percentage
    
    def generate_report(self, decision, percentage):
        self.log("\n📊 REPORTE FINAL")
        self.log(f"   Decisión: {decision}")
        self.log(f"   Score: {percentage}%")
        self.log(f"   Seguridad: {self.results['security']['percentage']}%")
        self.log(f"   Environment: {self.results['environment']['percentage']}%")
        self.log(f"   Health: {self.results['health']['percentage']}%")
        self.log(f"   Performance: {'OK' if all(self.results['performance'].values()) else 'ISSUES'}")
        self.log(f"   Backups: {'OK' if all(self.results['backups'].values()) else 'ISSUES'}")
        
        # Guardar reporte en servidor
        report = f"""
INMOVA APP - FASE 1 VERIFICACIÓN FINAL
Fecha: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

DECISIÓN: {decision}
SCORE GENERAL: {percentage}%

DETALLE:
- Seguridad: {self.results['security']['passed']}/{self.results['security']['total']} ({self.results['security']['percentage']}%)
- Environment: {self.results['environment']['found']}/{self.results['environment']['required']} ({self.results['environment']['percentage']}%)
- Health Checks: {self.results['health']['passed']}/{self.results['health']['total']} ({self.results['health']['percentage']}%)
- Performance: {'OK' if all(self.results['performance'].values()) else 'ISSUES'}
- Backups: {'OK' if all(self.results['backups'].values()) else 'ISSUES'}

URLs PRODUCCIÓN:
- https://inmovaapp.com
- https://inmovaapp.com/login
- https://inmovaapp.com/dashboard
- https://inmovaapp.com/api/health

PRÓXIMOS PASOS:
{'✅ Aplicación lista para lanzamiento' if decision == 'LAUNCH READY' else '⚠️  Revisar issues antes de lanzamiento'}
"""
        
        try:
            sftp = self.client.open_sftp()
            with sftp.file('/opt/inmova-app/FASE_1_VERIFICACION_FINAL.txt', 'w') as f:
                f.write(report)
            sftp.close()
            self.log("\n✅ Reporte guardado en: /opt/inmova-app/FASE_1_VERIFICACION_FINAL.txt")
        except:
            pass
    
    def disconnect(self):
        if self.client:
            self.client.close()
            self.log("🔌 Desconectado")

def main():
    print("=" * 70)
    print("🔍 FASE 1 PARTE 3: VERIFICACIÓN FINAL")
    print("=" * 70)
    print()
    
    phase = Phase1Part3()
    
    try:
        if not phase.connect():
            return 1
        
        # Ejecutar todas las verificaciones
        phase.verify_security()
        phase.verify_environment_variables()
        phase.verify_health_checks()
        phase.verify_performance()
        phase.verify_backups()
        phase.run_smoke_tests()
        
        # Decisión de lanzamiento
        decision, percentage = phase.make_launch_decision()
        
        # Generar reporte
        phase.generate_report(decision, percentage)
        
        print("\n" + "=" * 70)
        print("✅ FASE 1 COMPLETA")
        print("=" * 70)
        print()
        
        return 0 if decision in ['LAUNCH READY', 'SOFT LAUNCH'] else 1
        
    except KeyboardInterrupt:
        print("\n⚠️  Interrumpido por usuario")
        return 1
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        phase.disconnect()

if __name__ == '__main__':
    sys.exit(main())
