import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function DELETE(request, { params }) {
  try {
    const { id, imageId } = params
    const supabase = createServerClient()
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
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

    // Get image info first
    const { data: image } = await supabase
      .from('menu_images')
      .select('url')
      .eq('id', imageId)
      .eq('organization_id', id)
      .single()

    if (!image) {
      return NextResponse.json(
        { error: 'Imagem não encontrada' },
        { status: 404 }
      )
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('menu_images')
      .delete()
      .eq('id', imageId)

    if (dbError) {
      console.error('Error deleting image from database:', dbError)
      return NextResponse.json(
        { error: 'Erro ao deletar imagem' },
        { status: 500 }
      )
    }

    // Delete from storage
    try {
      const urlParts = image.url.split('/')
      const fileName = urlParts.slice(-2).join('/') // Get organization_id/filename
      await supabase.storage
        .from('menu-images')
        .remove([fileName])
    } catch (error) {
      console.log('Storage deletion failed (non-critical):', error)
    }

    return new Response(null, { status: 204 })

  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]/images/[imageId]:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}