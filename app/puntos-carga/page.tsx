import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PuntosCargaPage() {
  return (
    <ComingSoonPage
      title="Puntos de Carga Eléctrica"
      description="Gestión de puntos de carga para vehículos eléctricos"
      expectedFeatures={[
        'Mapa de puntos de carga',
        'Reservas de carga',
        'Monitoreo de consumo',
        'Facturación de uso',
        'Mantenimiento de cargadores',
      ]}
    />
  );
}
