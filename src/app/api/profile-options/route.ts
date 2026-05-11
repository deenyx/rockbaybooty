import { NextResponse } from 'next/server'

import prisma from '@/lib/prisma'
import {
  PROFILE_OPTION_CATEGORIES,
  PROFILE_OPTION_DEFAULTS,
  type ProfileOptionCategory,
  type ProfileOptionsMap,
} from '@/lib/profile-options'

export const dynamic = 'force-dynamic'

function createDefaultMap(): ProfileOptionsMap {
  return {
    lookingFor: [...PROFILE_OPTION_DEFAULTS.lookingFor],
    intentions: [...PROFILE_OPTION_DEFAULTS.intentions],
    gender: [...PROFILE_OPTION_DEFAULTS.gender],
    pronouns: [...PROFILE_OPTION_DEFAULTS.pronouns],
    orientation: [...PROFILE_OPTION_DEFAULTS.orientation],
    interests: [...PROFILE_OPTION_DEFAULTS.interests],
    kinks: [...PROFILE_OPTION_DEFAULTS.kinks],
    roles: [...PROFILE_OPTION_DEFAULTS.roles],
  }
}

export async function GET() {
  try {
    const options = createDefaultMap()

    const rows = await prisma.profileOption.findMany({
      where: {
        isActive: true,
        category: {
          in: [...PROFILE_OPTION_CATEGORIES],
        },
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { value: 'asc' }],
      select: {
        category: true,
        value: true,
      },
    })

    if (rows.length > 0) {
      for (const category of PROFILE_OPTION_CATEGORIES) {
        const values = rows
          .filter((row) => row.category === category)
          .map((row) => row.value.trim())
          .filter(Boolean)

        if (values.length > 0) {
          options[category as ProfileOptionCategory] = [...new Set(values)]
        }
      }
    }

    return NextResponse.json({ options })
  } catch (error) {
    console.error('Failed to load profile options:', error)
    return NextResponse.json({ options: createDefaultMap() })
  }
}
