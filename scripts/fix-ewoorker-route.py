#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko

SERVER = {
    'host': '157.180.119.236',
    'port': 22,
    'username': 'root',
    'password': 'xcc9brgkMMbf'
}

layout_content = """import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'eWoorker - B2B Marketplace para Subcontratación en Construcción',
  description: 'Conecta constructores con subcontratistas certificados. Cumple Ley 32/2006 automáticamente. Pagos seguros con escrow. 2,500+ empresas activas.',
  keywords: 'subcontratación construcción, marketplace construcción, ley 32/2006, escrow construcción, subcontratistas certificados',
  openGraph: {
    title: 'eWoorker - Subcontratación Legal Sin Complicaciones',
    description: 'El marketplace B2B que conecta constructores con subcontratistas certificados. 100% legal. Pagos seguros.',
    siteName: 'eWoorker by Inmova',
    type: 'website',
  },
};

export default function EwoorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
"""

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(
    SERVER['host'],
    port=SERVER['port'],
    username=SERVER['username'],
    password=SERVER['password'],
    timeout=10
)

print('✅ Conectado')

# Crear layout
stdin, stdout, stderr = ssh.exec_command(
    f'echo "{layout_content}" > /opt/inmova-app/app/ewoorker/layout.tsx'
)
stdout.channel.recv_exit_status()
print('✅ Layout creado')

# Build
print('🔄 Building...')
stdin, stdout, stderr = ssh.exec_command('cd /opt/inmova-app && npm run build', timeout=600)
build_output = stdout.read().decode()
exit_code = stdout.channel.recv_exit_status()

if exit_code != 0:
    print('❌ Build falló')
    print(build_output[-500:])
else:
    print('✅ Build OK')

# Reload
stdin, stdout, stderr = ssh.exec_command('pm2 reload inmova-app')
stdout.channel.recv_exit_status()
print('✅ PM2 reloaded')

# Test
import time
time.sleep(10)
stdin, stdout, stderr = ssh.exec_command('curl -f http://localhost:3000/ewoorker/landing')
exit_code = stdout.channel.recv_exit_status()

if exit_code == 0:
    print('✅ eWoorker landing funciona')
else:
    print('⚠️ eWoorker aún con issues')

ssh.close()
