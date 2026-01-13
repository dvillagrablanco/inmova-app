#!/usr/bin/env python3
"""
Diagnóstico completo del schema de BD vs Prisma
"""
import sys
import time
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log(msg, color=Colors.END):
    print(f"{color}{msg}{Colors.END}")

def exec_cmd(client, cmd, timeout=120):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return exit_status, stdout.read().decode('utf-8', errors='ignore'), stderr.read().decode('utf-8', errors='ignore')

def main():
    log("=" * 70, Colors.CYAN)
    log("🔍 DIAGNÓSTICO DE SCHEMA BD vs PRISMA", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado al servidor", Colors.GREEN)
        
        # 1. Verificar conexión BD
        log("\n📊 [1/6] Verificando conexión a BD...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && psql "$DATABASE_URL" -c "SELECT 1" 2>&1'''
        )
        if status == 0:
            log("✅ Conexión a BD OK", Colors.GREEN)
        else:
            log(f"❌ Error conectando a BD: {err}", Colors.RED)
            return
        
        # 2. Verificar columnas de tabla Company
        log("\n📋 [2/6] Verificando columnas de tabla Company...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && psql "$DATABASE_URL" -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'Company' ORDER BY ordinal_position"'''
        )
        log(f"\nColumnas en Company:\n{out}", Colors.CYAN)
        
        # Verificar columna específica
        critical_columns = ['esEmpresaPrueba', 'businessVertical', 'parentCompanyId', 'subscriptionPlanId']
        for col in critical_columns:
            if col.lower() in out.lower():
                log(f"  ✅ {col} existe", Colors.GREEN)
            else:
                log(f"  ❌ {col} FALTA", Colors.RED)
        
        # 3. Verificar columnas de tabla users
        log("\n👤 [3/6] Verificando columnas de tabla users...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"'''
        )
        user_columns = ['recoveryEmail', 'mfaEnabled', 'experienceLevel', 'uiMode']
        for col in user_columns:
            if col.lower() in out.lower():
                log(f"  ✅ {col} existe", Colors.GREEN)
            else:
                log(f"  ❌ {col} FALTA", Colors.RED)
        
        # 4. Verificar tablas críticas
        log("\n🗃️ [4/6] Verificando tablas críticas...", Colors.BLUE)
        critical_tables = [
            'Company', 'users', 'Building', 'Unit', 'Tenant', 'Contract',
            'contract_signatures', 'subscription_plans', 'promo_coupons',
            'partners', 'ewoorker_plans', 'company_addons'
        ]
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && psql "$DATABASE_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"'''
        )
        existing_tables = out.lower()
        for table in critical_tables:
            if table.lower() in existing_tables:
                log(f"  ✅ {table} existe", Colors.GREEN)
            else:
                log(f"  ❌ {table} FALTA", Colors.RED)
        
        # 5. Verificar PM2 status
        log("\n⚙️ [5/6] Verificando PM2...", Colors.BLUE)
        status, out, err = exec_cmd(client, "pm2 list")
        if "online" in out.lower():
            log("✅ PM2 online", Colors.GREEN)
        else:
            log(f"⚠️ PM2 status: {out[:500]}", Colors.YELLOW)
        
        # 6. Verificar health endpoint
        log("\n🏥 [6/6] Verificando health check...", Colors.BLUE)
        status, out, err = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        log(f"Health response: {out[:500]}", Colors.CYAN)
        
        # Resumen
        log("\n" + "=" * 70, Colors.CYAN)
        log("📊 RESUMEN DE DIAGNÓSTICO", Colors.CYAN)
        log("=" * 70, Colors.CYAN)
        
        # Verificar Prisma migrations pendientes
        log("\n🔄 Verificando migraciones Prisma pendientes...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f"cd {APP_PATH} && export $(grep -v '^#' .env | xargs) && npx prisma migrate status 2>&1",
            timeout=60
        )
        log(f"\n{out}", Colors.CYAN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
