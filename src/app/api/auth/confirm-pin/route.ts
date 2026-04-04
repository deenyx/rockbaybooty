import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { MESSAGES } from '@/lib/constants'

const prisma = new PrismaClient()

interface PinRevealPayload {
  userId: string
  pin: string
  type: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const submittedPin = body.pin?.trim()
    const submittedName = body.firstName?.trim().toLowerCase()

    if (!submittedPin || !submittedName) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    const revealToken = request.cookies.get('pin-reveal-token')?.value
    if (!revealToken) {
      return NextResponse.json(
        { error: 'Session expired. Please verify your email again.' },
        { status: 401 }
      )
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
    }

    let payload: PinRevealPayload
    try {
      payload = jwt.verify(revealToken, jwtSecret) as PinRevealPayload
    } catch {
      return NextResponse.json(
        { error: 'Session expired. Please verify your email again.' },
        { status: 401 }
      )
    }

    if (payload.type !== 'pin-reveal') {
      return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 400 })
    }

    if (submittedPin !== payload.pin) {
      return NextResponse.json({ error: MESSAGES.PIN_MISMATCH }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { firstName: true },
    })

    if (!user) {
      return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 404 })
    }

    if ((user.firstName?.trim().toLowerCase() ?? '') !== submittedName) {
      return NextResponse.json({ error: MESSAGES.NAME_MISMATCH }, { status: 400 })
    }

    const response = NextResponse.json(
      { message: "You're all set. You can now log in." },
      { status: 200 }
    )

    // Clear the pin-reveal cookie
    response.cookies.set({
      name: 'pin-reveal-token',
      value: '',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[confirm-pin]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
