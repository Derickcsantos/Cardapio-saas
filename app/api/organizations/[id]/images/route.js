import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const PLAN_LIMITS = {
  free: 1,
  plus: 3,
  pro: 999
}

export async function GET(request, { params }) {
  try {
    const { id } = params
    const supabase = createServerClient()
    
    // Get menu images for the organization
    const { data: images, error } = await supabase
      .from('menu_images')
      .select('*')
      .eq('organization_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching images:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar imagens' },
        { status: 500 }
      )
    }

    return NextResponse.json({ images: images || [] })

  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/images:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params
    const formData = await request.formData()
    const file = formData.get('file')
    const supabase = createServerClient()
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      )
    }

    // Check if user has permission
    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('organization_id', id)
      .single()

    if (!userOrg) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Get organization plan
    const { data: organization } = await supabase
      .from('organizations')
      .select('plan')
      .eq('id', id)
      .single()

    if (!organization) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 })
    }

    // Check current image count
    const { count: currentCount } = await supabase
      .from('menu_images')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id)

    const limit = PLAN_LIMITS[organization.plan] || PLAN_LIMITS.free
    
    if (currentCount >= limit) {
      return NextResponse.json(
        { 
          error: `Limite de ${limit} imagem${limit > 1 ? 's' : ''} atingido para o plano ${organization.plan}. Faça upgrade do seu plano para enviar mais imagens.` 
        },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao fazer upload da imagem' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName)

    // Save to database
    const { data: imageData, error: dbError } = await supabase
      .from('menu_images')
      .insert([{
        organization_id: id,
        url: publicUrl,
        filename: file.name,
        size: file.size,
      }])
      .select()
      .single()

    if (dbError) {
      console.error('Error saving image info:', dbError)
      // Try to cleanup uploaded file
      await supabase.storage.from('menu-images').remove([fileName])
      return NextResponse.json(
        { error: 'Erro ao salvar informações da imagem' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      image: imageData,
      message: 'Imagem enviada com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/images:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}