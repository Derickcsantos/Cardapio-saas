import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ? '✅ Present' : '❌ Missing',
    stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ? '✅ Present' : '❌ Missing',
    nodeEnv: process.env.NODE_ENV,
  });
}
