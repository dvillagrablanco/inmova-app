'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { heroData } from '@/lib/data/landing-data';
import { LandingEvents } from '@/lib/analytics/landing-events';
import { CheckCircle, Clock, Headphones } from 'lucide-react';

const trustBadgeIcons = {
  CheckCircle,
  Clock,
  Headphones,
};

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
    >
      <div className="container mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Column - Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="inline-block">
            <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-4 py-2 rounded-full">
              {heroData.eyebrow}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            {heroData.headline}
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed">{heroData.subheadline}</p>

          <p className="text-lg text-gray-600">{heroData.description}</p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto flex flex-col items-center"
              onClick={() => LandingEvents.heroCtaPrimary()}
              asChild
            >
              <a href={heroData.primaryCTA.href}>
                <span>{heroData.primaryCTA.text}</span>
                <span className="text-xs mt-1 opacity-80">{heroData.primaryCTA.subtext}</span>
              </a>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => LandingEvents.heroCtaSecondary()}
              asChild
            >
              <a href={heroData.secondaryCTA.href}>{heroData.secondaryCTA.text}</a>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-6 pt-4">
            {heroData.trustBadges.map((badge, index) => {
              const Icon = trustBadgeIcons[badge.icon as keyof typeof trustBadgeIcons];
              return (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <Icon className="w-5 h-5 text-green-600" />
                  <span>{badge.text}</span>
                </div>
              );
            })}
          </div>

          {/* Social Proof */}
          <p className="text-sm text-gray-600 pt-4">{heroData.socialProof}</p>
        </motion.div>

        {/* Right Column - Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white p-8">
            <div className="space-y-4">
              <div className="h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded w-32"></div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded w-16"></div>
                  </div>
                ))}
              </div>
              <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg"></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
