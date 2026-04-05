import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE_SECONDS,
  KINK_OPTIONS,
  MAX_PROFILE_PHOTO_BYTES,
  MESSAGES,
  MIN_AGE,
  MIN_PASSWORD_LENGTH,
  USERNAME_REGEX,
} from '@/lib/constants'

// Generate a unique personal passcode
function generatePersonalCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

function parseDob(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

function isAtLeastMinimumAge(dateOfBirth: Date, minimumAge: number): boolean {
  const now = new Date()
  const threshold = new Date(now)
  threshold.setFullYear(now.getFullYear() - minimumAge)
  return dateOfBirth <= threshold
}

function getAge(dateOfBirth: Date): number {
  const now = new Date()
  let age = now.getFullYear() - dateOfBirth.getUTCFullYear()
  const monthDifference = now.getMonth() - dateOfBirth.getUTCMonth()
  const dayDifference = now.getDate() - dateOfBirth.getUTCDate()

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age -= 1
  }

  return age
}

function estimateDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const padding = (base64.match(/=+$/)?.[0].length ?? 0)
  return Math.floor((base64.length * 3) / 4) - padding
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = body.username?.trim().toLowerCase()
    const password = body.password
    const displayName = body.displayName?.trim()
    const dateOfBirthInput = body.dateOfBirth?.trim()
    const city = body.city?.trim()
    const state = body.state?.trim() || null
    const country = body.country?.trim() || null
    const gender = body.gender?.trim()
    const genderOther = body.genderOther?.trim() || null
    const sexualOrientation = body.sexualOrientation?.trim()
    const orientationOther = body.orientationOther?.trim() || null
    const lookingFor = Array.isArray(body.lookingFor) ? body.lookingFor : []
    const bio = body.bio?.trim() || null
    const interests = Array.isArray(body.interests)
      ? body.interests.filter((value: unknown) => typeof value === 'string').map((value: string) => value.trim()).filter(Boolean)
      : []
    const kinks = Array.isArray(body.kinks)
      ? body.kinks
          .filter((value: unknown) => typeof value === 'string')
          .map((value: string) => value.trim())
          .filter((value: string) => KINK_OPTIONS.includes(value))
      : []
    const avatarUrl = body.avatarUrl?.trim() || null
    const profilePhoto = body.profilePhoto?.trim() || null
    const adultContentConfirmed = body.adultContentConfirmed === true
    const {
      email,
    } = body

    if (!dateOfBirthInput) {
      return NextResponse.json(
        { error: MESSAGES.INVALID_DATE_OF_BIRTH },
        { status: 400 }
      )
    }

    const dateOfBirth = parseDob(dateOfBirthInput)
    if (!dateOfBirth || !isAtLeastMinimumAge(dateOfBirth, MIN_AGE)) {
      return NextResponse.json(
        { error: MESSAGES.INVALID_DATE_OF_BIRTH },
        { status: 400 }
      )
    }

    if (!displayName) {
      return NextResponse.json(
        { error: MESSAGES.FIELD_REQUIRED },
        { status: 400 }
      )
    }

    if (!username || !USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: MESSAGES.INVALID_USER_ID },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: MESSAGES.PASSWORD_MIN_LENGTH },
        { status: 400 }
      )
    }

    if (!city || !gender || !sexualOrientation || lookingFor.length === 0) {
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

    if (!adultContentConfirmed) {
      return NextResponse.json(
        { error: 'Please confirm the adult content warning before continuing' },
        { status: 400 }
      )
    }

    if (kinks.length === 0) {
      return NextResponse.json(
        { error: 'Select at least one kink' },
        { status: 400 }
      )
    }

    if (avatarUrl && !/^https?:\/\//.test(avatarUrl)) {
      return NextResponse.json(
        { error: 'Invalid avatar image URL' },
        { status: 400 }
      )
    }

    if (profilePhoto) {
      const isDataUrl = profilePhoto.startsWith('data:image/')
      const imageSize = isDataUrl ? estimateDataUrlSize(profilePhoto) : 0

      if (isDataUrl && imageSize > MAX_PROFILE_PHOTO_BYTES) {
        return NextResponse.json(
          { error: 'Profile photo must be 5MB or smaller' },
          { status: 400 }
        )
      }
    }

    if (email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUserByEmail) {
        return NextResponse.json(
          { error: MESSAGES.EMAIL_EXISTS },
          { status: 409 }
        )
      }
    }

    const existingUserByUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    })

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: MESSAGES.USERNAME_EXISTS },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Generate unique personal code
    let personalCode = generatePersonalCode()
    let codeExists = true
    while (codeExists) {
      const existingCode = await prisma.user.findUnique({
        where: { personalCode },
      })
      if (!existingCode) {
        codeExists = false
      } else {
        personalCode = generatePersonalCode()
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email || null,
        username,
        displayName,
        personalCode,
        passwordHash,
        firstName: displayName,
        onboardingStep: 'completed',
        status: 'active',
      },
    })

    const location = [city, state, country].filter(Boolean).join(', ')

    const resolvedAvatarUrl = avatarUrl || profilePhoto

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        age: getAge(dateOfBirth),
        dateOfBirth,
        gender,
        genderOther,
        sexualOrientation,
        orientationOther,
        city,
        state,
        country,
        location,
        lookingFor,
        bio,
        interests,
        kinks,
        avatarUrl: resolvedAvatarUrl,
        photoUrls: resolvedAvatarUrl ? [resolvedAvatarUrl] : [],
        isPublic: false,
      },
      select: {
        age: true,
        city: true,
        state: true,
        country: true,
        location: true,
        gender: true,
        sexualOrientation: true,
        lookingFor: true,
        bio: true,
        interests: true,
        kinks: true,
        avatarUrl: true,
      },
    })

    const profileKinks = Array.isArray(profile.kinks)
      ? profile.kinks.filter((value): value is string => typeof value === 'string')
      : []

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json(
        { error: MESSAGES.ERROR_GENERAL },
        { status: 500 }
      )
    }

    const token = jwt.sign(
      {
        userId: user.id,
        personalCode: user.personalCode,
      },
      jwtSecret,
      { expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS }
    )

    // TODO: Send welcome email
    const response = NextResponse.json(
      {
        message: MESSAGES.ACCOUNT_CREATED,
        personalCode: user.personalCode,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          personalCode: user.personalCode,
        },
        profile: {
          age: profile.age,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          location: profile.location,
          gender: profile.gender,
          sexualOrientation: profile.sexualOrientation,
          lookingFor: profile.lookingFor,
          bio: profile.bio,
          interests: profile.interests,
          kinks: profileKinks,
          avatarUrl: profile.avatarUrl,
        },
      },
      { status: 201 }
    )

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: AUTH_TOKEN_MAX_AGE_SECONDS,
    })

    return response
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: MESSAGES.ERROR_CREATING_ACCOUNT },
      { status: 500 }
    )
  }
}
