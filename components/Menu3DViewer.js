'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react'

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
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      <Card className={`w-full ${isFullscreen ? 'h-full border-0 rounded-none' : 'h-96'}`}>
        <CardContent className={`relative p-0 h-full ${isFullscreen ? 'bg-black' : ''}`}>
          {/* Image Display */}
          <div className="relative h-full overflow-hidden rounded-lg">
            <img
              src={currentImage.imageUrl}
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
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 hover:bg-white shadow-lg"
                onClick={toggleZoom}
                title={isZoomed ? 'Diminuir zoom' : 'Aumentar zoom'}
              >
                {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 hover:bg-white shadow-lg"
                onClick={rotateImage}
                title="Girar imagem"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 hover:bg-white shadow-lg"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Page Counter */}
            {images.length > 1 && (
              <Badge className="absolute bottom-4 left-4 bg-white/90 text-black">
                {currentIndex + 1} de {images.length}
              </Badge>
            )}
          </div>
          
          {/* Thumbnail Navigation */}
          {images.length > 1 && !isFullscreen && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex gap-2 bg-white/90 rounded-lg p-2 shadow-lg">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      setCurrentIndex(index)
                      resetView()
                    }}
                    className={`
                      w-12 h-12 rounded border-2 overflow-hidden transition-all
                      ${index === currentIndex ? 'border-blue-500 scale-110' : 'border-gray-300 hover:border-gray-400'}
                    `}
                  >
                    <img
                      src={image.imageUrl}
                      alt={`Página ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Organization Info */}
          {organization && !isFullscreen && (
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-white/90 text-black">
                {organization.name}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Instructions */}
      {!isFullscreen && (
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Use as setas do teclado para navegar • Espaço para zoom • ESC para sair da tela cheia</p>
        </div>
      )}
    </div>
  )
}