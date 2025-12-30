import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function TurismoAlquilerPage() {
  return (
    <ComingSoonPage
      title="Alquiler Turístico"
      description="Gestión de propiedades de alquiler vacacional"
      expectedFeatures={[
        'Gestión de reservas turísticas',
        'Sincronización con Airbnb y Booking',
        'Precios dinámicos',
        'Check-in digital',
        'Gestión de limpieza entre huéspedes',
      ]}
    />
  );
}
