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

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    if (parsedUser.type === 'master') {
      router.push('/admin')
      return
    }

    if (parsedUser.user_organizations && parsedUser.user_organizations.length > 0) {
      const org = parsedUser.user_organizations[0].organizations
      setOrganization(org)
      loadMenuImages(org.id)
    }
    
    setLoading(false)
  }, [router])

  const loadMenuImages = async (orgId) => {
    try {
      if (!organization?.slug) return
      
      const response = await fetch(`/api/menu/${organization.slug}`)
      if (response.ok) {
        const data = await response.json()
        setMenuImages(data.menuImages || [])
      }
    } catch (error) {
      console.error('Error loading menu images:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  const handleUpdateOrganization = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const whatsapp = formData.get('whatsapp')
    const instagram = formData.get('instagram')
    
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ whatsapp, instagram }),
      })

      if (response.ok) {
        const data = await response.json()
        setOrganization(prev => ({ ...prev, whatsapp, instagram }))
        toast.success('Organização atualizada com sucesso!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao atualizar organização')
      }
    } catch (error) {
      toast.error('Erro de conexão. Tente novamente.')
    }
  }

  const copyUrl = () => {
    const url = `${window.location.origin}/${organization?.slug}`
    navigator.clipboard.writeText(url)
    toast.success('URL copiada para a área de transferência!')
  }

  const handleDeleteImage = async (imageId) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) {
      return
    }

    try {
      const response = await fetch(`/api/menu/images/${imageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMenuImages(prev => prev.filter(img => img.id !== imageId))
        toast.success('Imagem excluída com sucesso!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao excluir imagem')
      }
    } catch (error) {
      toast.error('Erro de conexão. Tente novamente.')
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <ImageIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{menuImages.length}</p>
                <p className="text-sm text-gray-500">Imagens do cardápio</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <ExternalLink className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">URL Pública</p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500 truncate">
                    /{organization?.slug}
                  </p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={copyUrl}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="bg-purple-100 rounded-full p-3 mr-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">1</p>
                <p className="text-sm text-gray-500">Usuários</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="menu" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="menu">📖 Cardápio</TabsTrigger>
            <TabsTrigger value="users">👥 Usuários</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Configurações</TabsTrigger>
            <TabsTrigger value="preview">👁️ Visualizar</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload de Imagens do Cardápio</CardTitle>
                <CardDescription>
                  Faça upload das páginas do seu cardápio. As imagens serão convertidas para WebP automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {organization && (
                  <ImageUploader 
                    organizationId={organization.id}
                    onUploadSuccess={(imageData) => {
                      setMenuImages(prev => [...prev, imageData])
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {menuImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Imagens do Cardápio</CardTitle>
                  <CardDescription>
                    Gerencie as imagens do seu cardápio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuImages.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.imageUrl}
                          alt={`Página ${index + 1} do cardápio`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.open(image.imageUrl, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteImage(image.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <Badge className="absolute top-2 left-2">
                          Página {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement 
              organizationId={organization?.id}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Organização</CardTitle>
                <CardDescription>
                  Configure as informações da sua organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateOrganization} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da organização</Label>
                    <Input 
                      defaultValue={organization?.name} 
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500">
                      O nome da organização não pode ser alterado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Slug da URL</Label>
                    <Input 
                      defaultValue={organization?.slug} 
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-sm text-gray-500">
                      Sua URL pública: {window.location.origin}/{organization?.slug}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">
                      <MessageCircle className="h-4 w-4 inline mr-2" />
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      placeholder="(11) 99999-9999"
                      defaultValue={organization?.whatsapp}
                    />
                    <p className="text-xs text-gray-500">
                      Formato: (11) 99999-9999 ou 5511999999999
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">
                      <Instagram className="h-4 w-4 inline mr-2" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      placeholder="@meurestaurante"
                      defaultValue={organization?.instagram}
                    />
                    <p className="text-xs text-gray-500">
                      Digite apenas o nome de usuário (com ou sem @)
                    </p>
                  </div>

                  <Button type="submit" className="w-full">
                    Salvar alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Visualização 3D do Cardápio</CardTitle>
                    <CardDescription>
                      Veja como seus clientes visualizarão o cardápio
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => window.open(`/${organization?.slug}`, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir página pública
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4 min-h-[400px]">
                  {menuImages.length > 0 ? (
                    <Menu3DViewer images={menuImages} />
                  ) : (
                    <div className="text-center text-gray-500 h-full flex items-center justify-center">
                      <div>
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhuma imagem do cardápio encontrada</p>
                        <p className="text-sm">Faça upload de algumas imagens para ver a visualização 3D</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{menuImages.length}</div>
                  <div className="text-sm text-gray-500">Imagens do cardápio</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {organization?.whatsapp ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-500">WhatsApp configurado</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {organization?.instagram ? '✓' : '✗'}
                  </div>
                  <div className="text-sm text-gray-500">Instagram configurado</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}