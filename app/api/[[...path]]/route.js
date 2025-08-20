import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { convertToWebP, generateSlug } from '@/lib/imageUtils'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Root endpoint
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "Menu SaaS 3D API" }))
    }

    // Authentication Routes
    if (route === '/auth/register' && method === 'POST') {
      const { email, password, name, organizationName } = await request.json()
      
      if (!email || !password || !name || !organizationName) {
        return handleCORS(NextResponse.json(
          { error: "All fields are required" }, 
          { status: 400 }
        ))
      }

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return handleCORS(NextResponse.json(
          { error: "User already exists" }, 
          { status: 400 }
        ))
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // Generate organization slug
      const organizationSlug = generateSlug(organizationName)
      
      // Check if organization slug exists
      const { data: existingOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('slug', organizationSlug)
        .single()

      if (existingOrg) {
        return handleCORS(NextResponse.json(
          { error: "Organization name already taken, please choose another" }, 
          { status: 400 }
        ))
      }

      // Create user
      const userId = uuidv4()
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: userId,
          email,
          password_hash: hashedPassword,
          name,
          type: 'user',
          created_at: new Date().toISOString()
        }])

      if (userError) {
        return handleCORS(NextResponse.json(
          { error: "Failed to create user" }, 
          { status: 500 }
        ))
      }

      // Create organization
      const organizationId = uuidv4()
      const { error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert([{
          id: organizationId,
          name: organizationName,
          slug: organizationSlug,
          owner_id: userId,
          created_at: new Date().toISOString()
        }])

      if (orgError) {
        return handleCORS(NextResponse.json(
          { error: "Failed to create organization" }, 
          { status: 500 }
        ))
      }

      // Link user to organization
      await supabaseAdmin
        .from('user_organizations')
        .insert([{
          user_id: userId,
          organization_id: organizationId,
          role: 'owner'
        }])

      return handleCORS(NextResponse.json({ 
        message: "Registration successful", 
        userId,
        organizationId,
        organizationSlug
      }))
    }

    // Login Route
    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      
      if (!email || !password) {
        return handleCORS(NextResponse.json(
          { error: "Email and password required" }, 
          { status: 400 }
        ))
      }

      // Get user with organization info
      const { data: user } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          user_organizations (
            role,
            organizations (*)
          )
        `)
        .eq('email', email)
        .single()

      if (!user) {
        return handleCORS(NextResponse.json(
          { error: "Invalid credentials" }, 
          { status: 401 }
        ))
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash)
      
      if (!validPassword) {
        return handleCORS(NextResponse.json(
          { error: "Invalid credentials" }, 
          { status: 401 }
        ))
      }

      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user

      return handleCORS(NextResponse.json({ 
        user: userWithoutPassword,
        message: "Login successful"
      }))
    }

    // Get Menu Images by Organization Slug
    if (route.startsWith('/menu/') && method === 'GET') {
      const orgSlug = route.split('/menu/')[1]
      
      // Get organization by slug
      const { data: organization } = await supabaseAdmin
        .from('organizations')
        .select('id, name, whatsapp, instagram')
        .eq('slug', orgSlug)
        .single()

      if (!organization) {
        return handleCORS(NextResponse.json(
          { error: "Organization not found" }, 
          { status: 404 }
        ))
      }

      // Get menu images
      const { data: menuImages } = await supabaseAdmin
        .from('menu_images')
        .select('*')
        .eq('organization_id', organization.id)
        .order('display_order', { ascending: true })

      return handleCORS(NextResponse.json({
        organization,
        menuImages: menuImages || []
      }))
    }

    // Upload Menu Image
    if (route === '/menu/upload' && method === 'POST') {
      const formData = await request.formData()
      const file = formData.get('image')
      const organizationId = formData.get('organizationId')
      const displayOrder = formData.get('displayOrder') || 0

      if (!file || !organizationId) {
        return handleCORS(NextResponse.json(
          { error: "Image and organization ID required" }, 
          { status: 400 }
        ))
      }

      // Convert to WebP
      const webpFile = await convertToWebP(file)
      
      // Generate unique filename
      const fileName = `menu-${organizationId}-${Date.now()}.webp`
      
      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('menu-images')
        .upload(fileName, webpFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        return handleCORS(NextResponse.json(
          { error: "Failed to upload image" }, 
          { status: 500 }
        ))
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('menu-images')
        .getPublicUrl(data.path)

      // Save to database
      const imageId = uuidv4()
      const { error: dbError } = await supabaseAdmin
        .from('menu_images')
        .insert([{
          id: imageId,
          organization_id: organizationId,
          image_url: publicUrl,
          display_order: parseInt(displayOrder),
          created_at: new Date().toISOString()
        }])

      if (dbError) {
        return handleCORS(NextResponse.json(
          { error: "Failed to save image info" }, 
          { status: 500 }
        ))
      }

      return handleCORS(NextResponse.json({
        id: imageId,
        imageUrl: publicUrl,
        message: "Image uploaded successfully"
      }))
    }

    // Delete Menu Image
    if (route.startsWith('/menu/images/') && method === 'DELETE') {
      const imageId = route.split('/menu/images/')[1]
      
      // Get image info first
      const { data: image } = await supabaseAdmin
        .from('menu_images')
        .select('image_url')
        .eq('id', imageId)
        .single()

      if (!image) {
        return handleCORS(NextResponse.json(
          { error: "Image not found" }, 
          { status: 404 }
        ))
      }

      // Delete from database
      const { error: dbError } = await supabaseAdmin
        .from('menu_images')
        .delete()
        .eq('id', imageId)

      if (dbError) {
        return handleCORS(NextResponse.json(
          { error: "Failed to delete image" }, 
          { status: 500 }
        ))
      }

      // Delete from storage (optional, as we might want to keep for backup)
      try {
        const fileName = image.image_url.split('/').pop()
        await supabaseAdmin.storage
          .from('menu-images')
          .remove([fileName])
      } catch (error) {
        console.log('Storage deletion failed:', error)
      }

      return handleCORS(NextResponse.json({
        message: "Image deleted successfully"
      }))
    }

    // Update Organization
    if (route.startsWith('/organizations/') && route.endsWith('/') === false && method === 'PUT') {
      const orgId = route.split('/organizations/')[1]
      const { whatsapp, instagram } = await request.json()
      
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({ 
          whatsapp: whatsapp || null, 
          instagram: instagram || null 
        })
        .eq('id', orgId)

      if (error) {
        return handleCORS(NextResponse.json(
          { error: "Failed to update organization" }, 
          { status: 500 }
        ))
      }

      return handleCORS(NextResponse.json({
        message: "Organization updated successfully"
      }))
    }

    // Get Organization Users
    if (route.match(/\/organizations\/[^\/]+\/users$/) && method === 'GET') {
      const orgId = route.split('/organizations/')[1].split('/users')[0]
      
      const { data: users } = await supabaseAdmin
        .from('user_organizations')
        .select(`
          role,
          users (
            id,
            name,
            email
          )
        `)
        .eq('organization_id', orgId)

      const formattedUsers = users?.map(item => ({
        id: item.users.id,
        name: item.users.name,
        email: item.users.email,
        role: item.role
      })) || []

      return handleCORS(NextResponse.json({
        users: formattedUsers
      }))
    }

    // Master Admin Dashboard - Get Stats
    if (route === '/admin/stats' && method === 'GET') {
      // Get total users count
      const { count: usersCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })

      // Get total organizations count
      const { count: orgsCount } = await supabaseAdmin
        .from('organizations')
        .select('*', { count: 'exact', head: true })

      // Get total menu images count
      const { count: imagesCount } = await supabaseAdmin
        .from('menu_images')
        .select('*', { count: 'exact', head: true })

      // Get recent registrations (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: recentUsers } = await supabaseAdmin
        .from('users')
        .select('created_at')
        .gte('created_at', sevenDaysAgo)

      return handleCORS(NextResponse.json({
        totalUsers: usersCount || 0,
        totalOrganizations: orgsCount || 0,
        totalMenuImages: imagesCount || 0,
        recentRegistrations: recentUsers?.length || 0
      }))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute