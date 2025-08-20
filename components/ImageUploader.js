'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export default function ImageUploader({ organizationId, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!organizationId) {
      toast.error('ID da organização não encontrado')
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('organizationId', organizationId)
      formData.append('displayOrder', Date.now().toString())

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/menu/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (response.ok) {
        toast.success('Imagem enviada com sucesso!')
        onUploadSuccess({
          id: data.id,
          imageUrl: data.imageUrl,
          displayOrder: parseInt(formData.get('displayOrder'))
        })
      } else {
        toast.error(data.error || 'Erro ao enviar imagem')
      }
    } catch (error) {
      toast.error('Erro de conexão. Tente novamente.')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [organizationId, onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles: 1,
    disabled: uploading
  })

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Enviando imagem...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                <p className="text-xs text-gray-500">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                {isDragActive ? (
                  <Upload className="h-6 w-6 text-blue-600" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Solte a imagem aqui' : 'Adicionar imagem do cardápio'}
                </p>
                <p className="text-sm text-gray-500">
                  Arraste e solte ou clique para selecionar
                </p>
                <p className="text-xs text-gray-400">
                  PNG, JPG, WEBP até 10MB
                </p>
              </div>
              
              <Button variant="outline" className="mt-4">
                <Upload className="h-4 w-4 mr-2" />
                Selecionar arquivo
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}