import { Metadata } from 'next';
import { InvestmentAnalyzer } from '@/components/calculators/InvestmentAnalyzer';

export const metadata: Metadata = {
  title: 'Análisis de Inversión Inmobiliaria | INMOVA',
  description: 'Herramienta profesional para evaluar la rentabilidad de inversiones inmobiliarias considerando CAPEX, OPEX, financiación e impuestos',
};

export default function AnalisisInversionPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <InvestmentAnalyzer />
      </div>
    </div>
  );
}
