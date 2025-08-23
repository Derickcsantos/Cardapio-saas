import { createServerClient } from '@/lib/supabase'
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

    const supabase = createServerClient()
    
    // 1. First try to authenticate with Supabase Auth
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError || !userData) {
      console.error('User not found in database:', userError)
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // 3. Check if user is active
    if (userData.is_active === false) {
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Esta conta está desativada. Entre em contato com o suporte.' },
        { status: 403 }
      )
    }

    // 4. Get user's organizations
    const { data: userOrgs, error: orgError } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organizations (
          id,
          name,
          plan,
          subscription_status,
          logo_url,
          created_at
        )
      `)
      .eq('user_id', userData.id)

    if (orgError) {
      console.error('Error fetching organizations:', orgError)
      // Don't fail the login if we can't get organizations
    }

    // Format organizations data
    const organizations = (userOrgs || []).map(org => ({
      ...org.organizations,
      userRole: org.role
    }))

    // 5. Check subscription status for non-master users
    const requiresSubscription = userData.type !== 'master' && 
      organizations.length > 0 &&
      !organizations.some(org => org.subscription_status === 'active')

    // 6. Prepare user data to return (without sensitive info)
    const { password_hash, ...userWithoutPassword } = userData
    
    return NextResponse.json({
      user: {
        ...userWithoutPassword,
        organizations,
        requires_subscription: requiresSubscription
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
