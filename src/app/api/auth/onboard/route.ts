import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Generate a unique personal passcode
function generatePersonalCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      passcode,
      email,
      firstName,
      lastName,
      age,
      gender,
      location,
      lookingFor,
      bio,
      interests,
    } = body

    // Validate passcode
    if (!passcode) {
      return NextResponse.json(
        { error: 'Passcode is required' },
        { status: 400 }
      )
    }

    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: passcode },
    })

    if (!inviteCode || inviteCode.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid or expired passcode' },
        { status: 401 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
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
        email,
        personalCode,
        passwordHash,
        firstName,
        lastName,
        onboardingStep: 'completed',
        status: 'active',
      },
    })

    // Create profile
    await prisma.profile.create({
      data: {
        userId: user.id,
        age: parseInt(age),
        gender,
        location,
        lookingFor,
        bio: bio || null,
        interests: interests ? interests.split(',').map((i: string) => i.trim()) : [],
        isPublic: false,
      },
    })

    // Mark invite code as used
    await prisma.inviteCode.update({
      where: { code: passcode },
      data: {
        usedAt: new Date(),
        usedBy: user.id,
        status: 'used',
      },
    })

    // TODO: Send welcome email with temporary password
    // TODO: Generate JWT token

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          email: user.email,
          personalCode: user.personalCode,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
