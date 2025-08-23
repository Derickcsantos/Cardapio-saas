import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

// Server-side Stripe instance
export const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20', // Use the latest API version
  typescript: true,
}) : null;

// Client-side Stripe promise
export const getStripe = () => {
  if (typeof window === 'undefined') return null;
  if (!STRIPE_PUBLIC_KEY) {
    console.warn('NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not set in environment variables');
    return null;
  }
  return loadStripe(STRIPE_PUBLIC_KEY);
};

// Plan configurations
export const PLANS = {
  free: {
    name: 'Grátis',
    price: 0,
    maxImages: 1,
    features: ['1 imagem no cardápio', 'Suporte básico'],
    stripePriceId: '', // No price ID for free plan
  },
  plus: {
    name: 'Plus',
    price: 12.00, // in BRL
    maxImages: 3,
    features: ['Até 3 imagens', 'Suporte prioritário', 'Análise de métricas básicas'],
    stripePriceId: process.env.STRIPE_PLUS_PRICE_ID || 'price_plus_monthly',
  },
  pro: {
    name: 'Pro',
    price: 25.00, // in BRL
    maxImages: Infinity,
    features: ['Imagens ilimitadas', 'Suporte prioritário', 'Métricas avançadas', 'Personalização avançada'],
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  },
};

// Helper to get plan by name
export const getPlan = (planName) => {
  return PLANS[planName] || PLANS.free;
};
