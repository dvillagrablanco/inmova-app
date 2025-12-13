'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { WizardStep, WizardField } from '@/lib/wizard-config';
import logger, { logError } from '@/lib/logger';

interface WizardDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  steps: WizardStep[];
  onComplete: (data: any) => Promise<void>;
}

export default function WizardDialog({
  open,
  onClose,
  title,
  description,
  steps,
  onComplete
}: WizardDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const validateCurrentStep = () => {
    const requiredFields = currentStepData.fields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!formData[field.name]) {
        toast.error(`El campo "${field.label}" es obligatorio`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onComplete(formData);
      toast.success('¡Completado con éxito!');
      onClose();
      setCurrentStep(0);
      setFormData({});
    } catch (error) {
      logger.error('Error completing wizard:', error);
      toast.error('Hubo un error. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: WizardField) => {
    switch (field.type) {
      case 'select':
        return (
          <Select
            value={formData[field.name] || ''}
            onValueChange={(value) => handleFieldChange(field.name, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Selecciona ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'multiselect':
        return (
          <Select
            value={formData[field.name] || ''}
            onValueChange={(value) => handleFieldChange(field.name, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Selecciona ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            rows={4}
          />
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={formData[field.name] || false}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <label
              htmlFor={field.name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.label}
            </label>
          </div>
        );
      
      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => handleFieldChange(field.name, e.target.files?.[0])}
          />
        );
      
      case 'text':
      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Paso {currentStep + 1} de {steps.length}</span>
              <span className="text-muted-foreground">{Math.round(progress)}% completado</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 pt-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full border-2 transition-all ${
                  index < currentStep
                    ? 'bg-primary border-primary text-primary-foreground'
                    : index === currentStep
                    ? 'border-primary text-primary'
                    : 'border-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="py-6 space-y-4"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>

            {currentStepData.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>
          <Button onClick={handleNext} disabled={loading}>
            {loading ? (
              'Procesando...'
            ) : isLastStep ? (
              'Finalizar'
            ) : (
              <>
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
