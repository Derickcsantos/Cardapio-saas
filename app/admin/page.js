'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Users, Menu, Building, HardDrive, Plus } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { columns as userColumns } from './users-columns'
import { useToast } from '@/components/ui/use-toast'

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    users: 0,
    organizations: 0,
    menuItems: 0,
    storageUsage: 0,
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          throw new Error('Not authenticated')
        }
        const userData = await response.json()
        
        if (userData.role !== 'master') {
          router.push('/dashboard')
          return
        }
        
        setUser(userData)
        
        // Fetch system stats
        const statsRes = await fetch('/api/admin/stats')
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
        
        // Fetch all users
        const usersRes = await fetch('/api/admin/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData)
        }
        
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
  }, [router])

  const handleCreateUser = () => {
    // Open create user dialog
    // This would be implemented with a dialog component
    console.log('Open create user dialog')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Logado como: {user.email}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="organizations">Organizações</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.users}</div>
                <p className="text-xs text-muted-foreground">+20.1% em relação ao mês passado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organizações</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.organizations}</div>
                <p className="text-xs text-muted-foreground">+5 desde o mês passado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Itens no Cardápio</CardTitle>
                <Menu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.menuItems}</div>
                <p className="text-xs text-muted-foreground">+12% em relação ao mês passado</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uso de Armazenamento</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.storageUsage} MB</div>
                <p className="text-xs text-muted-foreground">+1.1GB desde o mês passado</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Visão Geral</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Gráficos de uso virão aqui
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Atividade {i}</p>
                        <p className="text-sm text-muted-foreground">Descrição da atividade recente</p>
                      </div>
                      <div className="ml-auto text-sm text-muted-foreground">
                        {i}h atrás
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
            <Button onClick={handleCreateUser}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <DataTable 
                columns={userColumns} 
                data={users} 
                searchKey="email"
                placeholder="Filtrar usuários..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations">
          <h2 className="text-2xl font-bold mb-4">Organizações</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Lista de organizações virá aqui
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <h2 className="text-2xl font-bold mb-4">Configurações</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Configurações do Sistema</h3>
                  <p className="text-sm text-muted-foreground">
                    Ajustes gerais da plataforma
                  </p>
                </div>
                
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Manutenção</p>
                      <p className="text-sm text-muted-foreground">
                        Ative o modo de manutenção para realizar atualizações
                      </p>
                    </div>
                    <Button variant="outline">Ativar Manutenção</Button>
                  </div>
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">Backup do Banco de Dados</p>
                      <p className="text-sm text-muted-foreground">
                        Faça backup dos dados do sistema
                      </p>
                    </div>
                    <Button>Gerar Backup</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}