// Utility functions for API calls

import type {
  AuthResponse,
  LoginResponse,
  MemberProfileResponse,
  PasscodeValidationResponse,
  UpdateMemberProfileInput,
  UserIdAvailabilityResponse,
} from '@/lib/types'

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${process.env.NEXT_PUBLIC_API_URL || ''}${endpoint}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API call failed')
  }

  return response.json()
}

export async function onboard(data: {
  passcode: string
  dateOfBirth: string
  displayName: string
  username: string
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
  profilePhoto?: string
}): Promise<AuthResponse> {
  return apiCall('/api/auth/onboard', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function checkUsernameAvailability(
  username: string
): Promise<UserIdAvailabilityResponse> {
  return apiCall('/api/auth/check-username', {
    method: 'POST',
    body: JSON.stringify({ username }),
  })
}

export async function validatePasscode(
  passcode: string
): Promise<PasscodeValidationResponse> {
  return apiCall('/api/auth/validate-passcode', {
    method: 'POST',
    body: JSON.stringify({ passcode }),
  })
}

export async function loginWithPasscode(
  passcode: string
): Promise<LoginResponse> {
  return apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ passcode }),
  })
}

export async function fetchMemberProfile(): Promise<MemberProfileResponse> {
  return apiCall('/api/member/profile', {
    method: 'GET',
  })
}

export async function updateMemberProfile(
  data: UpdateMemberProfileInput
): Promise<MemberProfileResponse> {
  return apiCall('/api/member/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
