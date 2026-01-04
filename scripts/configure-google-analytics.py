#!/usr/bin/env python3
"""
Script para configurar Google Analytics 4 en producción
"""

import sys
import re
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')
import paramiko
import time

# Configuración del servidor
SERVER_IP = '157.180.119.236'
SERVER_USER = 'root'
SERVER_PASSWORD = 'hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo='
APP_PATH = '/opt/inmova-app'

def log(message, level='INFO'):
    """Log con timestamp"""
    timestamp = time.strftime('%H:%M:%S')
    colors = {
        'INFO': '\033[0;36m',
        'SUCCESS': '\033[0;32m',
        'ERROR': '\033[0;31m',
        'WARNING': '\033[1;33m',
    }
    color = colors.get(level, '\033[0m')
    reset = '\033[0m'
    print(f"[{timestamp}] {color}{level}{reset}: {message}")

def exec_cmd(client, command, timeout=30):
    """Ejecutar comando en servidor remoto"""
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    output = stdout.read().decode().strip()
    error = stderr.read().decode().strip()
    return exit_status, output, error

def validate_measurement_id(measurement_id):
    """Validar formato de Measurement ID"""
    pattern = r'^G-[A-Z0-9]{10}$'
    if not re.match(pattern, measurement_id):
        return False, "El Measurement ID debe tener formato G-XXXXXXXXXX (G- seguido de 10 caracteres alfanuméricos)"
    return True, "OK"

def configure_ga4(measurement_id):
    """Configurar Google Analytics 4 en producción"""
    
    log("🚀 CONFIGURACIÓN DE GOOGLE ANALYTICS 4")
    log("=" * 70)
    
    # Validar Measurement ID
    log(f"Validando Measurement ID: {measurement_id}")
    is_valid, message = validate_measurement_id(measurement_id)
    if not is_valid:
        log(message, 'ERROR')
        return False
    log("✅ Formato válido", 'SUCCESS')
    
    # Conectar al servidor
    log(f"Conectando a {SERVER_IP}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        log("✅ Conectado", 'SUCCESS')
    except Exception as e:
        log(f"Error conectando: {e}", 'ERROR')
        return False
    
    try:
        # PASO 1: Verificar si ya existe en .env.production
        log("")
        log("📋 PASO 1: Verificar configuración actual")
        status, output, error = exec_cmd(
            client,
            f'grep "NEXT_PUBLIC_GA_MEASUREMENT_ID" {APP_PATH}/.env.production || echo "NOT_FOUND"'
        )
        
        if "NOT_FOUND" in output:
            log("No hay configuración previa de GA4", 'INFO')
            backup_needed = False
        else:
            log(f"Configuración actual encontrada: {output}", 'WARNING')
            backup_needed = True
        
        # PASO 2: Backup del .env.production
        if backup_needed:
            log("")
            log("📋 PASO 2: Backup de .env.production")
            timestamp = time.strftime('%Y%m%d_%H%M%S')
            status, output, error = exec_cmd(
                client,
                f'cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup_{timestamp}'
            )
            
            if status == 0:
                log(f"✅ Backup creado: .env.production.backup_{timestamp}", 'SUCCESS')
            else:
                log(f"⚠️ No se pudo crear backup: {error}", 'WARNING')
        
        # PASO 3: Añadir/Actualizar NEXT_PUBLIC_GA_MEASUREMENT_ID
        log("")
        log("📋 PASO 3: Configurar Measurement ID")
        
        # Eliminar línea existente si hay
        exec_cmd(
            client,
            f"sed -i '/NEXT_PUBLIC_GA_MEASUREMENT_ID/d' {APP_PATH}/.env.production"
        )
        
        # Añadir nueva línea
        status, output, error = exec_cmd(
            client,
            f'echo "NEXT_PUBLIC_GA_MEASUREMENT_ID={measurement_id}" >> {APP_PATH}/.env.production'
        )
        
        if status == 0:
            log(f"✅ Añadido NEXT_PUBLIC_GA_MEASUREMENT_ID={measurement_id}", 'SUCCESS')
        else:
            log(f"Error añadiendo variable: {error}", 'ERROR')
            return False
        
        # PASO 4: Verificar que se añadió correctamente
        log("")
        log("📋 PASO 4: Verificar configuración")
        status, output, error = exec_cmd(
            client,
            f'grep "NEXT_PUBLIC_GA_MEASUREMENT_ID" {APP_PATH}/.env.production'
        )
        
        if measurement_id in output:
            log(f"✅ Verificado: {output}", 'SUCCESS')
        else:
            log(f"Error: No se pudo verificar la configuración", 'ERROR')
            return False
        
        # PASO 5: Reiniciar PM2
        log("")
        log("📋 PASO 5: Reiniciar PM2 con nuevas variables")
        status, output, error = exec_cmd(
            client,
            f'cd {APP_PATH} && pm2 restart inmova-app --update-env',
            timeout=60
        )
        
        if status == 0:
            log("✅ PM2 reiniciado correctamente", 'SUCCESS')
            log(output)
        else:
            log(f"⚠️ Warning al reiniciar PM2: {error}", 'WARNING')
        
        # PASO 6: Esperar warm-up
        log("")
        log("⏳ Esperando 15 segundos para warm-up...")
        time.sleep(15)
        
        # PASO 7: Verificar que la app está corriendo
        log("")
        log("📋 PASO 6: Verificar estado de la aplicación")
        status, output, error = exec_cmd(
            client,
            'pm2 status inmova-app --no-color'
        )
        
        if 'online' in output.lower():
            log("✅ Aplicación corriendo correctamente", 'SUCCESS')
        else:
            log(f"⚠️ Estado de PM2: {output}", 'WARNING')
        
        # PASO 8: Test de health check
        log("")
        log("📋 PASO 7: Test de health check")
        status, output, error = exec_cmd(
            client,
            'curl -s http://localhost:3000/api/health/detailed | grep -o "googleAnalytics.*configured.*true" || echo "NOT_CONFIGURED"'
        )
        
        if "NOT_CONFIGURED" not in output and "true" in output:
            log("✅ Google Analytics configurado y detectado", 'SUCCESS')
        else:
            log("⚠️ Google Analytics configurado pero no detectado aún (puede tardar en cargarse)", 'WARNING')
        
        # RESUMEN FINAL
        log("")
        log("=" * 70)
        log("✅ CONFIGURACIÓN COMPLETADA", 'SUCCESS')
        log("=" * 70)
        log("")
        log("📊 Google Analytics 4 configurado:")
        log(f"   Measurement ID: {measurement_id}")
        log(f"   URL de producción: https://inmovaapp.com")
        log("")
        log("🔍 Verificación:")
        log("   1. Ve a: https://analytics.google.com/")
        log("   2. Reports → Real-time")
        log("   3. Abre https://inmovaapp.com en otro navegador")
        log("   4. Deberías ver tu visita en tiempo real en ~10 segundos")
        log("")
        log("⚠️ IMPORTANTE:")
        log("   - Los usuarios deben aceptar cookies de 'Análisis' en el banner")
        log("   - Sin consentimiento, GA4 NO trackeará (GDPR compliant)")
        log("   - Desactiva Ad Blockers para testear")
        log("")
        log("📝 Próximos pasos:")
        log("   1. Marcar eventos como conversiones en GA4:")
        log("      - sign_up")
        log("      - purchase")
        log("      - property_created")
        log("   2. Configurar data retention: 14 meses (GDPR)")
        log("   3. Crear dashboard personalizado")
        log("")
        
        return True
        
    except Exception as e:
        log(f"Error durante la configuración: {e}", 'ERROR')
        return False
    finally:
        client.close()

def main():
    if len(sys.argv) < 2:
        print("❌ Error: Debes proporcionar el Measurement ID")
        print("")
        print("Uso:")
        print(f"  python3 {sys.argv[0]} G-XXXXXXXXXX")
        print("")
        print("Ejemplo:")
        print(f"  python3 {sys.argv[0]} G-ABC123XYZ9")
        print("")
        print("Cómo obtener tu Measurement ID:")
        print("  1. Ve a: https://analytics.google.com/")
        print("  2. Admin → Data Streams → [tu stream]")
        print("  3. Copia el Measurement ID (formato: G-XXXXXXXXXX)")
        sys.exit(1)
    
    measurement_id = sys.argv[1].strip().upper()
    
    success = configure_ga4(measurement_id)
    
    if success:
        sys.exit(0)
    else:
        log("", 'ERROR')
        log("❌ Configuración fallida", 'ERROR')
        log("Revisar logs arriba para detalles", 'ERROR')
        sys.exit(1)

if __name__ == '__main__':
    main()
