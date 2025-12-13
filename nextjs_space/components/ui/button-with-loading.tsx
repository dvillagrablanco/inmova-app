import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2, LucideIcon } from 'lucide-react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ButtonWithLoadingProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
  icon?: LucideIcon
}

export const ButtonWithLoading = forwardRef<HTMLButtonElement, ButtonWithLoadingProps>(
  ({ isLoading, loadingText, icon: Icon, children, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn('relative', className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {children}
          </>
        )}
      </Button>
    )
  }
)

ButtonWithLoading.displayName = 'ButtonWithLoading'
