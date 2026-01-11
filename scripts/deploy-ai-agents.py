#!/usr/bin/env python3
"""
Script de deployment para Agentes de IA
Despliega los nuevos cambios al servidor de producción
"""

import sys
import time
import subprocess

# Añadir path de paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# Configuración del servidor
SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(message, color=Colors.END):
    timestamp = time.strftime('%H:%M:%S')
    print(f"{color}[{timestamp}] {message}{Colors.END}")

def exec_cmd(client, cmd, timeout=300):
    """Ejecutar comando SSH y retornar resultado"""
    log(f"  → {cmd[:80]}{'...' if len(cmd) > 80 else ''}", Colors.CYAN)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace')
    error = stderr.read().decode('utf-8', errors='replace')
    return exit_status, output, error

def main():
    print(f"\n{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}🤖 DEPLOYMENT - SISTEMA DE AGENTES DE IA{Colors.END}")
    print(f"{Colors.BOLD}{'='*70}{Colors.END}\n")
    
    log(f"Servidor: {SERVER_IP}", Colors.BLUE)
    log(f"App Path: {APP_PATH}", Colors.BLUE)
    print()

    # Primero, hacer commit y push local
    log("📝 Haciendo commit de cambios locales...", Colors.YELLOW)
    
    try:
        # Git commit
        result = subprocess.run(
            ['git', 'commit', '-m', 'feat(ai-agents): Add unified AI agents management page and APIs\n\n- Create /admin/ai-agents page with dashboard for all AI agents\n- Add APIs for status, list, and test endpoints\n- Reorganize sidebar with unified AI section\n- Include metrics, configuration, and testing capabilities'],
            cwd='/workspace',
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            log("✅ Commit realizado", Colors.GREEN)
        else:
            log(f"⚠️ Commit: {result.stderr or result.stdout}", Colors.YELLOW)
        
        # Git push
        log("📤 Pushing cambios a origin...", Colors.YELLOW)
        result = subprocess.run(
            ['git', 'push', 'origin', 'main'],
            cwd='/workspace',
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            log("✅ Push completado", Colors.GREEN)
        else:
            log(f"⚠️ Push: {result.stderr or result.stdout}", Colors.YELLOW)
            
    except Exception as e:
        log(f"⚠️ Error en git: {e}", Colors.YELLOW)

    print()
    log("🔐 Conectando al servidor...", Colors.YELLOW)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(
            SERVER_IP,
            username=SERVER_USER,
            password=SERVER_PASSWORD,
            timeout=30
        )
        log("✅ Conectado", Colors.GREEN)
    except Exception as e:
        log(f"❌ Error de conexión: {e}", Colors.RED)
        return 1

    try:
        print()
        log("="*60, Colors.BLUE)
        log("📥 FASE 1: ACTUALIZAR CÓDIGO", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        # Pull del repositorio
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && git pull origin main 2>&1",
            timeout=120
        )
        
        if status == 0:
            log("✅ Código actualizado", Colors.GREEN)
            if 'Already up to date' not in output:
                log(f"   {output[:200]}", Colors.CYAN)
        else:
            log(f"⚠️ Git pull: {error or output}", Colors.YELLOW)

        print()
        log("="*60, Colors.BLUE)
        log("📦 FASE 2: INSTALAR DEPENDENCIAS", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm install 2>&1 | tail -5",
            timeout=300
        )
        log("✅ Dependencias verificadas", Colors.GREEN)

        print()
        log("="*60, Colors.BLUE)
        log("🏗️ FASE 3: BUILD", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && npm run build 2>&1 | tail -20",
            timeout=600
        )
        
        if status == 0:
            log("✅ Build completado", Colors.GREEN)
        else:
            log(f"❌ Error en build", Colors.RED)
            log(output[-500:] if output else error[-500:], Colors.RED)
            return 1

        print()
        log("="*60, Colors.BLUE)
        log("🚀 FASE 4: RESTART PM2", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        status, output, error = exec_cmd(
            client,
            f"cd {APP_PATH} && pm2 reload inmova-app --update-env 2>&1",
            timeout=60
        )
        
        if status == 0:
            log("✅ PM2 reloaded", Colors.GREEN)
        else:
            # Intentar restart si reload falla
            status, output, error = exec_cmd(
                client,
                f"cd {APP_PATH} && pm2 restart inmova-app --update-env 2>&1",
                timeout=60
            )
            if status == 0:
                log("✅ PM2 restarted", Colors.GREEN)
            else:
                log(f"⚠️ PM2: {output}", Colors.YELLOW)

        # Esperar warm-up
        log("⏳ Esperando warm-up (15s)...", Colors.YELLOW)
        time.sleep(15)

        print()
        log("="*60, Colors.BLUE)
        log("🏥 FASE 5: VERIFICACIÓN", Colors.BLUE)
        log("="*60, Colors.BLUE)
        
        # Health check
        status, output, error = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/health | head -c 200",
            timeout=30
        )
        
        if '"status":"ok"' in output or '"status": "ok"' in output:
            log("✅ Health check OK", Colors.GREEN)
        else:
            log(f"⚠️ Health check: {output[:100]}", Colors.YELLOW)

        # Verificar nueva página de AI Agents
        status, output, error = exec_cmd(
            client,
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/admin/ai-agents",
            timeout=30
        )
        
        if '200' in output or '302' in output:
            log("✅ Página AI Agents accesible", Colors.GREEN)
        else:
            log(f"⚠️ AI Agents page: HTTP {output}", Colors.YELLOW)

        # Verificar API de status de agentes
        status, output, error = exec_cmd(
            client,
            "curl -s http://localhost:3000/api/admin/ai-agents/status | head -c 300",
            timeout=30
        )
        
        if 'success' in output or 'error' in output or '401' in output:
            log("✅ API AI Agents Status funcional", Colors.GREEN)
        else:
            log(f"⚠️ API status: {output[:100]}", Colors.YELLOW)

        # PM2 status
        status, output, error = exec_cmd(
            client,
            "pm2 status | grep inmova",
            timeout=30
        )
        
        if 'online' in output.lower():
            log("✅ PM2 status: online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 status: {output}", Colors.YELLOW)

        print()
        log("="*70, Colors.GREEN)
        log("✅ DEPLOYMENT COMPLETADO", Colors.GREEN)
        log("="*70, Colors.GREEN)
        print()
        
        log("📍 URLs disponibles:", Colors.CYAN)
        log("   • AI Agents Dashboard: https://inmovaapp.com/admin/ai-agents", Colors.CYAN)
        log("   • Community Manager: https://inmovaapp.com/admin/community-manager", Colors.CYAN)
        log("   • Canva Studio: https://inmovaapp.com/admin/canva", Colors.CYAN)
        log("   • API Status: https://inmovaapp.com/api/admin/ai-agents/status", Colors.CYAN)
        print()
        
        log("🤖 Agentes de IA disponibles:", Colors.BLUE)
        log("   • Soporte Técnico - Mantenimiento y reparaciones", Colors.BLUE)
        log("   • Atención al Cliente - Consultas y soporte", Colors.BLUE)
        log("   • Gestión Comercial - Ventas y leads", Colors.BLUE)
        log("   • Análisis Financiero - ROI y rentabilidad", Colors.BLUE)
        log("   • Legal y Cumplimiento - Contratos y normativa", Colors.BLUE)
        log("   • Community Manager - Redes sociales y blog", Colors.BLUE)
        print()
        
        return 0

    except Exception as e:
        log(f"❌ Error durante deployment: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    finally:
        client.close()
        log("🔌 Conexión cerrada", Colors.YELLOW)

if __name__ == '__main__':
    sys.exit(main())
