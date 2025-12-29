'use client';

import { motion } from 'framer-motion';
import { solutionData } from '@/lib/data/landing-data';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export function SolutionSection() {
  return (
    <section id="solution" className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {solutionData.headline}
          </h2>
          <p className="text-xl text-gray-600">{solutionData.subheadline}</p>
        </motion.div>

        <div className="space-y-24">
          {solutionData.steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.2 }}
              className={cn(
                'grid lg:grid-cols-2 gap-12 items-center',
                index % 2 === 1 && 'lg:flex-row-reverse'
              )}
            >
              {/* Content */}
              <div className={cn('space-y-6', index % 2 === 1 && 'lg:order-2')}>
                <div className="inline-block">
                  <span className="text-5xl font-bold text-blue-600 bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-3xl font-bold text-gray-900">{step.title}</h3>

                <p className="text-lg text-gray-600">{step.description}</p>

                <ul className="space-y-3">
                  {step.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <div className="inline-block bg-green-100 text-green-800 px-6 py-3 rounded-full font-semibold">
                  {step.metric}
                </div>
              </div>

              {/* Image Placeholder */}
              <div className={cn('relative', index % 2 === 1 && 'lg:order-1')}>
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-xl p-8">
                  <div className="h-full bg-white/50 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-lg">Dashboard Preview {index + 1}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Button size="lg" className="text-lg px-8 py-6" asChild>
            <a href={solutionData.cta.href}>{solutionData.cta.text}</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
