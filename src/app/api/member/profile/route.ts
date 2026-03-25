import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, MESSAGES } from '@/lib/constants'

const prisma = new PrismaClient()

type JwtPayload = {
  sub?: string
}

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

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
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
    const payload = jwt.verify(token, jwtSecret) as JwtPayload
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: MESSAGES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        personalCode: true,
        profile: {
          select: {
            city: true,
            state: true,
            country: true,
            gender: true,
            genderOther: true,
            sexualOrientation: true,
            orientationOther: true,
            lookingFor: true,
            bio: true,
            interests: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: MESSAGES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        personalCode: user.personalCode,
      },
      profile: {
        city: user.profile?.city || '',
        state: user.profile?.state || '',
        country: user.profile?.country || '',
        gender: user.profile?.gender || '',
        genderOther: user.profile?.genderOther || '',
        sexualOrientation: user.profile?.sexualOrientation || '',
        orientationOther: user.profile?.orientationOther || '',
        lookingFor: user.profile?.lookingFor || [],
        bio: user.profile?.bio || '',
        interests: user.profile?.interests || [],
        avatarUrl: user.profile?.avatarUrl || '',
      },
    })
  } catch (error) {
    console.error('Member profile fetch error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: MESSAGES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const body = await request.json()

    const displayName = normalizeString(body.displayName)
    const city = normalizeString(body.city)
    const state = normalizeString(body.state)
    const country = normalizeString(body.country)
    const gender = normalizeString(body.gender)
    const genderOther = normalizeString(body.genderOther)
    const sexualOrientation = normalizeString(body.sexualOrientation)
    const orientationOther = normalizeString(body.orientationOther)
    const bio = normalizeString(body.bio)
    const avatarUrl = normalizeString(body.avatarUrl)
    const lookingFor = Array.isArray(body.lookingFor)
      ? body.lookingFor
          .filter((item: unknown) => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter(Boolean)
      : []
    const interests = Array.isArray(body.interests)
      ? body.interests
          .filter((item: unknown) => typeof item === 'string')
          .map((item: string) => item.trim())
          .filter(Boolean)
      : []

    if (!displayName || !city || !gender || !sexualOrientation || lookingFor.length === 0) {
      return NextResponse.json(
        { error: MESSAGES.FIELD_REQUIRED },
        { status: 400 }
      )
    }

    if (gender === 'Other' && !genderOther) {
      return NextResponse.json(
        { error: MESSAGES.FIELD_REQUIRED },
        { status: 400 }
      )
    }

    if (sexualOrientation === 'Other' && !orientationOther) {
      return NextResponse.json(
        { error: MESSAGES.FIELD_REQUIRED },
        { status: 400 }
      )
    }

    const location = [city, state, country].filter(Boolean).join(', ')

    const [user, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          displayName,
          firstName: displayName,
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          personalCode: true,
        },
      }),
      prisma.profile.upsert({
        where: { userId },
        update: {
          city,
          state: state || null,
          country: country || null,
          location,
          gender,
          genderOther: genderOther || null,
          sexualOrientation,
          orientationOther: orientationOther || null,
          lookingFor,
          bio: bio || null,
          interests,
          avatarUrl: avatarUrl || null,
          photoUrls: avatarUrl ? [avatarUrl] : [],
        },
        create: {
          userId,
          city,
          state: state || null,
          country: country || null,
          location,
          gender,
          genderOther: genderOther || null,
          sexualOrientation,
          orientationOther: orientationOther || null,
          lookingFor,
          bio: bio || null,
          interests,
          avatarUrl: avatarUrl || null,
          photoUrls: avatarUrl ? [avatarUrl] : [],
          isPublic: false,
        },
        select: {
          city: true,
          state: true,
          country: true,
          gender: true,
          genderOther: true,
          sexualOrientation: true,
          orientationOther: true,
          lookingFor: true,
          bio: true,
          interests: true,
          avatarUrl: true,
        },
      }),
    ])

    return NextResponse.json({
      user,
      profile: {
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || '',
        gender: profile.gender || '',
        genderOther: profile.genderOther || '',
        sexualOrientation: profile.sexualOrientation || '',
        orientationOther: profile.orientationOther || '',
        lookingFor: profile.lookingFor,
        bio: profile.bio || '',
        interests: profile.interests,
        avatarUrl: profile.avatarUrl || '',
      },
    })
  } catch (error) {
    console.error('Member profile update error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
