import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = createServerClient()
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Get user details with organization info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Get user's organizations
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organizations (
          id,
          name,
          slug,
          plan,
          instagram,
          whatsapp,
          tiktok,
          address,
          created_at
        )
      `)
      .eq('user_id', user.id)

    const organizations = (userOrgs || []).map(org => ({
      ...org.organizations,
      userRole: org.role
    }))

    // Return user data without sensitive information
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizations
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}