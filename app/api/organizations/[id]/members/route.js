import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const supabase = createServerClient()
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Check if user has access to this organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', id)
      .single()

    if (!userOrg) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Get organization members
    const { data: members, error } = await supabase
      .from('user_organizations')
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
      .eq('organization_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching members:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar membros' },
        { status: 500 }
      )
    }

    const formattedMembers = members.map(member => ({
      id: member.id,
      role: member.role,
      created_at: member.created_at,
      user: member.users
    }))

    return NextResponse.json({ members: formattedMembers })

  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/members:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params
    const { email, role = 'member' } = await request.json()
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

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado. O usuário deve se cadastrar primeiro.' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', existingUser.id)
      .eq('organization_id', id)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'Usuário já é membro desta organização' },
        { status: 400 }
      )
    }

    // Add user to organization
    const { data, error } = await supabase
      .from('user_organizations')
      .insert([{
        user_id: existingUser.id,
        organization_id: id,
        role
      }])
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
      console.error('Error adding member:', error)
      return NextResponse.json(
        { error: 'Erro ao adicionar membro' },
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
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/members:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}