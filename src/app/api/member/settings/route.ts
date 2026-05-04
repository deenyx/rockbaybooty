import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, MESSAGES } from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload, MemberSettings, UpdateMemberSettingsInput } from '@/lib/types'

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

function getDefaultSettings() {
  return {
    isPublic: false,
    allowDirectMessages: true,
    allowFriendRequests: true,
    showOnlineStatus: true,
    emailLoginAlerts: true,
  }
}

function validateSettingsPayload(body: unknown): UpdateMemberSettingsInput | null {
  if (!body || typeof body !== 'object') {
    return null
  }

  const input = body as Record<string, unknown>
  const allowedKeys = ['isPublic', 'allowDirectMessages', 'allowFriendRequests', 'showOnlineStatus', 'emailLoginAlerts']
  const output: UpdateMemberSettingsInput = {}

  for (const key of allowedKeys) {
    const value = input[key]

    if (typeof value === 'undefined') {
      continue
    }

    if (typeof value !== 'boolean') {
      return null
    }

    output[key as keyof UpdateMemberSettingsInput] = value
  }

  if (Object.keys(output).length === 0) {
    return null
  }

  return output
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        isPublic: true,
        allowDirectMessages: true,
        allowFriendRequests: true,
        showOnlineStatus: true,
        emailLoginAlerts: true,
      },
    } as never) as unknown as MemberSettings | null

    return NextResponse.json({
      settings: profile || getDefaultSettings(),
    })
  } catch (error) {
    console.error('Member settings fetch error:', error)

    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json()
    const updates = validateSettingsPayload(body)

    if (!updates) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        ...getDefaultSettings(),
        ...updates,
      },
      select: {
        isPublic: true,
        allowDirectMessages: true,
        allowFriendRequests: true,
        showOnlineStatus: true,
        emailLoginAlerts: true,
      },
    } as never) as unknown as MemberSettings

    return NextResponse.json({ settings: profile })
  } catch (error) {
    console.error('Member settings update error:', error)

    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
