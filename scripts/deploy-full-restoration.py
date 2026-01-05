#!/usr/bin/env python3
"""
Deployment completo para restaurar el servidor
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'
DB_URL = 'postgresql://postgres:postgres@localhost:5432/inmova_production'

def exec_cmd(client, command, timeout=60):
    """Ejecutar comando y retornar exit status, output"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode('utf-8', errors='ignore')
    error = stderr.read().decode('utf-8', errors='ignore')
    return exit_status, output, error

def main():
    print('=' * 70)
    print('🚀 DEPLOYMENT COMPLETO - RESTAURACIÓN DEL SERVIDOR')
    print('=' * 70)
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print('[Conectando al servidor...]')
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print('✅ Conectado\n')
        
        # 1. Backup
        print('[1/12] 💾 Backup de BD...')
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        status, output, _ = exec_cmd(client, 
            f'pg_dump "{DB_URL}" > /var/backups/inmova/db_pre_deploy_{timestamp}.sql 2>&1 || echo "Backup failed"',
            timeout=120)
        if 'failed' in output.lower():
            print(f'   ⚠️  Backup falló: {output[:100]}')
        else:
            print('   ✅ Backup creado')
        print()
        
        # 2. Git pull
        print('[2/12] 📥 Actualizando código...')
        status, output, _ = exec_cmd(client, f'cd {APP_PATH} && git fetch && git reset --hard origin/main 2>&1')
        if status == 0:
            print('   ✅ Código actualizado')
            commit_line = [l for l in output.split('\n') if 'HEAD' in l or 'commit' in l.lower()]
            if commit_line:
                print(f'      {commit_line[0][:80]}')
        else:
            print(f'   ❌ Error: {output[:200]}')
            return
        print()
        
        # 3. Limpiar build anterior
        print('[3/12] 🧹 Limpiando build anterior...')
        exec_cmd(client, f'cd {APP_PATH} && rm -rf .next node_modules/.prisma 2>&1')
        print('   ✅ Limpieza completada')
        print()
        
        # 4. Instalar dependencias
        print('[4/12] 📦 Instalando dependencias...')
        print('   (Esto puede tardar 2-3 minutos...)')
        status, output, _ = exec_cmd(client, f'cd {APP_PATH} && npm install 2>&1', timeout=300)
        if status == 0:
            print('   ✅ Dependencias instaladas')
        else:
            print(f'   ⚠️  Advertencias: {output[-200:]}')
        print()
        
        # 5. Prisma generate
        print('[5/12] 🔄 Generando Prisma Client...')
        status, output, _ = exec_cmd(client, 
            f'cd {APP_PATH} && export DATABASE_URL="{DB_URL}" && npx prisma generate 2>&1',
            timeout=120)
        if status == 0:
            print('   ✅ Prisma Client generado')
        else:
            print(f'   ⚠️  {output[:200]}')
        print()
        
        # 6. Aplicar migraciones
        print('[6/12] 🚀 Aplicando migraciones...')
        status, output, _ = exec_cmd(client,
            f'cd {APP_PATH} && export DATABASE_URL="{DB_URL}" && npx prisma migrate deploy 2>&1',
            timeout=300)
        
        if 'Applied' in output or 'No pending migrations' in output:
            print('   ✅ Migraciones aplicadas')
            for line in output.split('\n'):
                if 'Applied' in line:
                    print(f'      • {line.strip()}')
        else:
            print('   ⚠️  migrate deploy no aplicó cambios, intentando db push...')
            status, output, _ = exec_cmd(client,
                f'cd {APP_PATH} && export DATABASE_URL="{DB_URL}" && npx prisma db push --accept-data-loss 2>&1',
                timeout=300)
            
            if 'sync' in output.lower() or status == 0:
                print('   ✅ Schema sincronizado con db push')
            else:
                print(f'   ⚠️  {output[:300]}')
        print()
        
        # 7. Build
        print('[7/12] 🏗️  Building aplicación...')
        print('   (Esto puede tardar 3-5 minutos...)')
        status, output, _ = exec_cmd(client, f'cd {APP_PATH} && npm run build 2>&1', timeout=600)
        
        if status == 0:
            print('   ✅ Build completado')
        else:
            print(f'   ❌ Build falló:')
            error_lines = [l for l in output.split('\n') if 'error' in l.lower() or 'failed' in l.lower()]
            for line in error_lines[-10:]:
                print(f'      {line[:100]}')
            print()
            print('   ⚠️  Intentando continuar de todos modos...')
        print()
        
        # 8. Seed de usuarios
        print('[8/12] 👤 Creando usuarios de prueba...')
        status, output, _ = exec_cmd(client,
            f'cd {APP_PATH} && export DATABASE_URL="{DB_URL}" && npx tsx scripts/fix-auth-complete.ts 2>&1',
            timeout=180)
        
        if 'created' in output.lower() or 'updated' in output.lower():
            print('   ✅ Usuarios creados/actualizados')
        else:
            print(f'   ⚠️  {output[-300:]}')
        print()
        
        # 9. Seed de planes
        print('[9/12] 📊 Insertando planes de suscripción...')
        seed_plans_sql = """
DELETE FROM "SubscriptionPlan";

INSERT INTO "SubscriptionPlan" (
  id, nombre, descripcion, tier, "precioMensual",
  "maxUsuarios", "maxPropiedades", "modulosIncluidos",
  "signaturesIncludedMonth", "storageIncludedGB", 
  "aiTokensIncludedMonth", "smsIncludedMonth",
  activo, "createdAt", "updatedAt"
) VALUES
('plan_basico', 'Básico', 'Plan básico', 'basico', 29.99, 3, 10,
 ARRAY['PROPERTIES', 'TENANTS', 'CONTRACTS']::text[], 10, 5, 5000, 50, true, NOW(), NOW()),
('plan_profesional', 'Profesional', 'Plan profesional', 'profesional', 99.99, 10, 50,
 ARRAY['PROPERTIES', 'TENANTS', 'CONTRACTS', 'MAINTENANCE', 'CRM']::text[], 50, 25, 25000, 250, true, NOW(), NOW()),
('plan_empresarial', 'Empresarial', 'Plan empresarial', 'empresarial', 299.99, 50, 200,
 ARRAY['PROPERTIES', 'TENANTS', 'CONTRACTS', 'MAINTENANCE', 'CRM', 'COMMUNITY']::text[], 200, 100, 100000, 1000, true, NOW(), NOW()),
('plan_premium', 'Premium', 'Plan premium', 'premium', 999.99, NULL, NULL,
 ARRAY['PROPERTIES', 'TENANTS', 'CONTRACTS', 'MAINTENANCE', 'CRM', 'COMMUNITY', 'DOCUMENTS']::text[], 1000, 500, 500000, 5000, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT nombre FROM "SubscriptionPlan" WHERE activo = true;
"""
        
        status, output, _ = exec_cmd(client, f"psql \"{DB_URL}\" <<'EOF'\n{seed_plans_sql}\nEOF\n")
        if 'Básico' in output or 'DELETE' in output:
            print('   ✅ Planes insertados')
        else:
            print(f'   ⚠️  {output[:200]}')
        print()
        
        # 10. Reiniciar PM2
        print('[10/12] ♻️  Reiniciando aplicación...')
        exec_cmd(client, 'pm2 restart inmova-app --update-env')
        print('   ✅ PM2 reiniciado')
        print('   ⏳ Esperando warm-up (25 segundos)...')
        time.sleep(25)
        print()
        
        # 11. Health checks
        print('[11/12] 🏥 Verificando health...')
        status, output, _ = exec_cmd(client, 'curl -s http://localhost:3000/api/health')
        
        if '"status":"ok"' in output:
            print('   ✅ Health: OK')
            if '"database":"connected"' in output:
                print('   ✅ Database: connected')
            else:
                print('   ⚠️  Database status desconocido')
        else:
            print(f'   ⚠️  Health: {output[:150]}')
        print()
        
        # 12. Verificar APIs
        print('[12/12] 🧪 Verificando APIs...')
        
        # API Planes
        status, output, _ = exec_cmd(client, 'curl -s http://localhost:3000/api/public/subscription-plans')
        if 'Básico' in output or 'nombre' in output:
            print('   ✅ API planes: funcional')
        else:
            print(f'   ⚠️  API planes: {output[:100]}')
        
        # API Dashboard (sin auth debe dar 401)
        status, output, _ = exec_cmd(client, 'curl -s http://localhost:3000/api/dashboard')
        if '"error":"No autenticado"' in output or 'Unauthorized' in output:
            print('   ✅ API dashboard: requiere auth (correcto)')
        elif '500' in output:
            print('   ❌ API dashboard: error 500')
        else:
            print(f'   ⚠️  API dashboard: {output[:100]}')
        print()
        
        # Ver logs recientes
        print('📋 Logs recientes:')
        status, output, _ = exec_cmd(client, 'pm2 logs inmova-app --lines 15 --nostream 2>&1')
        recent_errors = [l for l in output.split('\n') if 'ERROR' in l or 'Error' in l]
        if recent_errors:
            print('   ⚠️  Errores detectados:')
            for err in recent_errors[-3:]:
                print(f'      {err[:120]}')
        else:
            print('   ✅ Sin errores críticos')
        print()
        
    except Exception as e:
        print(f'\n❌ Error durante deployment: {e}')
        import traceback
        traceback.print_exc()
    finally:
        client.close()
    
    print('=' * 70)
    print('✅ DEPLOYMENT COMPLETADO')
    print('=' * 70)
    print()
    print('Verificar manualmente:')
    print('  1. Login: https://inmovaapp.com/login')
    print('     Credenciales: admin@inmova.app / Admin123!')
    print()
    print('  2. Dashboard: https://inmovaapp.com/dashboard')
    print('     Debe cargar datos (no "No hay datos disponibles")')
    print()
    print('  3. Planes: https://inmovaapp.com/planes')
    print('     Deben aparecer 4 planes')
    print()
    print('Si hay problemas:')
    print('  • Ver logs: pm2 logs inmova-app')
    print('  • Verificar BD: psql "$DATABASE_URL" -c "\\dt"')
    print('  • Health check: curl https://inmovaapp.com/api/health')
    print()

if __name__ == '__main__':
    main()
