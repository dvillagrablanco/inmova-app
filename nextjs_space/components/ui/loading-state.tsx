import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  submessage?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({
  message = 'Cargando...',
  submessage,
  className,
  size = 'md'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Loader2 className={cn('animate-spin text-indigo-600 mb-4', sizeClasses[size])} />
      <p className="text-lg font-medium text-gray-700">{message}</p>
      {submessage && (
        <p className="text-sm text-gray-500 mt-2">{submessage}</p>
      )}
    </div>
  )
}
