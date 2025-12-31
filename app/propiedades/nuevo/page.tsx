import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PropiedadesNuevoPage() {
  return (
    <ComingSoonPage
      title="Nueva Propiedad"
      description="Wizard de creación rápida de propiedades"
      expectedFeatures={[
        "Creación paso a paso (wizard)",
        "Importación desde portales inmobiliarios",
        "Sugerencias automáticas de precio",
        "Generación de descripción con IA",
        "Publicación multi-canal"
      ]}
    />
  );
}
