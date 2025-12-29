'use client';

import { motion } from 'framer-motion';
import { comparisonData } from '@/lib/data/landing-data';
import { Check, X } from 'lucide-react';

export function ComparisonTable() {
  return (
    <section id="comparison" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Por Qué INMOVA es la Mejor Opción
          </h2>
          <p className="text-xl text-gray-600">Comparativa objetiva con la competencia</p>
        </motion.div>

        <div className="max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden shadow-xl">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <th className="p-6 text-left text-lg font-bold">Característica</th>
                <th className="p-6 text-center text-lg font-bold">INMOVA</th>
                <th className="p-6 text-center text-lg font-bold">Homming</th>
                <th className="p-6 text-center text-lg font-bold">Rentger</th>
                <th className="p-6 text-center text-lg font-bold">Buildium</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className={cn('border-b border-gray-200', row.inmova.highlight && 'bg-blue-50')}
                >
                  <td className="p-6 font-medium text-gray-900">{row.feature}</td>
                  <td className="p-6 text-center">{renderValue(row.inmova.value, true)}</td>
                  <td className="p-6 text-center">{renderValue(row.homming.value)}</td>
                  <td className="p-6 text-center">{renderValue(row.rentger.value)}</td>
                  <td className="p-6 text-center">{renderValue(row.buildium.value)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function renderValue(value: string | boolean, isInmova = false) {
  if (value === true) {
    return (
      <Check className={cn('w-6 h-6 mx-auto', isInmova ? 'text-green-600' : 'text-gray-400')} />
    );
  }
  if (value === false) {
    return <X className="w-6 h-6 text-red-400 mx-auto" />;
  }
  return <span className={cn('font-semibold', isInmova && 'text-blue-600')}>{value}</span>;
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
