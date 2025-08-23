import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerClient()
    
    // Get current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get current user's role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only allow master admin to access this endpoint
    if (currentUser.role !== 'master') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Fetch all statistics in parallel
    const [
      { count: usersCount },
      { count: organizationsCount },
      { count: menuItemsCount },
      { data: storageData }
    ] = await Promise.all([
      // Total users count
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true }),
      
      // Total organizations count
      supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true }),
      
      // Total menu items count
      supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true }),
      
      // Storage usage (list all files in storage)
      supabase.storage
        .from('menu-images')
        .list()
    ])

    // Calculate storage usage in MB (approximate)
    const storageUsageMB = storageData?.reduce((total, file) => {
      return total + (file.metadata?.size || 0)
    }, 0) / (1024 * 1024)

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentSignups } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Get active organizations (with subscription)
    const { count: activeOrganizations } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active')

    return NextResponse.json({
      // Basic counts
      users: usersCount || 0,
      organizations: organizationsCount || 0,
      menuItems: menuItemsCount || 0,
      storageUsage: storageUsageMB.toFixed(2),
      
      // Additional metrics
      recentSignups: recentSignups || 0,
      activeOrganizations: activeOrganizations || 0,
      
      // Timestamp
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in GET /api/admin/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
