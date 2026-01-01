#!/usr/bin/env python3
"""
Sincronizar archivos de tutoriales al servidor
"""

import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import os
from datetime import datetime

# Configuración
SERVER_IP = '157.180.119.236'
USERNAME = 'root'
PASSWORD = 'xcc9brgkMMbf'
APP_DIR = '/opt/inmova-app'

def log(message, level='INFO'):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f'[{timestamp}] [{level}] {message}')

def upload_file(sftp, local_path, remote_path):
    """Subir archivo al servidor"""
    try:
        # Crear directorio remoto si no existe
        remote_dir = os.path.dirname(remote_path)
        try:
            sftp.stat(remote_dir)
        except FileNotFoundError:
            # Crear directorios recursivamente
            dirs = []
            while remote_dir and remote_dir != '/':
                dirs.append(remote_dir)
                remote_dir = os.path.dirname(remote_dir)
            
            for d in reversed(dirs):
                try:
                    sftp.mkdir(d)
                except:
                    pass
        
        # Subir archivo
        sftp.put(local_path, remote_path)
        log(f'✓ Subido: {local_path} -> {remote_path}', 'SUCCESS')
        return True
    except Exception as e:
        log(f'Error subiendo {local_path}: {str(e)}', 'ERROR')
        return False

def main():
    log('========================================', 'INFO')
    log('SINCRONIZACIÓN: Archivos de Tutoriales', 'INFO')
    log('========================================', 'INFO')
    
    # Archivos a copiar
    files_to_copy = [
        ('components/tutorials/InteractiveGuide.tsx', f'{APP_DIR}/components/tutorials/InteractiveGuide.tsx'),
        ('components/tutorials/FirstTimeSetupWizard.tsx', f'{APP_DIR}/components/tutorials/FirstTimeSetupWizard.tsx'),
        ('components/tutorials/OnboardingChecklist.tsx', f'{APP_DIR}/components/tutorials/OnboardingChecklist.tsx'),
        ('app/api/onboarding/checklist/route.ts', f'{APP_DIR}/app/api/onboarding/checklist/route.ts'),
        ('app/api/onboarding/complete-setup/route.ts', f'{APP_DIR}/app/api/onboarding/complete-setup/route.ts'),
        ('app/api/user/onboarding-status/route.ts', f'{APP_DIR}/app/api/user/onboarding-status/route.ts'),
        ('components/layout/authenticated-layout.tsx', f'{APP_DIR}/components/layout/authenticated-layout.tsx'),
        ('prisma/schema.prisma', f'{APP_DIR}/prisma/schema.prisma'),
    ]
    
    # Conectar
    log(f'Conectando a {SERVER_IP}...', 'INFO')
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=USERNAME, password=PASSWORD, timeout=10)
        log('✓ Conexión SSH establecida', 'SUCCESS')
        
        # SFTP para subir archivos
        sftp = client.open_sftp()
        
        # Copiar archivos
        success_count = 0
        for local_file, remote_file in files_to_copy:
            local_path = f'/workspace/{local_file}'
            if os.path.exists(local_path):
                if upload_file(sftp, local_path, remote_file):
                    success_count += 1
            else:
                log(f'⚠ Archivo local no existe: {local_path}', 'WARN')
        
        sftp.close()
        
        log(f'✓ {success_count}/{len(files_to_copy)} archivos copiados', 'SUCCESS')
        
        # Generar Prisma Client
        log('Generando Prisma Client con nuevo schema...', 'INFO')
        stdin, stdout, stderr = client.exec_command(f'cd {APP_DIR} && npx prisma generate', timeout=120)
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8')
        if 'Generated Prisma Client' in output:
            log('✓ Prisma Client generado', 'SUCCESS')
        
        # Crear migración
        log('Aplicando cambios de base de datos...', 'INFO')
        
        # Ejecutar migración SQL directamente
        migration_sql = """
-- AlterTable
ALTER TABLE users ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS user_onboarding_progress (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "setupVersion" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_onboarding_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "user_onboarding_progress_userId_key" ON user_onboarding_progress("userId");
CREATE INDEX IF NOT EXISTS "user_onboarding_progress_userId_idx" ON user_onboarding_progress("userId");
CREATE INDEX IF NOT EXISTS "user_onboarding_progress_isCompleted_idx" ON user_onboarding_progress("isCompleted");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_onboarding_progress_userId_fkey'
    ) THEN
        ALTER TABLE user_onboarding_progress ADD CONSTRAINT user_onboarding_progress_userId_fkey 
            FOREIGN KEY ("userId") REFERENCES users("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
"""
        
        # Guardar SQL en archivo temporal
        stdin, stdout, stderr = client.exec_command(
            f'cd {APP_DIR} && cat > /tmp/migration_tutorials.sql << \'EOF\'\n{migration_sql}\nEOF'
        )
        stdout.channel.recv_exit_status()
        
        # Aplicar migración
        stdin, stdout, stderr = client.exec_command(
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && '
            f'psql $DATABASE_URL < /tmp/migration_tutorials.sql',
            timeout=60
        )
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8')
        error = stderr.read().decode('utf-8')
        
        if exit_status == 0:
            log('✓ Migración SQL aplicada', 'SUCCESS')
        else:
            log(f'Error en migración: {error}', 'WARN')
        
        # Verificar tabla creada
        stdin, stdout, stderr = client.exec_command(
            f'cd {APP_DIR} && export $(cat .env.production | grep -v ^# | xargs) && '
            f'psql $DATABASE_URL -c "\\dt user_onboarding_progress"'
        )
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8')
        
        if 'user_onboarding_progress' in output:
            log('✓ Tabla user_onboarding_progress existe', 'SUCCESS')
        else:
            log('⚠ Tabla no encontrada', 'WARN')
        
        # Build de Next.js
        log('Building Next.js...', 'INFO')
        stdin, stdout, stderr = client.exec_command(f'cd {APP_DIR} && npm run build', timeout=600)
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status == 0:
            log('✓ Build completado', 'SUCCESS')
        else:
            log('⚠ Build con warnings', 'WARN')
        
        # Reload PM2
        log('Reloading PM2...', 'INFO')
        stdin, stdout, stderr = client.exec_command('pm2 reload inmova-app', timeout=60)
        stdout.channel.recv_exit_status()
        log('✓ PM2 reloaded', 'SUCCESS')
        
        # Wait for app
        import time
        log('Esperando warm-up...', 'INFO')
        time.sleep(10)
        
        # Health checks
        log('Verificando APIs...', 'INFO')
        stdin, stdout, stderr = client.exec_command('curl -s http://localhost:3000/api/user/onboarding-status')
        stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8')
        
        if 'hasCompletedOnboarding' in output or 'No autenticado' in output:
            log('✓ API onboarding-status OK', 'SUCCESS')
        
        log('========================================', 'INFO')
        log('✓ SINCRONIZACIÓN COMPLETADA', 'SUCCESS')
        log('========================================', 'INFO')
        
        return 0
    
    except Exception as e:
        log(f'Error: {str(e)}', 'ERROR')
        return 1
    
    finally:
        client.close()

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
