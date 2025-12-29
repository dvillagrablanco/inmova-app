'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { personaTabs } from '@/lib/data/landing-data';
import { LandingEvents } from '@/lib/analytics/landing-events';
import * as Icons from 'lucide-react';

export function FeaturesByPersona() {
  const [activeTab, setActiveTab] = useState(personaTabs[0].id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    LandingEvents.personaTabClick(tabId);
  };

  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            La Solución Perfecta Para Ti
          </h2>
          <p className="text-xl text-gray-600">Sea cual sea tu perfil</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full max-w-4xl mx-auto mb-12 h-auto">
            {personaTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="text-base md:text-lg py-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {personaTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-8"
              >
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{tab.headline}</h3>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tab.features.map((feature, index) => {
                  const Icon = Icons[feature.icon as keyof typeof Icons] as any;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 hover:shadow-lg transition"
                    >
                      <div className="mb-4">
                        {Icon && <Icon className="w-10 h-10 text-blue-600" />}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h4>
                      <p className="text-gray-600 mb-4">{feature.description}</p>
                      {feature.metric && (
                        <div className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-semibold">
                          {feature.metric}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 md:p-12 text-center space-y-6"
              >
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-gray-900">
                    💰 Plan {tab.pricing.plan}: €{tab.pricing.price}/mes
                  </p>
                  {tab.pricing.savings && (
                    <p className="text-lg text-gray-700">🎁 {tab.pricing.savings}</p>
                  )}
                  <p className="text-xl font-semibold text-blue-600">📊 {tab.pricing.roi}</p>
                </div>

                <Button
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={() => LandingEvents.personaCtaClick(tab.id)}
                  asChild
                >
                  <a href={tab.cta.href}>{tab.cta.text}</a>
                </Button>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
