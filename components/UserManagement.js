'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { UserPlus, Mail, Shield, Trash2, Edit } from 'lucide-react'

export default function UserManagement({ organizationId, currentUser }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [organizationId])

  const loadUsers = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/users`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      toast.error('Digite um email válido')
      return
    }

    setInviting(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Convite enviado com sucesso!')
        setInviteEmail('')
        setInviteRole('member')
        setInviteDialogOpen(false)
        loadUsers()
      } else {
        toast.error(data.error || 'Erro ao enviar convite')
      }
    } catch (error) {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveUser = async (userId) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Usuário removido com sucesso!')
        loadUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao remover usuário')
      }
    } catch (error) {
      toast.error('Erro de conexão. Tente novamente.')
    }
  }

  const handleChangeRole = async (userId, newRole) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        toast.success('Função alterada com sucesso!')
        loadUsers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao alterar função')
      }
    } catch (error) {
      toast.error('Erro de conexão. Tente novamente.')
    }
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'owner': return 'destructive'
      case 'admin': return 'default'
      case 'member': return 'secondary'
      default: return 'outline'
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner': return 'Proprietário'
      case 'admin': return 'Administrador'
      case 'member': return 'Membro'
      default: return role
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando usuários...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gerenciar Usuários</CardTitle>
            <CardDescription>
              Gerencie os usuários que têm acesso a esta organização
            </CardDescription>
          </div>
          
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar novo usuário</DialogTitle>
                <DialogDescription>
                  Envie um convite para um novo usuário se juntar à organização
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Membro</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={inviting}>
                    {inviting ? 'Enviando...' : 'Enviar convite'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum usuário encontrado</p>
              <p className="text-sm">Convide usuários para colaborar nesta organização</p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {user.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleLabel(user.role)}
                  </Badge>
                  
                  {user.role !== 'owner' && currentUser?.role === 'owner' && (
                    <div className="flex space-x-1">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleChangeRole(user.id, newRole)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}