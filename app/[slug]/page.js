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
        {(organization?.whatsapp || organization?.instagram || organization?.tiktok) && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Heart className="h-5 w-5 mr-2 text-red-500" />
                Entre em contato
              </h2>
              
              <div className="flex flex-wrap gap-4">
                {organization?.whatsapp && (
                  <a
                    href={`https://wa.me/${organization.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 min-w-[150px] ${
                      organization.tiktok ? 'flex-[1_1_calc(33.333%-1rem)]' : 'flex-[1_1_calc(50%-0.5rem)]'
                    }`}
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  </a>
                )}
                
                {organization?.instagram && (
                  <a
                    href={`https://instagram.com/${organization.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 min-w-[150px] ${
                      organization.tiktok ? 'flex-[1_1_calc(33.333%-1rem)]' : 'flex-[1_1_calc(50%-0.5rem)]'
                    }`}
                  >
                    <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                      <Instagram className="h-4 w-4 mr-2" />
                      Instagram
                    </Button>
                  </a>
                )}
                
                {organization?.tiktok && (
                  <a
                    href={`https://tiktok.com/@${organization.tiktok.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[150px] flex-[1_1_calc(33.333%-1rem)]"
                  >
                    <Button className="w-full bg-black hover:bg-gray-900 text-white">
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.43.29-.8.68-1.06 1.16-.32.6-.4 1.25-.43 1.91-.06.83.02 1.67.33 2.43.44 1.01 1.4 1.74 2.5 1.98.7.16 1.42.09 2.09-.19.96-.39 1.66-1.2 1.9-2.2.15-.62.17-1.27.17-1.91.01-2.61.01-5.22.01-7.83.01-4.19.01-8.37.02-12.56v-.01z"></path>
                      </svg>
                      TikTok
                    </Button>
                  </a>
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