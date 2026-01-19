#!/usr/bin/env python3
"""
Verificar todos los fixes desplegados
"""
import sys
import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
    return stdout.read().decode('utf-8', errors='ignore').strip()

def main():
    print("\n" + "="*70)
    print("  VERIFICACIÓN COMPLETA DE FIXES")
    print("="*70 + "\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=15)
    
    # Commit actual
    print("📌 Commit actual:")
    print(f"   {exec_cmd(client, f'cd {APP_PATH} && git log -1 --oneline')}\n")
    
    fixes = [
        ("OnboardingTour.tsx - tourClosedRef", f"grep -c 'tourClosedRef' {APP_PATH}/components/onboarding/OnboardingTour.tsx"),
        ("OnboardingTour.tsx - isProcessingRef", f"grep -c 'isProcessingRef' {APP_PATH}/components/onboarding/OnboardingTour.tsx"),
        ("SmartOnboardingWizard.tsx - WIZARD_DISMISSED_KEY", f"grep -c 'WIZARD_DISMISSED_KEY' {APP_PATH}/components/automation/SmartOnboardingWizard.tsx"),
        ("SmartOnboardingWizard.tsx - handleDismiss", f"grep -c 'handleDismiss' {APP_PATH}/components/automation/SmartOnboardingWizard.tsx"),
        ("useOnboarding.ts - markedAsSeenRef", f"grep -c 'markedAsSeenRef' {APP_PATH}/hooks/useOnboarding.ts"),
        ("useOnboarding.ts - hasLoadedRef", f"grep -c 'hasLoadedRef' {APP_PATH}/hooks/useOnboarding.ts"),
        ("useOnboarding.ts - status === 'authenticated'", f"grep -c \"status === 'authenticated'\" {APP_PATH}/hooks/useOnboarding.ts"),
    ]
    
    all_ok = True
    for name, cmd in fixes:
        count = exec_cmd(client, cmd)
        try:
            n = int(count)
            if n > 0:
                print(f"✅ {name}: {n} ocurrencias")
            else:
                print(f"❌ {name}: NO ENCONTRADO")
                all_ok = False
        except:
            print(f"❌ {name}: ERROR ({count})")
            all_ok = False
    
    print("\n" + "-"*70)
    
    # Verificar el contenido crítico del hook
    print("\n📋 Verificando lógica clave de useOnboarding.ts:")
    
    # Verificar default de hasSeenOnboarding
    out = exec_cmd(client, f"grep 'hasSeenOnboarding: true' {APP_PATH}/hooks/useOnboarding.ts | head -1")
    if out:
        print(f"✅ Default hasSeenOnboarding a TRUE")
    else:
        print(f"❌ Default hasSeenOnboarding NO es TRUE")
        all_ok = False
    
    # Verificar que espera session status
    out = exec_cmd(client, f"grep \"status === 'loading'\" {APP_PATH}/hooks/useOnboarding.ts")
    if out:
        print(f"✅ Verifica session status antes de actuar")
    else:
        print(f"❌ NO verifica session status")
        all_ok = False
    
    print("\n" + "="*70)
    if all_ok:
        print("  ✅ TODOS LOS FIXES ESTÁN DESPLEGADOS CORRECTAMENTE")
    else:
        print("  ❌ ALGUNOS FIXES NO ESTÁN DESPLEGADOS")
    print("="*70 + "\n")
    
    print("Para probar:")
    print("1. Abre una ventana de incógnito")
    print("2. Ve a https://inmovaapp.com/login")
    print("3. Inicia sesión como administrador de sociedad")
    print("4. Cierra el tutorial cuando aparezca")
    print("5. Verifica que NO se reabre\n")
    
    client.close()
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
