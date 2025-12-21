/**
 * CELEBRATION MODAL
 * Modal con animaciones de celebración cuando el usuario completa hitos importantes
 * Incluye confetti, badges, mensajes motivacionales
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Award,
  Star,
  Sparkles,
  PartyPopper,
  Rocket,
  CheckCircle,
  Gift,
  Crown,
  Zap,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Celebration {
  id: string;
  type: string;
  title: string;
  message: string;
  badgeText?: string;
  badgeColor?: string;
  actionLabel?: string;
  actionRoute?: string;
}

interface CelebrationModalProps {
  celebration: Celebration | null;
  onClose: () => void;
  onAction?: (route: string) => void;
}

export default function CelebrationModal({
  celebration,
  onClose,
  onAction,
}: CelebrationModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (celebration) {
      setIsVisible(true);
      triggerConfetti();

      // Auto-cerrar después de 8 segundos
      const timeout = setTimeout(() => {
        handleClose();
      }, 8000);

      return () => clearTimeout(timeout);
    }
  }, [celebration]);

  function triggerConfetti() {
    // Disparo central
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'],
    });

    // Disparos laterales
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });
    }, 200);

    // Lluvia de estrellas
    setTimeout(() => {
      confetti({
        particleCount: 30,
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { y: 0.4 },
        shapes: ['star'],
        colors: ['#fbbf24', '#fcd34d'],
      });
    }, 400);
  }

  function handleClose() {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }

  function handleAction() {
    if (celebration?.actionRoute && onAction) {
      onAction(celebration.actionRoute);
    }
    handleClose();
  }

  if (!celebration) return null;

  const Icon = getIconByType(celebration.type);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header con gradiente */}
              <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-8 pt-12 pb-8 text-center overflow-hidden">
                {/* Floating sparkles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      initial={{
                        x: Math.random() * 400,
                        y: -20,
                        opacity: 0,
                      }}
                      animate={{
                        y: 400,
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    >
                      <Sparkles
                        className="text-white/30"
                        size={8 + Math.random() * 12}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Icon animado */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 0.6, delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <Icon className="w-10 h-10 text-indigo-600" />
                </motion.div>

                {/* Título */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  {celebration.title}
                </motion.h2>

                {/* Badge (opcional) */}
                {celebration.badgeText && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="inline-block"
                  >
                    <div
                      className={`px-4 py-1 rounded-full text-sm font-semibold ${
                        celebration.badgeColor || 'bg-yellow-400 text-yellow-900'
                      }`}
                    >
                      {celebration.badgeText}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Body */}
              <div className="px-8 py-6">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-600 text-center mb-6 leading-relaxed"
                >
                  {celebration.message}
                </motion.p>

                {/* Action Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3"
                >
                  {celebration.actionLabel && celebration.actionRoute ? (
                    <>
                      <button
                        onClick={handleAction}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                      >
                        {celebration.actionLabel}
                      </button>
                      <button
                        onClick={handleClose}
                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                      >
                        Cerrar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleClose}
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                      ¡Genial!
                    </button>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getIconByType(type: string) {
  const iconMap: Record<string, any> = {
    onboarding_completed: Trophy,
    first_building: Award,
    first_unit: Star,
    first_contract: CheckCircle,
    milestone: Sparkles,
    achievement: PartyPopper,
    level_up: Rocket,
    reward: Gift,
    champion: Crown,
    power_user: Zap,
  };

  return iconMap[type] || Trophy;
}
