import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

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
    
    // Get organization's subscription info
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('stripe_customer_id, stripe_subscription_id, subscription_status, plan_id')
      .eq('id', organizationId)
      .single()

    if (error || !organization) {
      console.error('Error fetching organization:', error)
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    let subscription = null
    let customer = null
    
    // Get subscription details from Stripe if available
    if (organization.stripe_subscription_id) {
      try {
        subscription = await stripe.subscriptions.retrieve(organization.stripe_subscription_id)
        
        // Get customer details
        customer = await stripe.customers.retrieve(organization.stripe_customer_id)
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError)
        // Continue without subscription details
      }
    }

    // Get available plans
    const { data: plans } = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      type: 'recurring'
    })

    return NextResponse.json({
      currentPlan: organization.plan_id || 'free',
      status: organization.subscription_status || 'inactive',
      subscription,
      customer,
      plans: plans.data.map(plan => ({
        id: plan.id,
        name: plan.product.name,
        description: plan.product.description,
        price: plan.unit_amount / 100, // Convert to currency
        currency: plan.currency,
        interval: plan.recurring.interval,
        features: plan.product.metadata.features ? 
          JSON.parse(plan.product.metadata.features) : []
      }))
    })

  } catch (error) {
    console.error('Error in GET /api/subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { organizationId, priceId } = await request.json()
    
    if (!organizationId || !priceId) {
      return NextResponse.json(
        { error: 'Organization ID and Price ID are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_customer_id, email')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    let customerId = organization.stripe_customer_id
    
    // Create customer in Stripe if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: organization.email,
        metadata: {
          organization_id: organizationId
        }
      })
      
      customerId = customer.id
      
      // Update organization with Stripe customer ID
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: {
        metadata: {
          organization_id: organizationId
        }
      }
    })

    return NextResponse.json({ sessionId: session.id })

  } catch (error) {
    console.error('Error in POST /api/subscription:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const { organizationId } = await request.json()
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    // Get organization's subscription ID
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('stripe_subscription_id')
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

    // Update organization subscription status
    await supabase
      .from('organizations')
      .update({ 
        subscription_status: 'canceled',
        plan_id: 'free'
      })
      .eq('id', organizationId)

    return NextResponse.json({ success: true, subscription })

  } catch (error) {
    console.error('Error in DELETE /api/subscription:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
