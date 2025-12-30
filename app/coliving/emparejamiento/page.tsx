import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function ColivingEmparejamientoPage() {
  return (
    <ComingSoonPage
      title="Emparejamiento de Compañeros"
      description="Sistema inteligente de matching para encontrar los mejores compañeros de habitación"
      expectedFeatures={[
        'Algoritmo de matching basado en preferencias',
        'Perfiles detallados de candidatos',
        'Compatibilidad de estilos de vida',
        'Sistema de puntuación y recomendaciones',
        'Chat para conocer a potenciales compañeros',
      ]}
    />
  );
}
