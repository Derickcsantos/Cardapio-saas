import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new NextResponse(`Webhook handler failed: ${error.message}`, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session) {
  const { organizationId, plan } = session.metadata;
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // Update organization with new subscription
  await supabase.from('organizations').update({
    plan,
    stripe_subscription_id: subscription.id,
    plan_status: 'active',
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  }).eq('id', organizationId);

  // Record payment
  await supabase.from('payments').insert({
    id: subscription.latest_invoice,
    organization_id: organizationId,
    user_id: session.metadata.userId,
    gateway_payment_id: subscription.latest_invoice,
    plan,
    amount: subscription.items.data[0].price.unit_amount / 100, // Convert from cents
    status: 'paid',
    start_date: new Date(subscription.current_period_start * 1000).toISOString(),
    end_date: new Date(subscription.current_period_end * 1000).toISOString(),
  });
}

async function handleSubscriptionChange(subscription) {
  const organization = await supabase
    .from('organizations')
    .select('*')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (!organization.data) return;

  const status = subscription.status;
  const plan = subscription.items.data[0].price.metadata.plan || 'free';

  await supabase.from('organizations').update({
    plan: status === 'active' ? plan : 'free',
    plan_status: status,
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  }).eq('id', organization.data.id);
}

async function handleInvoicePaid(invoice) {
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  
  await supabase.from('payments').insert({
    id: invoice.id,
    organization_id: invoice.metadata.organizationId,
    user_id: invoice.metadata.userId,
    gateway_payment_id: invoice.payment_intent,
    plan: invoice.metadata.plan || 'free',
    amount: invoice.amount_paid / 100, // Convert from cents
    status: 'paid',
    start_date: new Date(subscription.current_period_start * 1000).toISOString(),
    end_date: new Date(subscription.current_period_end * 1000).toISOString(),
  });
}

async function handlePaymentFailed(invoice) {
  await supabase.from('payments').insert({
    id: `failed_${Date.now()}`,
    organization_id: invoice.metadata.organizationId,
    user_id: invoice.metadata.userId,
    gateway_payment_id: invoice.payment_intent,
    plan: invoice.metadata.plan || 'free',
    amount: invoice.amount_due / 100, // Convert from cents
    status: 'failed',
    created_at: new Date().toISOString(),
  });
}
