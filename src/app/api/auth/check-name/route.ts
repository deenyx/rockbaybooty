import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { MESSAGES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawName = typeof body.name === 'string' ? body.name : body.firstName
    const name = typeof rawName === 'string' ? rawName.trim().replace(/\s+/g, ' ') : ''

    if (!name) {
      return NextResponse.json(
        { error: MESSAGES.FIELD_REQUIRED },
        { status: 400 }
      )
    }

    const existingName = await prisma.user.findFirst({
      where: {
        OR: [
          {
            firstName: {
              equals: name,
              mode: 'insensitive',
            },
          },
          {
            displayName: {
              equals: name,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: { id: true },
    })

    return NextResponse.json(
      { available: !existingName },
      { status: 200 }
    )
  } catch (error) {
    console.error('Name availability error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  }
}
