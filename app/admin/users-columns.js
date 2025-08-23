import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, User, Check, X } from 'lucide-react'
import Link from 'next/link'

export const columns = [
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => {
      const name = row.getValue('name')
      const email = row.getValue('email')
      return (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      return <span className="text-sm">{row.getValue('email')}</span>
    },
  },
  {
    accessorKey: 'role',
    header: 'Função',
    cell: ({ row }) => {
      const role = row.getValue('role')
      const variant = role === 'owner' ? 'default' : role === 'admin' ? 'secondary' : 'outline'
      const label = 
        role === 'owner' ? 'Proprietário' : 
        role === 'admin' ? 'Administrador' : 
        role === 'user' ? 'Usuário' : 
        role === 'master' ? 'Master Admin' : role
      
      return (
        <Badge variant={variant}>
          {label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active')
      return (
        <div className="flex items-center">
          {isActive ? (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              <span>Ativo</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-gray-400 mr-2"></div>
              <span>Inativo</span>
            </>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Cadastrado em',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return date.toLocaleDateString('pt-BR')
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original
      const isCurrentUser = false // You'll need to get this from your auth context
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${user.id}`} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            
            {!isCurrentUser && (
              <>
                {user.is_active ? (
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => console.log('Deactivate', user.id)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Desativar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => console.log('Activate', user.id)}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Ativar
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => console.log('Delete', user.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
