import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://inmova.app'
  
  // Páginas públicas principales
  const staticPages = [
    '',
    '/landing',
    '/landing/sobre-nosotros',
    '/landing/contacto',
    '/landing/demo',
    '/landing/casos-exito',
    '/landing/blog',
    '/landing/integraciones',
    '/landing/modulos',
    '/landing/legal/privacidad',
    '/landing/legal/terminos',
    '/landing/legal/gdpr',
    '/landing/legal/cookies',
    '/login',
    '/register',
  ]

  return staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/landing' ? 'daily' : 'weekly' as 'daily' | 'weekly',
    priority: route === '' || route === '/landing' ? 1 : 0.8,
  }))
}
