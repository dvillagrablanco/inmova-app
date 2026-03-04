'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpandableRowProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Fila expandible para tablas.
 * Click para expandir/colapsar contenido adicional inline.
 */
export function ExpandableRow({ trigger, children, className = '' }: ExpandableRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={className}>
      <div
        className="flex items-center gap-2 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-gray-400 flex-shrink-0">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <div className="flex-1 min-w-0">{trigger}</div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-6 pt-3 pb-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
