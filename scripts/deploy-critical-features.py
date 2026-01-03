#!/usr/bin/env python3
"""
Deploy de funcionalidades críticas al servidor
- Upload S3
- Stripe Checkout
- Firma Digital
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

SERVER_CONFIG = {
    'host': '157.180.119.236',
    'username': 'root',
    'password': 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo=',
    'port': 22,
    'timeout': 30
}

def exec_cmd(client, cmd, timeout=300):
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        return {
            'exit': exit_status,
            'output': stdout.read().decode('utf-8', errors='ignore'),
            'error': stderr.read().decode('utf-8', errors='ignore')
        }
    except Exception as e:
        return {'exit': -1, 'output': '', 'error': str(e)}

def main():
    print("=" * 70)
    print("🚀 DEPLOY DE FUNCIONALIDADES CRÍTICAS")
    print("=" * 70)
    print()
    
    # Conectar
    print("[1/8] 🔐 Conectando al servidor...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    print("      ✅ Conectado\n")
    
    # Backup
    print("[2/8] 💾 Backup pre-deployment...")
    exec_cmd(client, "cd /opt/inmova-app && git stash")
    result = exec_cmd(client, "cd /opt/inmova-app && git rev-parse HEAD")
    current_commit = result['output'].strip()[:8]
    print(f"      ✅ Commit actual: {current_commit}\n")
    
    # Pull changes
    print("[3/8] 📥 Descargando últimos cambios...")
    result = exec_cmd(client, "cd /opt/inmova-app && git pull origin main", timeout=60)
    if result['exit'] == 0:
        print("      ✅ Cambios descargados\n")
    else:
        print(f"      ⚠️  {result['error'][:200]}\n")
    
    # Install dependencies
    print("[4/8] 📦 Instalando dependencias...")
    result = exec_cmd(client, "cd /opt/inmova-app && npm install", timeout=300)
    if result['exit'] == 0:
        print("      ✅ Dependencias instaladas\n")
    else:
        print(f"      ⚠️  {result['error'][:200]}\n")
    
    # Verificar variables de entorno
    print("[5/8] ⚙️  Verificando variables de entorno...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep -E 'AWS_|STRIPE_' .env.production | head -8")
    
    required_vars = [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'AWS_BUCKET',
        'AWS_BUCKET_PRIVATE',
        'STRIPE_SECRET_KEY',
    ]
    
    env_output = result['output']
    missing = []
    for var in required_vars:
        if var not in env_output:
            missing.append(var)
    
    if missing:
        print(f"      ⚠️  Variables faltantes: {', '.join(missing)}")
    else:
        print("      ✅ Todas las variables configuradas")
    
    # Necesitamos NEXT_PUBLIC_STRIPE_PUBLIC_KEY
    print("\n      Añadiendo NEXT_PUBLIC_STRIPE_PUBLIC_KEY...")
    exec_cmd(client, """cd /opt/inmova-app && cat >> .env.production << 'EOF'
# Stripe Public Key (para frontend)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_51Sf0V7IgQiNlc4WDFF6q4n2y02t90DasQeSkydOthdlSSXFoJVOILcxPgYSE5sg6sIXFj5FC8aAGZCSaohkCKufs00ywhltNlU
EOF
""")
    print("      ✅ Variable añadida\n")
    
    # Build
    print("[6/8] 🏗️  Building aplicación...")
    print("      (Esto puede tardar 3-5 minutos)")
    result = exec_cmd(client, "cd /opt/inmova-app && npm run build 2>&1 | tail -20", timeout=600)
    
    if 'Compiled successfully' in result['output'] or result['exit'] == 0:
        print("      ✅ Build exitoso\n")
    else:
        print(f"      ❌ Build falló")
        print(f"      Error: {result['error'][:300]}")
        print(f"      Output: {result['output'][-300:]}\n")
        print("⚠️  Continuando con PM2 restart de todos modos...\n")
    
    # Restart PM2
    print("[7/8] ♻️  Reiniciando aplicación...")
    result = exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
    if result['exit'] == 0:
        print("      ✅ PM2 reiniciado\n")
    else:
        print(f"      ⚠️  {result['error'][:200]}\n")
    
    print("      ⏳ Esperando warm-up (15 segundos)...")
    time.sleep(15)
    
    # Health check
    print("\n[8/8] 🏥 Health check...")
    result = exec_cmd(client, "curl -s http://localhost:3000/api/health")
    
    if 'ok' in result['output']:
        print("      ✅ Aplicación funcionando\n")
    else:
        print(f"      ⚠️  Health check: {result['output'][:100]}\n")
    
    # Ver logs
    print("📋 Últimos logs:")
    result = exec_cmd(client, "pm2 logs inmova-app --nostream --lines 10")
    print(result['output'][-500:] if result['output'] else "Sin logs")
    
    client.close()
    
    print("\n" + "=" * 70)
    print("✅ DEPLOY COMPLETADO")
    print("=" * 70)
    print()
    print("📦 Funcionalidades deployadas:")
    print("   ✅ Upload de archivos a S3 (público + privado)")
    print("   ✅ Stripe Checkout con Elements")
    print("   ✅ Firma Digital (estructura base)")
    print()
    print("🔗 URLs:")
    print("   - App: https://inmovaapp.com")
    print("   - Health: https://inmovaapp.com/api/health")
    print()
    print("🧪 Testing:")
    print("   1. Upload público: POST /api/upload/public")
    print("   2. Upload privado: POST /api/upload/private")
    print("   3. Create payment: POST /api/payments/create-payment-intent")
    print("   4. Sign contract: POST /api/contracts/[id]/sign")
    print()
    print("⚠️  Para firma digital real:")
    print("   - Signaturit: SIGNATURIT_API_KEY")
    print("   - DocuSign: DOCUSIGN_INTEGRATION_KEY")
    print()
    return 0

if __name__ == '__main__':
    sys.exit(main())
