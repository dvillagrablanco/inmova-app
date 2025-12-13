"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Transición suave entre páginas
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Transición con fade para modales
 */
export function FadeTransition({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Transición tipo slide para sidebars
 */
interface SlideTransitionProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

export function SlideTransition({ children, direction = 'right' }: SlideTransitionProps) {
  const variants = {
    hidden: {
      x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
      y: direction === 'top' ? -300 : direction === 'bottom' ? 300 : 0,
      opacity: 0,
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
    },
    exit: {
      x: direction === 'left' ? 300 : direction === 'right' ? -300 : 0,
      y: direction === 'top' ? 300 : direction === 'bottom' ? -300 : 0,
      opacity: 0,
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Animación de lista escalonada
 */
interface StaggeredListProps {
  children: ReactNode;
  className?: string;
}

export function StaggeredList({ children, className }: StaggeredListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Item de lista con animación
 */
export function StaggeredListItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
