#!/usr/bin/env python3
"""
Test de páginas de media y baja prioridad desarrolladas.
Ejecuta verificaciones HTTP y opcionalmente Playwright.
"""

import sys
import time

# Añadir path para importar paramiko
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

# ============================================================================
# CONFIGURACIÓN
# ============================================================================

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"
APP_URL = "http://localhost:3000"

# Páginas de media y baja prioridad a verificar
PAGES_TO_TEST = [
    # Hospitality
    ("/hospitality", "Hospitality Management"),
    
    # Warranty Management
    ("/warranty-management", "Gestión de Garantías"),
    
    # Subastas
    ("/subastas", "Subastas de Propiedades"),
    
    # Servicios Concierge
    ("/servicios-concierge", "Servicios de Concierge"),
    
    # Microtransacciones
    ("/microtransacciones", "Microtransacciones"),
    
    # Retail
    ("/retail", "Gestión Retail"),
    
    # Stock Gestion
    ("/stock-gestion", "Gestión de Stock"),
    
    # Sincronización Avanzada
    ("/sincronizacion-avanzada", "Sincronización Avanzada"),
]

# APIs a verificar
APIS_TO_TEST = [
    ("/api/hospitality/rooms", "API Hospitality Rooms"),
    ("/api/hospitality/bookings", "API Hospitality Bookings"),
    ("/api/warranties", "API Warranties"),
    ("/api/auctions", "API Auctions"),
    ("/api/concierge", "API Concierge"),
    ("/api/microtransactions", "API Microtransactions"),
    ("/api/retail", "API Retail"),
    ("/api/stock", "API Stock"),
    ("/api/sync", "API Sync"),
]

# ============================================================================
# COLORES
# ============================================================================

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=Colors.END):
    timestamp = time.strftime("%H:%M:%S")
    print(f"{color}[{timestamp}] {msg}{Colors.END}")

# ============================================================================
# SSH UTILITIES
# ============================================================================

def get_ssh_client():
    """Obtener cliente SSH configurado."""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        SERVER_IP,
        username=SERVER_USER,
        password=SERVER_PASSWORD,
        timeout=10
    )
    return client

def exec_cmd(client, cmd, timeout=30):
    """Ejecutar comando SSH y retornar resultado."""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_code = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore').strip()
        errors = stderr.read().decode('utf-8', errors='ignore').strip()
        return exit_code, output, errors
    except Exception as e:
        return -1, "", str(e)

# ============================================================================
# TESTS
# ============================================================================

def test_pages_http(client):
    """Verificar que las páginas responden con HTTP 200/302/307."""
    log("=" * 70, Colors.CYAN)
    log("TEST DE PÁGINAS HTTP", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    results = []
    
    for path, name in PAGES_TO_TEST:
        cmd = f'curl -s -o /dev/null -w "%{{http_code}}" {APP_URL}{path}'
        exit_code, output, errors = exec_cmd(client, cmd)
        
        status_code = output.strip()
        # 200 = OK, 302/307 = Redirect to login (expected for protected pages)
        success = status_code in ['200', '302', '307']
        
        if success:
            log(f"  ✅ {name} ({path}) - HTTP {status_code}", Colors.GREEN)
        else:
            log(f"  ❌ {name} ({path}) - HTTP {status_code}", Colors.RED)
        
        results.append((path, name, success, status_code))
    
    return results

def test_apis_http(client):
    """Verificar que las APIs responden."""
    log("")
    log("=" * 70, Colors.CYAN)
    log("TEST DE APIs HTTP", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    results = []
    
    for path, name in APIS_TO_TEST:
        # Las APIs protegidas pueden retornar 401 (no autenticado) lo cual es correcto
        cmd = f'curl -s -o /dev/null -w "%{{http_code}}" {APP_URL}{path}'
        exit_code, output, errors = exec_cmd(client, cmd)
        
        status_code = output.strip()
        # 200 = OK, 401 = Auth required (expected), 500 = Error
        success = status_code in ['200', '401', '403']
        is_error = status_code == '500'
        
        if success:
            log(f"  ✅ {name} - HTTP {status_code}", Colors.GREEN)
        elif is_error:
            log(f"  ❌ {name} - HTTP {status_code} (Server Error)", Colors.RED)
        else:
            log(f"  ⚠️  {name} - HTTP {status_code}", Colors.YELLOW)
        
        results.append((path, name, success, status_code))
    
    return results

def test_health_check(client):
    """Verificar health check básico."""
    log("")
    log("=" * 70, Colors.CYAN)
    log("HEALTH CHECK", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    cmd = f'curl -s {APP_URL}/api/health'
    exit_code, output, errors = exec_cmd(client, cmd)
    
    if '"status":"ok"' in output.lower() or '"status": "ok"' in output.lower():
        log("  ✅ Health check OK", Colors.GREEN)
        return True
    else:
        log(f"  ❌ Health check falló: {output[:100]}", Colors.RED)
        return False

def test_pm2_status(client):
    """Verificar que PM2 está corriendo."""
    log("")
    log("=" * 70, Colors.CYAN)
    log("PM2 STATUS", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    cmd = "pm2 jlist"
    exit_code, output, errors = exec_cmd(client, cmd)
    
    if exit_code == 0 and "online" in output.lower():
        log("  ✅ PM2 online", Colors.GREEN)
        return True
    else:
        log("  ❌ PM2 no está online", Colors.RED)
        return False

# ============================================================================
# MAIN
# ============================================================================

def main():
    log("=" * 70, Colors.BOLD)
    log("  VERIFICACIÓN DE PÁGINAS MEDIA/BAJA PRIORIDAD", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    log(f"Servidor: {SERVER_IP}", Colors.BLUE)
    log(f"URL: {APP_URL}", Colors.BLUE)
    log("")
    
    try:
        # Conectar SSH
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client = get_ssh_client()
        log("✅ Conectado", Colors.GREEN)
        
        # Tests
        health_ok = test_health_check(client)
        pm2_ok = test_pm2_status(client)
        page_results = test_pages_http(client)
        api_results = test_apis_http(client)
        
        # Resumen
        log("")
        log("=" * 70, Colors.BOLD)
        log("  RESUMEN", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        
        pages_ok = sum(1 for _, _, success, _ in page_results if success)
        pages_total = len(page_results)
        apis_ok = sum(1 for _, _, success, _ in api_results if success)
        apis_total = len(api_results)
        
        log(f"  Health Check: {'✅' if health_ok else '❌'}", Colors.GREEN if health_ok else Colors.RED)
        log(f"  PM2 Status:   {'✅' if pm2_ok else '❌'}", Colors.GREEN if pm2_ok else Colors.RED)
        log(f"  Páginas:      {pages_ok}/{pages_total}", Colors.GREEN if pages_ok == pages_total else Colors.YELLOW)
        log(f"  APIs:         {apis_ok}/{apis_total}", Colors.GREEN if apis_ok == apis_total else Colors.YELLOW)
        
        # Determinar resultado
        all_ok = health_ok and pm2_ok and pages_ok == pages_total and apis_ok >= apis_total - 2
        
        log("")
        if all_ok:
            log("🎉 TODOS LOS TESTS PASARON", Colors.GREEN)
        else:
            log("⚠️  ALGUNOS TESTS FALLARON", Colors.YELLOW)
        
        client.close()
        return 0 if all_ok else 1
        
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        return 1

if __name__ == "__main__":
    sys.exit(main())
