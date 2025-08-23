'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { checkImageUploadLimit } from '@/lib/imageLimits';

export default function ImageUploader({ 
  onUpload, 
  currentImages = [], 
  organization,
  disabled = false 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const { canUpload, maxAllowed, currentCount, remaining } = checkImageUploadLimit(
    currentImages, 
    organization?.plan || 'free'
  );

  const uploadImage = useCallback(async (file) => {
    if (!canUpload) {
      toast({
        title: 'Limite de imagens atingido',
        description: `Seu plano atual permite no máximo ${maxAllowed} imagem${maxAllowed !== 1 ? 's' : ''}. Atualize seu plano para enviar mais imagens.`,
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.match('image.*')) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Por favor, envie apenas imagens (JPEG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem não pode ter mais de 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload?organizationId=${organization.id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha ao fazer upload da imagem');
      }

      const data = await response.json();
      onUpload([...currentImages, data.url]);
      
      toast({
        title: 'Sucesso!',
        description: 'Imagem enviada com sucesso',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao fazer upload da imagem',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [canUpload, currentImages, maxAllowed, onUpload, organization?.id, toast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadImage(e.dataTransfer.files[0]);
    }
  }, [uploadImage]);

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={() => !disabled && setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          !disabled && setDragActive(true);
        }}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-upload')?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Clique para enviar</span> ou arraste e solte
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {maxAllowed === 'unlimited' 
                ? 'SVG, PNG, JPG ou GIF (máx. 5MB)'
                : `Restam ${remaining} de ${maxAllowed} imagens no seu plano atual`}
            </p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="mt-2"
            disabled={disabled || isUploading}
            onClick={(e) => e.stopPropagation()}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Selecionar arquivo'
            )}
          </Button>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            accept="image/*"
            onChange={handleChange}
            disabled={disabled || isUploading}
          />
        </div>
      </div>
      
      {!canUpload && (
        <div className="mt-4 text-sm text-amber-600 dark:text-amber-400">
          Você atingiu o limite de imagens do seu plano. <a href="/pricing" className="font-medium text-primary hover:underline">Atualize seu plano</a> para enviar mais imagens.
        </div>
      )}
    </div>
  );
}