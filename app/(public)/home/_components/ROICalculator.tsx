'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { roiCalculatorFields, calculateROI } from '@/lib/data/landing-data';
import { LandingEvents } from '@/lib/analytics/landing-events';
import { Calculator } from 'lucide-react';

export function ROICalculator() {
  const [inputs, setInputs] = useState({
    properties: 10,
    hoursPerWeek: 8,
    tools: 3,
    hourlyRate: 25,
  });

  const [showResults, setShowResults] = useState(false);
  const results = calculateROI(inputs);

  const handleCalculate = () => {
    setShowResults(true);
    LandingEvents.roiCalculatorSubmit(results.roi);
  };

  return (
    <section id="roi-calculator" className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Calcula Cuánto Ahorrarías con INMOVA
          </h2>
          <p className="text-xl text-gray-600">
            Resultados en tiempo real · Basado en datos de +500 clientes
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {roiCalculatorFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id} className="text-base font-semibold">
                    {field.label}
                  </Label>
                  <Input
                    id={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={inputs[field.id as keyof typeof inputs]}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        [field.id]: parseInt(e.target.value) || 0,
                      })
                    }
                    min={field.min}
                    max={field.max}
                    className="text-lg p-6"
                  />
                </div>
              ))}
            </div>

            <Button size="lg" className="w-full text-lg py-6 mb-8" onClick={handleCalculate}>
              <Calculator className="w-5 h-5 mr-2" />
              Calcular Mi Ahorro
            </Button>

            {showResults && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 space-y-6"
              >
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
                  📊 TU AHORRO ANUAL CON INMOVA
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">💰 Ahorro en software:</span>
                    <span className="font-bold text-xl">
                      €{results.softwareSavings.toLocaleString()}/año
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">⏰ Ahorro en tiempo:</span>
                    <span className="font-bold text-xl">
                      €{results.timeSavings.toLocaleString()}/año
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">📉 Reducción morosidad:</span>
                    <span className="font-bold text-xl">
                      €{results.morositySavings.toLocaleString()}/año
                    </span>
                  </div>

                  <div className="border-t-2 border-gray-300 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">💎 TOTAL AHORRO:</span>
                      <span className="font-bold text-2xl text-green-600">
                        €{results.totalSavings.toLocaleString()}/año
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-red-600">
                    <span>🔥 Costo INMOVA (Plan {results.plan}):</span>
                    <span className="font-bold">-€{results.planCost.toLocaleString()}/año</span>
                  </div>

                  <div className="border-t-2 border-green-600 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">✅ BENEFICIO NETO:</span>
                      <span className="font-bold text-3xl text-green-600">
                        €{results.netBenefit.toLocaleString()}/año
                      </span>
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-2xl font-bold text-blue-600">ROI: {results.roi}% 🚀</p>
                    <p className="text-sm text-gray-600 mt-2">Tu plan ideal: {results.plan}</p>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full text-lg py-6"
                  onClick={() => LandingEvents.roiCalculatorCta(results.netBenefit)}
                  asChild
                >
                  <a href="/signup">
                    Empezar Ahora y Ahorrar €{results.netBenefit.toLocaleString()} →
                  </a>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
