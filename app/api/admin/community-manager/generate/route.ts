import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Templates de contenido por categoría
const CONTENT_TEMPLATES = {
  proptech: [
    '🏠 {topic}\n\n{content}\n\n✅ {benefit1}\n✅ {benefit2}\n✅ {benefit3}\n\n#PropTech #InmobiliariaDigital #GestiónInmobiliaria {hashtags}',
    '📊 Dato del día: {stat}\n\n{insight}\n\nDescubre más en inmova.app 🚀\n\n#PropTech #DatosInmobiliarios {hashtags}',
    '💡 Tip para gestores inmobiliarios:\n\n{tip}\n\n{callToAction}\n\n#GestiónAlquileres #PropTech #TipsInmobiliarios {hashtags}',
  ],
  engagement: [
    '🤔 {question}\n\n{context}\n\nCuéntanos en los comentarios 👇\n\n{hashtags}',
    '📈 Esta semana hemos logrado {achievement}\n\nGracias a todos los que confían en Inmova 💜\n\n{hashtags}',
    '🎉 ¡Noticia importante!\n\n{news}\n\n{callToAction}\n\n{hashtags}',
  ],
  educational: [
    '📚 {title}\n\n{point1}\n{point2}\n{point3}\n{point4}\n{point5}\n\n¿Cuál te parece más importante? 👇\n\n{hashtags}',
    '❓ ¿Sabías que...?\n\n{fact}\n\n{explanation}\n\nSigue aprendiendo en nuestro blog 📖\n\n{hashtags}',
  ],
  promotional: [
    '✨ {headline}\n\n{description}\n\n🔗 Link en bio\n\n{hashtags}',
    '🚀 Nuevo en Inmova: {feature}\n\n{benefits}\n\nActiva tu prueba gratuita hoy mismo 👉 inmova.app\n\n{hashtags}',
  ],
};

// Datos de contexto PropTech
const PROPTECH_DATA = {
  stats: [
    'El 73% de los compradores busca propiedades online antes de visitar',
    'Las inmobiliarias digitalizadas reducen un 40% el tiempo de gestión',
    'El 85% de los inquilinos prefiere pagar el alquiler de forma digital',
    'Los tours virtuales aumentan un 65% las consultas de propiedades',
    'La firma digital reduce el cierre de operaciones de 2 semanas a 2 días',
  ],
  tips: [
    'Automatiza los recordatorios de pago y reduce la morosidad hasta un 60%',
    'Digitaliza los contratos y ahorra 8 horas semanales en gestión documental',
    'Usa tours virtuales para filtrar visitas y mostrar solo a compradores serios',
    'Centraliza la comunicación con inquilinos en una sola plataforma',
    'Programa informes automáticos para mantener informados a tus propietarios',
  ],
  topics: [
    'La digitalización de la gestión inmobiliaria',
    'Los beneficios de la firma digital en contratos',
    'Cómo automatizar el cobro de alquileres',
    'Tendencias PropTech para 2026',
    'La importancia del CRM inmobiliario',
  ],
  hashtags: [
    '#PropTech', '#InmobiliariaDigital', '#GestiónInmobiliaria', '#Inmova',
    '#AlquilerDigital', '#TransformaciónDigital', '#RealEstateTech',
    '#GestiónDeAlquileres', '#PropietariosDigitales', '#InmobiliariasModernas',
  ],
};

// Generar contenido basado en el prompt y configuración
function generateContent(prompt: string, tone: string, language: string, hashtagConfig: any): string {
  // Seleccionar tipo de contenido basado en el prompt
  let category = 'proptech';
  if (prompt.toLowerCase().includes('pregunta') || prompt.toLowerCase().includes('engagement')) {
    category = 'engagement';
  } else if (prompt.toLowerCase().includes('educativo') || prompt.toLowerCase().includes('aprende')) {
    category = 'educational';
  } else if (prompt.toLowerCase().includes('promoción') || prompt.toLowerCase().includes('nuevo')) {
    category = 'promotional';
  }

  // Seleccionar template aleatorio
  const templates = CONTENT_TEMPLATES[category as keyof typeof CONTENT_TEMPLATES] || CONTENT_TEMPLATES.proptech;
  let template = templates[Math.floor(Math.random() * templates.length)];

  // Generar hashtags
  const selectedHashtags = hashtagConfig?.custom?.slice(0, 4) || [];
  const additionalHashtags = PROPTECH_DATA.hashtags
    .filter(h => !selectedHashtags.includes(h.replace('#', '')))
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(hashtagConfig?.maxCount || 10, 6) - selectedHashtags.length);
  
  const allHashtags = [
    ...selectedHashtags.map((h: string) => h.startsWith('#') ? h : `#${h}`),
    ...additionalHashtags,
  ].join(' ');

  // Reemplazar placeholders
  const replacements: Record<string, string> = {
    '{topic}': prompt || PROPTECH_DATA.topics[Math.floor(Math.random() * PROPTECH_DATA.topics.length)],
    '{content}': `Con Inmova, ${prompt.toLowerCase() || 'digitaliza tu gestión inmobiliaria'} y dedica más tiempo a lo que importa: tus clientes.`,
    '{benefit1}': 'Contratos digitales con firma electrónica',
    '{benefit2}': 'Cobros automáticos sin impagos',
    '{benefit3}': 'Comunicación centralizada 24/7',
    '{stat}': PROPTECH_DATA.stats[Math.floor(Math.random() * PROPTECH_DATA.stats.length)],
    '{insight}': 'La digitalización no es el futuro, es el presente del sector inmobiliario.',
    '{tip}': PROPTECH_DATA.tips[Math.floor(Math.random() * PROPTECH_DATA.tips.length)],
    '{callToAction}': 'Con Inmova puedes configurarlo en 2 minutos ⏱️',
    '{question}': prompt || '¿Cuál es el mayor reto de tu gestión inmobiliaria?',
    '{context}': 'Queremos conocer tu opinión para seguir mejorando nuestra plataforma.',
    '{achievement}': 'ayudar a más de 100 gestores a digitalizar sus procesos',
    '{news}': prompt || '¡Lanzamos nueva funcionalidad en Inmova!',
    '{title}': prompt || '5 tendencias PropTech para 2026',
    '{point1}': '1️⃣ IA para valoraciones automáticas',
    '{point2}': '2️⃣ Tours virtuales 360°',
    '{point3}': '3️⃣ Firma digital de contratos',
    '{point4}': '4️⃣ Automatización de cobros',
    '{point5}': '5️⃣ Analytics predictivo',
    '{fact}': PROPTECH_DATA.stats[Math.floor(Math.random() * PROPTECH_DATA.stats.length)],
    '{explanation}': 'La tecnología está transformando cómo gestionamos propiedades.',
    '{headline}': prompt || 'Digitaliza tu inmobiliaria hoy',
    '{description}': 'Gestiona contratos, cobros y comunicación desde una sola plataforma.',
    '{feature}': prompt || 'Dashboard de Analytics avanzado',
    '{benefits}': '✅ Métricas en tiempo real\n✅ Reportes automáticos\n✅ Predicciones de ocupación',
    '{hashtags}': allHashtags,
  };

  for (const [key, value] of Object.entries(replacements)) {
    template = template.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  // Ajustar tono
  if (tone === 'casual') {
    template = template.replace(/Inmova/g, 'Inmova 😊');
  } else if (tone === 'inspiracional') {
    template = '🌟 ' + template;
  }

  return template;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, tone = 'profesional', language = 'es', hashtags = {} } = body;

    // Si tenemos Anthropic configurado, usar IA real
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    if (anthropicKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: `Eres un community manager experto en PropTech y sector inmobiliario.
              
Genera un post para redes sociales con las siguientes características:
- Tema: ${prompt || 'Beneficios de digitalizar la gestión inmobiliaria'}
- Tono: ${tone}
- Idioma: ${language === 'es' ? 'Español' : language === 'en' ? 'Inglés' : 'Catalán'}
- Incluye emojis relevantes
- Añade un call-to-action
- Incluye estos hashtags al final: ${hashtags.custom?.map((h: string) => `#${h}`).join(' ') || '#PropTech #Inmova'}

El post debe ser para la empresa Inmova, una plataforma de gestión inmobiliaria digital.
Máximo 280 caracteres para el texto principal (sin contar hashtags).
Responde SOLO con el texto del post, sin explicaciones adicionales.`,
            }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.content[0]?.text || '';
          return NextResponse.json({ 
            success: true, 
            content,
            source: 'ai',
          });
        }
      } catch (aiError) {
        console.error('[AI Generation Error]:', aiError);
        // Fallback a generación local
      }
    }

    // Generación local sin IA
    const content = generateContent(prompt, tone, language, hashtags);
    
    return NextResponse.json({
      success: true,
      content,
      source: 'template',
    });
  } catch (error: any) {
    console.error('[Generate Content Error]:', error);
    return NextResponse.json(
      { error: 'Error generando contenido' },
      { status: 500 }
    );
  }
}
