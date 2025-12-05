'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FeatureHighlight {
  id: string;
  title: string;
  description: string;
  benefits: string[];
  action?: {
    label: string;
    onClick: () => void;
  };
  imageUrl?: string;
}

interface FeatureHighlightProps {
  feature: FeatureHighlight;
  onDismiss: () => void;
  onComplete?: () => void;
}

/**
 * Componente para destacar nuevas funcionalidades
 * Ayuda a descubrir características de la plataforma
 */
export function FeatureHighlightBanner({
  feature,
  onDismiss,
  onComplete,
}: FeatureHighlightProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const handleAction = () => {
    if (feature.action) {
      feature.action.onClick();
    }
    if (onComplete) {
      onComplete();
    }
    handleDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Lightbulb className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {feature.title}
                        <span className="text-xs font-normal px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                          Nuevo
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {feature.description}
                      </p>
                    </div>
                    <button
                      onClick={handleDismiss}
                      className="ml-4 p-1 rounded-lg hover:bg-white/50 transition-colors"
                      aria-label="Cerrar"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Benefits */}
                  <div className="flex flex-wrap gap-2">
                    {feature.benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200"
                      >
                        <Check className="h-3 w-3 text-green-600" />
                        {benefit}
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  {feature.action && (
                    <div>
                      <Button
                        onClick={handleAction}
                        size="sm"
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                      >
                        {feature.action.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Optional Image */}
                {feature.imageUrl && (
                  <div className="hidden lg:block flex-shrink-0">
                    <img
                      src={feature.imageUrl}
                      alt={feature.title}
                      className="w-32 h-32 object-cover rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
