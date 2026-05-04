import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { AUTH_COOKIE_NAME, MESSAGES } from '@/lib/constants'
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
    const payload = jwt.verify(token, jwtSecret) as AuthTokenPayload & { sub?: string }
    if (typeof payload.userId === 'string') {
      return payload.userId
    }

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
            pronouns: true,
            sexualOrientation: true,
            orientationOther: true,
            intentions: true,
            lookingFor: true,
            bio: true,
            interests: true,
            avatarUrl: true,
            twitterUrl: true,
            fetlifeUrl: true,
            onlyfansUrl: true,
            pornhubUrl: true,
            tumblrUrl: true,
            instagramUrl: true,
            socialLinksVisibility: true,
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
        pronouns: user.profile?.pronouns || '',
        sexualOrientation: user.profile?.sexualOrientation || '',
        orientationOther: user.profile?.orientationOther || '',
        intentions: user.profile?.intentions || '',
        lookingFor: user.profile?.lookingFor || [],
        bio: user.profile?.bio || '',
        interests: user.profile?.interests || [],
        avatarUrl: user.profile?.avatarUrl || '',
        twitterUrl: user.profile?.twitterUrl || '',
        fetlifeUrl: user.profile?.fetlifeUrl || '',
        onlyfansUrl: user.profile?.onlyfansUrl || '',
        pornhubUrl: user.profile?.pornhubUrl || '',
        tumblrUrl: user.profile?.tumblrUrl || '',
        instagramUrl: user.profile?.instagramUrl || '',
        socialLinksVisibility: user.profile?.socialLinksVisibility || 'members',
      },
    })
  } catch (error) {
    console.error('Member profile fetch error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
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
    const pronouns = normalizeString(body.pronouns)
    const sexualOrientation = normalizeString(body.sexualOrientation)
    const orientationOther = normalizeString(body.orientationOther)
    const intentions = normalizeString(body.intentions)
    const bio = normalizeString(body.bio)
    const avatarUrl = normalizeString(body.avatarUrl)
    const twitterUrl = normalizeString(body.twitterUrl)
    const fetlifeUrl = normalizeString(body.fetlifeUrl)
    const onlyfansUrl = normalizeString(body.onlyfansUrl)
    const pornhubUrl = normalizeString(body.pornhubUrl)
    const tumblrUrl = normalizeString(body.tumblrUrl)
    const instagramUrl = normalizeString(body.instagramUrl)
    const socialLinksVisibility =
      ['public', 'members', 'friends', 'private'].includes(body.socialLinksVisibility)
        ? (body.socialLinksVisibility as string)
        : 'members'
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
          pronouns: pronouns || null,
          sexualOrientation,
          orientationOther: orientationOther || null,
          intentions: intentions || null,
          lookingFor,
          bio: bio || null,
          interests,
          avatarUrl: avatarUrl || null,
          photoUrls: avatarUrl ? [avatarUrl] : [],
          twitterUrl: twitterUrl || null,
          fetlifeUrl: fetlifeUrl || null,
          onlyfansUrl: onlyfansUrl || null,
          pornhubUrl: pornhubUrl || null,
          tumblrUrl: tumblrUrl || null,
          instagramUrl: instagramUrl || null,
          socialLinksVisibility,
        },
        create: {
          userId,
          city,
          state: state || null,
          country: country || null,
          location,
          gender,
          genderOther: genderOther || null,
          pronouns: pronouns || null,
          sexualOrientation,
          orientationOther: orientationOther || null,
          intentions: intentions || null,
          lookingFor,
          bio: bio || null,
          interests,
          avatarUrl: avatarUrl || null,
          photoUrls: avatarUrl ? [avatarUrl] : [],
          twitterUrl: twitterUrl || null,
          fetlifeUrl: fetlifeUrl || null,
          onlyfansUrl: onlyfansUrl || null,
          pornhubUrl: pornhubUrl || null,
          tumblrUrl: tumblrUrl || null,
          instagramUrl: instagramUrl || null,
          socialLinksVisibility,
          isPublic: false,
        },
        select: {
          city: true,
          state: true,
          country: true,
          gender: true,
          genderOther: true,
          pronouns: true,
          sexualOrientation: true,
          orientationOther: true,
          intentions: true,
          lookingFor: true,
          bio: true,
          interests: true,
          avatarUrl: true,
          twitterUrl: true,
          fetlifeUrl: true,
          onlyfansUrl: true,
          pornhubUrl: true,
          tumblrUrl: true,
          instagramUrl: true,
          socialLinksVisibility: true,
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
        pronouns: profile.pronouns || '',
        sexualOrientation: profile.sexualOrientation || '',
        orientationOther: profile.orientationOther || '',
        intentions: profile.intentions || '',
        lookingFor: profile.lookingFor,
        bio: profile.bio || '',
        interests: profile.interests,
        avatarUrl: profile.avatarUrl || '',
        twitterUrl: profile.twitterUrl || '',
        fetlifeUrl: profile.fetlifeUrl || '',
        onlyfansUrl: profile.onlyfansUrl || '',
        pornhubUrl: profile.pornhubUrl || '',
        tumblrUrl: profile.tumblrUrl || '',
        instagramUrl: profile.instagramUrl || '',
        socialLinksVisibility: profile.socialLinksVisibility || 'members',
      },
    })
  } catch (error) {
    console.error('Member profile update error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  }
}
