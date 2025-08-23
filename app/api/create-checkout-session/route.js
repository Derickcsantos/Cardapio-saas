import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { plan, organizationId, userId } = await request.json();
    
    if (!plan || !organizationId || !userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400 }
      );
    }

    // Get organization and user
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      return new NextResponse(
        JSON.stringify({ error: 'Organization not found' }),
        { status: 404 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    // Get plan details
    const selectedPlan = PLANS[plan];
    if (!selectedPlan) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid plan selected' }),
        { status: 400 }
      );
    }

    // Create a Stripe customer if not exists
    let customer;
    if (organization.stripe_customer_id) {
      customer = await stripe.customers.retrieve(organization.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: organization.name,
        metadata: {
          organizationId,
          userId,
        },
      });

      // Update organization with Stripe customer ID
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customer.id })
        .eq('id', organizationId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id,
      line_items: [
        {
          price: selectedPlan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
      metadata: {
        organizationId,
        userId,
        plan,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: error.message 
      }),
      { status: 500 }
    );
  }
}
