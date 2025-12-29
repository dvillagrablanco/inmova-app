'use client';

import { motion } from 'framer-motion';
import { problemData } from '@/lib/data/landing-data';
import { Button } from '@/components/ui/button';

export function ProblemSection() {
  return (
    <section id="problem" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {problemData.headline}
          </h2>
          <p className="text-xl text-gray-600">{problemData.subheadline}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {problemData.painPoints.map((pain, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition"
            >
              <div className="text-4xl mb-4">{pain.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{pain.title}</h3>
              <p className="text-gray-600">{pain.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <Button size="lg" className="text-lg px-8 py-6" asChild>
            <a href={problemData.cta.href}>{problemData.cta.text}</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
