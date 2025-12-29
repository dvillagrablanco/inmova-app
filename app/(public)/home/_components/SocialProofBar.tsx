'use client';

import { motion } from 'framer-motion';
import { socialProofStats } from '@/lib/data/landing-data';
import * as Icons from 'lucide-react';

export function SocialProofBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="sticky top-[72px] z-40 bg-white/95 backdrop-blur-lg border-y border-gray-200 shadow-sm"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
          {socialProofStats.map((stat, index) => {
            const Icon = Icons[stat.icon as keyof typeof Icons] as any;
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                {Icon && <Icon className="w-4 h-4 text-blue-600" />}
                <span className="font-medium text-gray-700">{stat.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
