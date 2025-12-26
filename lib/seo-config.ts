import { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://inmova.app';

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default:
      'INMOVA - Software de Gestión Inmobiliaria Todo-en-Uno | Alternativa a Homming, Rentger, Nester',
    template: '%s | INMOVA - Gestión Inmobiliaria Profesional',
  },
  description:
    'INMOVA es el software de gestión inmobiliaria profesional todo-en-uno. Alternativa superior a Homming, Rentger, Nester, Buildium y AppFolio. 88 módulos integrados, 7 modelos de negocio, tecnología avanzada (IA, Blockchain, IoT). Desde €149/mes. Prueba gratis 30 días.',
  keywords: [
    'INMOVA',
    'software gestión inmobiliaria',
    'proptech',
    'property management software',
    'alternativa Homming',
    'mejor que Homming',
    'vs Homming',
    'sustituir Homming',
    'alternativa Rentger',
    'mejor que Rentger',
    'vs Rentger',
    'sustituir Rentger',
    'alternativa Nester',
    'mejor que Nester',
    'vs Nester',
    'sustituir Nester',
    'alternativa Inmovilla',
    'alternativa Tecnocasa',
    'alternativa Buildium',
    'mejor que Buildium',
    'Buildium España',
    'alternativa AppFolio',
    'mejor que AppFolio',
    'AppFolio España',
    'alternativa Yardi',
    'alternativa MRI Software',
    'software gestión alquileres',
    'gestión propiedades',
    'gestión inquilinos',
    'software inmobiliario multivertical',
    'ERP inmobiliario',
    'alquiler por habitaciones',
    'coliving software',
    'room rental management',
    'channel manager airbnb',
    'gestión apartamentos turísticos',
    'vacation rental software',
    'comunidades de propietarios',
    'administración fincas',
    'flipping inmobiliario',
    'promoción inmobiliaria',
    'construcción',
    'software inmobiliario IA',
    'inteligencia artificial inmobiliaria',
    'blockchain inmobiliario',
    'tokenización activos',
    'IoT edificios inteligentes',
    'domotica gestión',
    'integración contabilidad',
    'ContaSimple',
    'Zucchetti',
    'Sage',
    'Holded',
    'A3',
    'sincronización Airbnb',
    'Booking.com',
    'Expedia',
    'software inmobiliario España',
    'gestión inmobiliaria Madrid',
    'gestión inmobiliaria Barcelona',
    'software proptech Europa',
    'software todo en uno inmobiliario',
    'reducir costos software',
    'aumentar ROI inmobiliario',
    'automatización gestión',
    'software escalable inmobiliario',
    'plataforma modular',
  ],
  authors: [{ name: 'Enxames Investments SL' }],
  creator: 'Enxames Investments SL',
  publisher: 'INMOVA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: baseUrl,
    siteName: 'INMOVA',
    title: 'INMOVA - Software de Gestión Inmobiliaria Todo-en-Uno',
    description:
      '¿Buscas alternativa a Homming, Rentger o Nester? INMOVA es el software inmobiliario profesional todo-en-uno con 88 módulos, IA, Blockchain, IoT. Desde €149/mes. Prueba gratis 30 días.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'INMOVA - Software de Gestión Inmobiliaria Profesional',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'INMOVA - Alternativa Superior a Homming, Rentger, Nester',
    description:
      'Software inmobiliario profesional todo-en-uno. 88 módulos, 7 verticales, tecnología avanzada. Desde €149/mes.',
    images: ['/og-image.png'],
    creator: '@inmova_tech',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const landingMetadata: Metadata = {
  ...defaultMetadata,
  alternates: {
    canonical: baseUrl,
    languages: {
      'es-ES': baseUrl,
      'en-US': `${baseUrl}/en`,
    },
  },
};

export const generatePageMetadata = ({
  title,
  description,
  path,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata => {
  return {
    title,
    description,
    keywords: keywords || defaultMetadata.keywords,
    openGraph: {
      ...defaultMetadata.openGraph,
      title,
      description,
      url: `${baseUrl}${path}`,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}${path}`,
    },
  };
};
