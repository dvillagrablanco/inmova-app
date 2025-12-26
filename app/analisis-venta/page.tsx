import { Metadata } from 'next';
import SaleAnalyzer from '@/components/investment/SaleAnalyzer';

export const metadata: Metadata = {
  title: 'Análisis de Venta | INMOVA',
  description:
    'Analiza cuándo es el momento óptimo para vender tu propiedad y calcula el ROI total de tu inversión',
};

export default function AnalisisVentaPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Análisis de Venta de Activo</h1>
        <p className="text-muted-foreground mt-2">
          Determina el momento perfecto para vender y maximiza el retorno de tu inversión
        </p>
      </div>

      <SaleAnalyzer />
    </div>
  );
}
