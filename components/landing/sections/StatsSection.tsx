'use client';

import { Building2, Users, TrendingUp, TrendingDown } from 'lucide-react';

const stats = [
  {
    icon: Building2,
    number: '€850M',
    label: 'Mercado España (TAM)',
    gradient: 'from-yellow-300 to-amber-300',
  },
  {
    icon: Users,
    number: '34',
    label: 'Tipos de Partners',
    gradient: 'from-green-300 to-emerald-300',
  },
  {
    icon: TrendingDown,
    number: '-70%',
    label: 'Más Barato que Competencia',
    gradient: 'from-blue-300 to-cyan-300',
  },
  {
    icon: TrendingUp,
    number: '€150M',
    label: 'Potencial 5 Años',
    gradient: 'from-pink-300 to-rose-300',
  },
];

export function StatsSection() {
  return (
    <section className="py-16 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/10" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="group hover:scale-105 transition-transform">
              <div className="flex items-center justify-center mb-3">
                <stat.icon className="h-6 w-6 mr-2 group-hover:animate-bounce" />
              </div>
              <div
                className={`text-5xl font-black mb-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
              >
                {stat.number}
              </div>
              <div className="text-white/90 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
