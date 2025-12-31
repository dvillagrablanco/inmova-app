import { ComingSoonPage } from '@/components/shared/ComingSoonPage';

export default function PropiedadesCrearPage() {
  return (
    <ComingSoonPage
      title="Crear Propiedad"
      description="Formulario de creación de nuevas propiedades inmobiliarias"
      expectedFeatures={[
        "Formulario inteligente con validación en tiempo real",
        "Carga múltiple de fotos y documentos",
        "Geolocalización automática",
        "Valoración estimada con IA",
        "Plantillas pre-configuradas por tipo de propiedad"
      ]}
    />
  );
}
