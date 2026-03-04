'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { memo } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  suffix?: string;
  subtitle?: string;
  sparklineData?: number[];
  accentColor?: string;
  className?: string;
}

/**
 * Sparkline SVG mini-chart (inline, no dependencies)
 */
function Sparkline({ data, color = '#6366f1', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const width = 80;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const lastX = width;
        const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
        return <circle cx={lastX} cy={lastY} r={2.5} fill={color} />;
      })()}
    </svg>
  );
}

// Optimizado con React.memo para evitar re-renders innecesarios
export const KPICard = memo(function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  suffix = '', 
  subtitle,
  sparklineData,
  accentColor,
  className = '' 
}: KPICardProps) {
  const borderStyle = accentColor ? { borderLeftColor: accentColor, borderLeftWidth: '4px' } : {};
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className={`bg-white dark:bg-gray-900 dark:border-gray-800 rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow ${className}`}
      style={borderStyle}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
            </h3>
            {suffix && <span className="text-lg text-gray-600">{suffix}</span>}
          </div>
          {trend && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span className={trend.isPositive ? '▲' : '▼'}>{''}</span>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg" style={accentColor ? { backgroundColor: `${accentColor}15` } : {}}>
            <Icon size={24} className="text-gray-700 dark:text-gray-300" style={accentColor ? { color: accentColor } : {}} />
          </div>
          {sparklineData && sparklineData.length >= 2 && (
            <Sparkline data={sparklineData} color={accentColor || '#6366f1'} />
          )}
        </div>
      </div>
    </motion.div>
  );
});
