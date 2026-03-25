import { Prisma, PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

import { AUTH_COOKIE_NAME, MAX_AGE, MESSAGES, MIN_AGE } from '@/lib/constants'
import type { AuthTokenPayload } from '@/lib/types'

const prisma = new PrismaClient()
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60
const ONLINE_WINDOW_MINUTES = 15

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
  const headerToken = getBearerToken(request.headers.get('authorization'))
  const token = cookieToken || headerToken

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

function parseNumber(value: string | null): number | null {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parseBoolean(value: string | null): boolean {
  return value === 'true'
}

function parseList(value: string | null): string[] {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getAuthenticatedUserId(request)

    if (!currentUserId) {
      return NextResponse.json(
        { error: MESSAGES.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')?.trim() || ''
    const gender = searchParams.get('gender')?.trim() || ''
    const orientation = searchParams.get('orientation')?.trim() || ''
    const lookingFor = parseList(searchParams.get('lookingFor'))
    const onlineOnly = parseBoolean(searchParams.get('onlineOnly'))
    const parsedMinAge = parseNumber(searchParams.get('minAge'))
    const parsedMaxAge = parseNumber(searchParams.get('maxAge'))
    const parsedLimit = parseNumber(searchParams.get('limit'))

    const minAge = clamp(parsedMinAge ?? MIN_AGE, MIN_AGE, MAX_AGE)
    const maxAge = clamp(parsedMaxAge ?? MAX_AGE, MIN_AGE, MAX_AGE)
    const ageFloor = Math.min(minAge, maxAge)
    const ageCeiling = Math.max(minAge, maxAge)
    const limit = clamp(parsedLimit ?? DEFAULT_LIMIT, 1, MAX_LIMIT)

    const profileFilters: Prisma.ProfileWhereInput = {
      isPublic: true,
      age: {
        gte: ageFloor,
        lte: ageCeiling,
      },
      ...(gender
        ? {
            gender: {
              equals: gender,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(orientation
        ? {
            sexualOrientation: {
              equals: orientation,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(lookingFor.length > 0
        ? {
            lookingFor: {
              hasSome: lookingFor,
            },
          }
        : {}),
    }

    const onlineCutoff = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000)

    const where: Prisma.UserWhereInput = {
      id: {
        not: currentUserId,
      },
      status: 'active',
      ...(onlineOnly
        ? {
            updatedAt: {
              gte: onlineCutoff,
            },
          }
        : {}),
      profile: {
        is: profileFilters,
      },
      ...(q
        ? {
            OR: [
              {
                username: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
              {
                displayName: {
                  contains: q,
                  mode: 'insensitive',
                },
              },
              {
                profile: {
                  is: {
                    location: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                profile: {
                  is: {
                    city: {
                      contains: q,
                      mode: 'insensitive',
                    },
                  },
                },
              },
              {
                profile: {
                  is: {
                    interests: {
                      has: q,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [
        {
          updatedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        updatedAt: true,
        profile: {
          select: {
            age: true,
            city: true,
            state: true,
            country: true,
            location: true,
            bio: true,
            interests: true,
            lookingFor: true,
            avatarUrl: true,
          },
        },
      },
    })

    const members = users.map((user) => {
      const profile = user.profile
      const fallbackLocation = [profile?.city, profile?.state, profile?.country]
        .filter(Boolean)
        .join(', ')

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        age: profile?.age || null,
        location: profile?.location || fallbackLocation,
        bio: profile?.bio || '',
        avatarUrl: profile?.avatarUrl || '',
        interests: profile?.interests || [],
        lookingFor: profile?.lookingFor || [],
        isOnline: user.updatedAt >= onlineCutoff,
      }
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Member search error:', error)

    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}