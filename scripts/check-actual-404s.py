#!/usr/bin/env python3
"""
Verificar 404s reales - Análisis más profundo
"""

import sys
import time

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
    print(f"{color}[{time.strftime('%H:%M:%S')}] {message}{Colors.END}")

def exec_cmd(client, command, timeout=30):
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    log("🔍 VERIFICACIÓN DETALLADA DE 404s", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado\n", Colors.GREEN)
        
        # Test 1: Dashboard
        log("📋 TEST 1: Dashboard (/dashboard)", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            "curl -s 'http://localhost:3000/dashboard' | head -50",
            timeout=10
        )
        
        print(output)
        print()
        
        # Test 2: Login
        log("📋 TEST 2: Login (/login)", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            "curl -s 'http://localhost:3000/login' | head -50",
            timeout=10
        )
        
        print(output)
        print()
        
        # Test 3: Propiedades
        log("📋 TEST 3: Propiedades (/propiedades)", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            "curl -s 'http://localhost:3000/propiedades' | head -50",
            timeout=10
        )
        
        print(output)
        print()
        
        # Test 4: Verificar si Next.js tiene custom 404
        log("📋 TEST 4: Página 404 explícita (/ruta-que-no-existe)", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            "curl -s 'http://localhost:3000/ruta-que-no-existe-xyz' | head -50",
            timeout=10
        )
        
        print(output)
        print()
        
        # Test 5: Verificar con headers
        log("📋 TEST 5: Headers HTTP del Dashboard", Colors.CYAN)
        log("-" * 70, Colors.CYAN)
        
        status, output, error = exec_cmd(
            client,
            "curl -I 'http://localhost:3000/dashboard'",
            timeout=10
        )
        
        print(output)
        
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()

if __name__ == '__main__':
    main()
