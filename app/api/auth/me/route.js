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
      .select(`
        *,
        organizations (
          id,
          name,
          plan,
          subscription_status,
          logo_url,
          created_at
        )
      `)
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // For master admin, get system stats
    let systemStats = null
    if (user.role === 'master') {
      const [
        { count: menuCount },
        { count: userCount },
        { count: organizationCount },
        { data: storageData }
      ] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true }),
        supabase
          .storage
          .from('menu-images')
          .list()
      ])

      systemStats = {
        menuCount,
        userCount,
        organizationCount,
        storageUsage: storageData?.length || 0
      }
    }

    // Return user data without sensitive information
    const { password, organizations, ...userWithoutPassword } = user
    
    return NextResponse.json({
      ...userWithoutPassword,
      organization: organizations || null,
      systemStats
    })

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
