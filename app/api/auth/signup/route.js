import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
}

export async function POST(request) {
  try {
    const { email, password, name, organizationName } = await request.json()
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    
    // 1. Create auth user first
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
      },
    })

    if (signUpError || !authData?.user) {
      console.error('Auth signup error:', signUpError)
      return NextResponse.json(
        { error: signUpError?.message || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // 2. Create user in our users table
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email,
        name,
        role: 'user',
        is_active: true
      }])

    if (userError) {
      console.error('Database user creation error:', userError)
      // Cleanup auth user if database user creation fails
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Erro ao criar usuário no banco de dados' },
        { status: 500 }
      )
    }

    let organization = null
    
    // 3. Create organization if name provided
    if (organizationName) {
      const orgId = uuidv4()
      const slug = generateSlug(organizationName)
      
      // Check if slug exists
      const { data: existingOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingOrg) {
        // Cleanup user if org creation fails
        await Promise.all([
          supabase.from('users').delete().eq('id', userId),
          supabase.auth.admin.deleteUser(userId)
        ])
        return NextResponse.json(
          { error: 'Nome da organização já existe. Escolha outro nome.' },
          { status: 400 }
        )
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          id: orgId,
          name: organizationName,
          slug,
          owner_id: userId,
          plan: 'free',
        }])
        .select()
        .single()

      if (orgError) {
        console.error('Org creation error:', orgError)
        // Cleanup user if org creation fails
        await Promise.all([
          supabase.from('users').delete().eq('id', userId),
          supabase.auth.admin.deleteUser(userId)
        ])
        return NextResponse.json(
          { error: 'Erro ao criar organização' },
          { status: 500 }
        )
      }

      // Create user_organizations relationship
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert([{
          user_id: userId,
          organization_id: orgId,
          role: 'owner',
        }])

      if (userOrgError) {
        console.error('User org relationship error:', userOrgError)
        // Cleanup everything if relationship creation fails
        await Promise.all([
          supabase.from('users').delete().eq('id', userId),
          supabase.from('organizations').delete().eq('id', orgId),
          supabase.auth.admin.deleteUser(userId)
        ])
        return NextResponse.json(
          { error: 'Erro ao configurar permissões' },
          { status: 500 }
        )
      }

      organization = orgData
    }

    return NextResponse.json({
      user: {
        id: userId,
        email,
        name,
        role: 'user',
        organizations: organization ? [{
          ...organization,
          userRole: 'owner'
        }] : []
      },
      message: 'Usuário criado com sucesso! Você pode fazer login agora.'
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}