import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createServerClient()
    
    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    )
  }
}
