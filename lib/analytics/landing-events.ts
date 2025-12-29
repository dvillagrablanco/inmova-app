/**
 * Landing Page Events - Google Analytics 4
 */

import { event } from './gtag';

export const LandingEvents = {
  // Hero Section
  heroCtaPrimary: () => {
    event({
      action: 'click',
      category: 'CTA',
      label: 'Hero Primary - Prueba Gratis',
    });
  },

  heroCtaSecondary: () => {
    event({
      action: 'click',
      category: 'CTA',
      label: 'Hero Secondary - Ver Demo',
    });
  },

  // Navigation
  navDemo: () => {
    event({
      action: 'click',
      category: 'Navigation',
      label: 'Nav - Demo',
    });
  },

  navLogin: () => {
    event({
      action: 'click',
      category: 'Navigation',
      label: 'Nav - Login',
    });
  },

  // Features by Persona
  personaTabClick: (personaId: string) => {
    event({
      action: 'tab_change',
      category: 'Features',
      label: `Persona Tab - ${personaId}`,
    });
  },

  personaCtaClick: (personaId: string) => {
    event({
      action: 'click',
      category: 'CTA',
      label: `Persona CTA - ${personaId}`,
    });
  },

  // ROI Calculator
  roiCalculatorSubmit: (roi: number) => {
    event({
      action: 'calculate',
      category: 'ROI Calculator',
      label: 'ROI Calculated',
      value: roi,
    });
  },

  roiCalculatorCta: (netBenefit: number) => {
    event({
      action: 'click',
      category: 'CTA',
      label: 'ROI Calculator CTA',
      value: netBenefit,
    });
  },

  // Pricing
  pricingPlanView: (planId: string) => {
    event({
      action: 'view',
      category: 'Pricing',
      label: `Plan View - ${planId}`,
    });
  },

  pricingPlanClick: (planId: string, price: number) => {
    event({
      action: 'click',
      category: 'CTA',
      label: `Pricing CTA - ${planId}`,
      value: price,
    });
  },

  // Testimonials
  testimonialView: (testimonialId: number) => {
    event({
      action: 'view',
      category: 'Testimonials',
      label: `Testimonial ${testimonialId}`,
    });
  },

  // FAQ
  faqExpand: (questionId: number, question: string) => {
    event({
      action: 'expand',
      category: 'FAQ',
      label: `Q${questionId}: ${question.substring(0, 50)}`,
    });
  },

  // Scroll Depth
  scrollDepth: (depth: number) => {
    event({
      action: 'scroll',
      category: 'Engagement',
      label: `Scroll Depth ${depth}%`,
      value: depth,
    });
  },

  // Time on Page
  timeOnPage: (seconds: number) => {
    event({
      action: 'time_on_page',
      category: 'Engagement',
      label: 'Time Spent',
      value: seconds,
    });
  },

  // Form Interactions
  signupFormStart: () => {
    event({
      action: 'start',
      category: 'Form',
      label: 'Signup Form Started',
    });
  },

  signupFormComplete: (plan: string) => {
    event({
      action: 'complete',
      category: 'Form',
      label: `Signup Form Completed - ${plan}`,
    });
  },

  demoFormSubmit: (source: string) => {
    event({
      action: 'submit',
      category: 'Form',
      label: `Demo Request - ${source}`,
    });
  },

  // Exit Intent
  exitIntentPopup: () => {
    event({
      action: 'show',
      category: 'Engagement',
      label: 'Exit Intent Popup',
    });
  },
};
