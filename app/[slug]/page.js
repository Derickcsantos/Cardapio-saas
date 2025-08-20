'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { MessageCircle, Instagram, ExternalLink, Share2, Heart } from 'lucide-react'
import Menu3DViewer from '@/components/Menu3DViewer'

export default function PublicMenuPage({ params }) {
  const [organization, setOrganization] = useState(null)
  const [menuImages, setMenuImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMenuData()
  }, [params.slug])

  const loadMenuData = async () => {
    try {
      const response = await fetch(`/api/menu/${params.slug}`)
      
      if (response.ok) {
        const data = await response.json()
        setOrganization(data.organization)
        setMenuImages(data.menuImages || [])
      } else if (response.status === 404) {
        setError('Organização não encontrada')
      } else {
        setError('Erro ao carregar cardápio')
      }
    } catch (error) {
      console.error('Error loading menu:', error)
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppClick = () => {
    if (organization?.whatsapp) {
      const cleanNumber = organization.whatsapp.replace(/\D/g, '')
      const message = encodeURIComponent(`Olá! Vi o cardápio de ${organization.name} e gostaria de fazer um pedido.`)
      window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank')
    }
  }

  const handleInstagramClick = () => {
    if (organization?.instagram) {
      const username = organization.instagram.replace('@', '')
      window.open(`https://instagram.com/${username}`, '_blank')
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cardápio - ${organization?.name}`,
          text: `Confira o cardápio de ${organization?.name}`,
          url: url,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        toast.success('Link copiado para a área de transferência!')
      } catch (error) {
        toast.error('Erro ao copiar link')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando cardápio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">😕</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Ops!</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {organization?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization?.name}
                </h1>
                <p className="text-gray-600">Cardápio Digital</p>
              </div>
            </div>
            
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Menu Viewer */}
        <div className="mb-8">
          <Menu3DViewer images={menuImages} organization={organization} />
        </div>

        {/* Action Buttons */}
        {(organization?.whatsapp || organization?.instagram) && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-500" />
                Entre em contato
              </h2>
              
              <div className="flex flex-wrap gap-4">
                {organization?.whatsapp && (
                  <Button
                    onClick={handleWhatsAppClick}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
                
                {organization?.instagram && (
                  <Button
                    onClick={handleInstagramClick}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card>
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Cardápio Digital 3D
                </h3>
                <p className="text-gray-600">
                  Navegue pelas páginas do cardápio usando as setas ou clique nas miniaturas
                </p>
              </div>
              
              <div className="flex justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">←→</kbd>
                  <span className="ml-2">Navegar</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Espaço</kbd>
                  <span className="ml-2">Zoom</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">ESC</kbd>
                  <span className="ml-2">Sair tela cheia</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-gray-500">
          <p className="text-sm">
            Powered by <span className="font-semibold text-blue-600">Menu SaaS 3D</span>
          </p>
        </div>
      </footer>
    </div>
  )
}