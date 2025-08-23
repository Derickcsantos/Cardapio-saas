'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, ExternalLink, Copy } from 'lucide-react'
import { toast } from "sonner"

export default function OrganizationSettings({ organization, onUpdate }) {
  const [formData, setFormData] = useState({
    name: organization.name || '',
    slug: organization.slug || '',
    instagram: organization.instagram || '',
    whatsapp: organization.whatsapp || '',
    tiktok: organization.tiktok || '',
    address: organization.address || ''
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSlugChange = (value) => {
    // Generate slug from value
    const slug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
    
    handleChange('slug', slug)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedOrg = await response.json()
        onUpdate?.(updatedOrg)
        toast.success('Configurações salvas com sucesso!')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const copyMenuUrl = () => {
    const url = `${window.location.origin}/${formData.slug}`
    navigator.clipboard.writeText(url)
    toast.success('URL copiada para a área de transferência!')
  }

  const openMenuUrl = () => {
    const url = `${window.location.origin}/${formData.slug}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Organização</CardTitle>
          <CardDescription>
            Atualize as informações do seu estabelecimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Estabelecimento</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Nome do seu negócio"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Personalizada</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      {typeof window !== 'undefined' ? window.location.origin : 'https://seu-site.com'}/
                    </span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="sua-marca"
                      className="rounded-l-none"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Esta será a URL do seu cardápio público
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Endereço completo do estabelecimento"
                  rows={3}
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Redes Sociais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      @
                    </span>
                    <Input
                      id="instagram"
                      value={formData.instagram.replace('@', '')}
                      onChange={(e) => handleChange('instagram', e.target.value.replace('@', ''))}
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
                    value={formData.whatsapp}
                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktok">TikTok</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      @
                    </span>
                    <Input
                      id="tiktok"
                      value={formData.tiktok.replace('@', '')}
                      onChange={(e) => handleChange('tiktok', e.target.value.replace('@', ''))}
                      placeholder="seuusuario"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Menu URL Preview */}
      <Card>
        <CardHeader>
          <CardTitle>URL do Cardápio</CardTitle>
          <CardDescription>
            Esta é a URL pública do seu cardápio digital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://seu-site.com'}/${formData.slug}`}
              readOnly
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={copyMenuUrl}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={openMenuUrl}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}