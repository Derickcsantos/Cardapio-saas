'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Upload, 
  ExternalLink, 
  Settings, 
  Users, 
  Image as ImageIcon,
  LogOut,
  Trash2,
  Instagram,
  MessageCircle,
  Copy,
  Building2,
  Eye,
  Edit
} from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'
import Menu3DViewer from '@/components/Menu3DViewer'
import UserManagement from '@/components/UserManagement'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [menuImages, setMenuImages] = useState([])
  const [loading, setLoading] = useState(true)

  // Check authentication and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          throw new Error('Not authenticated')
        }
        
        const userData = await response.json()
        setUser(userData)
        
        // Fetch organization data
        const orgResponse = await fetch(`/api/organization?userId=${userData.id}`)
        if (orgResponse.ok) {
          const orgData = await orgResponse.json()
          setOrganization(orgData)
          
          // Fetch menu images if organization exists
          if (orgData.id) {
            const imagesResponse = await fetch(`/api/menu?organizationId=${orgData.id}`)
            if (imagesResponse.ok) {
              const images = await imagesResponse.json()
              setMenuImages(images)
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/?error=session_expired')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      })
      localStorage.removeItem('user')
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  const handleSaveOrganization = async (e) => {
    e.preventDefault()
    if (!organization) return
    
    try {
      const response = await fetch(`/api/organization/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organization),
      })

      if (response.ok) {
        toast.success('Dados salvos com sucesso!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Erro ao salvar as alterações')
    }
  }

  const handleImageUpload = async (file) => {
    if (!organization) return
    
    const formData = new FormData()
    formData.append('image', file)
    formData.append('organizationId', organization.id)
    
    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMenuImages(prev => [...prev, data])
        toast.success('Imagem adicionada com sucesso!')
      } else {
        throw new Error(data.error || 'Falha ao fazer upload')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Erro ao fazer upload da imagem')
    }
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
                  {organization?.name || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">
                  Olá, {user?.name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="menu" className="space-y-4">
          <TabsList>
            <TabsTrigger value="menu">Cardápio</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visualização 3D do Cardápio</CardTitle>
                <CardDescription>
                  Visualize como ficará o cardápio 3D do seu estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Menu3DViewer images={menuImages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Imagens do Cardápio</CardTitle>
                <CardDescription>
                  Adicione e gerencie as imagens do seu cardápio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader onUpload={handleImageUpload} />
                
                {menuImages.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Suas imagens</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {menuImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="rounded-lg h-32 w-full object-cover"
                          />
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Estabelecimento</CardTitle>
                <CardDescription>
                  Atualize as informações do seu estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveOrganization} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Estabelecimento</Label>
                      <Input
                        id="name"
                        value={organization?.name || ''}
                        onChange={(e) => setOrganization({...organization, name: e.target.value})}
                        placeholder="Nome do seu negócio"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Personalizada</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          {window.location.origin}/
                        </span>
                        <Input
                          id="slug"
                          value={organization?.slug || ''}
                          onChange={(e) => setOrganization({...organization, slug: e.target.value})}
                          placeholder="sua-marca"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          @
                        </span>
                        <Input
                          id="instagram"
                          value={organization?.social_media?.instagram?.replace('@', '') || ''}
                          onChange={(e) => setOrganization({
                            ...organization, 
                            social_media: {
                              ...organization?.social_media,
                              instagram: e.target.value.startsWith('@') ? e.target.value : `@${e.target.value}`
                            }
                          })}
                          placeholder="seuusuario"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={organization?.contact?.whatsapp || ''}
                        onChange={(e) => setOrganization({
                          ...organization, 
                          contact: {
                            ...organization?.contact,
                            whatsapp: e.target.value
                          }
                        })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" disabled={!organization}>
                      Salvar alterações
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <UserManagement organizationId={organization?.id} />
          </TabsContent>

          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <CardTitle>Planos e Assinatura</CardTitle>
                <CardDescription>
                  Gerencie seu plano de assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                {organization?.subscription_status === 'active' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <h3 className="font-medium">Plano Atual</h3>
                        <p className="text-sm text-gray-600">
                          {organization?.plan === 'free' ? 'Grátis' : 
                           organization?.plan === 'premium' ? 'Premium' : 'Enterprise'}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Recursos do Plano</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center">
                          <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {organization?.plan === 'free' ? 'Até 10 itens no cardápio' : 'Itens ilimitados no cardápio'}
                        </li>
                        <li className="flex items-center">
                          <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {organization?.plan === 'enterprise' ? 'Suporte prioritário' : 'Suporte por e-mail'}
                        </li>
                        {organization?.plan !== 'free' && (
                          <li className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Domínio personalizado
                          </li>
                        )}
                      </ul>
                    </div>

                    {organization?.plan === 'free' && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-800">Atualize seu plano</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Desbloqueie recursos avançados com nossos planos pagos.
                        </p>
                        <Button className="mt-3" onClick={() => router.push('/pricing')}>
                          Ver planos
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium">Nenhum plano ativo</h3>
                    <p className="text-gray-600 mt-1 mb-4">
                      Escolha um plano para começar a usar a plataforma
                    </p>
                    <Button onClick={() => router.push('/pricing')}>
                      Ver planos disponíveis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}