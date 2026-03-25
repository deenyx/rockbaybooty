import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_MAX_AGE_SECONDS,
  MESSAGES,
  MIN_AGE,
} from '@/lib/constants'

const prisma = new PrismaClient()
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024

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
    const normalizedPasscode = body.passcode?.trim().toUpperCase()
    const username = body.username?.trim().toLowerCase()
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
    const profilePhoto = body.profilePhoto?.trim() || null
    const {
      email,
    } = body

    // Validate passcode
    if (!normalizedPasscode) {
      return NextResponse.json(
        { error: MESSAGES.PASSCODE_REQUIRED },
        { status: 400 }
      )
    }

    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: normalizedPasscode },
    })

    if (!inviteCode || inviteCode.status !== 'active') {
      return NextResponse.json(
        { error: MESSAGES.PASSCODE_INVALID },
        { status: 401 }
      )
    }

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

    // Create password hash (TODO: require password from user)
    const tempPassword = Math.random().toString(36).substring(2, 15)
    const passwordHash = await bcrypt.hash(tempPassword, 10)

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

    // Create profile
    await prisma.profile.create({
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
        avatarUrl: profilePhoto,
        photoUrls: profilePhoto ? [profilePhoto] : [],
        isPublic: false,
      },
    })

    // Mark invite code as used
    await prisma.inviteCode.update({
      where: { code: normalizedPasscode },
      data: {
        usedAt: new Date(),
        usedBy: user.id,
        status: 'used',
      },
    })

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json(
        { error: MESSAGES.ERROR_GENERAL },
        { status: 500 }
      )
    }

    const token = jwt.sign(
      {
        sub: user.id,
        username: user.username,
      },
      jwtSecret,
      { expiresIn: AUTH_TOKEN_MAX_AGE_SECONDS }
    )

    // TODO: Send welcome email with temporary password
    const response = NextResponse.json(
      {
        message: MESSAGES.ACCOUNT_CREATED,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          personalCode: user.personalCode,
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
  } finally {
    await prisma.$disconnect()
  }
}
