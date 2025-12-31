import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function HuertoUrbanoPage() {
  return (
    <ComingSoonPage
      title="Huerto Urbano"
      description="Gestión de huertos urbanos y espacios verdes comunitarios"
      expectedFeatures={[
        'Reserva de parcelas de cultivo',
        'Calendario de siembra y cosecha',
        'Guías de cultivo',
        'Eventos y talleres de jardinería',
        'Marketplace de productos ecológicos',
      ]}
    />
  );
}
