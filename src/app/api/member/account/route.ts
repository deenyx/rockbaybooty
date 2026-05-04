import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload } from '@/lib/types'

function getBearerToken(header: string | null): string | null {
  if (!header) {
    return null
  }

  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null
  }

  return token
}

async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return null
  }

  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
  const authToken = getBearerToken(request.headers.get('authorization'))
  const token = cookieToken || authToken

  if (!token) {
    return null
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload & { sub?: string }

    if (typeof payload.userId === 'string') {
      return payload.userId
    }

    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  })

  return response
}

async function applyPrivacyLockdown(userId: string) {
  await prisma.profile.upsert({
    where: { userId },
    update: {
      isPublic: false,
      allowDirectMessages: false,
      allowFriendRequests: false,
      showOnlineStatus: false,
      emailLoginAlerts: false,
    },
    create: {
      userId,
      isPublic: false,
      allowDirectMessages: false,
      allowFriendRequests: false,
      showOnlineStatus: false,
      emailLoginAlerts: false,
    },
  } as never)
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()

    if (body?.action !== 'disable') {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'suspended' },
      select: { id: true },
    })

    await applyPrivacyLockdown(userId)

    return clearAuthCookie(NextResponse.json({ message: MESSAGES.ACCOUNT_DISABLED }))
  } catch (error) {
    console.error('Disable account error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()

    if (body?.confirm !== 'DELETE') {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'deleted' },
      select: { id: true },
    })

    await applyPrivacyLockdown(userId)

    return clearAuthCookie(NextResponse.json({ message: MESSAGES.ACCOUNT_DELETED }))
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
