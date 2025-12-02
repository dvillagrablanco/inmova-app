import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/*',
          '/api/*',
          '/dashboard',
          '/edificios',
          '/unidades',
          '/inquilinos',
          '/contratos',
          '/pagos',
          '/mantenimiento',
          '/proveedores',
          '/documentos',
          '/reportes',
          '/gastos',
          '/candidatos',
          '/tareas',
          '/notificaciones',
          '/perfil',
          '/calendario',
          '/chat',
          '/unauthorized',
        ],
      },
    ],
    sitemap: 'https://inmova.app/sitemap.xml',
  }
}
