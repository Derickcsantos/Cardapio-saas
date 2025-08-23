'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, CheckCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { PLANS } from '@/lib/stripe';
import { useRouter } from 'next/navigation';

export default function PricingPlans({ organization }) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(organization?.plan || 'free');
  const { user } = useUser();
  const router = useRouter();

  const handleSubscribe = async (plan) => {
    if (!user || !organization) return;
    
    setLoading(true);
    setSelectedPlan(plan);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          organizationId: organization.id,
          userId: user.id,
        }),
      });

      const { sessionId } = await response.json();
      
      const stripe = (await import('@stripe/stripe-js')).loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
      );
      
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        console.error('Error redirecting to checkout:', error);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPlan = (plan) => {
    return organization?.plan === plan;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 py-8">
      {Object.entries(PLANS).map(([key, plan]) => (
        <div
          key={key}
          className={`rounded-lg border bg-card text-card-foreground shadow-sm ${
            isCurrentPlan(key) ? 'ring-2 ring-primary' : ''
          }`}
        >
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            <div className="text-4xl font-bold mb-6">
              {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
              <span className="text-sm font-normal text-muted-foreground">
                {plan.price > 0 ? '/mês' : ''}
              </span>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                {plan.maxImages === Infinity ? 'Imagens ilimitadas' : `Até ${plan.maxImages} imagem${plan.maxImages > 1 ? 's' : ''}`}
              </li>
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              className={`w-full ${
                isCurrentPlan(key) ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
              onClick={() => handleSubscribe(key)}
              disabled={isCurrentPlan(key) || loading}
            >
              {loading && selectedPlan === key ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isCurrentPlan(key) ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : null}
              {isCurrentPlan(key) ? 'Plano Atual' : 'Assinar'}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
