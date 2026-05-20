import type { Prisma } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

import { AUTH_COOKIE_NAME, MAX_AGE, MESSAGES, MIN_AGE } from '@/lib/constants'
import type { AuthTokenPayload, FriendshipStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 60
const ONLINE_WINDOW_MINUTES = 15
const SORT_OPTIONS = new Set(['recent', 'location_asc', 'location_desc', 'nearby'])
const VERIFICATION_STATUS_OPTIONS = new Set(['any', 'verified', 'pending', 'rejected', 'unverified'])

function normalizeLocationPart(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase()
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
    const location = searchParams.get('location')?.trim() || ''
    const rawSortBy = searchParams.get('sortBy')?.trim() || 'recent'
    const sortBy = SORT_OPTIONS.has(rawSortBy) ? rawSortBy : 'recent'
    const gender = searchParams.get('gender')?.trim() || ''
    const orientation = searchParams.get('orientation')?.trim() || ''
    const lookingFor = parseList(searchParams.get('lookingFor'))
    const interests = parseList(searchParams.get('interests'))
    const kinks = parseList(searchParams.get('kinks'))
    const onlineOnly = parseBoolean(searchParams.get('onlineOnly'))
    const verifiedOnly = parseBoolean(searchParams.get('verifiedOnly'))
    const rawVerificationStatus = searchParams.get('verificationStatus')?.trim().toLowerCase() || 'any'
    const verificationStatus = VERIFICATION_STATUS_OPTIONS.has(rawVerificationStatus)
      ? rawVerificationStatus
      : 'any'
    const hasPhoto = parseBoolean(searchParams.get('hasPhoto'))
    const lastActive = searchParams.get('lastActive') as 'today' | 'week' | 'any' | null
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
      ...(hasPhoto ? { avatarUrl: { not: null } } : {}),
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
      ...(interests.length > 0
        ? {
            interests: {
              hasSome: interests,
            },
          }
        : {}),
      ...(location
        ? {
            OR: [
              {
                location: {
                  contains: location,
                  mode: 'insensitive',
                },
              },
              {
                city: {
                  contains: location,
                  mode: 'insensitive',
                },
              },
              {
                state: {
                  contains: location,
                  mode: 'insensitive',
                },
              },
              {
                country: {
                  contains: location,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    }

    const onlineCutoff = new Date(Date.now() - ONLINE_WINDOW_MINUTES * 60 * 1000)

    const lastActiveCutoff =
      lastActive === 'today'
        ? new Date(Date.now() - 24 * 60 * 60 * 1000)
        : lastActive === 'week'
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          : null

    const resolvedVerificationStatus =
      verificationStatus === 'any' && verifiedOnly ? 'verified' : verificationStatus

    const verificationFilter: Prisma.UserWhereInput =
      resolvedVerificationStatus === 'verified'
        ? {
            role: 'MODEL_VERIFIED',
          }
        : resolvedVerificationStatus === 'unverified'
          ? {
              role: {
                not: 'MODEL_VERIFIED',
              },
            }
          : {}

    const where: Prisma.UserWhereInput = {
      id: {
        not: currentUserId,
      },
      status: 'active',
      ...verificationFilter,
      ...(onlineOnly
        ? {
            updatedAt: {
              gte: onlineCutoff,
            },
          }
        : lastActiveCutoff
          ? {
              updatedAt: {
                gte: lastActiveCutoff,
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

    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: currentUserId },
      select: {
        city: true,
        state: true,
        country: true,
      },
    })

    const currentCity = normalizeLocationPart(currentUserProfile?.city)
    const currentState = normalizeLocationPart(currentUserProfile?.state)
    const currentCountry = normalizeLocationPart(currentUserProfile?.country)

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
        role: true,
        profile: {
          select: {
            age: true,
            city: true,
            state: true,
            country: true,
            location: true,
            bio: true,
            interests: true,
            kinks: true,
            lookingFor: true,
            avatarUrl: true,
            showOnlineStatus: true,
          },
        },
      },
    })

    const filteredUsers = kinks.length > 0
      ? users.filter((user) => {
          const profileKinks = Array.isArray(user.profile?.kinks) ? user.profile.kinks as string[] : []
          return kinks.some((k) => profileKinks.includes(k))
        })
      : users

    const relationshipRecords = await prisma.friendship.findMany({
      where: {
        OR: [
          {
            requesterId: currentUserId,
            recipientId: {
              in: filteredUsers.map((user) => user.id),
            },
          },
          {
            recipientId: currentUserId,
            requesterId: {
              in: filteredUsers.map((user) => user.id),
            },
          },
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        requesterId: true,
        recipientId: true,
        status: true,
      },
    })

    const relationshipByUser = new Map<string, FriendshipStatus>()

    for (const relationship of relationshipRecords) {
      const partnerId = relationship.requesterId === currentUserId
        ? relationship.recipientId
        : relationship.requesterId

      if (relationshipByUser.get(partnerId) === 'friends') {
        continue
      }

      if (relationship.status === 'accepted') {
        relationshipByUser.set(partnerId, 'friends')
        continue
      }

      if (relationship.status === 'pending') {
        relationshipByUser.set(
          partnerId,
          relationship.requesterId === currentUserId ? 'outgoing_pending' : 'incoming_pending'
        )
      }
    }

    const members = filteredUsers.map((user) => {
      const profile = user.profile
      const fallbackLocation = [profile?.city, profile?.state, profile?.country]
        .filter(Boolean)
        .join(', ')

      const isVerified = user.role === 'MODEL_VERIFIED'
      const verificationStatus = isVerified ? 'verified' : 'unverified'

      const city = normalizeLocationPart(profile?.city)
      const state = normalizeLocationPart(profile?.state)
      const country = normalizeLocationPart(profile?.country)

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        age: profile?.age || null,
        location: profile?.location || fallbackLocation,
        bio: profile?.bio || '',
        avatarUrl: profile?.avatarUrl || '',
        interests: profile?.interests || [],
        kinks: Array.isArray(profile?.kinks) ? profile.kinks as string[] : [],
        lookingFor: profile?.lookingFor || [],
        isOnline: profile?.showOnlineStatus ? user.updatedAt >= onlineCutoff : false,
        isVerified,
        verificationStatus,
        friendshipStatus: relationshipByUser.get(user.id) || 'none',
        __city: city,
        __state: state,
        __country: country,
      }
    })

    if (sortBy === 'nearby') {
      const proximityScore = (member: { __city: string; __state: string; __country: string }) => {
        if (currentCity && member.__city && member.__city === currentCity) return 3
        if (currentState && member.__state && member.__state === currentState) return 2
        if (currentCountry && member.__country && member.__country === currentCountry) return 1
        return 0
      }

      members.sort((a, b) => {
        const scoreDiff = proximityScore(b) - proximityScore(a)
        if (scoreDiff !== 0) return scoreDiff

        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1

        const aLoc = (a.location || '').trim().toLowerCase()
        const bLoc = (b.location || '').trim().toLowerCase()
        return aLoc.localeCompare(bLoc)
      })
    } else if (sortBy === 'location_asc' || sortBy === 'location_desc') {
      const direction = sortBy === 'location_asc' ? 1 : -1
      members.sort((a, b) => {
        const aLoc = (a.location || '').trim().toLowerCase()
        const bLoc = (b.location || '').trim().toLowerCase()

        if (!aLoc && !bLoc) return 0
        if (!aLoc) return 1
        if (!bLoc) return -1

        return aLoc.localeCompare(bLoc) * direction
      })
    }

    const responseMembers = members.map(({ __city, __state, __country, ...member }) => member)

    return NextResponse.json({ members: responseMembers })
  } catch (error) {
    console.error('Member search error:', error)

    return NextResponse.json(
      { error: MESSAGES.ERROR_GENERAL },
      { status: 500 }
    )
  }
}