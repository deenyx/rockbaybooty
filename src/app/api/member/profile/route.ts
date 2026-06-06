import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'
import { getMemberMediaPolicy } from '@/lib/member-media-policy'
import prisma from '@/lib/prisma'

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const parsed = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return Array.from(new Set(parsed))
}

function buildLocation(city: string, state: string, country: string): string {
  return [city, state, country].filter(Boolean).join(', ')
}

async function buildProfileResponse(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      accountName: true,
      personalCode: true,
      role: true,
      isPremium: true,
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
          photoUrls: true,
          videoUrls: true,
        },
      },
    },
  })

  if (!user) {
    return null
  }

  const mediaPolicy = getMemberMediaPolicy({ role: user.role, isPremium: user.isPremium })
  const photoUrls = user.profile?.photoUrls || []
  const videoUrls = user.profile?.videoUrls || []

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      accountName: user.accountName,
      personalCode: user.personalCode,
      role: user.role,
      isPremium: user.isPremium,
    },
    profile: {
      city: user.profile?.city || '',
      state: user.profile?.state || '',
      country: user.profile?.country || '',
      gender: user.profile?.gender || '',
      genderOther: user.profile?.genderOther || '',
      pronouns: '',
      sexualOrientation: user.profile?.sexualOrientation || '',
      orientationOther: user.profile?.orientationOther || '',
      intentions: '',
      lookingFor: user.profile?.lookingFor || [],
      bio: user.profile?.bio || '',
      interests: user.profile?.interests || [],
      avatarUrl: user.profile?.avatarUrl || '',
      photoUrls,
      videoUrls,
      twitterUrl: '',
      fetlifeUrl: '',
      onlyfansUrl: '',
      pornhubUrl: '',
      tumblrUrl: '',
      instagramUrl: '',
      socialLinksVisibility: 'private',
    },
    media: {
      policy: mediaPolicy,
      counts: {
        photos: photoUrls.length,
        videos: videoUrls.length,
      },
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const response = await buildProfileResponse(userId)

    if (!response) {
      return NextResponse.json({ error: MESSAGES.LOGIN_INVALID }, { status: 404 })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch member profile:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null

    if (!body) {
      return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isPremium: true,
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
            photoUrls: true,
            videoUrls: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: MESSAGES.LOGIN_INVALID }, { status: 404 })
    }

    const incomingDisplayName = normalizeString(body.displayName)
    const nextDisplayName = incomingDisplayName ?? undefined

    const nextCity = normalizeString(body.city) ?? user.profile?.city ?? ''
    const nextState = normalizeString(body.state) ?? user.profile?.state ?? ''
    const nextCountry = normalizeString(body.country) ?? user.profile?.country ?? ''
    const nextGender = normalizeString(body.gender) ?? user.profile?.gender ?? ''
    const nextGenderOther = normalizeString(body.genderOther) ?? user.profile?.genderOther ?? ''
    const nextSexualOrientation = normalizeString(body.sexualOrientation) ?? user.profile?.sexualOrientation ?? ''
    const nextOrientationOther = normalizeString(body.orientationOther) ?? user.profile?.orientationOther ?? ''
    const nextLookingFor = normalizeStringArray(body.lookingFor) ?? user.profile?.lookingFor ?? []
    const nextInterests = normalizeStringArray(body.interests) ?? user.profile?.interests ?? []
    const nextBio = normalizeString(body.bio) ?? user.profile?.bio ?? ''
    const nextAvatarUrl = normalizeString(body.avatarUrl) ?? user.profile?.avatarUrl ?? ''
    const nextPhotoUrls = normalizeStringArray(body.photoUrls) ?? user.profile?.photoUrls ?? []
    const nextVideoUrls = normalizeStringArray(body.videoUrls) ?? user.profile?.videoUrls ?? []

    const mediaPolicy = getMemberMediaPolicy({ role: user.role, isPremium: user.isPremium })

    if (mediaPolicy.maxPhotos !== null && nextPhotoUrls.length > mediaPolicy.maxPhotos) {
      return NextResponse.json({ error: `Photo limit reached for your plan (${mediaPolicy.maxPhotos} max).` }, { status: 400 })
    }

    if (!mediaPolicy.allowVideos && nextVideoUrls.length > 0) {
      return NextResponse.json({ error: 'Your account cannot upload videos.' }, { status: 403 })
    }

    if (mediaPolicy.maxVideos !== null && nextVideoUrls.length > mediaPolicy.maxVideos) {
      return NextResponse.json({ error: `Video limit reached for your plan (${mediaPolicy.maxVideos} max).` }, { status: 400 })
    }

    if (!nextDisplayName) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    if (!nextCity || !nextGender || !nextSexualOrientation) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    const location = buildLocation(nextCity, nextState, nextCountry)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          displayName: nextDisplayName,
          firstName: nextDisplayName,
        },
      }),
      prisma.profile.upsert({
        where: { userId },
        create: {
          userId,
          city: nextCity,
          state: nextState,
          country: nextCountry,
          location,
          gender: nextGender,
          genderOther: nextGenderOther,
          sexualOrientation: nextSexualOrientation,
          orientationOther: nextOrientationOther,
          lookingFor: nextLookingFor,
          interests: nextInterests,
          bio: nextBio,
          avatarUrl: nextAvatarUrl,
          photoUrls: nextPhotoUrls,
          videoUrls: nextVideoUrls,
        },
        update: {
          city: nextCity,
          state: nextState,
          country: nextCountry,
          location,
          gender: nextGender,
          genderOther: nextGenderOther,
          sexualOrientation: nextSexualOrientation,
          orientationOther: nextOrientationOther,
          lookingFor: nextLookingFor,
          interests: nextInterests,
          bio: nextBio,
          avatarUrl: nextAvatarUrl,
          photoUrls: nextPhotoUrls,
          videoUrls: nextVideoUrls,
        },
      }),
    ])

    const response = await buildProfileResponse(userId)

    if (!response) {
      return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to update member profile:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
