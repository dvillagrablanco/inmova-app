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
  className?: string;
}

// Optimizado con React.memo para evitar re-renders innecesarios
export const KPICard = memo(function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  suffix = '', 
  className = '' 
}: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900 animate-count-up">
              {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
            </h3>
            {suffix && <span className="text-lg text-gray-600">{suffix}</span>}
          </div>
          {trend && (
            <p
              className={`text-sm mt-2 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <Icon size={24} className="text-gray-700" />
        </div>
      </div>
    </motion.div>
  );
});