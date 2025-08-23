'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { UserPlus, Mail, Shield, Trash2, Edit, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export default function MemberManager({ organizationId, currentUserRole }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [organizationId])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      } else {
        toast.error('Erro ao carregar membros')
      }
    } catch (error) {
      console.error('Error loading members:', error)
      toast.error('Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }

  const inviteMember = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      toast.error('Digite um email válido')
      return
    }

    setInviting(true)
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`, {
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
        toast.success('Membro adicionado com sucesso!')
        setInviteEmail('')
        setInviteRole('member')
        setInviteDialogOpen(false)
        fetchMembers()
      } else {
        toast.error(data.error || 'Erro ao adicionar membro')
      }
    } catch (error) {
      console.error('Error inviting member:', error)
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setInviting(false)
    }
  }

  const removeMember = async (memberId) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) {
      return
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Membro removido com sucesso!')
        fetchMembers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao remover membro')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Erro de conexão. Tente novamente.')
    }
  }

  const changeRole = async (memberId, newRole) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        toast.success('Função alterada com sucesso!')
        fetchMembers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao alterar função')
      }
    } catch (error) {
      console.error('Error changing role:', error)
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

  const canManageMembers = ['owner', 'admin'].includes(currentUserRole)

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando membros...</p>
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
            <CardTitle>Gerenciar Membros</CardTitle>
            <CardDescription>
              Gerencie os usuários que têm acesso a esta organização
            </CardDescription>
          </div>
          
          {canManageMembers && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar novo membro</DialogTitle>
                  <DialogDescription>
                    Adicione um usuário existente à organização
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={inviteMember} className="space-y-4">
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
                      {inviting ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum membro encontrado</p>
              <p className="text-sm">Adicione usuários para colaborar nesta organização</p>
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {member.user.name?.charAt(0)?.toUpperCase() || member.user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <p className="font-medium">{member.user.name || 'Sem nome'}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {member.user.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleLabel(member.role)}
                  </Badge>
                  
                  {canManageMembers && member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {currentUserRole === 'owner' && (
                          <>
                            <DropdownMenuItem onClick={() => changeRole(member.id, 'admin')}>
                              <Edit className="h-4 w-4 mr-2" />
                              Tornar Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeRole(member.id, 'member')}>
                              <Edit className="h-4 w-4 mr-2" />
                              Tornar Membro
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => removeMember(member.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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