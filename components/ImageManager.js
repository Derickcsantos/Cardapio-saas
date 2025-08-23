'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, Trash2, Eye, AlertCircle } from 'lucide-react'
import { toast } from "sonner"

const PLAN_LIMITS = {
  free: 1,
  plus: 3,
  pro: 999
}

export default function ImageManager({ organization, onImagesChange }) {
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchImages()
  }, [organization.id])

  const fetchImages = async () => {
    try {
      const response = await fetch(`/api/organizations/${organization.id}/images`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
        onImagesChange?.(data.images || [])
      } else {
        toast.error('Erro ao carregar imagens')
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      toast.error('Erro ao carregar imagens')
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (file) => {
    const limit = PLAN_LIMITS[organization.plan] || PLAN_LIMITS.free
    
    if (images.length >= limit) {
      toast.error(`Limite de ${limit} imagem${limit > 1 ? 's' : ''} atingido para o plano ${organization.plan}. Faça upgrade do seu plano.`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/organizations/${organization.id}/images`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Imagem enviada com sucesso!')
        fetchImages()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao fazer upload da imagem')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  const deleteImage = async (imageId) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${organization.id}/images/${imageId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Imagem excluída com sucesso!')
        fetchImages()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao excluir imagem')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Erro ao excluir imagem')
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
    // Reset input
    e.target.value = ''
  }

  const limit = PLAN_LIMITS[organization.plan] || PLAN_LIMITS.free
  const canUpload = images.length < limit
  const usagePercentage = (images.length / (limit === 999 ? 100 : limit)) * 100

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando imagens...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Imagens do Cardápio</CardTitle>
          <CardDescription>
            Faça upload e gerencie as imagens do seu cardápio digital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Usage indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso de imagens</span>
              <span>
                {images.length}/{limit === 999 ? '∞' : limit} imagens
              </span>
            </div>
            {limit !== 999 && (
              <Progress value={usagePercentage} className="h-2" />
            )}
          </div>

          {/* Upload area */}
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            canUpload && !uploading 
              ? 'border-gray-300 hover:border-blue-400 cursor-pointer' 
              : 'border-gray-200 cursor-not-allowed opacity-50'
          }`}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={!canUpload || uploading}
              className="hidden"
              id="image-upload"
            />
            <label 
              htmlFor={canUpload && !uploading ? "image-upload" : undefined}
              className="cursor-pointer"
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div>
                {uploading ? (
                  <p className="text-lg font-medium text-gray-600">Enviando imagem...</p>
                ) : canUpload ? (
                  <>
                    <p className="text-lg font-medium text-gray-900">
                      Clique para fazer upload
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF até 5MB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-600">
                      Limite de imagens atingido
                    </p>
                    <p className="text-sm text-gray-500">
                      Faça upgrade do seu plano para enviar mais imagens
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>

          {!canUpload && organization.plan === 'free' && (
            <div className="flex items-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-3" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Limite atingido</p>
                <p className="text-amber-700">
                  Atualize para o plano Plus ou Pro para enviar mais imagens.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images grid */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suas Imagens ({images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(image.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteImage(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Image info */}
                  <div className="mt-2">
                    <p className="text-sm font-medium truncate">{image.filename}</p>
                    <p className="text-xs text-gray-500">
                      {image.size ? `${(image.size / 1024 / 1024).toFixed(1)} MB` : 'Tamanho desconhecido'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}