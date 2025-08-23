'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  LogOut,
  Building2,
  Settings,
  Users,
  Image as ImageIcon,
  CreditCard,
  Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PlanManager from '@/components/PlanManager'
import MemberManager from '@/components/MemberManager'
import ImageManager from '@/components/ImageManager'
import OrganizationSettings from '@/components/OrganizationSettings'
import Menu3DViewer from '@/components/Menu3DViewer'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [menuImages, setMenuImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Check authentication and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/')
          return
        }

        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          throw new Error('Not authenticated')
        }
        
        const userData = await response.json()
        setUser(userData)
        
        // Get the first organization (assuming user has at least one)
        if (userData.organizations && userData.organizations.length > 0) {
          setOrganization(userData.organizations[0])
        } else {
          // If no organization, redirect to create one
          toast.error('Nenhuma organização encontrada')
          router.push('/')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  const handleOrganizationUpdate = (updatedOrg) => {
    setOrganization(updatedOrg)
  }

  const handlePlanChange = (newPlan) => {
    setOrganization(prev => ({ ...prev, plan: newPlan }))
  }

  const handleImagesChange = (images) => {
    setMenuImages(images)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Nenhuma organização encontrada</h1>
            <p className="text-gray-600 mb-4">Você precisa criar uma organização para continuar.</p>
            <Button onClick={() => router.push('/')}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 rounded-full p-2">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization.name}
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">
                    Olá, {user?.name}
                  </p>
                  <Badge variant="outline">
                    {organization.plan === 'free' ? 'Grátis' : 
                     organization.plan === 'plus' ? 'Plus' : 'Pro'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => window.open(`/${organization.slug}`, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Cardápio
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="images">Imagens</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Plano Atual</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {organization.plan === 'free' ? 'Grátis' : 
                     organization.plan === 'plus' ? 'Plus' : 'Pro'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {organization.plan === 'free' ? 'Plano gratuito' : 
                     `R$ ${organization.plan === 'plus' ? '12' : '25'}/mês`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Imagens do Cardápio</CardTitle>
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{menuImages.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {organization.plan === 'free' ? 'Máx. 1 imagem' : 
                     organization.plan === 'plus' ? 'Máx. 3 imagens' : 'Imagens ilimitadas'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">URL do Cardápio</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-mono truncate">
                    /{organization.slug}
                  </div>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-xs"
                    onClick={() => window.open(`/${organization.slug}`, '_blank')}
                  >
                    Visualizar cardápio
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Menu Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Prévia do Cardápio</CardTitle>
                <CardDescription>
                  Visualize como ficará o cardápio 3D do seu estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {menuImages.length > 0 ? (
                  <div className="h-96">
                    <Menu3DViewer images={menuImages} organization={organization} />
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600">Nenhuma imagem do cardápio</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Adicione imagens na aba "Imagens" para visualizar seu cardápio
                      </p>
                      <Button onClick={() => setActiveTab('images')}>
                        Adicionar Imagens
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <ImageManager 
              organization={organization} 
              onImagesChange={handleImagesChange}
            />
          </TabsContent>

          <TabsContent value="settings">
            <OrganizationSettings 
              organization={organization}
              onUpdate={handleOrganizationUpdate}
            />
          </TabsContent>

          <TabsContent value="team">
            <MemberManager 
              organizationId={organization.id}
              currentUserRole={organization.userRole}
            />
          </TabsContent>

          <TabsContent value="plans">
            <PlanManager 
              organization={organization}
              onPlanChange={handlePlanChange}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}