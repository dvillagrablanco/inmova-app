import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Filter {
  id: string
  label: string
  value: string
}

interface FilterChipsProps {
  filters: Filter[]
  onRemove: (id: string) => void
  onClearAll: () => void
  className?: string
}

export function FilterChips({ filters, onRemove, onClearAll, className }: FilterChipsProps) {
  if (filters.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2 mb-4 items-center', className)}>
      <span className="text-sm font-medium text-gray-600">Filtros activos:</span>
      {filters.map((filter) => (
        <Badge 
          key={filter.id} 
          variant="secondary" 
          className="gap-2 pr-1 pl-3 py-1"
        >
          <span className="text-xs">
            <span className="font-semibold">{filter.label}:</span> {filter.value}
          </span>
          <button
            onClick={() => onRemove(filter.id)}
            className="ml-1 rounded-full hover:bg-gray-300 p-0.5 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAll}
          className="h-7 px-2 text-xs"
        >
          Limpiar todos
        </Button>
      )}
    </div>
  )
}
