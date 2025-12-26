'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  Home,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';

interface Property {
  id: string;
  address: string;
  neighborhood: string;
  price: number;
  size: number;
  bedrooms: number;
  bathrooms: number;
  condition: 'excellent' | 'good' | 'needs_renovation' | 'poor';
  estimatedRenovation: number;
  estimatedSalePrice: number;
  estimatedROI: number;
  daysOnMarket: number;
  features: string[];
  pros: string[];
  cons: string[];
}

export default function FlippingComparatorPage() {
  const router = useRouter();
  const [properties] = useState<Property[]>([
    {
      id: '1',
      address: 'C/ Mayor 123, 3ºA',
      neighborhood: 'Centro',
      price: 180000,
      size: 85,
      bedrooms: 2,
      bathrooms: 1,
      condition: 'needs_renovation',
      estimatedRenovation: 35000,
      estimatedSalePrice: 265000,
      estimatedROI: 23.3,
      daysOnMarket: 45,
      features: ['Ascensor', 'Balcón', 'Exterior'],
      pros: ['Ubicación céntrica', 'Estructura sólida', 'Buena luz natural'],
      cons: ['Instalaciones antiguas', 'Cocina pequeña'],
    },
    {
      id: '2',
      address: 'Av. Constitución 45, 1ºB',
      neighborhood: 'Ensanche',
      price: 210000,
      size: 95,
      bedrooms: 3,
      bathrooms: 2,
      condition: 'good',
      estimatedRenovation: 20000,
      estimatedSalePrice: 280000,
      estimatedROI: 21.7,
      daysOnMarket: 20,
      features: ['Garaje', 'Ascensor', 'Trastero'],
      pros: ['Zona en expansión', 'Más espacio', 'Garaje incluido'],
      cons: ['Menos céntrico', 'Competencia alta'],
    },
    {
      id: '3',
      address: 'C/ Valencia 78, Bajo',
      neighborhood: 'Barrio Antiguo',
      price: 150000,
      size: 70,
      bedrooms: 2,
      bathrooms: 1,
      condition: 'poor',
      estimatedRenovation: 50000,
      estimatedSalePrice: 240000,
      estimatedROI: 20.0,
      daysOnMarket: 120,
      features: ['Patio privado', 'Alto potencial'],
      pros: ['Precio muy bajo', 'Patio privado', 'Zona en gentrificación'],
      cons: ['Requiere reforma integral', 'Mucho tiempo en venta'],
    },
  ]);

  const getConditionBadge = (condition: string) => {
    const config = {
      excellent: { color: 'bg-green-500', label: 'Excelente' },
      good: { color: 'bg-blue-500', label: 'Buen estado' },
      needs_renovation: { color: 'bg-yellow-500', label: 'Necesita reforma' },
      poor: { color: 'bg-red-500', label: 'Mal estado' },
    };
    const { color, label } = config[condition as keyof typeof config] || config.good;
    return <Badge className={color}>{label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const bestROI = Math.max(...properties.map(p => p.estimatedROI));

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Comparador de Propiedades</h1>
                <p className="text-muted-foreground mt-2">
                  Compara oportunidades de inversión lado a lado
                </p>
              </div>
              <Button onClick={() => router.push('/flipping')}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Propiedad
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className={`hover:shadow-xl transition-shadow ${
                  property.estimatedROI === bestROI ? 'ring-2 ring-green-500' : ''
                }`}>
                  <CardHeader>
                    {property.estimatedROI === bestROI && (
                      <Badge className="w-fit mb-2 bg-green-500">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Mejor ROI
                      </Badge>
                    )}
                    <CardTitle className="text-lg">{property.address}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {property.neighborhood}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">{formatCurrency(property.price)}</span>
                      {getConditionBadge(property.condition)}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm text-center">
                      <div>
                        <p className="text-muted-foreground text-xs">m²</p>
                        <p className="font-semibold">{property.size}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Habitaciones</p>
                        <p className="font-semibold">{property.bedrooms}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Baños</p>
                        <p className="font-semibold">{property.bathrooms}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Renovación estimada:</span>
                        <span className="font-medium">{formatCurrency(property.estimatedRenovation)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Precio venta estimado:</span>
                        <span className="font-medium text-green-600">{formatCurrency(property.estimatedSalePrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ROI estimado:</span>
                        <span className={`font-bold text-lg ${property.estimatedROI >= 20 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {property.estimatedROI}%
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {property.daysOnMarket} días en el mercado
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Características:</p>
                      <div className="flex flex-wrap gap-1">
                        {property.features.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t">
                      <div>
                        <p className="text-xs font-medium text-green-700 mb-1">Pros:</p>
                        <ul className="space-y-1">
                          {property.pros.map((pro, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-red-700 mb-1">Contras:</p>
                        <ul className="space-y-1">
                          {property.cons.map((con, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs">
                              <XCircle className="h-3 w-3 text-red-600 flex-shrink-0 mt-0.5" />
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <Button className="w-full mt-4" onClick={() => router.push(`/flipping/calculator?property=${property.id}`)}>
                      Calcular ROI Detallado
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumen Comparativo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Propiedad</th>
                        <th className="text-right p-2">Precio</th>
                        <th className="text-right p-2">Renovación</th>
                        <th className="text-right p-2">Venta Est.</th>
                        <th className="text-right p-2">Beneficio</th>
                        <th className="text-right p-2">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.map((property) => {
                        const profit = property.estimatedSalePrice - property.price - property.estimatedRenovation;
                        return (
                          <tr key={property.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{property.address}</td>
                            <td className="text-right p-2">{formatCurrency(property.price)}</td>
                            <td className="text-right p-2">{formatCurrency(property.estimatedRenovation)}</td>
                            <td className="text-right p-2 text-green-600">{formatCurrency(property.estimatedSalePrice)}</td>
                            <td className="text-right p-2 font-semibold">{formatCurrency(profit)}</td>
                            <td className="text-right p-2 font-bold">{property.estimatedROI}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
