'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Coins, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const steps = [
  { id: 1, title: 'Selección de Propiedad', description: 'Elige la propiedad a tokenizar' },
  { id: 2, title: 'Configuración de Tokens', description: 'Define los parámetros de tokenización' },
  { id: 3, title: 'Verificación Legal', description: 'Confirma cumplimiento normativo' },
  { id: 4, title: 'Despliegue', description: 'Crea los smart contracts' },
];

export default function TokenizarPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('property');

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [form, setForm] = useState({
    propertyId: propertyId || '',
    totalValue: 0,
    tokenSupply: 10000,
    tokenPrice: 100,
    minInvestment: 100,
    maxInvestment: 50000,
    annualYieldTarget: 6,
    description: '',
    legalCompliance: {
      kycRequired: true,
      accreditedOnly: false,
      maxInvestors: 500,
      jurisdictions: ['ES', 'EU'],
    },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProperties();
    }
  }, [status, router]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/units?status=disponible');
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handlePropertySelect = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    if (property) {
      const totalValue = property.valorEstimado || property.rentaMensual * 200;
      setForm({
        ...form,
        propertyId,
        totalValue,
        tokenPrice: Math.round(totalValue / form.tokenSupply),
      });
    }
  };

  const handleTokenSupplyChange = (value: number) => {
    setForm({
      ...form,
      tokenSupply: value,
      tokenPrice: form.totalValue > 0 ? Math.round(form.totalValue / value) : 100,
    });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/blockchain/tokenize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('Tokenización iniciada exitosamente');
        router.push('/blockchain');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al tokenizar');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar tokenización');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Coins className="h-8 w-8 text-purple-600" />
              Tokenizar Propiedad
            </h1>
            <p className="text-muted-foreground mt-1">
              Convierte tu propiedad en tokens negociables
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-16 md:w-24 h-1 ${
                        currentStep > step.id ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h3 className="font-semibold">{steps[currentStep - 1].title}</h3>
              <p className="text-sm text-muted-foreground">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Selecciona la Propiedad</CardTitle>
              <CardDescription>
                Elige la propiedad que deseas tokenizar para inversión fraccionada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Propiedad</Label>
                <Select value={form.propertyId} onValueChange={handlePropertySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.building?.nombre} - {property.numero} (
                        {property.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.propertyId && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Información de la Propiedad</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor estimado:</span>
                      <span className="font-medium ml-2">
                        €{form.totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Renta mensual:</span>
                      <span className="font-medium ml-2">
                        €
                        {properties
                          .find((p) => p.id === form.propertyId)
                          ?.rentaMensual?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Tokens</CardTitle>
              <CardDescription>Define los parámetros de la tokenización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Total (€)</Label>
                  <Input
                    type="number"
                    value={form.totalValue}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        totalValue: parseInt(e.target.value) || 0,
                        tokenPrice: Math.round(
                          (parseInt(e.target.value) || 0) / form.tokenSupply
                        ),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número de Tokens</Label>
                  <Input
                    type="number"
                    value={form.tokenSupply}
                    onChange={(e) =>
                      handleTokenSupplyChange(parseInt(e.target.value) || 1000)
                    }
                  />
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Precio por Token</p>
                  <p className="text-3xl font-bold text-purple-600">
                    €{form.tokenPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inversión Mínima (€)</Label>
                  <Input
                    type="number"
                    value={form.minInvestment}
                    onChange={(e) =>
                      setForm({ ...form, minInvestment: parseInt(e.target.value) || 100 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inversión Máxima (€)</Label>
                  <Input
                    type="number"
                    value={form.maxInvestment}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maxInvestment: parseInt(e.target.value) || 50000,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rentabilidad Anual Estimada (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.annualYieldTarget}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      annualYieldTarget: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verificación Legal
              </CardTitle>
              <CardDescription>
                Confirma el cumplimiento normativo para la tokenización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">KYC/AML Requerido</p>
                    <p className="text-sm text-muted-foreground">
                      Todos los inversores deben verificar su identidad
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Cumplimiento MiCA</p>
                    <p className="text-sm text-muted-foreground">
                      Conforme a la regulación europea de criptoactivos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Smart Contract Auditado</p>
                    <p className="text-sm text-muted-foreground">
                      Contrato verificado por auditores de seguridad
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-900">Información Importante</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      La tokenización de propiedades inmobiliarias está sujeta a la normativa
                      vigente. Asegúrate de cumplir con todos los requisitos legales de tu
                      jurisdicción.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción para Inversores</Label>
                <Textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe la oportunidad de inversión..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Tokenización</CardTitle>
              <CardDescription>
                Revisa los detalles antes de desplegar los smart contracts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">€{form.totalValue.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Tokens a Emitir</p>
                  <p className="text-2xl font-bold">{form.tokenSupply.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Precio por Token</p>
                  <p className="text-2xl font-bold">€{form.tokenPrice}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Rentabilidad Objetivo</p>
                  <p className="text-2xl font-bold text-green-600">
                    {form.annualYieldTarget}%
                  </p>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Red Blockchain</p>
                <p className="font-semibold">Polygon (MATIC)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Costes de gas reducidos • Alta velocidad • Compatible EVM
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Anterior
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={currentStep === 1 && !form.propertyId}
            >
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Iniciar Tokenización
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
