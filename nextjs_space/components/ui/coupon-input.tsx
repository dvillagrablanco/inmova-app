'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Check, X, Loader2, Percent, Euro, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CouponInputProps {
  amount: number;
  userId?: string;
  tenantId?: string;
  contractId?: string;
  onCouponApplied: (coupon: {
    codigo: string;
    tipo: string;
    valor: number;
    descuento: number;
    montoFinal: number;
  }) => void;
  onCouponRemoved: () => void;
}

export function CouponInput({
  amount,
  userId,
  tenantId,
  contractId,
  onCouponApplied,
  onCouponRemoved
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const handleValidate = async () => {
    if (!couponCode.trim()) {
      toast.error('Ingresa un código de cupón');
      return;
    }

    try {
      setValidating(true);

      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          codigo: couponCode.toUpperCase(),
          monto: amount,
          userId,
          tenantId,
          contractId
        })
      });

      const data = await response.json();

      if (response.ok && data.valido) {
        setAppliedCoupon(data);
        toast.success('¡Cupón aplicado correctamente!');
        onCouponApplied({
          codigo: data.codigo,
          tipo: data.tipo,
          valor: data.valor,
          descuento: data.descuento,
          montoFinal: data.montoFinal
        });
      } else {
        toast.error(data.message || 'Cupón inválido');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast.error('Error al validar cupón');
    } finally {
      setValidating(false);
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    onCouponRemoved();
    toast.success('Cupón removido');
  };

  if (appliedCoupon) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">Cupón aplicado</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                    {appliedCoupon.codigo}
                  </code>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {appliedCoupon.tipo === 'PERCENTAGE' ? (
                      <><Percent className="h-3 w-3" /> {appliedCoupon.valor}%</>
                    ) : (
                      <><Euro className="h-3 w-3" /> {appliedCoupon.valor}€</>
                    )}
                  </Badge>
                </div>
                <div className="text-sm text-green-700">
                  Descuento: <span className="font-semibold">{appliedCoupon.descuento.toFixed(2)}€</span>
                </div>
                <div className="text-sm font-bold text-green-900">
                  Total a pagar: <span className="text-lg">{appliedCoupon.montoFinal.toFixed(2)}€</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">¿Tienes un cupón?</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Ingresa el código"
                maxLength={50}
                disabled={validating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleValidate();
                  }
                }}
                className="uppercase"
              />
            </div>
            <Button
              onClick={handleValidate}
              disabled={validating || !couponCode.trim()}
              className="gradient-primary shadow-primary"
            >
              {validating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando...</>
              ) : (
                'Aplicar'
              )}
            </Button>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <p>Ingresa el código promocional para aplicar el descuento al monto total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
