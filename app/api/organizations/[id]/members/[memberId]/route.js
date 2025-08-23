import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
  try {
    const { id, memberId } = params
    const supabase = createServerClient()
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Check if user is owner or admin
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', id)
      .single()

    if (!userOrg || !['owner', 'admin'].includes(userOrg.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Get member info to check if trying to remove owner
    const { data: memberInfo } = await supabase
      .from('user_organizations')
      .select('role, user_id')
      .eq('id', memberId)
      .single()

    if (memberInfo?.role === 'owner') {
      return NextResponse.json(
        { error: 'Não é possível remover o proprietário da organização' },
        { status: 400 }
      )
    }

    // Prevent removing yourself if you're the only owner
    if (memberInfo?.user_id === session.user.id && userOrg.role === 'owner') {
      const { count: ownerCount } = await supabase
        .from('user_organizations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)
        .eq('role', 'owner')

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Não é possível remover o último proprietário da organização' },
          { status: 400 }
        )
      }
    }

    // Remove member
    const { error } = await supabase
      .from('user_organizations')
      .delete()
      .eq('id', memberId)

    if (error) {
      console.error('Error removing member:', error)
      return NextResponse.json(
        { error: 'Erro ao remover membro' },
        { status: 500 }
      )
    }

    return new Response(null, { status: 204 })

  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]/members/[memberId]:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id, memberId } = params
    const { role } = await request.json()
    const supabase = createServerClient()
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Check if user is owner
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', id)
      .single()

    if (!userOrg || userOrg.role !== 'owner') {
      return NextResponse.json({ error: 'Apenas proprietários podem alterar funções' }, { status: 403 })
    }

    // Update member role
    const { data, error } = await supabase
      .from('user_organizations')
      .update({ role })
      .eq('id', memberId)
      .select(`
        id,
        role,
        created_at,
        users (
          id,
          name,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error updating member role:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar função do membro' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      member: {
        id: data.id,
        role: data.role,
        created_at: data.created_at,
        user: data.users
      }
    })

  } catch (error) {
    console.error('Error in PUT /api/organizations/[id]/members/[memberId]:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}