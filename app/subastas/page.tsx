import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function SubastasPage() {
  return (
    <ComingSoonPage
      title="Subastas de Propiedades"
      description="Sistema de subastas online para propiedades"
      expectedFeatures={[
        'Publicación de propiedades en subasta',
        'Sistema de pujas en tiempo real',
        'Gestión de depósitos',
        'Verificación de compradores',
        'Cierre y adjudicación automática',
      ]}
    />
  );
}
