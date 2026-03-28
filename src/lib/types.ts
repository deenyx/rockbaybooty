// Type definitions for the application

export interface User {
  id: string
  email?: string | null
  username: string
  displayName: string
  personalCode: string
  firstName?: string
  lastName?: string
  status: 'active' | 'suspended' | 'deleted'
  onboardingStep: 'passcode' | 'interview' | 'completed'
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Profile {
  id: string
  userId: string
  age?: number
  dateOfBirth?: Date
  gender?: string
  genderOther?: string
  sexualOrientation?: string
  orientationOther?: string
  city?: string
  state?: string
  country?: string
  location?: string
  bio?: string
  interests: string[]
  lookingFor: string[]
  avatarUrl?: string
  photoUrls: string[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

export interface InviteCode {
  id: string
  code: string
  status: 'active' | 'used' | 'revoked'
  createdAt: Date
  usedAt?: Date
  usedBy?: string
}

export interface AuthTokenPayload {
  userId: string
  personalCode: string
  mode?: 'default-member'
  sub?: string
  username?: string
  iat?: number
  exp?: number
}

export interface OnboardingQuestion {
  id: string
  label: string
  type: 'text' | 'email' | 'number' | 'select' | 'textarea'
  placeholder?: string
  options?: string[]
  required: boolean
}

export interface AuthResponse {
  message: string
  personalCode: string
  user: {
    id: string
    email?: string | null
    username: string
    displayName: string
    personalCode: string
  }
}

export interface UserIdAvailabilityResponse {
  available: boolean
}

export interface PasscodeValidationResponse {
  message: string
}

export interface LoginResponse {
  message: string
  user: {
    id: string
    username: string
    displayName: string
    personalCode: string
  }
}

export interface ErrorResponse {
  error: string
}

export interface MemberProfileResponse {
  user: {
    id: string
    username: string
    displayName: string
    personalCode: string
  }
  profile: {
    city: string
    state: string
    country: string
    gender: string
    genderOther: string
    sexualOrientation: string
    orientationOther: string
    lookingFor: string[]
    bio: string
    interests: string[]
    avatarUrl: string
  }
}

export interface UpdateMemberProfileInput {
  displayName: string
  city: string
  state?: string
  country?: string
  gender: string
  genderOther?: string
  sexualOrientation: string
  orientationOther?: string
  lookingFor: string[]
  bio?: string
  interests?: string[]
  avatarUrl?: string
}

export interface MemberSearchFilters {
  q?: string
  minAge?: number
  maxAge?: number
  gender?: string
  orientation?: string
  lookingFor?: string[]
  onlineOnly?: boolean
  limit?: number
}

export interface MemberSearchResult {
  id: string
  username: string
  displayName: string
  age: number | null
  location: string
  bio: string
  avatarUrl: string
  interests: string[]
  lookingFor: string[]
  isOnline: boolean
}

export interface MemberSearchResponse {
  members: MemberSearchResult[]
}
