#!/usr/bin/env python3
"""
Verificar que ambos fixes están desplegados
"""
import sys
import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def main():
    print("\n" + "="*70)
    print("  VERIFICACIÓN: Fixes Tutorial Bienvenida")
    print("="*70 + "\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=15)
        print("✅ Conectado al servidor\n")
        
        # Verificar commit actual
        print("🔍 Commit desplegado:")
        stdin, stdout, stderr = client.exec_command(f"cd {APP_PATH} && git log -1 --oneline")
        print(f"   {stdout.read().decode().strip()}\n")
        
        # 1. Verificar OnboardingTour
        print("🔍 Verificando OnboardingTour.tsx...")
        stdin, stdout, stderr = client.exec_command(
            f"grep -c 'tourClosedRef' {APP_PATH}/components/onboarding/OnboardingTour.tsx"
        )
        count = int(stdout.read().decode().strip())
        if count > 0:
            print(f"   ✅ tourClosedRef encontrado ({count} ocurrencias)")
        else:
            print("   ❌ tourClosedRef NO encontrado")
        
        # 2. Verificar SmartOnboardingWizard
        print("\n🔍 Verificando SmartOnboardingWizard.tsx...")
        
        stdin, stdout, stderr = client.exec_command(
            f"grep -c 'WIZARD_DISMISSED_KEY' {APP_PATH}/components/automation/SmartOnboardingWizard.tsx"
        )
        count = int(stdout.read().decode().strip())
        if count > 0:
            print(f"   ✅ WIZARD_DISMISSED_KEY encontrado ({count} ocurrencias)")
        else:
            print("   ❌ WIZARD_DISMISSED_KEY NO encontrado - Fix NO desplegado")
            
        stdin, stdout, stderr = client.exec_command(
            f"grep -c 'dismissedRef' {APP_PATH}/components/automation/SmartOnboardingWizard.tsx"
        )
        count = int(stdout.read().decode().strip())
        if count > 0:
            print(f"   ✅ dismissedRef encontrado ({count} ocurrencias)")
        else:
            print("   ❌ dismissedRef NO encontrado")
            
        stdin, stdout, stderr = client.exec_command(
            f"grep -c 'handleDismiss' {APP_PATH}/components/automation/SmartOnboardingWizard.tsx"
        )
        count = int(stdout.read().decode().strip())
        if count > 0:
            print(f"   ✅ handleDismiss encontrado ({count} ocurrencias)")
        else:
            print("   ❌ handleDismiss NO encontrado")
        
        # 3. Ver ultimos commits
        print("\n🔍 Últimos 5 commits:")
        stdin, stdout, stderr = client.exec_command(f"cd {APP_PATH} && git log -5 --oneline")
        for line in stdout.read().decode().strip().split('\n'):
            print(f"   {line}")
        
        print("\n" + "="*70)
        print("  Verificación completada")
        print("="*70 + "\n")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
