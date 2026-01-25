#!/usr/bin/env python3
"""
Script de verificación de deployment en producción para Inmova App.
Uso: python3 scripts/verify-production-deployment.py

Este script verifica:
1. Docker container corriendo
2. Puerto 3000 escuchando
3. Health check local y externo
4. Variables de entorno configuradas
5. Servicios (Nginx, PostgreSQL)
6. APIs funcionando
"""
import sys
import subprocess
import json
import time

try:
    sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
    import paramiko
    HAS_PARAMIKO = True
except ImportError:
    HAS_PARAMIKO = False

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
APP_PATH = "/opt/inmova-app"

class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.RESET):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.RESET}")

def exec_cmd(client, cmd, timeout=60):
    """Ejecutar comando SSH"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='replace').strip()
    return exit_status, output

def verify_deployment(password):
    """Verificar deployment completo"""
    if not HAS_PARAMIKO:
        print("Error: paramiko no instalado. Instalar con: pip install paramiko")
        return False
    
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*70}")
    print("🎯 VERIFICACIÓN DE DEPLOYMENT - INMOVA APP")
    print(f"{'='*70}{Colors.RESET}\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=password, timeout=15)
    except Exception as e:
        log(f"Error conectando: {e}", Colors.RED)
        return False
    
    checks = []
    
    # 1. Docker corriendo
    print(f"{Colors.YELLOW}1. Docker Container:{Colors.RESET}")
    status, output = exec_cmd(client, "docker ps | grep inmova-app-production")
    docker_ok = "Up" in output
    checks.append(("Docker Container", docker_ok))
    print(f"   {'✅' if docker_ok else '❌'} {'Corriendo' if docker_ok else 'No encontrado'}")
    
    # 2. Puerto 3000
    print(f"\n{Colors.YELLOW}2. Puerto 3000:{Colors.RESET}")
    status, output = exec_cmd(client, "ss -tlnp | grep :3000")
    port_ok = ":3000" in output
    checks.append(("Puerto 3000", port_ok))
    print(f"   {'✅' if port_ok else '❌'} {'Escuchando' if port_ok else 'No escuchando'}")
    
    # 3. Health check local
    print(f"\n{Colors.YELLOW}3. Health Check Local:{Colors.RESET}")
    status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
    health_ok = '"status":"ok"' in output
    db_ok = '"database":"connected"' in output
    checks.append(("Health Check", health_ok))
    checks.append(("Base de Datos", db_ok))
    print(f"   {'✅' if health_ok else '❌'} Status: {'OK' if health_ok else 'FAIL'}")
    print(f"   {'✅' if db_ok else '❌'} Database: {'connected' if db_ok else 'disconnected'}")
    
    # 4. Health check externo
    print(f"\n{Colors.YELLOW}4. Health Check Externo:{Colors.RESET}")
    status, output = exec_cmd(client, "curl -s https://inmovaapp.com/api/health")
    external_ok = '"status":"ok"' in output
    checks.append(("Health Externo", external_ok))
    print(f"   {'✅' if external_ok else '❌'} https://inmovaapp.com/api/health")
    
    # 5. Variables críticas
    print(f"\n{Colors.YELLOW}5. Variables Críticas:{Colors.RESET}")
    critical_vars = ["DATABASE_URL", "NEXTAUTH_SECRET", "ANTHROPIC_API_KEY"]
    vars_ok = True
    for var in critical_vars:
        status, output = exec_cmd(client, f"docker exec inmova-app-production printenv {var} 2>/dev/null | head -c 10")
        var_ok = len(output) > 5
        vars_ok = vars_ok and var_ok
        print(f"   {'✅' if var_ok else '❌'} {var}: {'configurada' if var_ok else 'FALTA'}")
    checks.append(("Variables Entorno", vars_ok))
    
    # 6. Servicios
    print(f"\n{Colors.YELLOW}6. Servicios:{Colors.RESET}")
    for service in ["nginx", "postgresql"]:
        status, output = exec_cmd(client, f"systemctl is-active {service} 2>/dev/null || systemctl is-active {service}@14-main 2>/dev/null")
        service_ok = "active" in output
        checks.append((service.title(), service_ok))
        print(f"   {'✅' if service_ok else '❌'} {service.title()}: {'activo' if service_ok else 'inactivo'}")
    
    client.close()
    
    # Resumen
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*70}")
    print("📊 RESUMEN")
    print(f"{'='*70}{Colors.RESET}")
    
    passed = sum(1 for _, ok in checks if ok)
    total = len(checks)
    
    for name, ok in checks:
        color = Colors.GREEN if ok else Colors.RED
        print(f"{color}  {'✅' if ok else '❌'} {name}{Colors.RESET}")
    
    print(f"\n{Colors.BOLD}Resultado: {passed}/{total} checks pasaron{Colors.RESET}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}🎉 ¡Todo funcionando correctamente!{Colors.RESET}")
        return True
    else:
        print(f"\n{Colors.RED}❌ Hay problemas que requieren atención{Colors.RESET}")
        return False

def main():
    print("Inmova App - Verificación de Deployment")
    print("-" * 40)
    
    if len(sys.argv) > 1:
        password = sys.argv[1]
    else:
        import getpass
        password = getpass.getpass("Password del servidor: ")
    
    success = verify_deployment(password)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
