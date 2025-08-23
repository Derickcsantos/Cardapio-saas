'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import PricingPlans from '@/components/PricingPlans';

export default function PricingPage() {
  const { user, isLoading: userLoading } = useUser();
  const [organization, setOrganization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/organization?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
        } else {
          throw new Error('Failed to fetch organization');
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as informações da sua organização',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchOrganization();
    } else {
      setIsLoading(false);
    }
  }, [user, toast]);

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    router.push('/login?redirect=/pricing');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Planos de Assinatura
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Escolha o plano perfeito para o seu negócio
          </p>
        </div>
        
        {organization && (
          <div className="mb-8 p-4 bg-primary/5 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Seu plano atual: <span className="font-semibold text-foreground">
                {organization.plan === 'free' ? 'Grátis' : 
                 organization.plan === 'plus' ? 'Plus' : 'Pro'}
              </span>
              {organization.plan !== 'free' && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (válido até {new Date(organization.current_period_end).toLocaleDateString()})
                </span>
              )}
            </p>
          </div>
        )}
        
        <PricingPlans organization={organization} />
        
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Dúvidas sobre os planos? <a href="/contact" className="text-primary hover:underline">Fale conosco</a></p>
          <p className="mt-2 text-xs">Todos os valores em Reais (BRL). Cobrança recorrente mensal. Cancele quando quiser.</p>
        </div>
      </div>
    </div>
  );
}
