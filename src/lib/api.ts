// Utility functions for API calls

import type {
  AuthResponse,
  ChatRoomTokenResponse,
  ConversationMessagesResponse,
  ConversationsResponse,
  LoginResponse,
  MemberSearchFilters,
  MemberSearchResponse,
  MemberProfileResponse,
  PasscodeValidationResponse,
  SendMessageResponse,
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

export async function fetchChatRoomToken(): Promise<ChatRoomTokenResponse> {
  return apiCall('/api/chat/token')
}

export async function searchMembers(
  filters: MemberSearchFilters,
  signal?: AbortSignal
): Promise<MemberSearchResponse> {
  const params = new URLSearchParams()

  if (filters.q) {
    params.set('q', filters.q)
  }

  if (typeof filters.minAge === 'number') {
    params.set('minAge', String(filters.minAge))
  }

  if (typeof filters.maxAge === 'number') {
    params.set('maxAge', String(filters.maxAge))
  }

  if (filters.gender) {
    params.set('gender', filters.gender)
  }

  if (filters.orientation) {
    params.set('orientation', filters.orientation)
  }

  if (filters.lookingFor && filters.lookingFor.length > 0) {
    params.set('lookingFor', filters.lookingFor.join(','))
  }

  if (filters.onlineOnly) {
    params.set('onlineOnly', 'true')
  }

  if (filters.hasPhoto) {
    params.set('hasPhoto', 'true')
  }

  if (filters.lastActive && filters.lastActive !== 'any') {
    params.set('lastActive', filters.lastActive)
  }

  if (typeof filters.limit === 'number') {
    params.set('limit', String(filters.limit))
  }

  const query = params.toString()

  return apiCall(`/api/members/search${query ? `?${query}` : ''}`, {
    method: 'GET',
    signal,
  })
}

export async function fetchConversations(): Promise<ConversationsResponse> {
  return apiCall('/api/messages/conversations')
}

export async function fetchConversationMessages(
  userId: string
): Promise<ConversationMessagesResponse> {
  return apiCall(`/api/messages?with=${encodeURIComponent(userId)}`)
}

export async function sendMessage(
  recipientId: string,
  body: string
): Promise<SendMessageResponse> {
  return apiCall('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ recipientId, body }),
  })
}

export async function sendPoke(
  recipientId: string
): Promise<SendMessageResponse> {
  return apiCall('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ recipientId, kind: 'poke' }),
  })
}
