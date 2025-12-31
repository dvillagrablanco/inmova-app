import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function EnergiaSolarPage() {
  return (
    <ComingSoonPage
      title="Energía Solar"
      description="Gestión de instalaciones solares en propiedades"
      expectedFeatures={[
        'Monitoreo de producción solar',
        'Cálculo de ahorro energético',
        'ROI de instalaciones solares',
        'Mantenimiento de paneles',
        'Venta de excedentes energéticos',
      ]}
    />
  );
}
