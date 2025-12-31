import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ViajesCorporativosGuestsPage() {
  return (
    <ComingSoonPage
      title="Huéspedes Corporativos"
      description="Gestión de empleados y huéspedes de empresa"
      expectedFeatures={[
        "Directorio de empleados",
        "Preferencias de alojamiento",
        "Historial de estancias",
        "Programa de fidelización",
        "Comunicación automatizada"
      ]}
    />
  );
}
