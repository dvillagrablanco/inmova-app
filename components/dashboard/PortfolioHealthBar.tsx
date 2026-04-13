'use client';

import { Building2 } from 'lucide-react';
import Link from 'next/link';

interface PortfolioHealthBarProps {
  ok: number;
  warning: number;
  critical: number;
  className?: string;
}

/**
 * Barra visual de salud de la cartera tipo semáforo.
 * 🟢 OK | 🟡 Alertas | 🔴 Problemas
 */
export function PortfolioHealthBar({
  ok,
  warning,
  critical,
  className = '',
}: PortfolioHealthBarProps) {
  const total = ok + warning + critical;
  if (total === 0) return null;

  const okPct = (ok / total) * 100;
  const warnPct = (warning / total) * 100;
  const critPct = (critical / total) * 100;

  return (
    <div
      className={`bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Building2 className="h-4 w-4" />
          Estado de la Cartera
        </div>
        <span className="text-xs text-gray-500">{total} edificios</span>
      </div>

      {/* Health bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800 mb-3">
        {okPct > 0 && (
          <div className="bg-green-500 transition-all" style={{ width: `${okPct}%` }} />
        )}
        {warnPct > 0 && (
          <div className="bg-amber-400 transition-all" style={{ width: `${warnPct}%` }} />
        )}
        {critPct > 0 && (
          <div className="bg-red-500 transition-all" style={{ width: `${critPct}%` }} />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <Link href="/edificios?estado=ok" className="flex items-center gap-1.5 hover:underline">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="text-gray-600 dark:text-gray-400">{ok} OK</span>
        </Link>
        <Link href="/alertas?tipo=edificio" className="flex items-center gap-1.5 hover:underline">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="text-gray-600 dark:text-gray-400">{warning} alertas</span>
        </Link>
        {critical > 0 && (
          <Link href="/morosidad" className="flex items-center gap-1.5 hover:underline">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {critical} {critical === 1 ? 'problema' : 'problemas'}
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
