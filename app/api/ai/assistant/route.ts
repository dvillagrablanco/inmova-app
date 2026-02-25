import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatWithClaude, AssistantContext } from '@/lib/claude-assistant-service';
import logger from '@/lib/logger';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// Helper function to map user role to assistant context user type
function mapUserRole(role: string | undefined): 'tenant' | 'landlord' | 'admin' | 'provider' | 'operador' | 'gestor' {
  switch (role) {
    case 'super_admin':
    case 'administrador':
    case 'admin':
      return 'admin';
    case 'gestor':
      return 'gestor';
    case 'operador':
      return 'operador';
    case 'tenant':
      return 'tenant';
    case 'soporte':
      return 'provider';
    default:
      return 'admin';
  }
}

/**
 * POST /api/ai/assistant
 * Asistente IA avanzado con Claude y Tool Calling
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verify plan access - Owner and premium plans have full access
    const companyId = session.user?.companyId;
    if (companyId) {
      const { getPrismaClient } = await import('@/lib/db');
      const prisma = getPrismaClient();
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { subscriptionPlan: { select: { tier: true, nombre: true } } },
      });
      const tier = company?.subscriptionPlan?.tier?.toLowerCase() || '';
      const planName = company?.subscriptionPlan?.nombre?.toLowerCase() || '';
      const premiumTiers = ['enterprise', 'business', 'empresarial', 'premium', 'personalizado'];
      const isPremium = premiumTiers.some(t => tier.includes(t)) || planName === 'owner';
      if (!isPremium) {
        return NextResponse.json({
          type: 'text',
          content: `El Asistente IA está disponible para planes premium. Tu plan actual es "${company?.subscriptionPlan?.nombre || 'Sin plan'}". Contacta con tu administrador para hacer upgrade.`,
          requiresUpgrade: true,
        });
      }
    }

    // Accept both JSON and FormData (for file uploads)
    let message = '';
    let conversationHistory: any[] = [];
    let fileContext = '';

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      message = formData.get('message') as string || '';
      const historyStr = formData.get('conversationHistory') as string;
      if (historyStr) try { conversationHistory = JSON.parse(historyStr); } catch {}
      
      // Process uploaded file
      const file = formData.get('file') as File;
      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name.toLowerCase();
        
        // Extract text based on file type
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
          const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
          const allText: string[] = [];
          for (const sheetName of wb.SheetNames) {
            const ws = wb.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
            allText.push(`=== Hoja: ${sheetName} (${rows.length} filas) ===`);
            for (const row of rows.slice(0, 50)) { // First 50 rows
              allText.push(row.filter((c: any) => c !== '').join(' | '));
            }
            if (rows.length > 50) allText.push(`... y ${rows.length - 50} filas más`);
          }
          fileContext = `\n\n[ARCHIVO ADJUNTO: ${file.name}]\n${allText.join('\n').substring(0, 6000)}`;
        } else if (fileName.endsWith('.pdf')) {
          // For PDFs, try basic text extraction
          try {
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(buffer);
            fileContext = `\n\n[ARCHIVO ADJUNTO: ${file.name}]\n${data.text.substring(0, 6000)}`;
          } catch {
            fileContext = `\n\n[ARCHIVO ADJUNTO: ${file.name} - PDF de ${(buffer.length/1024).toFixed(0)}KB. No se pudo extraer texto, puede ser un documento escaneado.]`;
          }
        } else if (fileName.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
          fileContext = `\n\n[ARCHIVO ADJUNTO: ${file.name} - Imagen de ${(buffer.length/1024).toFixed(0)}KB]`;
        } else {
          const text = buffer.toString('utf-8').substring(0, 4000);
          fileContext = `\n\n[ARCHIVO ADJUNTO: ${file.name}]\n${text}`;
        }
        
        if (!message) message = `Analiza este archivo: ${file.name}`;
      }
    } else {
      const body = await request.json();
      message = body.message || '';
      conversationHistory = body.conversationHistory || [];
    }

    if (!message && !fileContext) {
      return NextResponse.json(
        { error: 'Mensaje o archivo requerido' },
        { status: 400 }
      );
    }
    
    // Append file context to the message
    const fullMessage = message + fileContext;

    // Construir contexto del usuario
    const context: AssistantContext = {
      userId: session?.user?.id || '',
      userType: mapUserRole(session?.user?.role),
      userName: session?.user?.name || 'Usuario',
      userEmail: session?.user?.email || '',
      companyId: session?.user?.companyId || '',
      conversationHistory
    };

    logger.info(`🤖 Claude Assistant - New message from ${context.userName} (${context.userType})`);

    // Usar el nuevo servicio de Claude con tool calling
    const response = await chatWithClaude(fullMessage, context);

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error en asistente IA:', error);
    return NextResponse.json(
      {
        type: 'text',
        content: 'Lo siento, hubo un error. Por favor, inténtalo de nuevo.',
        error: 'Error procesando mensaje'
      },
      { status: 500 }
    );
  }
}
