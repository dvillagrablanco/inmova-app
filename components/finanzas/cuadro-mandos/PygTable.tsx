// @ts-nocheck
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatEuro, formatPct } from '@/lib/finanzas/pyg-config';
import type { PygData, PygLine, PygGroup, CentroCosteData } from '@/types/finanzas';
import { cn } from '@/lib/utils';

interface PygTableProps {
  pygTotal: PygData;
  centrosCoste: CentroCosteData[];
}

// ─── ROW COMPONENT ──────────────────────────────────────────────────────────

interface PygRowProps {
  line: PygLine;
  indent?: number;
  isBold?: boolean;
  isHighlight?: boolean;
  isSeparator?: boolean;
  centrosCoste: CentroCosteData[];
  pygKey: string;
}

function PygRow({
  line,
  indent = 0,
  isBold = false,
  isHighlight = false,
  isSeparator = false,
  centrosCoste,
  pygKey,
}: PygRowProps) {
  const isNegative = line.importe < 0;

  const rowClass = cn(
    'border-b border-gray-100 hover:bg-gray-50/50 transition-colors',
    isHighlight && 'bg-blue-50/50 font-semibold',
    isSeparator && 'border-t-2 border-t-gray-300',
    isBold && 'font-semibold'
  );

  const amountClass = cn(
    'text-right tabular-nums text-xs px-2 py-1.5',
    isNegative && 'text-red-600',
    isBold && 'font-semibold'
  );

  const pctClass = cn(
    'text-right tabular-nums text-xs px-2 py-1.5 text-gray-500',
    isNegative && 'text-red-400'
  );

  // Helper to extract a line from a centroCoste's pyg using the pygKey
  function getCcLine(cc: CentroCosteData): PygLine | null {
    const pyg = cc.pyg;
    // Navigate the pyg structure using the key
    const keys = pygKey.split('.');
    let value: unknown = pyg;
    for (const k of keys) {
      if (!value || typeof value !== 'object') return null;
      value = (value as Record<string, unknown>)[k];
    }
    if (value && typeof value === 'object' && 'importe' in value) {
      return value as PygLine;
    }
    return null;
  }

  return (
    <tr className={rowClass}>
      {/* Concepto */}
      <td
        className={cn('px-3 py-1.5 text-xs whitespace-nowrap', isBold && 'font-semibold')}
        style={{ paddingLeft: `${12 + indent * 16}px` }}
      >
        {line.nombre}
      </td>
      {/* Total - Importe */}
      <td className={amountClass}>{formatEuro(line.importe)}</td>
      {/* Total - % Rentas */}
      <td className={pctClass}>{formatPct(line.pctSobreRentas)}</td>
      {/* Total - % Inversión */}
      <td className={pctClass}>{formatPct(line.pctSobreInversion)}</td>
      {/* Centros de coste */}
      {centrosCoste.map((cc) => {
        const ccLine = getCcLine(cc);
        const ccNeg = ccLine && ccLine.importe < 0;
        return (
          <td
            key={cc.id}
            className={cn(
              'text-right tabular-nums text-xs px-2 py-1.5',
              ccNeg && 'text-red-600',
              isBold && 'font-semibold'
            )}
          >
            {ccLine ? formatEuro(ccLine.importe) : '—'}
          </td>
        );
      })}
    </tr>
  );
}

// ─── EXPANDABLE GROUP ───────────────────────────────────────────────────────

interface PygGroupRowsProps {
  group: PygGroup;
  groupLabel: string;
  pygKeyPrefix: string;
  centrosCoste: CentroCosteData[];
}

function PygGroupRows({ group, groupLabel, pygKeyPrefix, centrosCoste }: PygGroupRowsProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Subtotal row (clickable) */}
      <tr
        className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-1.5 text-xs whitespace-nowrap" style={{ paddingLeft: '28px' }}>
          <span className="flex items-center gap-1">
            {expanded ? (
              <ChevronDown className="h-3 w-3 text-gray-400" />
            ) : (
              <ChevronRight className="h-3 w-3 text-gray-400" />
            )}
            <span className="font-medium">{groupLabel}</span>
          </span>
        </td>
        <td
          className={cn(
            'text-right tabular-nums text-xs px-2 py-1.5 font-medium',
            group.subtotal.importe < 0 && 'text-red-600'
          )}
        >
          {formatEuro(group.subtotal.importe)}
        </td>
        <td
          className={cn(
            'text-right tabular-nums text-xs px-2 py-1.5 text-gray-500',
            group.subtotal.importe < 0 && 'text-red-400'
          )}
        >
          {formatPct(group.subtotal.pctSobreRentas)}
        </td>
        <td
          className={cn(
            'text-right tabular-nums text-xs px-2 py-1.5 text-gray-500',
            group.subtotal.importe < 0 && 'text-red-400'
          )}
        >
          {formatPct(group.subtotal.pctSobreInversion)}
        </td>
        {centrosCoste.map((cc) => {
          const ccPyg = cc.pyg as Record<string, unknown>;
          const keys = pygKeyPrefix.split('.');
          let subtotal: unknown = ccPyg;
          for (const k of keys) {
            if (!subtotal || typeof subtotal !== 'object') break;
            subtotal = (subtotal as Record<string, unknown>)[k];
          }
          const group = subtotal as { subtotal?: PygLine } | undefined;
          const ccLine = group?.subtotal;
          return (
            <td
              key={cc.id}
              className={cn(
                'text-right tabular-nums text-xs px-2 py-1.5 font-medium',
                ccLine && ccLine.importe < 0 && 'text-red-600'
              )}
            >
              {ccLine ? formatEuro(ccLine.importe) : '—'}
            </td>
          );
        })}
      </tr>
      {/* Detail rows */}
      {expanded &&
        group.detalle.map((line, idx) => (
          <PygRow
            key={line.codigo}
            line={line}
            indent={2}
            centrosCoste={centrosCoste}
            pygKey={`${pygKeyPrefix}.detalle.${idx}`}
          />
        ))}
    </>
  );
}

// ─── MAIN TABLE ─────────────────────────────────────────────────────────────

export function PygTable({ pygTotal, centrosCoste }: PygTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">PyG Analítica por Centro de Coste</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50/80">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 w-[240px]">
                  Concepto
                </th>
                <th
                  colSpan={3}
                  className="text-center px-2 py-1 text-xs font-semibold text-gray-600 border-l border-gray-200"
                >
                  TOTAL ACTIVIDAD
                </th>
                {centrosCoste.map((cc) => (
                  <th
                    key={cc.id}
                    className="text-center px-2 py-1 text-xs font-semibold text-gray-600 border-l border-gray-200"
                    title={cc.nombre}
                  >
                    {cc.codigo}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-3 py-1 text-xs text-gray-400"></th>
                <th className="text-right px-2 py-1 text-[10px] text-gray-400 border-l border-gray-200">
                  Importe €
                </th>
                <th className="text-right px-2 py-1 text-[10px] text-gray-400">% S/ Rentas</th>
                <th className="text-right px-2 py-1 text-[10px] text-gray-400">% S/ Inv.</th>
                {centrosCoste.map((cc) => (
                  <th
                    key={cc.id}
                    className="text-right px-2 py-1 text-[10px] text-gray-400 border-l border-gray-200"
                  >
                    Importe €
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* ═══ INGRESOS ═══ */}
              <PygRow
                line={pygTotal.totalIngresos}
                isBold
                isHighlight
                centrosCoste={centrosCoste}
                pygKey="totalIngresos"
              />
              <PygRow
                line={pygTotal.ingresosArrendamientos}
                indent={1}
                centrosCoste={centrosCoste}
                pygKey="ingresosArrendamientos"
              />
              <PygRow
                line={pygTotal.otrosIngresos}
                indent={1}
                centrosCoste={centrosCoste}
                pygKey="otrosIngresos"
              />

              {/* ═══ GASTOS ═══ */}
              <PygRow
                line={pygTotal.totalGastos}
                isBold
                isHighlight
                centrosCoste={centrosCoste}
                pygKey="totalGastos"
              />
              <PygGroupRows
                group={pygTotal.serviciosExteriores}
                groupLabel="Servicios Exteriores"
                pygKeyPrefix="serviciosExteriores"
                centrosCoste={centrosCoste}
              />
              <PygGroupRows
                group={pygTotal.tributos}
                groupLabel="Tributos"
                pygKeyPrefix="tributos"
                centrosCoste={centrosCoste}
              />
              <PygGroupRows
                group={pygTotal.costesSociales}
                groupLabel="Costes Sociales"
                pygKeyPrefix="costesSociales"
                centrosCoste={centrosCoste}
              />

              {/* ═══ EBITDA ═══ */}
              <PygRow
                line={pygTotal.ebitda}
                isBold
                isHighlight
                isSeparator
                centrosCoste={centrosCoste}
                pygKey="ebitda"
              />
              <PygRow
                line={pygTotal.amortizaciones}
                indent={1}
                centrosCoste={centrosCoste}
                pygKey="amortizaciones"
              />
              <PygRow
                line={pygTotal.resultadoEnajenaciones}
                indent={1}
                centrosCoste={centrosCoste}
                pygKey="resultadoEnajenaciones"
              />

              {/* ═══ RESULTADO EXPLOTACIÓN ═══ */}
              <PygRow
                line={pygTotal.resultadoExplotacion}
                isBold
                isHighlight
                isSeparator
                centrosCoste={centrosCoste}
                pygKey="resultadoExplotacion"
              />

              {/* ═══ RESULTADO FINANCIERO ═══ */}
              {pygTotal.detalleFinanciero.map((line, idx) => (
                <PygRow
                  key={line.codigo}
                  line={line}
                  indent={1}
                  centrosCoste={centrosCoste}
                  pygKey={`detalleFinanciero.${idx}`}
                />
              ))}
              <PygRow
                line={pygTotal.resultadoFinanciero}
                isBold
                centrosCoste={centrosCoste}
                pygKey="resultadoFinanciero"
              />

              {/* ═══ EXTRAORDINARIOS ═══ */}
              <PygRow
                line={pygTotal.ingresosGtosExtraordinarios}
                indent={1}
                centrosCoste={centrosCoste}
                pygKey="ingresosGtosExtraordinarios"
              />
              <PygRow
                line={pygTotal.impuestoSociedades}
                indent={1}
                centrosCoste={centrosCoste}
                pygKey="impuestoSociedades"
              />

              {/* ═══ RESULTADO DEL PERIODO ═══ */}
              <PygRow
                line={pygTotal.resultadoPeriodo}
                isBold
                isHighlight
                isSeparator
                centrosCoste={centrosCoste}
                pygKey="resultadoPeriodo"
              />
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
