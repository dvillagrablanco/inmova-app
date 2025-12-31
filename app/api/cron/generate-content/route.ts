/**
 * 🤖 CRON JOB: Generar contenido para posts en DRAFT
 * Se ejecuta diariamente para llenar posts vacíos con contenido generado por IA
 *
 * Vercel Cron: Diario a las 8:00 AM
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateCompletePost } from '@/lib/ai/copywriter';
import { updatePostContent } from '@/app/actions/auto-growth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autorización (Vercel Cron Secret)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Auto-Growth] 🤖 Generando contenido para posts en DRAFT...');

    // 2. Obtener posts en DRAFT sin contenido
    const draftPosts = await prisma.marketingSocialPost.findMany({
      where: {
        status: 'DRAFT',
        content: '',
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10, // Procesar máximo 10 posts por ejecución
    });

    if (draftPosts.length === 0) {
      console.log('[Auto-Growth] ✅ No hay posts pendientes de generar contenido');
      return NextResponse.json({
        success: true,
        message: 'No pending drafts',
        processed: 0,
      });
    }

    console.log(`[Auto-Growth] 📝 Generando contenido para ${draftPosts.length} posts...`);

    // 3. Generar contenido para cada post
    const results = await Promise.allSettled(
      draftPosts.map(async (post) => {
        try {
          // Generar contenido completo (copy + imagen)
          const generated = await generateCompletePost({
            topic: post.topic,
            platform: post.platform,
            imagePrompt: post.imagePrompt || undefined,
            useAI: true, // Intentar usar IA, fallback a templates
          });

          // Construir contenido final (con hashtags si aplica)
          let finalContent = generated.content;
          if (generated.hashtags && generated.hashtags.length > 0) {
            finalContent = `${generated.content}\n\n${generated.hashtags.join(' ')}`;
          }

          // Actualizar post en BD
          await updatePostContent(post.id, finalContent, generated.imageUrl);

          console.log(
            `[Auto-Growth] ✅ Post ${post.id} actualizado: ${post.platform} - ${post.topic}`
          );

          return {
            success: true,
            postId: post.id,
            platform: post.platform,
            topic: post.topic,
          };
        } catch (error) {
          console.error(`[Auto-Growth] ❌ Error procesando post ${post.id}:`, error);
          return {
            success: false,
            postId: post.id,
            error: String(error),
          };
        }
      })
    );

    // 4. Contar éxitos y fallos
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    );

    console.log(
      `[Auto-Growth] 🎉 Contenido generado: ${successful.length} éxitos, ${failed.length} fallos`
    );

    return NextResponse.json({
      success: true,
      message: `Content generated for ${successful.length} posts`,
      processed: draftPosts.length,
      successful: successful.length,
      failed: failed.length,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { success: false, error: 'rejected' }
      ),
    });
  } catch (error) {
    console.error('[Auto-Growth] 💥 Error crítico:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler para testing manual (requiere autenticación)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Crear un request mock para POST
  const mockRequest = new NextRequest(req.url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  return POST(mockRequest);
}
