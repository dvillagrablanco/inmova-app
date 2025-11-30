import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className
}: EmptyStateProps) {
  return (
    <Card className={cn('col-span-full border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-4">
        <div className="rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 p-6 mb-6">
          <Icon className="h-16 w-16 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-center">{title}</h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          {description}
        </p>
        {action && (
          <div className="flex gap-3">
            <Button 
              onClick={action.onClick}
              className="gradient-primary shadow-primary"
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
            {secondaryAction && (
              <Button 
                variant="outline" 
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
