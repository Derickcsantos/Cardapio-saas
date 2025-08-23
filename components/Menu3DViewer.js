'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2, MessageCircle, Instagram } from 'lucide-react'

export default function Menu3DViewer({ images = [], organization = null }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setIsZoomed(false)
    setRotation(0)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setIsZoomed(false)
    setRotation(0)
  }

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
  }

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const resetView = () => {
    setIsZoomed(false)
    setRotation(0)
  }

  const getImageUrl = (image) => {
    return image?.imageUrl || image?.image_url
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'Escape') setIsFullscreen(false)
      if (e.key === ' ') {
        e.preventDefault()
        toggleZoom()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!images || images.length === 0) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📖</span>
            </div>
            <p className="text-lg font-medium">Nenhuma imagem do cardápio</p>
            <p className="text-sm">Adicione algumas imagens para visualizar aqui</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentImage = images[currentIndex]

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-full'}`}>
      <Card className={`w-full h-full ${isFullscreen ? 'border-0 rounded-none' : 'border'}`}>
        <CardContent className={`relative p-0 h-full ${isFullscreen ? 'bg-black' : ''}`}>
          {/* Image Display */}
          <div className="relative h-full overflow-hidden">
            <img
              src={getImageUrl(currentImage)}
              alt={`Página ${currentIndex + 1} do cardápio`}
              className={`
                w-full h-full object-contain transition-all duration-300 cursor-pointer
                ${isZoomed ? 'scale-150' : 'scale-100'}
              `}
              style={{ transform: `rotate(${rotation}deg) scale(${isZoomed ? 1.5 : 1})` }}
              onClick={toggleZoom}
              draggable={false}
            />
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg z-10"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg z-10"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Address Display */}
            {organization?.address && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-lg shadow-lg">
                <p className="text-sm font-medium text-center">{organization.address}</p>
              </div>
            )}
            
            {/* Page Counter */}
            {images.length > 1 && (
              <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full shadow-lg">
                <span className="text-sm font-medium">{currentIndex + 1}/{images.length}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}