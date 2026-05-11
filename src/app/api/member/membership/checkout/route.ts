import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

type CheckoutPlan = 'monthly' | 'yearly'

const PLAN_LABELS: Record<CheckoutPlan, string> = {
  monthly: 'Premium Monthly',
  yearly: 'Premium Yearly',
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const plan = body.plan as CheckoutPlan
    const cardholderName = typeof body.cardholderName === 'string' ? body.cardholderName.trim() : ''

    if (plan !== 'monthly' && plan !== 'yearly') {
      return NextResponse.json({ error: 'Select a valid payment plan.' }, { status: 400 })
    }

    if (!cardholderName) {
      return NextResponse.json({ error: 'Cardholder name is required.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, isVerified: true, isPremium: true },
    })

    if (!user) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Complete photo ID verification before making a payment.' },
        { status: 400 }
      )
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripePublicUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ''

    if (!stripeSecretKey || !stripePublicUrl) {
      return NextResponse.json(
        { error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_APP_URL.' },
        { status: 503 }
      )
    }

    const stripe = new Stripe(stripeSecretKey)

    const planPriceCents = plan === 'monthly' ? 1900 : 17900

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: planPriceCents,
            product_data: {
              name: PLAN_LABELS[plan],
              description: plan === 'monthly' ? 'Monthly premium membership' : 'Yearly premium membership',
            },
          },
        },
      ],
      metadata: {
        userId,
        plan,
        cardholderName,
      },
      success_url: `${stripePublicUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${stripePublicUrl}/upgrade?canceled=1`,
    })

    return NextResponse.json({
      url: session.url,
      message: 'Redirecting to secure checkout.',
    })
  } catch (error) {
    console.error('[POST /api/member/membership/checkout]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
