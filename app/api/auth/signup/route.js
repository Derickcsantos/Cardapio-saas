import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { hash } from 'bcryptjs'

export async function POST(request) {
  try {
    const { email, password, name, organizationName } = await request.json()
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // 1. Check if user exists in auth
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 400 }
      )
    }

    // 2. Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
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
    const passwordHash = await hash(password, 10)

    // 3. Create user in database
    const { error: userError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email,
        name,
        password_hash: passwordHash,
        type: 'user',
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
    
    // 4. Create organization if name provided
    if (organizationName) {
      const orgId = uuidv4()
      
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          id: orgId,
          name: organizationName,
          owner_id: userId,
          subscription_status: 'inactive',
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

    // 5. Sign in the user
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Auto sign-in error:', signInError)
      // Don't fail the signup if auto sign-in fails
    }

    return NextResponse.json({
      user: {
        id: userId,
        email,
        name,
        type: 'user',
        organizations: organization ? [{
          ...organization,
          userRole: 'owner'
        }] : []
      },
      session: session || null
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
