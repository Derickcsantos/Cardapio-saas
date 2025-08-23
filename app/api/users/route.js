import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Get current user's role
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', session.user.id)
      .single()

    // Only allow organization admins or master admin to list users
    if (currentUser.role !== 'master' && currentUser.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get users for the organization
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_active, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { error: 'Error fetching users' },
        { status: 500 }
      )
    }

    return NextResponse.json(users)

  } catch (error) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { email, name, role = 'user', organizationId } = await request.json()
    
    if (!email || !name || !organizationId) {
      return NextResponse.json(
        { error: 'Email, name, and organization ID are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Get current user's role
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', session.user.id)
      .single()

    // Only allow organization admins or master admin to create users
    if (currentUser.role !== 'master' && currentUser.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Generate a random password
    const password = Math.random().toString(36).slice(-10)
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password`,
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Create user in database
    const { error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          name,
          role,
          organization_id: organizationId,
          is_active: true,
        }
      ])

    if (userError) {
      console.error('User creation error:', userError)
      // Clean up auth user if db user creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Error creating user' },
        { status: 400 }
      )
    }

    // TODO: Send welcome email with password reset link
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully. They will receive an email to set their password.'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const { id, updates } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Get current user's role
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', session.user.id)
      .single()

    // Get target user's organization
    const { data: targetUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', id)
      .single()

    // Only allow organization admins or master admin to update users
    if (currentUser.role !== 'master' && 
        (currentUser.organization_id !== targetUser.organization_id || 
         currentUser.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Prevent changing certain fields
    const { email, id: _, organization_id, ...safeUpdates } = updates
    
    // Update user in database
    const { data, error } = await supabase
      .from('users')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in PUT /api/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Get current user's role
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Prevent deleting yourself
    if (session.user.id === id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role, organization_id')
      .eq('id', session.user.id)
      .single()

    // Get target user's organization
    const { data: targetUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', id)
      .single()

    // Only allow organization admins or master admin to delete users
    if (currentUser.role !== 'master' && 
        (currentUser.organization_id !== targetUser.organization_id || 
         currentUser.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Soft delete user (mark as inactive)
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)

    if (updateError) {
      console.error('Error deactivating user:', updateError)
      return NextResponse.json(
        { error: 'Error deactivating user' },
        { status: 400 }
      )
    }

    return new Response(null, { status: 204 })

  } catch (error) {
    console.error('Error in DELETE /api/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
