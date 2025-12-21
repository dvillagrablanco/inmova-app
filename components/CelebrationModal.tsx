"use client";

/**
 * 🎉 CELEBRATION MODAL
 * 
 * Modal de celebración con efecto confetti para mostrar cuando el usuario
 * completa un hito importante (onboarding, primera propiedad, etc.)
 * 
 * Características:
 * - Efecto confetti animado usando canvas-confetti
 * - Animaciones con Framer Motion
 * - Auto-cierre después de 5 segundos
 * - Botón para cerrar manualmente
 * - Emojis y mensajes personalizados
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  emoji?: string;
  autoCloseDuration?: number; // en milisegundos (default: 5000)
}

export default function CelebrationModal({
  isOpen,
  onClose,
  title,
  message,
  emoji = '🎉',
  autoCloseDuration = 5000,
}: CelebrationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout>();

  // Efecto confetti
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Importar dinámicamente canvas-confetti
      import('canvas-confetti').then((confetti) => {
        const myConfetti = confetti.default;
        
        // Configurar canvas
        if (canvasRef.current) {
          myConfetti.create(canvasRef.current, {
            resize: true,
            useWorker: true,
          })({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
          });
        }

        // Confetti adicional después de 200ms
        setTimeout(() => {
          myConfetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#6366f1', '#8b5cf6', '#ec4899'],
          });
        }, 200);

        // Confetti adicional después de 400ms
        setTimeout(() => {
          myConfetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#f59e0b', '#10b981', '#06b6d4'],
          });
        }, 400);
      });

      // Auto-cerrar después del tiempo configurado
      if (autoCloseDuration > 0) {
        autoCloseTimerRef.current = setTimeout(() => {
          onClose();
        }, autoCloseDuration);
      }
    }

    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [isOpen, onClose, autoCloseDuration]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Canvas para confetti (fullscreen, detras del modal) */}
          <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[51] pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[52] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Emoji animado */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: 'spring',
                  stiffness: 200,
                }}
                className="text-7xl mb-4"
              >
                {emoji}
              </motion.div>

              {/* Title con animación */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-6 h-6 text-yellow-500" />
                {title}
                <Sparkles className="w-6 h-6 text-yellow-500" />
              </motion.h2>

              {/* Message con animación */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-600 mb-6"
              >
                {message}
              </motion.p>

              {/* Botón de acción */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  ¡Continuar! 🚀
                </Button>
              </motion.div>

              {/* Decoración adicional */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-xs text-gray-400"
              >
                Este mensaje se cerrará automáticamente
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
