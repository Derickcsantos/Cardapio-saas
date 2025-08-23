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
      // Get organization by slug
      const orgResponse = await fetch(`/api/organizations/slug/${params.slug}`)
      
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        setOrganization(orgData)
        
        // Get organization images
        const imagesResponse = await fetch(`/api/organizations/${orgData.id}/images`)
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json()
          setMenuImages(imagesData.images || [])
        }
      } else if (orgResponse.status === 404) {
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Carregando cardápio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
    <div className="min-h-screen bg-black">
      {/* Header - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {organization?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  {organization?.name}
                </h1>
                <p className="text-xs text-gray-400">Cardápio Digital</p>
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-white hover:bg-white/10">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Full screen menu viewer */}
      <div className="pt-16">
        <div className="h-screen">
          <Menu3DViewer images={menuImages} organization={organization} />
        </div>
      </div>

      {/* Contact buttons - Fixed at bottom */}
      {(organization?.whatsapp || organization?.instagram || organization?.tiktok) && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="flex justify-center space-x-3 max-w-md mx-auto">
            {organization?.whatsapp && (
              <a
                href={`https://wa.me/${organization.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg">
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
                className="flex-1"
              >
                <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white shadow-lg">
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
                className="flex-1"
              >
                <Button className="w-full bg-gray-900 hover:bg-black text-white shadow-lg">
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.43.29-.8.68-1.06 1.16-.32.6-.4 1.25-.43 1.91-.06.83.02 1.67.33 2.43.44 1.01 1.4 1.74 2.5 1.98.7.16 1.42.09 2.09-.19.96-.39 1.66-1.2 1.9-2.2.15-.62.17-1.27.17-1.91.01-2.61.01-5.22.01-7.83.01-4.19.01-8.37.02-12.56v-.01z"></path>
                  </svg>
                  TikTok
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Address display - if no contact buttons */}
      {organization?.address && !(organization?.whatsapp || organization?.instagram || organization?.tiktok) && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-center max-w-md mx-auto">
            <p className="text-sm">{organization.address}</p>
          </div>
        </div>
      )}
    </div>
  )
}