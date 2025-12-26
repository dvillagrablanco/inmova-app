import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // TODO: Implementar desde base de datos
    const services = [
      {
        id: 's1',
        name: 'Limpieza Profesional Express',
        category: 'cleaning',
        provider: {
          id: 'p1',
          name: 'CleanPro Services',
          verified: true,
          rating: 4.8,
          reviews: 156,
        },
        description:
          'Servicio de limpieza profesional para propiedades vacacionales con entrega en 2 horas',
        price: 45,
        priceType: 'fixed',
        image: '/images/services/cleaning.jpg',
        featured: true,
        tags: ['Limpieza profunda', '2 horas', 'Productos incluidos'],
      },
      {
        id: 's2',
        name: 'Reparación de Averías 24/7',
        category: 'maintenance',
        provider: {
          id: 'p2',
          name: 'Fix It Now',
          verified: true,
          rating: 4.9,
          reviews: 203,
        },
        description: 'Servicio de fontanería, electricidad y cerrajería con disponibilidad 24/7',
        price: 60,
        priceType: 'hourly',
        image: '/images/services/maintenance.jpg',
        featured: true,
        tags: ['24/7', 'Urgencias', 'Multi-servicio'],
      },
      {
        id: 's3',
        name: 'Fibra Óptica 1GB',
        category: 'internet',
        provider: {
          id: 'p3',
          name: 'FastNet Telecom',
          verified: true,
          rating: 4.6,
          reviews: 89,
        },
        description: 'Internet de alta velocidad con instalación gratuita y router incluido',
        price: 39,
        priceType: 'monthly',
        image: '/images/services/internet.jpg',
        featured: false,
        tags: ['1GB', 'Instalación gratis', 'Router incluido'],
      },
      {
        id: 's4',
        name: 'Seguro de Hogar Plus',
        category: 'insurance',
        provider: {
          id: 'p4',
          name: 'SafeHome Insurance',
          verified: true,
          rating: 4.7,
          reviews: 342,
        },
        description: 'Cobertura completa: incendio, robo, daños por agua y responsabilidad civil',
        price: 25,
        priceType: 'monthly',
        image: '/images/services/insurance.jpg',
        featured: false,
        tags: ['Cobertura completa', 'Sin franquicia', 'Asistencia 24h'],
      },
      {
        id: 's5',
        name: 'Mantenimiento Preventivo',
        category: 'maintenance',
        provider: {
          id: 'p5',
          name: 'ProCare Maintenance',
          verified: true,
          rating: 4.8,
          reviews: 127,
        },
        description: 'Revisión trimestral de instalaciones eléctricas, fontanería y climatización',
        price: 89,
        priceType: 'fixed',
        image: '/images/services/preventive.jpg',
        featured: true,
        tags: ['Trimestral', 'Informe detallado', 'Garantía'],
      },
      {
        id: 's6',
        name: 'Limpieza con Ozono',
        category: 'cleaning',
        provider: {
          id: 'p1',
          name: 'CleanPro Services',
          verified: true,
          rating: 4.8,
          reviews: 156,
        },
        description: 'Desinfección completa con ozono, ideal para cambios de inquilino',
        price: 75,
        priceType: 'fixed',
        image: '/images/services/ozone.jpg',
        featured: false,
        tags: ['Ozono', 'Desinfección total', 'Certificado'],
      },
    ];

    return NextResponse.json(services);
  } catch (error) {
    logger.error('Error fetching marketplace services:', error);
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
  }
}
