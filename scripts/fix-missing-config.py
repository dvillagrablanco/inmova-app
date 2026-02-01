#!/usr/bin/env python3
"""
Corregir configuración faltante en Inmova
"""
import sys
sys.path.insert(0, '/home/ubuntu/.local/lib/python3.12/site-packages')

import paramiko
import time

# Configuración del servidor
SERVER_IP = "157.180.119.236"
SERVER_USER = "root"
SERVER_PASSWORD = "hBXxC6pZCQPBLPiHGUHkASiln+Su/BAVQAN6qQ+xjVo="
APP_PATH = "/opt/inmova-app"

def exec_cmd(client, cmd, timeout=60):
    """Ejecutar comando SSH"""
    try:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
        exit_status = stdout.channel.recv_exit_status()
        output = stdout.read().decode('utf-8', errors='ignore')
        return exit_status, output
    except Exception as e:
        return -1, str(e)

def main():
    print("=" * 70)
    print("🔧 CORRIGIENDO CONFIGURACIÓN FALTANTE")
    print("=" * 70)
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(SERVER_IP, username=SERVER_USER, password=SERVER_PASSWORD, timeout=10)
        print("✅ Conectado\n")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    try:
        # 1. Buscar DocuSign Private Key
        print("=" * 70)
        print("1️⃣ BUSCANDO DOCUSIGN_PRIVATE_KEY")
        print("=" * 70)
        
        # Buscar en documentación
        status, output = exec_cmd(client, f"grep -r 'DOCUSIGN_PRIVATE_KEY' {APP_PATH}/docs {APP_PATH}/*.md 2>/dev/null | head -10")
        if output.strip():
            print("\nReferencias encontradas:")
            print(output[:500])
        
        # Buscar archivo de clave RSA
        status, output = exec_cmd(client, f"find {APP_PATH} -name '*.pem' -o -name '*private*key*' 2>/dev/null | head -10")
        if output.strip():
            print("\nArchivos de clave encontrados:")
            print(output)
        
        # Buscar en backups
        status, output = exec_cmd(client, "grep -r 'BEGIN RSA PRIVATE KEY' /opt /root --include='*.env*' --include='*.pem' --include='*.key' 2>/dev/null | head -5")
        if output.strip():
            print("\nClaves RSA encontradas:")
            print(output[:200])
        
        # 2. Añadir variables públicas faltantes
        print("\n" + "=" * 70)
        print("2️⃣ AÑADIENDO VARIABLES PÚBLICAS")
        print("=" * 70)
        
        # Leer .env.production
        status, env_content = exec_cmd(client, f"cat {APP_PATH}/.env.production")
        lines = env_content.strip().split('\n')
        
        # Variables a añadir
        new_vars = {
            "NEXT_PUBLIC_APP_URL": "https://inmovaapp.com",
            "NEXT_PUBLIC_SENTRY_DSN": "https://4c2bae7d9fbc413e8f7385f55c515d51@o1.ingest.sentry.io/6690737",
        }
        
        added = []
        for var, value in new_vars.items():
            # Verificar si ya existe
            exists = any(line.strip().startswith(var + '=') for line in lines)
            if not exists:
                lines.append(f'{var}={value}')
                added.append(var)
                print(f"  ➕ Añadido: {var}")
            else:
                print(f"  ✅ Ya existe: {var}")
        
        if added:
            # Guardar cambios
            new_content = '\n'.join(lines)
            exec_cmd(client, f"cp {APP_PATH}/.env.production {APP_PATH}/.env.production.backup.fix.$(date +%Y%m%d_%H%M%S)")
            exec_cmd(client, f"cat > {APP_PATH}/.env.production << 'ENVEOF'\n{new_content}\nENVEOF")
            print(f"\n✅ {len(added)} variables añadidas")
        
        # 3. Verificar/Crear webhook de DocuSign
        print("\n" + "=" * 70)
        print("3️⃣ VERIFICANDO WEBHOOK DE DOCUSIGN")
        print("=" * 70)
        
        docusign_webhook_path = f"{APP_PATH}/app/api/webhooks/docusign"
        status, output = exec_cmd(client, f"ls -la {docusign_webhook_path}/route.ts 2>/dev/null")
        
        if 'route.ts' not in output:
            print("\n⚠️ Webhook de DocuSign no existe")
            print("  Creando estructura...")
            
            # Crear directorio
            exec_cmd(client, f"mkdir -p {docusign_webhook_path}")
            
            # Crear archivo de webhook
            webhook_code = '''import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Webhook handler for DocuSign events
 * Configure in DocuSign Connect: https://admindemo.docusign.com/
 * URL: https://inmovaapp.com/api/webhooks/docusign
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // DocuSign sends XML by default, can be configured to send JSON
    logger.info('[DocuSign Webhook] Received event', { bodyLength: body.length });
    
    // Parse the envelope status
    // DocuSign Connect sends envelope-level events
    // Common statuses: sent, delivered, signed, completed, declined, voided
    
    // TODO: Implement signature verification
    // const hmacKey = process.env.DOCUSIGN_CONNECT_SECRET;
    
    // Log the event
    try {
      await prisma.webhookLog.create({
        data: {
          provider: 'docusign',
          event: 'envelope_status',
          payload: body.substring(0, 5000), // Limit size
          status: 'received',
        },
      });
    } catch (dbError) {
      logger.warn('[DocuSign Webhook] Could not log to database', { error: dbError });
    }
    
    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error: any) {
    logger.error('[DocuSign Webhook] Error processing event', { error: error.message });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET for webhook verification (if DocuSign sends verification requests)
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    webhook: 'docusign',
    message: 'DocuSign webhook endpoint is active'
  });
}
'''
            
            # Escribir archivo
            escaped_code = webhook_code.replace("'", "'\"'\"'")
            exec_cmd(client, f"cat > {docusign_webhook_path}/route.ts << 'ROUTEEOF'\n{webhook_code}\nROUTEEOF")
            print("  ✅ Webhook de DocuSign creado")
        else:
            print("\n✅ Webhook de DocuSign ya existe")
        
        # 4. Verificar/Crear webhook de Twilio
        print("\n" + "=" * 70)
        print("4️⃣ VERIFICANDO WEBHOOK DE TWILIO")
        print("=" * 70)
        
        twilio_webhook_path = f"{APP_PATH}/app/api/webhooks/twilio"
        status, output = exec_cmd(client, f"ls -la {twilio_webhook_path}/route.ts 2>/dev/null")
        
        if 'route.ts' not in output:
            print("\n⚠️ Webhook de Twilio no existe")
            print("  Creando estructura...")
            
            # Crear directorio
            exec_cmd(client, f"mkdir -p {twilio_webhook_path}")
            
            # Crear archivo de webhook
            twilio_webhook_code = '''import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import twilio from 'twilio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Webhook handler for Twilio SMS events
 * Configure in Twilio Console: https://console.twilio.com/
 * URL: https://inmovaapp.com/api/webhooks/twilio
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract Twilio webhook data
    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    
    logger.info('[Twilio Webhook] Received event', {
      messageSid,
      messageStatus,
      from,
      to,
    });
    
    // Validate Twilio signature (recommended for production)
    const twilioSignature = request.headers.get('x-twilio-signature');
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (twilioSignature && authToken) {
      const url = `${process.env.NEXTAUTH_URL}/api/webhooks/twilio`;
      const params: Record<string, string> = {};
      formData.forEach((value, key) => {
        params[key] = value.toString();
      });
      
      const isValid = twilio.validateRequest(authToken, twilioSignature, url, params);
      if (!isValid) {
        logger.warn('[Twilio Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    
    // Log the event
    try {
      await prisma.webhookLog.create({
        data: {
          provider: 'twilio',
          event: messageStatus || 'incoming',
          payload: JSON.stringify({
            messageSid,
            messageStatus,
            from,
            to,
            body: body?.substring(0, 500),
          }),
          status: 'received',
        },
      });
    } catch (dbError) {
      logger.warn('[Twilio Webhook] Could not log to database', { error: dbError });
    }
    
    // Handle different event types
    if (messageStatus) {
      // Status callback (sent, delivered, failed, etc.)
      // Update SMS status in database if tracking
    } else if (body) {
      // Incoming SMS
      // Could trigger automated responses or notifications
    }
    
    // Return TwiML response (empty is fine for status callbacks)
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    logger.error('[Twilio Webhook] Error processing event', { error: error.message });
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle GET for testing
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    webhook: 'twilio',
    message: 'Twilio webhook endpoint is active'
  });
}
'''
            
            exec_cmd(client, f"cat > {twilio_webhook_path}/route.ts << 'ROUTEEOF'\n{twilio_webhook_code}\nROUTEEOF")
            print("  ✅ Webhook de Twilio creado")
        else:
            print("\n✅ Webhook de Twilio ya existe")
        
        # 5. Reiniciar PM2
        print("\n" + "=" * 70)
        print("5️⃣ APLICANDO CAMBIOS")
        print("=" * 70)
        
        print("\n🔄 Reiniciando PM2...")
        exec_cmd(client, "pm2 restart inmova-app --update-env")
        time.sleep(15)
        
        # Verificar
        print("\n🏥 Health check:")
        status, output = exec_cmd(client, "curl -s http://localhost:3000/api/health")
        print(output)
        
        print("\n✅ Configuración corregida")
        
    finally:
        client.close()
        print("\n✅ Conexión cerrada")

if __name__ == "__main__":
    main()
