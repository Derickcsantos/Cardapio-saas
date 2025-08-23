import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const supabase = createServerClient()
    
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)

  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const updates = await request.json()
    const supabase = createServerClient()
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Check if user has permission to update this organization
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', id)
      .single()

    if (!userOrg || !['owner', 'admin'].includes(userOrg.role)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Update organization
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}