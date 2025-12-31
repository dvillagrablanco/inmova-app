import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ColivingComunidadPage() {
  return (
    <ComingSoonPage
      title="Comunidad Coliving"
      description="Gestión de la comunidad y eventos sociales en espacios de coliving"
      expectedFeatures={[
        'Directorio de residentes y networking',
        'Eventos y actividades de la comunidad',
        'Foros de discusión y grupos de interés',
        'Sistema de mensajería entre residentes',
        'Calendario compartido de actividades',
      ]}
    />
  );
}
