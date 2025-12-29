'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { pricingPlans, additionalPlans } from '@/lib/data/landing-data';
import { LandingEvents } from '@/lib/analytics/landing-events';
import { Check } from 'lucide-react';

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Planes que Escalan Contigo
          </h2>
          <p className="text-xl text-gray-600">
            Sin costos ocultos · Sin permanencia · Cancela cuando quieras
          </p>
        </motion.div>

        {/* Main Plans */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'bg-white border-2 rounded-2xl p-8 hover:shadow-2xl transition relative',
                plan.popular ? 'border-blue-600 shadow-xl scale-105' : 'border-gray-200'
              )}
            >
              {plan.popular && (
                <Badge className="absolute top-4 right-4 bg-blue-600">Más Popular</Badge>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-gray-900">€{plan.price}</span>
                  <span className="text-gray-600">/mes</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{plan.savings}</p>
              </div>

              <Button
                size="lg"
                className={cn('w-full mb-6', plan.popular ? 'bg-blue-600 hover:bg-blue-700' : '')}
                variant={plan.ctaVariant === 'outline' ? 'outline' : 'default'}
                onClick={() => LandingEvents.pricingPlanClick(plan.id, plan.price)}
                asChild
              >
                <a href={`/signup?plan=${plan.id}`}>{plan.ctaText}</a>
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.idealFor && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Ideal para:</p>
                  <p className="text-sm text-gray-600">{plan.idealFor}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Additional Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Planes Adicionales</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {additionalPlans.map((plan, index) => (
              <div
                key={plan.id}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 text-center"
              >
                <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <p className="text-3xl font-bold text-blue-600">{plan.price}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
