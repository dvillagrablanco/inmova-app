import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function RetailPage() {
  return (
    <ComingSoonPage
      title="Retail & Locales Comerciales"
      description="Gestión de locales comerciales y retail"
      expectedFeatures={[
        'Gestión de contratos comerciales',
        'Control de facturación variable',
        'Análisis de ventas del local',
        'Gestión de horarios',
        'Marketing para retailers',
      ]}
    />
  );
}
