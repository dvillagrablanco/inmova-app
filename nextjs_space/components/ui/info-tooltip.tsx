import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { ReactNode } from 'react'

interface InfoTooltipProps {
  content: string | ReactNode
  maxWidth?: string
}

export function InfoTooltip({ content, maxWidth = 'max-w-xs' }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex">
            <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent className={maxWidth}>
          {typeof content === 'string' ? <p>{content}</p> : content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
