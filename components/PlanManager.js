'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Star, Zap } from 'lucide-react'
import { toast } from "sonner"

const PLANS = {
  free: { 
    name: 'Free', 
    price: 0, 
    images: 1, 
    icon: Star,
    features: ['1 imagem no cardápio', 'Suporte básico', 'URL personalizada']
  },
  plus: { 
    name: 'Plus', 
    price: 12, 
    images: 3, 
    icon: Zap,
    features: ['3 imagens no cardápio', 'Suporte prioritário', 'Análise de métricas', 'Personalização avançada']
  },
  pro: { 
    name: 'Pro', 
    price: 25, 
    images: 999, 
    icon: Crown,
    features: ['Imagens ilimitadas', 'Suporte VIP', 'Métricas avançadas', 'Domínio personalizado', 'API access']
  }
}

export default function PlanManager({ organization, onPlanChange }) {
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const upgradePlan = async (newPlan) => {
    if (newPlan === 'free') {
      toast.error('Não é possível fazer downgrade para o plano gratuito')
      return
    }

    setLoading(true)
    setSelectedPlan(newPlan)
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          plan: newPlan
        })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao criar sessão de pagamento')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error)
      toast.error('Erro ao processar upgrade. Tente novamente.')
    } finally {
      setLoading(false)
      setSelectedPlan(null)
    }
  }

  const cancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id
        })
      })

      if (response.ok) {
        toast.success('Assinatura cancelada com sucesso')
        onPlanChange?.('free')
      } else {
        throw new Error('Erro ao cancelar assinatura')
      }
    } catch (error) {
      console.error('Erro ao cancelar:', error)
      toast.error('Erro ao cancelar assinatura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gerenciar Plano</h2>
        <p className="text-gray-600">
          Plano atual: <Badge variant="outline">{PLANS[organization.plan]?.name || 'Free'}</Badge>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => {
          const Icon = plan.icon
          const isCurrentPlan = organization.plan === key
          const isLoading = loading && selectedPlan === key

          return (
            <Card key={key} className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}>
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500">Plano Atual</Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Icon className={`h-8 w-8 ${isCurrentPlan ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-sm">/mês</span>}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="font-medium">
                    {plan.images === 999 ? 'Imagens ilimitadas' : `${plan.images} imagem${plan.images > 1 ? 's' : ''}`}
                  </p>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {isCurrentPlan ? (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" disabled>
                        Plano Atual
                      </Button>
                      {key !== 'free' && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="w-full"
                          onClick={cancelSubscription}
                          disabled={loading}
                        >
                          Cancelar Assinatura
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button 
                      onClick={() => upgradePlan(key)}
                      disabled={loading || key === 'free'}
                      className="w-full"
                      variant={key === 'pro' ? 'default' : 'outline'}
                    >
                      {isLoading ? 'Processando...' : 
                       key === 'free' ? 'Plano Gratuito' : 'Selecionar Plano'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {organization.plan !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações da Assinatura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Status</p>
                <Badge variant="outline" className="mt-1">Ativo</Badge>
              </div>
              <div>
                <p className="font-medium">Próxima cobrança</p>
                <p className="text-gray-600 mt-1">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}