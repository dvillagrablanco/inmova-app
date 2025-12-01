"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  nombre: string;
  tier: string;
  descripcion: string;
  precioMensual: number;
  maxUsuarios: number;
  maxPropiedades: number;
  modulosIncluidos: string[];
  activo: boolean;
}

interface Company {
  id: string;
  nombre: string;
  subscriptionPlanId?: string;
  subscriptionPlan?: {
    id: string;
    nombre: string;
    tier: string;
    precioMensual: number;
  } | null;
}

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onSuccess: () => void;
}

export function ChangePlanDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
}: ChangePlanDialogProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPlans, setIsFetchingPlans] = useState(true);

  useEffect(() => {
    if (open) {
      fetchPlans();
      setSelectedPlanId(company.subscriptionPlanId || '');
    }
  }, [open, company.subscriptionPlanId]);

  const fetchPlans = async () => {
    try {
      setIsFetchingPlans(true);
      const response = await fetch('/api/admin/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.filter((p: SubscriptionPlan) => p.activo));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error al cargar los planes');
    } finally {
      setIsFetchingPlans(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlanId || selectedPlanId === company.subscriptionPlanId) {
      toast.error('Selecciona un plan diferente');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/subscription/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          newPlanId: selectedPlanId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        onSuccess();
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al cambiar el plan');
      }
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Error al cambiar el plan');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const currentPlan = company.subscriptionPlan;
  const isUpgrade = selectedPlan && currentPlan && selectedPlan.precioMensual > currentPlan.precioMensual;
  const isDowngrade = selectedPlan && currentPlan && selectedPlan.precioMensual < currentPlan.precioMensual;

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      basico: 'bg-gray-100 text-gray-800',
      profesional: 'bg-blue-100 text-blue-800',
      empresarial: 'bg-purple-100 text-purple-800',
    };
    return colors[tier.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cambiar Plan de Suscripción</DialogTitle>
          <DialogDescription>
            Selecciona un nuevo plan para {company.nombre}
          </DialogDescription>
        </DialogHeader>

        {isFetchingPlans ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Plan */}
            {currentPlan && (
              <div>
                <p className="text-sm font-medium mb-2">Plan Actual</p>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{currentPlan.nombre}</h4>
                        <p className="text-sm text-muted-foreground">{currentPlan.tier}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          €{currentPlan.precioMensual}
                        </p>
                        <p className="text-xs text-muted-foreground">por mes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Select New Plan */}
            <div>
              <p className="text-sm font-medium mb-2">Nuevo Plan</p>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{plan.nombre}</span>
                        <span className="text-muted-foreground">
                          €{plan.precioMensual}/mes
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plan Comparison */}
            {selectedPlan && selectedPlan.id !== company.subscriptionPlanId && (
              <div>
                <p className="text-sm font-medium mb-2">Resumen del Cambio</p>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Change Type */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tipo de cambio:</span>
                        {isUpgrade && (
                          <Badge className="bg-green-100 text-green-800">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            Upgrade
                          </Badge>
                        )}
                        {isDowngrade && (
                          <Badge className="bg-orange-100 text-orange-800">
                            <ArrowDown className="h-3 w-3 mr-1" />
                            Downgrade
                          </Badge>
                        )}
                        {!isUpgrade && !isDowngrade && (
                          <Badge variant="outline">Cambio lateral</Badge>
                        )}
                      </div>

                      {/* Price Difference */}
                      {currentPlan && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Diferencia de precio:</span>
                          <span
                            className={`text-sm font-semibold ${
                              isUpgrade
                                ? 'text-green-600'
                                : isDowngrade
                                ? 'text-orange-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {isUpgrade && '+'}
                            €{(selectedPlan.precioMensual - currentPlan.precioMensual).toFixed(2)}/mes
                          </span>
                        </div>
                      )}

                      {/* Features */}
                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm font-medium mb-2">Características del nuevo plan:</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span>Hasta {selectedPlan.maxUsuarios} usuarios</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span>Hasta {selectedPlan.maxPropiedades} propiedades</span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span>{selectedPlan.modulosIncluidos.length} módulos incluidos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleChangePlan}
            disabled={!selectedPlanId || selectedPlanId === company.subscriptionPlanId || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cambiando plan...
              </>
            ) : (
              'Cambiar Plan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
