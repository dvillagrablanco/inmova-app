import { cn } from '@/lib/utils';

interface StatBadgeProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
};

export function StatBadge({ label, value, variant = 'default', className }: StatBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        variantStyles[variant],
        className
      )}
    >
      <span className="text-xs font-medium">{label}:</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
