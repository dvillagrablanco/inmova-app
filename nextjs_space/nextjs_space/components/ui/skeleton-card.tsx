import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  className?: string
  showHeader?: boolean
  linesCount?: number
}

export function SkeletonCard({ 
  className, 
  showHeader = true,
  linesCount = 3 
}: SkeletonCardProps) {
  return (
    <Card className={cn('animate-pulse', className)}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: linesCount }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'h-4',
              i === linesCount - 1 ? 'w-2/3' : 'w-full'
            )} 
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
