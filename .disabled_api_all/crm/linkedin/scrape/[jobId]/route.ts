/**
 * API: /api/crm/linkedin/scrape/[jobId]
 * 
 * GET: Obtener estado del job de scraping
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { LinkedInScrapingJobManager } from '@/lib/linkedin-scraper';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const job = await LinkedInScrapingJobManager.getJobStatus(params.jobId);

    if (!job || job.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Job no encontrado' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error getting scraping job status:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado del job', details: error.message },
      { status: 500 }
    );
  }
}
