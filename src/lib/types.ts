// Type definitions for the application

export interface User {
  id: string
  email: string
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
  gender?: string
  location?: string
  bio?: string
  interests: string[]
  lookingFor?: string
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
  user: {
    id: string
    email: string
    personalCode: string
  }
}

export interface ErrorResponse {
  error: string
}
