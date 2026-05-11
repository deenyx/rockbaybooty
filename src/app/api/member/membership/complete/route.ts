import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured yet.' }, { status: 503 })
    }

    const stripe = new Stripe(stripeSecretKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment has not been completed.' }, { status: 400 })
    }

    if (session.client_reference_id !== userId && session.metadata?.userId !== userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 403 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isPremium: true },
      select: { id: true },
    })

    await prisma.notification.create({
      data: {
        userId,
        type: 'membership',
        title: 'Premium activated',
        body: `${session.metadata?.plan || 'Premium'} payment completed successfully.`,
        link: '/membership',
      },
    })

    return NextResponse.json({
      message: 'Payment verified. Premium is now active.',
      isPremium: true,
    })
  } catch (error) {
    console.error('[POST /api/member/membership/complete]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
