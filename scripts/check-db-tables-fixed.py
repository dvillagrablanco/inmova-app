#!/usr/bin/env python3
"""
Verificar tablas en la BD de producción - versión corregida
"""
import sys
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
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, out, err

def main():
    log("=" * 70, Colors.CYAN)
    log("🔍 VERIFICACIÓN DE TABLAS EN BD", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado al servidor", Colors.GREEN)
        
        # Obtener DATABASE_URL y limpiar el query string ?schema=public
        log("\n🔑 Obteniendo DATABASE_URL...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-'''
        )
        db_url = out.strip()
        log(f"  URL (sin query string): ***@{db_url.split('@')[-1][:40]}...", Colors.CYAN)
        
        # Tablas críticas que necesitan existir para las APIs problemáticas
        critical_tables = [
            'subscription_plans',  # Para /api/admin/planes
            'promo_coupons',       # Para /api/admin/promo-coupons
            'promo_coupon_usages', # Para contar usos de cupones
            'partners',            # Para /api/admin/partners
            'partner_commissions', # Para /api/admin/partners/comisiones
            'partner_landings',    # Para /api/admin/partners/landings
            'ewoorker_plans',      # Para /api/admin/ewoorker-planes
            'Company',             # Tabla principal de empresas
            'users',               # Usuarios
        ]
        
        # 1. Listar todas las tablas
        log("\n📋 [1/3] Listando todas las tablas en BD...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-) && psql "$DB_URL" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename" 2>&1'''
        )
        log(f"\nTablas existentes:\n{out}", Colors.CYAN)
        existing_tables = out.lower()
        
        # 2. Verificar tablas críticas
        log("\n🔍 [2/3] Verificando tablas críticas...", Colors.BLUE)
        missing_tables = []
        for table in critical_tables:
            if table.lower() in existing_tables:
                log(f"  ✅ {table}", Colors.GREEN)
            else:
                log(f"  ❌ {table} - FALTA", Colors.RED)
                missing_tables.append(table)
        
        # 3. Contar registros en tablas existentes
        log("\n📊 [3/3] Contando registros...", Colors.BLUE)
        for table in ['subscription_plans', 'promo_coupons', 'partners', 'ewoorker_plans', 'Company', 'users']:
            if table.lower() in existing_tables:
                status, out, err = exec_cmd(client, 
                    f'''cd {APP_PATH} && DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-) && psql "$DB_URL" -c 'SELECT COUNT(*) FROM "{table}"' 2>&1'''
                )
                # Extraer el número
                try:
                    lines = [line.strip() for line in out.split('\n') if line.strip()]
                    for line in lines:
                        if line.isdigit():
                            log(f"  {table}: {line} registros", Colors.CYAN)
                            break
                except:
                    log(f"  {table}: (no se pudo contar)", Colors.YELLOW)
        
        # Resumen
        log("\n" + "=" * 70, Colors.CYAN)
        if missing_tables:
            log(f"⚠️ TABLAS FALTANTES: {', '.join(missing_tables)}", Colors.RED)
            log("\nPara sincronizar schema, ejecutar:", Colors.YELLOW)
            log(f"  cd {APP_PATH} && npx prisma db push --accept-data-loss", Colors.YELLOW)
        else:
            log("✅ Todas las tablas críticas existen", Colors.GREEN)
        log("=" * 70, Colors.CYAN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
