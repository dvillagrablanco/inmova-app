'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  Home,
  CheckCircle2,
  XCircle,
  Undo2,
  Sparkles,
  Link2,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================
// TIPOS
// ============================================

interface BankMovement {
  id: string;
  fecha: string;
  concepto: string;
  importe: number;
  estado: 'pendiente' | 'conciliado' | 'descartado';
  aiConfidence?: number;
  matchedChargeId?: string;
}

interface ExpectedCharge {
  id: string;
  concepto: string;
  inquilino: string;
  importe: number;
  fecha: string;
  aiConfidence?: number;
  matchedBankId?: string;
}

interface Match {
  bankId: string;
  chargeId: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_BANK_MOVEMENTS: BankMovement[] = [
  { id: 'bm1', fecha: '2025-03-05', concepto: 'TRF ALQUILER MARZO', importe: 850, estado: 'pendiente', aiConfidence: 92 },
  { id: 'bm2', fecha: '2025-03-06', concepto: 'PAGO COMUNIDAD EDIF A', importe: 120, estado: 'pendiente', aiConfidence: 88 },
  { id: 'bm3', fecha: '2025-03-07', concepto: 'TRANSFERENCIA RECIBIDA', importe: 1200, estado: 'pendiente', aiConfidence: 45 },
  { id: 'bm4', fecha: '2025-03-08', concepto: 'ALQ PISO CALLE MAYOR', importe: 650, estado: 'pendiente', aiConfidence: 78 },
  { id: 'bm5', fecha: '2025-03-09', concepto: 'INGRESO SEPA', importe: 720, estado: 'pendiente', aiConfidence: 65 },
  { id: 'bm6', fecha: '2025-03-10', concepto: 'COMISION BANCARIA', importe: -15, estado: 'pendiente' },
  { id: 'bm7', fecha: '2025-03-10', concepto: 'PAGO SEGURO HOGAR', importe: -180, estado: 'pendiente' },
  { id: 'bm8', fecha: '2025-03-10', concepto: 'TRF INQUILINO GARCIA', importe: 900, estado: 'pendiente', aiConfidence: 91 },
];

const MOCK_EXPECTED_CHARGES: ExpectedCharge[] = [
  { id: 'ec1', concepto: 'Alquiler Marzo - García', inquilino: 'María García', importe: 850, fecha: '2025-03-01', aiConfidence: 92 },
  { id: 'ec2', concepto: 'Cuota comunidad Edificio A', inquilino: 'Comunidad', importe: 120, fecha: '2025-03-05', aiConfidence: 88 },
  { id: 'ec3', concepto: 'Alquiler Marzo - López', inquilino: 'Juan López', importe: 1200, fecha: '2025-03-01', aiConfidence: 45 },
  { id: 'ec4', concepto: 'Alquiler Piso Calle Mayor', inquilino: 'Ana Ruiz', importe: 650, fecha: '2025-03-01', aiConfidence: 78 },
  { id: 'ec5', concepto: 'Alquiler Marzo - Martínez', inquilino: 'Pedro Martínez', importe: 720, fecha: '2025-03-01', aiConfidence: 65 },
  { id: 'ec6', concepto: 'Seguro hogar anual', inquilino: 'Propiedad', importe: 180, fecha: '2025-03-01' },
  { id: 'ec7', concepto: 'Alquiler Marzo - Fernández', inquilino: 'Laura Fernández', importe: 900, fecha: '2025-03-01', aiConfidence: 91 },
  { id: 'ec8', concepto: 'Gastos comunidad Q1', inquilino: 'Comunidad', importe: 95, fecha: '2025-03-15' },
];

const TOLERANCE = 5;

function amountsMatch(bank: number, charge: number): boolean {
  return Math.abs(Math.abs(bank) - charge) <= TOLERANCE;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ConciliacionVisualPage() {
  const { status } = useSession();
  const router = useRouter();

  const [bankMovements, setBankMovements] = useState<BankMovement[]>(() =>
    MOCK_BANK_MOVEMENTS.map((m) => ({ ...m }))
  );
  const [expectedCharges, setExpectedCharges] = useState<ExpectedCharge[]>(() =>
    MOCK_EXPECTED_CHARGES.map((c) => ({ ...c }))
  );
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [discardedBankIds, setDiscardedBankIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<{ type: 'match' | 'discard'; bankId: string; chargeId?: string }[]>([]);

  const pendingBank = bankMovements.filter((m) => m.estado === 'pendiente' && !discardedBankIds.has(m.id));
  const pendingCharges = expectedCharges.filter((c) => !matches.some((m) => m.chargeId === c.id));
  const reconciledCount = matches.length;
  const discardedCount = discardedBankIds.size;
  const totalAmount = matches.reduce((sum, m) => {
    const bank = bankMovements.find((b) => b.id === m.bankId);
    return sum + (bank ? Math.abs(bank.importe) : 0);
  }, 0);

  const handleSelectBank = useCallback((id: string) => {
    const m = bankMovements.find((b) => b.id === id);
    if (!m || m.estado !== 'pendiente' || discardedBankIds.has(id)) return;
    setSelectedBankId((prev) => (prev === id ? null : id));
  }, [bankMovements, discardedBankIds]);

  const handleMatchCharge = useCallback(
    (chargeId: string) => {
      if (!selectedBankId) return;
      const bank = bankMovements.find((b) => b.id === selectedBankId);
      const charge = expectedCharges.find((c) => c.id === chargeId);
      if (!bank || !charge || bank.estado !== 'pendiente') return;

      setMatches((prev) => [...prev, { bankId: selectedBankId, chargeId }]);
      setBankMovements((prev) =>
        prev.map((m) => (m.id === selectedBankId ? { ...m, estado: 'conciliado' as const, matchedChargeId: chargeId } : m))
      );
      setExpectedCharges((prev) =>
        prev.map((c) => (c.id === chargeId ? { ...c, matchedBankId: selectedBankId } : c))
      );
      setHistory((prev) => [...prev, { type: 'match', bankId: selectedBankId, chargeId }]);
      setSelectedBankId(null);
      toast.success('Conciliado correctamente');
    },
    [selectedBankId, bankMovements, expectedCharges]
  );

  const handleDiscard = useCallback(() => {
    if (!selectedBankId) return;
    setDiscardedBankIds((prev) => new Set(prev).add(selectedBankId));
    setBankMovements((prev) =>
      prev.map((m) => (m.id === selectedBankId ? { ...m, estado: 'descartado' as const } : m))
    );
    setHistory((prev) => [...prev, { type: 'discard', bankId: selectedBankId }]);
    setSelectedBankId(null);
    toast.info('Movimiento descartado');
  }, [selectedBankId]);

  const handleUndo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;
    if (last.type === 'match' && last.chargeId) {
      setMatches((prev) => prev.filter((m) => !(m.bankId === last.bankId && m.chargeId === last.chargeId)));
      setBankMovements((prev) =>
        prev.map((m) => (m.id === last.bankId ? { ...m, estado: 'pendiente' as const, matchedChargeId: undefined } : m))
      );
      setExpectedCharges((prev) =>
        prev.map((c) => (c.id === last.chargeId ? { ...c, matchedBankId: undefined } : c))
      );
    } else if (last.type === 'discard') {
      setDiscardedBankIds((prev) => {
        const next = new Set(prev);
        next.delete(last.bankId);
        return next;
      });
      setBankMovements((prev) =>
        prev.map((m) => (m.id === last.bankId ? { ...m, estado: 'pendiente' as const } : m))
      );
    }
    setHistory((prev) => prev.slice(0, -1));
    toast.info('Acción deshecha');
  }, [history]);

  const getAiSuggestionForCharge = (charge: ExpectedCharge): number | undefined => {
    if (!selectedBankId) return charge.aiConfidence;
    const bank = bankMovements.find((b) => b.id === selectedBankId);
    if (!bank) return charge.aiConfidence;
    if (amountsMatch(bank.importe, charge.importe)) return charge.aiConfidence ?? 85;
    return undefined;
  };

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/finanzas">Finanzas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/finanzas/conciliacion">Conciliación</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Vista Visual</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/finanzas/conciliacion">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a vista detallada
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-xl font-bold">Conciliación Visual</h1>
            </div>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <span>
            <strong>{pendingBank.length}</strong> sin conciliar
          </span>
          <span className="text-green-600">
            <strong>{reconciledCount}</strong> conciliados
          </span>
          <span className="text-amber-600">
            <strong>{discardedCount}</strong> descartados
          </span>
          <span className="ml-auto font-semibold">
            Total conciliado: {totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={!selectedBankId}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Descartar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="gap-2"
          >
            <Undo2 className="h-4 w-4" />
            Deshacer
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Movimientos Bancarios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movimientos Bancarios</CardTitle>
              <p className="text-sm text-muted-foreground">
                Haz clic en un movimiento y luego en un cobro esperado para conciliar
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {pendingBank.map((m) => {
                  const isSelected = selectedBankId === m.id;
                  const isDiscarded = discardedBankIds.has(m.id);
                  if (isDiscarded) return null;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectBank(m.id)}
                      className={`flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.concepto}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(m.fecha), 'd MMM yyyy', { locale: es })}
                        </p>
                        {m.aiConfidence !== undefined && (
                          <Badge variant="secondary" className="mt-1 gap-1 text-xs">
                            <Sparkles className="h-3 w-3" />
                            IA sugiere: {m.aiConfidence}% confianza
                          </Badge>
                        )}
                      </div>
                      <span
                        className={`font-semibold shrink-0 ${
                          m.importe >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {m.importe >= 0 ? '+' : ''}
                        {m.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  );
                })}
                {pendingBank.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay movimientos pendientes
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Cobros/Gastos Esperados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cobros/Gastos Esperados</CardTitle>
              <p className="text-sm text-muted-foreground">
                Haz clic en un cobro para vincularlo con el movimiento seleccionado
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {pendingCharges.map((c) => {
                  const aiConf = getAiSuggestionForCharge(c);
                  const canMatch = selectedBankId && amountsMatch(
                    bankMovements.find((b) => b.id === selectedBankId)?.importe ?? 0,
                    c.importe
                  );
                  return (
                    <div
                      key={c.id}
                      onClick={() => selectedBankId && handleMatchCharge(c.id)}
                      className={`flex items-center justify-between gap-2 rounded-lg border p-3 transition-colors ${
                        canMatch
                          ? 'cursor-pointer hover:bg-primary/10 hover:border-primary'
                          : selectedBankId
                            ? 'opacity-60 cursor-not-allowed'
                            : 'cursor-default'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.concepto}</p>
                        <p className="text-xs text-muted-foreground">{c.inquilino}</p>
                        {aiConf !== undefined && selectedBankId && (
                          <Badge variant="secondary" className="mt-1 gap-1 text-xs">
                            <Sparkles className="h-3 w-3" />
                            IA sugiere: {aiConf}% confianza
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-semibold text-green-600">
                          {c.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                        {canMatch && (
                          <Link2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {pendingCharges.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay cobros pendientes
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conciliados section */}
        {matches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Conciliados ({matches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {matches.map((m) => {
                  const bank = bankMovements.find((b) => b.id === m.bankId);
                  const charge = expectedCharges.find((c) => c.id === m.chargeId);
                  if (!bank || !charge) return null;
                  return (
                    <div
                      key={`${m.bankId}-${m.chargeId}`}
                      className="flex items-center justify-between gap-4 rounded-lg border border-green-200 bg-green-50/50 p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{bank.concepto}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(bank.fecha), 'd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <Link2 className="h-4 w-4 text-green-600 shrink-0" />
                      <div className="text-right">
                        <p className="text-sm font-medium">{charge.concepto}</p>
                        <p className="text-xs text-muted-foreground">{charge.inquilino}</p>
                      </div>
                      <span className="font-semibold text-green-600 shrink-0">
                        {Math.abs(bank.importe).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
