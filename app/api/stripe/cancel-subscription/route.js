import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { organizationId } = await request.json()
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    
    // Get organization with subscription info
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_subscription_id, plan')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    if (!organization.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(
      organization.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    )

    // Update organization plan to free
    await supabase
      .from('organizations')
      .update({ 
        plan: 'free',
        stripe_subscription_id: null
      })
      .eq('id', organizationId)

    return NextResponse.json({ 
      success: true,
      message: 'Subscription canceled successfully'
    })

  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}