#!/usr/bin/env python3
"""
Debug profundo del problema del bucle de onboarding
"""
import sys
import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    return stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

def main():
    print("\n" + "="*70)
    print("  DEBUG: Bucle de Onboarding")
    print("="*70 + "\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=15)
    print("✅ Conectado\n")
    
    # 1. Ver todos los componentes de onboarding en el dashboard
    print("="*70)
    print("1. COMPONENTES DE ONBOARDING EN DASHBOARD")
    print("="*70)
    out, _ = exec_cmd(client, f"grep -n 'Onboarding\\|Tour\\|Wizard\\|Welcome' {APP_PATH}/app/dashboard/page.tsx")
    print(out if out else "No encontrado")
    
    # 2. Ver imports del dashboard
    print("\n" + "="*70)
    print("2. IMPORTS DEL DASHBOARD")
    print("="*70)
    out, _ = exec_cmd(client, f"head -60 {APP_PATH}/app/dashboard/page.tsx | grep -E '^import'")
    print(out)
    
    # 3. Ver todos los hooks/componentes que podrían causar re-renders
    print("\n" + "="*70)
    print("3. USO DE useEffect EN COMPONENTES DE ONBOARDING")
    print("="*70)
    
    # OnboardingTour
    print("\n--- OnboardingTour.tsx ---")
    out, _ = exec_cmd(client, f"grep -A5 'useEffect' {APP_PATH}/components/onboarding/OnboardingTour.tsx | head -40")
    print(out)
    
    # SmartOnboardingWizard
    print("\n--- SmartOnboardingWizard.tsx ---")
    out, _ = exec_cmd(client, f"grep -A5 'useEffect' {APP_PATH}/components/automation/SmartOnboardingWizard.tsx | head -40")
    print(out)
    
    # 4. Buscar OTROS componentes de onboarding que podrían estar activos
    print("\n" + "="*70)
    print("4. OTROS COMPONENTES DE BIENVENIDA/ONBOARDING")
    print("="*70)
    out, _ = exec_cmd(client, f"grep -r 'Bienvenido' {APP_PATH}/app/dashboard/ --include='*.tsx' -l")
    print("Archivos con 'Bienvenido' en dashboard/:")
    print(out if out else "Ninguno")
    
    # 5. Ver si hay algún componente Joyride adicional
    print("\n" + "="*70)
    print("5. USO DE JOYRIDE")
    print("="*70)
    out, _ = exec_cmd(client, f"grep -r 'Joyride' {APP_PATH}/components/ --include='*.tsx' -l")
    print("Componentes que usan Joyride:")
    print(out if out else "Ninguno")
    
    # 6. Ver la API de onboarding/progress
    print("\n" + "="*70)
    print("6. API /api/onboarding/progress")
    print("="*70)
    out, _ = exec_cmd(client, f"cat {APP_PATH}/app/api/onboarding/progress/route.ts")
    print(out[:2000] if out else "No encontrado")
    
    # 7. Ver el servicio de onboarding
    print("\n" + "="*70)
    print("7. SERVICIO DE ONBOARDING")
    print("="*70)
    out, _ = exec_cmd(client, f"head -100 {APP_PATH}/lib/onboarding-service.ts 2>/dev/null || echo 'Archivo no existe'")
    print(out)
    
    # 8. Logs de PM2 recientes
    print("\n" + "="*70)
    print("8. LOGS PM2 RECIENTES (errores)")
    print("="*70)
    out, _ = exec_cmd(client, "pm2 logs inmova-app --lines 30 --nostream 2>&1 | grep -i 'error\\|warn\\|onboard' | tail -20")
    print(out if out else "Sin errores relacionados")
    
    # 9. Verificar el hook useOnboarding
    print("\n" + "="*70)
    print("9. HOOK useOnboarding")
    print("="*70)
    out, _ = exec_cmd(client, f"cat {APP_PATH}/hooks/useOnboarding.ts")
    print(out)
    
    print("\n" + "="*70)
    print("  DEBUG COMPLETADO")
    print("="*70 + "\n")
    
    client.close()
    return 0

if __name__ == "__main__":
    sys.exit(main())
