import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText: string
  onConfirm: () => void | Promise<void>
  requiresTyping?: boolean
  confirmationWord?: string
  isDangerous?: boolean
  impacts?: string[]
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  onConfirm,
  requiresTyping = false,
  confirmationWord = '',
  isDangerous = false,
  impacts = []
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleConfirm = async () => {
    setIsProcessing(true)
    try {
      await onConfirm()
      onOpenChange(false)
      setInputValue('')
    } finally {
      setIsProcessing(false)
    }
  }

  const isConfirmDisabled = requiresTyping && inputValue !== confirmationWord

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={`flex items-center gap-2 ${isDangerous ? 'text-red-600' : ''}`}>
            {isDangerous && <AlertTriangle className="h-5 w-5" />}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{description}</p>
            {impacts && impacts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="font-semibold text-red-800 mb-2">Esta acción es <strong>irreversible</strong> y afectará:</p>
                <ul className="list-disc pl-5 space-y-1 text-red-700 text-sm">
                  {impacts.map((impact, i) => (
                    <li key={i}>{impact}</li>
                  ))}
                </ul>
              </div>
            )}
            {requiresTyping && (
              <div className="space-y-2">
                <p>Escribe <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{confirmationWord}</code> para confirmar:</p>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={confirmationWord}
                  className={inputValue === confirmationWord ? 'border-green-500' : ''}
                />
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isProcessing}
            className={isDangerous ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isProcessing ? 'Procesando...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
