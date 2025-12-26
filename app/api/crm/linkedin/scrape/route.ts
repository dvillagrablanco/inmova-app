/**
 * API: /api/crm/linkedin/scrape
 *
 * POST: Iniciar job de scraping de LinkedIn
 * GET:  Listar jobs de scraping
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { LinkedInScrapingJobManager } from '@/lib/linkedin-scraper';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo super_admin o administrador pueden iniciar scraping
    if (session.user.role !== 'super_admin' && session.user.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No tienes permisos para iniciar scraping' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { searchQuery, targetCount, linkedInEmail, linkedInPassword } = body;

    if (!searchQuery) {
      return NextResponse.json({ error: 'Se requiere searchQuery' }, { status: 400 });
    }

    if (!linkedInEmail || !linkedInPassword) {
      return NextResponse.json(
        { error: 'Se requieren credenciales de LinkedIn (linkedInEmail, linkedInPassword)' },
        { status: 400 }
      );
    }

    // Crear job
    const job = await LinkedInScrapingJobManager.createJob(
      session.user.companyId,
      searchQuery,
      targetCount || 100
    );

    // Ejecutar job en background (no esperar)
    // En producción, usar una queue (Bull, BullMQ, etc.)
    LinkedInScrapingJobManager.executeJob(job.id, linkedInEmail, linkedInPassword).catch(
      (error) => {
        console.error('Error executing LinkedIn scraping job:', error);
      }
    );

    return NextResponse.json(
      {
        jobId: job.id,
        status: 'pending',
        message: 'Scraping job iniciado. Usa el jobId para consultar el estado.',
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('Error starting LinkedIn scraping:', error);
    return NextResponse.json(
      { error: 'Error al iniciar scraping', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const jobs = await LinkedInScrapingJobManager.listJobs(session.user.companyId);

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Error listing scraping jobs:', error);
    return NextResponse.json(
      { error: 'Error al listar jobs', details: error.message },
      { status: 500 }
    );
  }
}
