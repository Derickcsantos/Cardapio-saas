import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { slug } = params
    const supabase = createAdminClient()
    
    // Get organization by slug
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !organization) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)

  } catch (error) {
    console.error('Error fetching organization by slug:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}