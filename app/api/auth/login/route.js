import { createAdminClient, supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData?.user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      )
    }

    // 2. Get user details from database
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      console.error('User not found in database:', userError)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // 3. Check if user is active
    if (userData.is_active === false) {
      return NextResponse.json(
        { error: 'Esta conta está desativada. Entre em contato com o suporte.' },
        { status: 403 }
      )
    }

    // 4. Get user's organizations
    const { data: userOrgs, error: orgError } = await adminClient
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
      .eq('user_id', userData.id)

    if (orgError) {
      console.error('Error fetching organizations:', orgError)
    }

    // Format organizations data
    const organizations = (userOrgs || []).map(org => ({
      ...org.organizations,
      userRole: org.role
    }))

    // 5. Prepare user data to return (without sensitive info)
    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        organizations,
      },
      session: authData.session
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}