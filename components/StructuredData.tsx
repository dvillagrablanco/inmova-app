'use client';

import Script from 'next/script';

export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'INMOVA',
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '149',
      priceCurrency: 'EUR',
      priceValidUntil: '2026-12-31',
      availability: 'https://schema.org/InStock',
    },
    operatingSystem: 'Web-based',
    description: 'Software de gestión inmobiliaria profesional todo-en-uno. La plataforma PropTech más completa. 88 módulos integrados, 7 modelos de negocio, tecnología avanzada con IA, Blockchain e IoT.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
    author: {
      '@type': 'Organization',
      name: 'Enxames Investments SL',
      url: 'https://inmova.app',
      logo: 'https://inmova.app/inmova-logo-cover.jpg',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+34-900-000-000',
        contactType: 'Sales',
        areaServed: 'ES',
        availableLanguage: ['Spanish', 'English'],
      },
      sameAs: [
        'https://www.linkedin.com/company/inmova',
        'https://twitter.com/inmova_tech',
      ],
    },
    featureList: [
      'Gestión de propiedades y alquileres',
      'Gestión de inquilinos y contratos',
      'Alquiler por habitaciones y coliving',
      'Channel manager para apartamentos turísticos',
      'Inteligencia artificial y automatización',
      'Blockchain y tokenización de activos',
      'IoT y edificios inteligentes',
      'Integración contable (ContaSimple, Zucchetti, Sage, Holded)',
    ],
  };

  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'INMOVA',
    url: 'https://inmova.app',
    logo: 'https://inmova.app/inmova-logo-cover.jpg',
    description: 'Software de gestión inmobiliaria profesional todo-en-uno para empresas que gestionan múltiples propiedades',
    foundingDate: '2024',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: '15-50',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ES',
      addressRegion: 'Madrid',
    },
  };

  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://inmova.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Software Gestión Inmobiliaria',
        item: 'https://inmova.app/landing',
      },
    ],
  };

  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Por qué elegir INMOVA?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'INMOVA ofrece 88 módulos profesionales integrados vs los 15-25 de la competencia, soporta 7 modelos de negocio diferentes, incluye tecnología avanzada como IA, Blockchain e IoT, y todo esto desde 149€/mes, siendo hasta 70% más económico que alternativas como Buildium o AppFolio.',
        },
      },
      {
        '@type': 'Question',
        name: '¿INMOVA incluye gestión de alquiler por habitaciones?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, INMOVA incluye un módulo completo de Room Rental para gestión de alquiler por habitaciones y coliving, con prorrateo automático de gastos, calendarios de limpieza rotatorios y gestión de espacios comunes. Una funcionalidad única en el mercado.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Cuánto cuesta INMOVA comparado con otros software?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'INMOVA tiene un precio inicial de 149€/mes para el plan Básico, 299€/mes para Profesional y 599€/mes para Enterprise. Esto es significativamente más económico que Buildium (300-800€/mes) o AppFolio (500-1500€/mes), ofreciendo más funcionalidades.',
        },
      },
      {
        '@type': 'Question',
        name: '¿INMOVA se integra con mi software de contabilidad?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, INMOVA se integra con los principales sistemas contables en España: ContaSimple, Zucchetti, Sage, Holded, A3 Software y Alegra. También sincroniza automáticamente con plataformas como Airbnb, Booking.com y Expedia.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Puedo probar INMOVA antes de comprar?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, ofrecemos una prueba gratuita de 30 días sin necesidad de tarjeta de crédito. Durante este periodo tendrás acceso completo a todos los módulos y funcionalidades de la plataforma.',
        },
      },
    ],
  };

  return (
    <>
      <Script
        id="structured-data-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script
        id="structured-data-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <Script
        id="structured-data-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <Script
        id="structured-data-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
    </>
  );
}
