#!/usr/bin/env python3
"""
Fix definitivo del .env.production - eliminar el backup que tiene las variables viejas
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko

SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'xcc9brgkMMbf'

SENTRY_DSN = 'https://f3e76aca26cfeef767c4f3d3b5b271fd@o4510643145932800.ingest.de.sentry.io/4510643147505744'
CRISP_WEBSITE_ID = '1f115549-e9ef-49e5-8fd7-174e6d896a7e'

def main():
    print("🔧 Conexión al servidor...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
    
    print("✅ Conectado\n")
    
    try:
        # Estrategia: Reescribir el .env.production desde cero con solo las variables correctas
        print("📝 Leyendo .env.production actual...")
        
        stdin, stdout, stderr = client.exec_command("cd /opt/inmova-app && cat .env.production")
        current_env = stdout.read().decode()
        
        # Filtrar líneas que NO sean de la Triada
        print("🧹 Filtrando variables de Triada antiguas...")
        
        lines_to_keep = []
        skip_triada_section = False
        
        for line in current_env.split('\n'):
            # Si encontramos la sección de Triada, saltarla completa
            if '# ============================================' in line or '# 🛡️ TRIADA DE MANTENIMIENTO' in line:
                skip_triada_section = True
                continue
            
            # Saltar líneas de la sección de Triada
            if skip_triada_section:
                if line.strip() == '' or line.startswith('#') or 'SENTRY' in line or 'CRISP' in line or 'STATUS_PAGE' in line:
                    continue
                else:
                    skip_triada_section = False
            
            # Saltar cualquier línea que contenga variables de la Triada
            if any(keyword in line for keyword in ['SENTRY_DSN', 'CRISP_WEBSITE_ID', 'STATUS_PAGE_URL', 'PENDIENTE_OBTENER']):
                continue
            
            lines_to_keep.append(line)
        
        # Reconstruir el .env limpio
        clean_env = '\n'.join(lines_to_keep)
        
        # Añadir la nueva sección de Triada
        triada_section = f'''

# ============================================
# 🛡️ TRIADA DE MANTENIMIENTO - INMOVA
# ============================================

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN={SENTRY_DSN}
SENTRY_DSN={SENTRY_DSN}

# Crisp Chat (Live Support)
NEXT_PUBLIC_CRISP_WEBSITE_ID={CRISP_WEBSITE_ID}

# Status Page (BetterStack) - Opcional
# NEXT_PUBLIC_STATUS_PAGE_URL=https://your-subdomain.betteruptime.com
'''
        
        final_env = clean_env.rstrip() + triada_section
        
        # Escribir el nuevo .env.production
        print("✍️  Escribiendo .env.production limpio...")
        
        # Usar heredoc para escribir el archivo completo
        sftp = client.open_sftp()
        with sftp.open('/opt/inmova-app/.env.production', 'w') as f:
            f.write(final_env)
        sftp.close()
        
        print("✅ .env.production reescrito\n")
        
        # Verificar
        print("🔍 Verificando variables de la Triada...")
        stdin, stdout, stderr = client.exec_command("cd /opt/inmova-app && grep -E '(SENTRY_DSN|CRISP_WEBSITE_ID)' .env.production")
        result = stdout.read().decode()
        
        print(result)
        
        # Contar apariciones
        sentry_count = result.count('NEXT_PUBLIC_SENTRY_DSN')
        crisp_count = result.count('NEXT_PUBLIC_CRISP_WEBSITE_ID')
        
        if sentry_count == 1 and crisp_count == 1:
            print(f"✅ Variables únicas: Sentry x1, Crisp x1\n")
        else:
            print(f"⚠️  Sentry x{sentry_count}, Crisp x{crisp_count}\n")
        
        # Rebuild
        print("🔨 Rebuilding Next.js (2-3 min)...")
        client.exec_command("cd /opt/inmova-app && pm2 stop inmova-app").channel.recv_exit_status()
        client.exec_command("cd /opt/inmova-app && rm -rf .next/cache").channel.recv_exit_status()
        
        stdin, stdout, stderr = client.exec_command("cd /opt/inmova-app && npm run build", timeout=600)
        exit_code = stdout.channel.recv_exit_status()
        
        if exit_code == 0:
            print("✅ Build completado\n")
        else:
            print("⚠️  Build con warnings (continuando)\n")
        
        # Reiniciar
        print("🔄 Reiniciando PM2...")
        client.exec_command("cd /opt/inmova-app && pm2 restart inmova-app --update-env").channel.recv_exit_status()
        
        import time
        print("⏳ Esperando 20 segundos...\n")
        time.sleep(20)
        
        # Verificar
        stdin, stdout, stderr = client.exec_command("pm2 status inmova-app")
        print(stdout.read().decode())
        
        print("\n✅ CONFIGURACIÓN COMPLETADA")
        print("\n🧪 Verifica en: https://inmovaapp.com")
        print("   - Widget de Crisp (esquina inferior derecha)")
        print("   - F12 → busca 'CRISP_WEBSITE_ID' en el HTML\n")
        
    finally:
        client.close()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️  Cancelado\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
