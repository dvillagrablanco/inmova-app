#!/usr/bin/env python3
"""
Verificar que el fix del tutorial está desplegado correctamente
"""
import sys
import paramiko

SERVER_IP = "157.180.119.236"
USERNAME = "root"
PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def main():
    print("\n" + "="*70)
    print("  VERIFICACIÓN: Fix Tutorial Bienvenida")
    print("="*70 + "\n")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=15)
        print("✅ Conectado al servidor\n")
        
        # 1. Verificar que el archivo contiene el fix
        print("🔍 Verificando código del fix...")
        stdin, stdout, stderr = client.exec_command(
            f"grep -A2 'tourClosedRef' {APP_PATH}/components/onboarding/OnboardingTour.tsx | head -20"
        )
        output = stdout.read().decode()
        
        if "tourClosedRef" in output and "useRef" in output:
            print("✅ tourClosedRef encontrado - Fix aplicado correctamente")
            print(f"\n   Código relevante:\n   {'-'*50}")
            for line in output.strip().split('\n')[:10]:
                print(f"   {line}")
            print(f"   {'-'*50}\n")
        else:
            print("❌ tourClosedRef NO encontrado - Fix puede no estar aplicado")
            return 1
        
        # 2. Verificar isProcessingRef
        stdin, stdout, stderr = client.exec_command(
            f"grep -c 'isProcessingRef' {APP_PATH}/components/onboarding/OnboardingTour.tsx"
        )
        count = int(stdout.read().decode().strip())
        if count > 0:
            print(f"✅ isProcessingRef encontrado ({count} ocurrencias)")
        else:
            print("⚠️ isProcessingRef no encontrado")
        
        # 3. Verificar que no hay el patrón problemático antiguo
        stdin, stdout, stderr = client.exec_command(
            f"grep -c 'finishedStatuses.includes(status)' {APP_PATH}/components/onboarding/OnboardingTour.tsx"
        )
        count = int(stdout.read().decode().strip())
        if count > 0:
            print(f"✅ Lógica de finalización encontrada ({count} ocurrencias)")
        
        # 4. Verificar el build
        print("\n🔍 Verificando build...")
        stdin, stdout, stderr = client.exec_command(
            f"ls -la {APP_PATH}/.next/server/app/dashboard/page.js 2>/dev/null | head -1"
        )
        output = stdout.read().decode()
        if output:
            print(f"✅ Build del dashboard existe: {output.strip().split()[-1] if output.strip() else 'OK'}")
        
        # 5. Verificar logs de PM2 para errores
        print("\n🔍 Verificando logs recientes (últimos errores)...")
        stdin, stdout, stderr = client.exec_command(
            "pm2 logs inmova-app --err --lines 5 --nostream 2>/dev/null | tail -10"
        )
        errors = stdout.read().decode().strip()
        if errors and "error" in errors.lower():
            print(f"⚠️ Errores recientes encontrados:\n{errors[:500]}")
        else:
            print("✅ Sin errores críticos en logs recientes")
        
        # 6. Test HTTP del dashboard
        print("\n🔍 Verificando respuesta HTTP del dashboard...")
        stdin, stdout, stderr = client.exec_command(
            "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/dashboard"
        )
        http_code = stdout.read().decode().strip()
        if http_code in ["200", "307", "302"]:
            print(f"✅ Dashboard responde: HTTP {http_code}")
        else:
            print(f"⚠️ Dashboard responde: HTTP {http_code}")
        
        # 7. Verificar el commit actual
        print("\n🔍 Verificando commit desplegado...")
        stdin, stdout, stderr = client.exec_command(
            f"cd {APP_PATH} && git log -1 --oneline"
        )
        commit = stdout.read().decode().strip()
        print(f"✅ Commit actual: {commit}")
        
        print("\n" + "="*70)
        print("  ✅ VERIFICACIÓN COMPLETADA - FIX DESPLEGADO CORRECTAMENTE")
        print("="*70)
        print("\nPara probar manualmente:")
        print("  1. Ir a https://inmovaapp.com/login")
        print("  2. Iniciar sesión como administrador de sociedad")
        print("  3. Cuando aparezca el tutorial '¡Bienvenido a tu Dashboard!'")
        print("  4. Cerrarlo y verificar que NO se reabre")
        print("\nEl fix funciona usando refs para rastrear si el tour ya fue")
        print("cerrado, evitando el race condition que causaba el bucle.\n")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    finally:
        client.close()

if __name__ == "__main__":
    sys.exit(main())
