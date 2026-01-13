#!/usr/bin/env python3
"""
Insertar planes de suscripción - versión corregida con comillas
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
    log("📋 INSERTAR PLANES DE SUSCRIPCIÓN", Colors.CYAN)
    log("=" * 70, Colors.CYAN)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=30)
        log("✅ Conectado al servidor", Colors.GREEN)
        
        # SQL para insertar todos los planes
        sql = '''
INSERT INTO subscription_plans (id, nombre, tier, descripcion, "precioMensual", "maxUsuarios", "maxPropiedades", "modulosIncluidos", activo, "createdAt", "updatedAt") 
VALUES 
    ('plan-free', 'Free', 'FREE', 'Plan gratuito para probar', 0, 1, 3, '["dashboard"]'::jsonb, true, NOW(), NOW()),
    ('plan-starter', 'Starter', 'STARTER', 'Para propietarios', 29, 2, 10, '["dashboard","propiedades","inquilinos"]'::jsonb, true, NOW(), NOW()),
    ('plan-pro', 'Professional', 'PROFESSIONAL', 'Para gestores', 79, 5, 50, '["dashboard","propiedades","inquilinos","contratos","pagos"]'::jsonb, true, NOW(), NOW()),
    ('plan-biz', 'Business', 'BUSINESS', 'Para empresas', 199, 15, 200, '["dashboard","propiedades","inquilinos","contratos","pagos","mantenimiento"]'::jsonb, true, NOW(), NOW()),
    ('plan-ent', 'Enterprise', 'ENTERPRISE', 'Solucion enterprise', 499, 1000, 10000, '["all"]'::jsonb, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;
'''
        
        log("\n🌱 Insertando planes...", Colors.BLUE)
        
        # Guardar SQL en archivo
        exec_cmd(client, f'''cat > /tmp/insert_plans.sql << 'EOF'
{sql}
EOF''')
        
        # Ejecutar SQL
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-) && psql "$DB_URL" -f /tmp/insert_plans.sql 2>&1'''
        )
        log(f"  Output: {out}", Colors.CYAN)
        
        # Verificar
        log("\n📊 Verificando...", Colors.BLUE)
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-) && psql "$DB_URL" -c 'SELECT id, nombre, tier, "precioMensual" FROM subscription_plans ORDER BY "precioMensual"' 2>&1'''
        )
        log(f"\n{out}", Colors.CYAN)
        
        # Limpiar
        exec_cmd(client, "rm -f /tmp/insert_plans.sql")
        
        # Contar
        status, out, err = exec_cmd(client, 
            f'''cd {APP_PATH} && DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'?' -f1 | cut -d'=' -f2-) && psql "$DB_URL" -c 'SELECT COUNT(*) as total FROM subscription_plans' 2>&1'''
        )
        log(f"Total registros: {out}", Colors.GREEN)
        
        log("\n" + "=" * 70, Colors.GREEN)
        log("✅ COMPLETADO", Colors.GREEN)
        log("=" * 70, Colors.GREEN)
        
    except Exception as e:
        log(f"❌ Error: {e}", Colors.RED)
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    main()
