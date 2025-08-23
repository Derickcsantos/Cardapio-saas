import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase'

const PLAN_PRICES = {
  plus: process.env.STRIPE_PLUS_PRICE_ID || 'price_plus_monthly',
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly'
}

export async function POST(request) {
  try {
    const { organizationId, plan } = await request.json()
    
    if (!organizationId || !plan) {
      return NextResponse.json(
        { error: 'Organization ID and plan are required' },
        { status: 400 }
      )
    }

    if (!PLAN_PRICES[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    
    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get organization owner
    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', organization.owner_id)
      .single()

    if (ownerError || !owner) {
      return NextResponse.json(
        { error: 'Organization owner not found' },
        { status: 404 }
      )
    }

    let customerId = organization.stripe_customer_id

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: owner.email,
        name: owner.name,
        metadata: {
          organizationId,
          ownerId: organization.owner_id
        }
      })

      customerId = customer.id

      // Update organization with customer ID
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
          price: PLAN_PRICES[plan],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      metadata: {
        organizationId,
        plan,
        ownerId: organization.owner_id
      },
      subscription_data: {
        metadata: {
          organizationId,
          plan
        }
      }
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}