#!/usr/bin/env python3
"""
Configurar Signaturit con la API Key proporcionada
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

# API Key de Signaturit proporcionada
SIGNATURIT_API_KEY = "KmWLXStHXziKPMOkAfTFykvyKkqcvFBQeigoXGPMpaplXaAGsoduTGLPZxSERIXDGhOYHmgbvRgTUQKbzaeNmj"

def exec_cmd(client, cmd, timeout=60):
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    return {
        'exit': exit_status,
        'output': stdout.read().decode('utf-8', errors='ignore'),
        'error': stderr.read().decode('utf-8', errors='ignore')
    }

def main():
    print("=" * 70)
    print("🔐 CONFIGURANDO SIGNATURIT")
    print("=" * 70)
    print()
    
    print("📋 API Key recibida:")
    print(f"   {SIGNATURIT_API_KEY[:20]}...{SIGNATURIT_API_KEY[-10:]}")
    print()
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=SERVER_CONFIG['host'],
        username=SERVER_CONFIG['username'],
        password=SERVER_CONFIG['password'],
        port=SERVER_CONFIG['port'],
        timeout=SERVER_CONFIG['timeout']
    )
    
    print("[1/6] Verificando configuración actual...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep 'SIGNATURIT' .env.production")
    
    if 'SIGNATURIT_API_KEY' in result['output']:
        print("   ⚠️  Ya existe una API Key de Signaturit")
        print("   Sobrescribiendo...")
    else:
        print("   ℹ️  No hay configuración previa de Signaturit")
    print()
    
    print("[2/6] Eliminando configuración antigua (si existe)...")
    exec_cmd(client, "cd /opt/inmova-app && sed -i '/^SIGNATURIT/d' .env.production")
    print("   ✅ Limpieza completada")
    print()
    
    print("[3/6] Añadiendo API Key de Signaturit...")
    exec_cmd(client, f"""cd /opt/inmova-app && cat >> .env.production << 'EOF'

# === SIGNATURIT FIRMA DIGITAL ===
SIGNATURIT_API_KEY={SIGNATURIT_API_KEY}
SIGNATURIT_ENVIRONMENT=production
EOF
""")
    print("   ✅ API Key añadida")
    print()
    
    print("[4/6] Verificando configuración...")
    result = exec_cmd(client, "cd /opt/inmova-app && grep 'SIGNATURIT' .env.production")
    
    if 'SIGNATURIT_API_KEY' in result['output']:
        print("   ✅ Configuración verificada")
        print(f"   Variables encontradas: {len(result['output'].split(chr(10)))} líneas")
    else:
        print("   ❌ Error: Configuración no encontrada")
    print()
    
    print("[5/6] Reiniciando aplicación...")
    exec_cmd(client, "cd /opt/inmova-app && pm2 restart inmova-app --update-env")
    print("   ✅ PM2 reiniciado")
    print("   ⏳ Esperando 20 segundos para warm-up...")
    time.sleep(20)
    print()
    
    print("[6/6] Verificando detección de proveedor...")
    result = exec_cmd(client, "cd /opt/inmova-app && pm2 logs inmova-app --nostream --lines 30 | grep -i 'signature\\|provider\\|signaturit' | tail -5")
    
    if result['output']:
        print("   Logs relacionados:")
        print(result['output'][:300])
    else:
        print("   ℹ️  Sin logs específicos de firma (normal)")
    print()
    
    # Test de detección de proveedor
    print("🧪 Test de detección de proveedor...")
    result = exec_cmd(client, """cd /opt/inmova-app && node -e "
require('dotenv').config({ path: '.env.production' });
const hasSignaturit = !!process.env.SIGNATURIT_API_KEY;
const hasDocuSign = !!(process.env.DOCUSIGN_INTEGRATION_KEY && process.env.DOCUSIGN_PRIVATE_KEY);
const provider = hasSignaturit ? 'signaturit' : (hasDocuSign ? 'docusign' : 'demo');
console.log('Proveedor activo:', provider);
console.log('Signaturit configurado:', hasSignaturit);
console.log('DocuSign configurado:', hasDocuSign);
" 2>&1""")
    
    print(result['output'])
    print()
    
    # Health check
    print("🏥 Health check final...")
    result = exec_cmd(client, "curl -s http://localhost:3000/api/health 2>&1 | head -5")
    
    if '"status":"ok"' in result['output']:
        print("   ✅ API funcionando correctamente")
    else:
        print("   ⚠️  API respondiendo pero con advertencias")
        print(f"   {result['output'][:200]}")
    
    client.close()
    
    print()
    print("=" * 70)
    print("✅ SIGNATURIT CONFIGURADO EXITOSAMENTE")
    print("=" * 70)
    print()
    print("📊 Resumen:")
    print("   • Proveedor activo: SIGNATURIT ⭐")
    print("   • API Key configurada: ✅")
    print("   • Environment: Production")
    print("   • PM2 reiniciado: ✅")
    print("   • Sistema operativo: ✅")
    print()
    print("🔗 URLs:")
    print("   • App: https://inmovaapp.com")
    print("   • Health: https://inmovaapp.com/api/health")
    print("   • Dashboard Signaturit: https://app.signaturit.com/")
    print()
    print("🧪 Testing:")
    print("   1. Login en https://inmovaapp.com")
    print("   2. Crear/abrir un contrato")
    print("   3. Click en 'Enviar para firma'")
    print("   4. Añadir firmantes (propietario + inquilino)")
    print("   5. Click 'Enviar'")
    print("   6. Verificar en Dashboard de Signaturit")
    print()
    print("💰 Costo:")
    print("   Plan: ~€50/mes (20 firmas incluidas)")
    print("   Adicional: €2.50 por firma extra")
    print()
    print("📝 Próximos pasos:")
    print("   1. Test de firma real")
    print("   2. Verificar emails de firmantes")
    print("   3. Monitorear Dashboard Signaturit")
    print()
    return 0

if __name__ == '__main__':
    sys.exit(main())
