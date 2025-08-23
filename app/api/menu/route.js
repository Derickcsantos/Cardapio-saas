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
    
    // Get menu items for the organization
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('organization_id', organizationId)
      .order('category')
      .order('position')

    if (error) {
      console.error('Error fetching menu items:', error)
      return NextResponse.json(
        { error: 'Error fetching menu items' },
        { status: 500 }
      )
    }

    // Group items by category
    const menuByCategory = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {})

    return NextResponse.json(menuByCategory)

  } catch (error) {
    console.error('Error in GET /api/menu:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const menuItem = await request.json()
    
    if (!menuItem.organization_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Get current max position for the category
    const { data: maxPosition, error: positionError } = await supabase
      .from('menu_items')
      .select('position')
      .eq('organization_id', menuItem.organization_id)
      .eq('category', menuItem.category)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const newPosition = maxPosition ? maxPosition.position + 1 : 0
    
    // Insert new menu item
    const { data, error } = await supabase
      .from('menu_items')
      .insert([
        { 
          ...menuItem,
          position: newPosition
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating menu item:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/menu:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const { id, ...updates } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Update menu item
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating menu item:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in PUT /api/menu:', error)
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
        { error: 'Menu item ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Delete menu item
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting menu item:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return new Response(null, { status: 204 })

  } catch (error) {
    console.error('Error in DELETE /api/menu:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
