'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calculator,
  FileText,
  Euro,
  Building2,
  ShoppingCart,
  Tag,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { 
  calculateTransactionCosts, 
  TransactionCostsInput, 
  TransactionCostsOutput,
  ComunidadAutonoma 
} from '@/lib/calculators/transaction-costs-calculator';

const COMUNIDADES: ComunidadAutonoma[] = [
  'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias',
  'Cantabria', 'Castilla-La Mancha', 'Castilla y León', 'Cataluña',
  'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia',
  'Navarra', 'País Vasco', 'Valencia', 'Ceuta', 'Melilla',
];

export function TransactionCostsCalculator() {
  const [result, setResult] = useState<TransactionCostsOutput | null>(null);
  
  const [formData, setFormData] = useState({
    transactionType: 'BUY' as 'BUY' | 'SELL',
    propertyPrice: 200000,
    propertyType: 'SECONDHAND' as 'NEW' | 'SECONDHAND',
    comunidadAutonoma: 'Madrid' as ComunidadAutonoma,
    isFirstHome: true,
    buyerAge: 30,
    largeFamily: false,
    disability: false,
    mortgageAmount: 160000,
    yearsOwned: 10,
    originalPurchasePrice: 150000,
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculate = () => {
    const input: TransactionCostsInput = {
      ...formData,
    };
    
    const output = calculateTransactionCosts(input);
    setResult(output);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Calculadora de Gastos de Compraventa
          </CardTitle>
          <CardDescription>
            Estima todos los gastos e impuestos de comprar o vender un inmueble
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de transacción */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={formData.transactionType === 'BUY' ? 'default' : 'outline'}
              className="h-20 flex flex-col gap-2"
              onClick={() => handleChange('transactionType', 'BUY')}
            >
              <ShoppingCart className="h-6 w-6" />
              Compra
            </Button>
            <Button
              variant={formData.transactionType === 'SELL' ? 'default' : 'outline'}
              className="h-20 flex flex-col gap-2"
              onClick={() => handleChange('transactionType', 'SELL')}
            >
              <Tag className="h-6 w-6" />
              Venta
            </Button>
          </div>
          
          {/* Datos del inmueble */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Precio del inmueble (€)</Label>
              <Input
                type="number"
                value={formData.propertyPrice}
                onChange={(e) => handleChange('propertyPrice', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Comunidad Autónoma</Label>
              <Select 
                value={formData.comunidadAutonoma} 
                onValueChange={(v) => handleChange('comunidadAutonoma', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMUNIDADES.map(ccaa => (
                    <SelectItem key={ccaa} value={ccaa}>{ccaa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {formData.transactionType === 'BUY' && (
            <>
              <div className="space-y-2">
                <Label>Tipo de inmueble</Label>
                <Select 
                  value={formData.propertyType} 
                  onValueChange={(v: any) => handleChange('propertyType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Obra Nueva (IVA 10%)</SelectItem>
                    <SelectItem value="SECONDHAND">Segunda Mano (ITP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Bonificaciones para compra */}
              <div className="p-4 bg-muted rounded-lg space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Posibles bonificaciones (solo para ITP)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.isFirstHome}
                      onCheckedChange={(c) => handleChange('isFirstHome', c)}
                    />
                    <Label className="text-sm">Vivienda habitual</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.largeFamily}
                      onCheckedChange={(c) => handleChange('largeFamily', c)}
                    />
                    <Label className="text-sm">Familia numerosa</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.disability}
                      onCheckedChange={(c) => handleChange('disability', c)}
                    />
                    <Label className="text-sm">Discapacidad ≥33%</Label>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Edad del comprador</Label>
                    <Input
                      type="number"
                      value={formData.buyerAge}
                      onChange={(e) => handleChange('buyerAge', parseInt(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>¿Vas a pedir hipoteca? Importe (€)</Label>
                <Input
                  type="number"
                  value={formData.mortgageAmount}
                  onChange={(e) => handleChange('mortgageAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0 si no pides hipoteca"
                />
              </div>
            </>
          )}
          
          {formData.transactionType === 'SELL' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Años como propietario</Label>
                  <Input
                    type="number"
                    value={formData.yearsOwned}
                    onChange={(e) => handleChange('yearsOwned', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio compra original (€)</Label>
                  <Input
                    type="number"
                    value={formData.originalPurchasePrice}
                    onChange={(e) => handleChange('originalPurchasePrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>¿Tienes hipoteca pendiente? Importe (€)</Label>
                <Input
                  type="number"
                  value={formData.mortgageAmount}
                  onChange={(e) => handleChange('mortgageAmount', parseFloat(e.target.value) || 0)}
                  placeholder="0 si no tienes hipoteca"
                />
              </div>
            </>
          )}
          
          <Button onClick={calculate} className="w-full" size="lg">
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Gastos
          </Button>
        </CardContent>
      </Card>
      
      {result && (
        <Card className="border-primary">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-primary" />
              Desglose de Gastos - {formData.transactionType === 'BUY' ? 'Compra' : 'Venta'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Resumen principal */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Precio inmueble</p>
                <p className="text-2xl font-bold">{formatCurrency(formData.propertyPrice)}</p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Total gastos ({result.costsPercent}%)</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(result.totalCosts)}</p>
              </div>
            </div>
            
            <div className="text-center p-4 bg-primary/10 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground">
                {formData.transactionType === 'BUY' ? 'Precio efectivo (precio + gastos)' : 'Neto a recibir (precio - gastos)'}
              </p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(result.effectivePrice)}</p>
            </div>
            
            {/* Bonificaciones aplicadas */}
            {result.bonificationsApplied.length > 0 && (
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg mb-6">
                <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Bonificaciones aplicadas:
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {result.bonificationsApplied.map((b, i) => (
                    <Badge key={i} variant="secondary">{b}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Separator className="my-6" />
            
            {/* Desglose detallado */}
            <h4 className="font-semibold mb-4">Desglose de gastos</h4>
            <div className="space-y-2">
              {result.breakdown.map((item, index) => (
                <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <Badge variant={item.type === 'tax' ? 'destructive' : item.type === 'fee' ? 'default' : 'secondary'} className="text-xs">
                        {item.type === 'tax' ? 'Impuesto' : item.type === 'fee' ? 'Tasa' : 'Servicio'}
                      </Badge>
                      {item.isEstimate && (
                        <Badge variant="outline" className="text-xs">Estimación</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  <span className="font-semibold whitespace-nowrap">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
            
            {/* Resumen por tipo */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Impuestos</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(result.summary.taxes)}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Tasas</p>
                <p className="text-lg font-semibold text-blue-600">{formatCurrency(result.summary.fees)}</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Servicios</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(result.summary.services)}</p>
              </div>
            </div>
            
            {/* Disclaimer */}
            <div className="mt-6 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm">
              <p className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  Los importes son estimaciones basadas en datos generales. Los costes reales pueden variar según el municipio, 
                  notaría y circunstancias específicas. Consulta con un profesional para obtener cifras exactas.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
