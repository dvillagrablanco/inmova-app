'use client';

import Link from 'next/link';

export function MinimalLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            <span className="text-2xl font-bold">INMOVA</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <button className="px-4 py-2 border rounded">Iniciar Sesión</button>
            </Link>
            <Link href="/register">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">Empezar Gratis</button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold mb-6">
            6 Verticales + 10 Módulos
            <br />
            <span className="text-blue-600">Poder Multiplicado</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            La única plataforma PropTech que combina verticales de negocio con módulos transversales de IA, IoT y Blockchain.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <button className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg">
                Prueba Gratis 30 Días
              </button>
            </Link>
            <Link href="/contact">
              <button className="px-8 py-4 border-2 text-lg rounded-lg">
                Contactar Ventas
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">6 Verticales Especializados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: '🏢', title: 'Alquiler Tradicional' },
              { emoji: '🏖️', title: 'STR (Vacacional)' },
              { emoji: '🛏️', title: 'Coliving' },
              { emoji: '💹', title: 'House Flipping' },
              { emoji: '🏗️', title: 'Construcción' },
              { emoji: '💼', title: 'Servicios Profesionales' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="text-xl font-bold">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Planes y Precios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '€49', features: ['10 propiedades', 'Módulos básicos'] },
              { name: 'Professional', price: '€149', features: ['100 propiedades', 'Todos los módulos'], highlight: true },
              { name: 'Enterprise', price: 'Custom', features: ['Ilimitado', 'White-label'] }
            ].map((plan, i) => (
              <div key={i} className={`p-8 rounded-lg ${plan.highlight ? 'border-2 border-blue-600 shadow-xl' : 'border shadow'}`}>
                {plan.highlight && (
                  <div className="text-center mb-4">
                    <span className="inline-block px-4 py-1 bg-blue-600 text-white text-sm rounded-full">
                      Más Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-center text-blue-600 mb-6">
                  {plan.price}
                  {plan.price !== 'Custom' && <span className="text-lg text-gray-600">/mes</span>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <button className={`w-full py-3 rounded-lg ${plan.highlight ? 'bg-blue-600 text-white' : 'border-2'}`}>
                    Empezar Ahora
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🏢</span>
            <span className="text-xl font-bold">INMOVA</span>
          </div>
          <p className="text-gray-400">
            © 2025 INMOVA. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
