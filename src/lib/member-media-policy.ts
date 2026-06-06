import type { UserRole } from '@prisma/client'

export type MemberMediaPolicy = {
  tier: 'premium' | 'free' | 'burner'
  maxPhotos: number | null
  maxVideos: number | null
  allowVideos: boolean
  requireWatermark: boolean
}

type MemberPolicyInput = {
  role: UserRole
  isPremium: boolean
}

export function getMemberMediaPolicy(user: MemberPolicyInput): MemberMediaPolicy {
  if (user.isPremium || user.role === 'ADMIN' || user.role === 'SUPREME_ADMIN') {
    return {
      tier: 'premium',
      maxPhotos: null,
      maxVideos: null,
      allowVideos: true,
      requireWatermark: false,
    }
  }

  if (user.role === 'BURNER') {
    return {
      tier: 'burner',
      maxPhotos: 5,
      maxVideos: 0,
      allowVideos: false,
      requireWatermark: true,
    }
  }

  return {
    tier: 'free',
    maxPhotos: 10,
    maxVideos: 3,
    allowVideos: true,
    requireWatermark: false,
  }
}
