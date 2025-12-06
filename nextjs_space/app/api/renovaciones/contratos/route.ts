import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  analyzeContractForRenewal,
  getRenewalStats,
} from '@/lib/services/renewal-service';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const stats = await getRenewalStats(session.user.companyId);
    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error en GET renovaciones/contratos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { contractId } = body;
    if (!contractId) {
      return NextResponse.json(
        { error: 'contractId es requerido' },
        { status: 400 }
      );
    const analysis = await analyzeContractForRenewal(contractId);
    return NextResponse.json(analysis);
    logger.error('Error en POST renovaciones/contratos:', error);
