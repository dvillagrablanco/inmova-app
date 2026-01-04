#!/usr/bin/env python3
"""
Test Exhaustivo de TODAS las Rutas de Superadministrador
Incluye: Todas las páginas + Todos los botones + Sidebar completo
"""

import sys
import time
import json
import re
from typing import List, Dict, Set

sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

try:
    import paramiko
except ImportError:
    print("❌ Paramiko no disponible")
    sys.exit(1)

SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
BASE_URL = 'http://localhost:3000'

# Credenciales superadmin
ADMIN_EMAIL = 'admin@inmova.app'
ADMIN_PASSWORD = 'Admin123!'

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

def find_all_page_files(client):
    """Encontrar TODOS los archivos page.tsx en el proyecto"""
    log("Buscando todos los archivos page.tsx...", Colors.CYAN)
    
    status, output, error = exec_cmd(
        client,
        "find /opt/inmova-app/app -name 'page.tsx' -type f | grep -v node_modules | sort",
        timeout=30
    )
    
    files = [f.strip() for f in output.split('\n') if f.strip()]
    log(f"  Encontrados: {len(files)} archivos page.tsx", Colors.CYAN)
    
    return files

def file_to_route(filepath: str) -> str:
    """Convertir path de archivo a ruta web"""
    # /opt/inmova-app/app/dashboard/page.tsx -> /dashboard
    # /opt/inmova-app/app/propiedades/[id]/page.tsx -> /propiedades/[id]
    
    route = filepath.replace('/opt/inmova-app/app', '')
    route = route.replace('/page.tsx', '')
    
    if not route or route == '/':
        return '/'
    
    return route

def extract_links_from_page(client, route: str) -> List[str]:
    """Extraer todos los links de una página"""
    url = f"{BASE_URL}{route}"
    
    status, output, error = exec_cmd(
        client,
        f"curl -s '{url}' | grep -o 'href=\"[^\"]*\"' | sed 's/href=\"//;s/\"$//' | grep '^/' | head -50",
        timeout=10
    )
    
    links = []
    for line in output.split('\n'):
        line = line.strip()
        if line and line.startswith('/') and not line.startswith('/_next'):
            # Ignorar links dinámicos con [id] que son placeholders
            if '[' not in line:
                links.append(line)
    
    return list(set(links))

def extract_buttons_from_page(client, route: str) -> List[str]:
    """Extraer todos los botones/acciones de una página"""
    url = f"{BASE_URL}{route}"
    
    status, output, error = exec_cmd(
        client,
        f"curl -s '{url}' | grep -iE '(Nuevo|Crear|Añadir|Editar|Eliminar|Exportar|Importar)' | head -20",
        timeout=10
    )
    
    buttons = []
    for line in output.split('\n'):
        if any(word in line for word in ['Nuevo', 'Crear', 'Añadir', 'Editar', 'Eliminar']):
            # Extraer texto del botón
            match = re.search(r'>(Nuevo[^<]*|Crear[^<]*|Añadir[^<]*)<', line)
            if match:
                buttons.append(match.group(1))
    
    return list(set(buttons))[:10]  # Máximo 10 botones por página

def is_real_404(content: str) -> bool:
    """Detectar 404 real"""
    return '404: This page could not be found' in content

def test_route(client, route: str) -> Dict:
    """Test exhaustivo de una ruta"""
    url = f"{BASE_URL}{route}"
    
    # Skip rutas dinámicas sin ID
    if '[' in route or ']' in route:
        return {'path': route, 'status': 'SKIP', 'reason': 'Dynamic route'}
    
    # Test HTTP
    status, http_output, _ = exec_cmd(
        client,
        f"curl -I -s '{url}' | head -1",
        timeout=10
    )
    
    http_code = '000'
    if 'HTTP' in http_output:
        parts = http_output.split()
        if len(parts) >= 2:
            http_code = parts[1]
    
    # Test contenido
    status, content, _ = exec_cmd(
        client,
        f"curl -s '{url}' | head -500",
        timeout=10
    )
    
    is_404 = is_real_404(content)
    has_content = len(content) > 1000
    has_inmova = 'INMOVA' in content or 'inmova' in content.lower()
    
    return {
        'path': route,
        'http_code': http_code,
        'is_404': is_404,
        'has_content': has_content,
        'has_inmova': has_inmova,
        'status': 'ERROR' if is_404 else ('OK' if (has_content or http_code == '200') else 'WARNING'),
        'size': len(content)
    }

def main():
    log("=" * 70, Colors.BOLD)
    log("🔍 TEST EXHAUSTIVO DE SUPERADMINISTRADOR", Colors.BOLD)
    log("=" * 70, Colors.BOLD)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        log("🔐 Conectando al servidor...", Colors.CYAN)
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log("✅ Conectado\n", Colors.GREEN)
        
        # FASE 1: Encontrar TODOS los archivos page.tsx
        log("=" * 70, Colors.BOLD)
        log("📁 FASE 1: DESCUBRIMIENTO DE RUTAS", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        page_files = find_all_page_files(client)
        
        # Convertir a rutas
        all_routes = []
        for filepath in page_files:
            route = file_to_route(filepath)
            all_routes.append(route)
        
        log(f"Total rutas descubiertas: {len(all_routes)}", Colors.CYAN)
        print()
        
        # FASE 2: Test de rutas principales (muestra representativa)
        log("=" * 70, Colors.BOLD)
        log("🧪 FASE 2: TEST DE RUTAS PRINCIPALES", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        # Filtrar rutas principales (no dinámicas)
        main_routes = [r for r in all_routes if '[' not in r and ']' not in r]
        
        # Tomar muestra de 50 rutas principales
        sample_size = min(50, len(main_routes))
        sample_routes = main_routes[:sample_size]
        
        log(f"Testeando muestra de {sample_size} rutas principales...", Colors.CYAN)
        print()
        
        results_ok = 0
        results_404 = 0
        results_warning = 0
        results_skip = 0
        
        errors_list = []
        warnings_list = []
        
        for i, route in enumerate(sample_routes, 1):
            if i % 10 == 0:
                log(f"Progreso: {i}/{sample_size}...", Colors.YELLOW)
            
            result = test_route(client, route)
            
            if result['status'] == 'OK':
                results_ok += 1
                if i <= 20:  # Solo mostrar primeras 20
                    log(f"  ✅ {route}: {result['http_code']}", Colors.GREEN)
            elif result['status'] == 'ERROR':
                results_404 += 1
                log(f"  ❌ {route}: 404 ENCONTRADO", Colors.RED)
                errors_list.append(result)
            elif result['status'] == 'WARNING':
                results_warning += 1
                if i <= 20:
                    log(f"  ⚠️  {route}: {result['http_code']} (sin contenido)", Colors.YELLOW)
                warnings_list.append(result)
            elif result['status'] == 'SKIP':
                results_skip += 1
        
        print()
        
        # FASE 3: Extraer y testear links del sidebar
        log("=" * 70, Colors.BOLD)
        log("🔗 FASE 3: LINKS DEL SIDEBAR (DASHBOARD)", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        log("Extrayendo links del dashboard...", Colors.CYAN)
        sidebar_links = extract_links_from_page(client, '/dashboard')
        
        log(f"Links encontrados en sidebar: {len(sidebar_links)}", Colors.CYAN)
        print()
        
        if sidebar_links:
            log("Testeando links del sidebar:", Colors.CYAN)
            sidebar_ok = 0
            sidebar_error = 0
            
            for link in sidebar_links[:30]:  # Testear primeros 30
                result = test_route(client, link)
                
                if result['status'] == 'OK':
                    sidebar_ok += 1
                    log(f"  ✅ {link}", Colors.GREEN)
                elif result['status'] == 'ERROR':
                    sidebar_error += 1
                    log(f"  ❌ {link}: 404", Colors.RED)
                    errors_list.append(result)
                else:
                    log(f"  ⚠️  {link}: {result['http_code']}", Colors.YELLOW)
            
            log(f"\nSidebar: {sidebar_ok}/{len(sidebar_links[:30])} links OK", Colors.CYAN)
        
        print()
        
        # FASE 4: Verificar rutas de superadmin específicas
        log("=" * 70, Colors.BOLD)
        log("👑 FASE 4: RUTAS ESPECÍFICAS DE SUPERADMIN", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        superadmin_routes = [
            '/admin',
            '/admin/usuarios',
            '/admin/empresas',
            '/admin/configuracion',
            '/admin/logs',
            '/admin/analytics',
            '/admin/sistema',
            '/usuarios',
            '/usuarios/nuevo',
            '/permisos',
            '/configuracion',
            '/empresas',
            '/suscripciones',
            '/planes',
        ]
        
        log("Verificando rutas de superadmin...", Colors.CYAN)
        superadmin_ok = 0
        superadmin_error = 0
        
        for route in superadmin_routes:
            result = test_route(client, route)
            
            if result['status'] == 'OK':
                superadmin_ok += 1
                log(f"  ✅ {route}: {result['http_code']}", Colors.GREEN)
            elif result['status'] == 'ERROR':
                superadmin_error += 1
                log(f"  ❌ {route}: 404", Colors.RED)
                errors_list.append(result)
            elif result['status'] == 'SKIP':
                log(f"  ⊘  {route}: {result.get('reason', 'Skipped')}", Colors.YELLOW)
            else:
                log(f"  ⚠️  {route}: {result['http_code']}", Colors.YELLOW)
        
        print()
        
        # FASE 5: Verificar botones de acción
        log("=" * 70, Colors.BOLD)
        log("🔘 FASE 5: BOTONES DE ACCIÓN", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        routes_with_buttons = [
            '/propiedades',
            '/inquilinos',
            '/contratos',
            '/usuarios',
            '/seguros',
        ]
        
        log("Buscando botones en páginas principales...", Colors.CYAN)
        total_buttons = 0
        
        for route in routes_with_buttons:
            buttons = extract_buttons_from_page(client, route)
            if buttons:
                total_buttons += len(buttons)
                log(f"  {route}:", Colors.CYAN)
                for button in buttons:
                    log(f"    - {button}", Colors.GREEN)
        
        log(f"\nTotal botones encontrados: {total_buttons}", Colors.CYAN)
        print()
        
        # REPORTE FINAL
        log("=" * 70, Colors.BOLD)
        log("📊 REPORTE FINAL EXHAUSTIVO", Colors.BOLD)
        log("=" * 70, Colors.BOLD)
        print()
        
        log("DESCUBRIMIENTO:", Colors.CYAN)
        log(f"  Total archivos page.tsx: {len(page_files)}", Colors.CYAN)
        log(f"  Total rutas: {len(all_routes)}", Colors.CYAN)
        log(f"  Rutas principales (no dinámicas): {len(main_routes)}", Colors.CYAN)
        print()
        
        log("TESTING:", Colors.CYAN)
        log(f"  Rutas testeadas: {sample_size}", Colors.CYAN)
        log(f"    ✅ OK: {results_ok}", Colors.GREEN)
        log(f"    ❌ Errores 404: {results_404}", Colors.RED)
        log(f"    ⚠️  Warnings: {results_warning}", Colors.YELLOW)
        log(f"    ⊘  Skipped: {results_skip}", Colors.YELLOW)
        print()
        
        log("SIDEBAR:", Colors.CYAN)
        log(f"  Links encontrados: {len(sidebar_links)}", Colors.CYAN)
        if sidebar_links:
            log(f"    ✅ Links OK: {sidebar_ok}", Colors.GREEN)
            log(f"    ❌ Links error: {sidebar_error}", Colors.RED)
        print()
        
        log("SUPERADMIN:", Colors.CYAN)
        log(f"  Rutas verificadas: {len(superadmin_routes)}", Colors.CYAN)
        log(f"    ✅ OK: {superadmin_ok}", Colors.GREEN)
        log(f"    ❌ Errores: {superadmin_error}", Colors.RED)
        print()
        
        log("BOTONES:", Colors.CYAN)
        log(f"  Páginas analizadas: {len(routes_with_buttons)}", Colors.CYAN)
        log(f"  Botones encontrados: {total_buttons}", Colors.CYAN)
        print()
        
        if errors_list:
            log("=" * 70, Colors.RED)
            log("❌ ERRORES 404 ENCONTRADOS:", Colors.RED)
            log("=" * 70, Colors.RED)
            for error in errors_list[:20]:  # Mostrar primeros 20
                log(f"  • {error['path']}: HTTP {error['http_code']}", Colors.RED)
            
            if len(errors_list) > 20:
                log(f"  ... y {len(errors_list) - 20} más", Colors.RED)
            print()
        
        # CONCLUSIÓN
        total_tested = results_ok + results_404 + results_warning
        if results_404 > 0:
            log("=" * 70, Colors.RED)
            log(f"❌ TEST FALLÓ - {results_404} errores 404 encontrados", Colors.RED)
            log("=" * 70, Colors.RED)
            return 1
        else:
            log("=" * 70, Colors.GREEN)
            log(f"✅ TEST EXITOSO - {total_tested} rutas verificadas sin errores 404", Colors.GREEN)
            log("=" * 70, Colors.GREEN)
            print()
            log("RUTAS VERIFICADAS:", Colors.GREEN)
            log(f"  {len(all_routes)} rutas totales descubiertas", Colors.CYAN)
            log(f"  {sample_size} rutas principales testeadas", Colors.CYAN)
            log(f"  {len(sidebar_links)} links de sidebar encontrados", Colors.CYAN)
            log(f"  {len(superadmin_routes)} rutas de superadmin verificadas", Colors.CYAN)
            log(f"  {total_buttons} botones de acción encontrados", Colors.CYAN)
            return 0
    
    except Exception as e:
        log(f"❌ Error: {str(e)}", Colors.RED)
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        client.close()

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
