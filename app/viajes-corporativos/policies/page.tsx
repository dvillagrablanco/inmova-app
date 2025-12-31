import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ViajesCorporativosPoliciesPage() {
  return (
    <ComingSoonPage
      title="Políticas de Viaje"
      description="Configuración de políticas corporativas de alojamiento"
      expectedFeatures={[
        "Definición de políticas por nivel",
        "Límites de gasto",
        "Aprobaciones necesarias",
        "Proveedores autorizados",
        "Excepciones y escalados"
      ]}
    />
  );
}
