import type {
  AccountActionResponse,
  AuthResponse,
  ChatRoomTokenResponse,
  ConversationMessagesResponse,
  ConversationsResponse,
  CreateVideoInput,
  FriendRequestResponse,
  FriendRequestsResponse,
  FriendshipDecisionAction,
  LoginResponse,
  MemberProfileResponse,
  MemberSearchFilters,
  MemberSearchResponse,
  MemberSettingsResponse,
  PasscodeValidationResponse,
  SendMessageResponse,
  UpdateMemberProfileInput,
  UpdateMemberSettingsInput,
  UpdateVideoInput,
  UserIdAvailabilityResponse,
  VideoListResponse,
  VideoResponse,
  VideoViewResponse,
} from '@/lib/types'

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${process.env.NEXT_PUBLIC_API_URL || ''}${endpoint}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'API call failed')
  }

  return response.json()
}

export async function onboard(data: {
  passcode?: string
  dateOfBirth: string
  displayName: string
  username: string
  password: string
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
  kinks?: string[]
  avatarUrl?: string
  adultContentConfirmed: boolean
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

export async function fetchMemberSettings(): Promise<MemberSettingsResponse> {
  return apiCall('/api/member/settings', {
    method: 'GET',
  })
}

export async function updateMemberSettings(
  data: UpdateMemberSettingsInput
): Promise<MemberSettingsResponse> {
  return apiCall('/api/member/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function disableMyAccount(): Promise<AccountActionResponse> {
  return apiCall('/api/member/account', {
    method: 'PATCH',
    body: JSON.stringify({ action: 'disable' }),
  })
}

export async function deleteMyAccount(): Promise<AccountActionResponse> {
  return apiCall('/api/member/account', {
    method: 'DELETE',
    body: JSON.stringify({ confirm: 'DELETE' }),
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

  if (filters.q) params.set('q', filters.q)
  if (filters.location) params.set('location', filters.location)
  if (typeof filters.minAge === 'number') params.set('minAge', String(filters.minAge))
  if (typeof filters.maxAge === 'number') params.set('maxAge', String(filters.maxAge))
  if (filters.gender) params.set('gender', filters.gender)
  if (filters.orientation) params.set('orientation', filters.orientation)
  if (filters.lookingFor && filters.lookingFor.length > 0) {
    params.set('lookingFor', filters.lookingFor.join(','))
  }
  if (filters.onlineOnly) params.set('onlineOnly', 'true')
  if (filters.hasPhoto) params.set('hasPhoto', 'true')
  if (filters.lastActive && filters.lastActive !== 'any') params.set('lastActive', filters.lastActive)
  if (typeof filters.limit === 'number') params.set('limit', String(filters.limit))

  const query = params.toString()

  return apiCall(`/api/members/search${query ? `?${query}` : ''}`, {
    method: 'GET',
    signal,
  })
}

export async function fetchConversations(signal?: AbortSignal): Promise<ConversationsResponse> {
  return apiCall('/api/messages/conversations', {
    signal,
  })
}

export async function fetchConversationMessages(
  userId: string,
  signal?: AbortSignal
): Promise<ConversationMessagesResponse> {
  return apiCall(`/api/messages?with=${encodeURIComponent(userId)}`, {
    signal,
  })
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

export async function sendPoke(recipientId: string): Promise<SendMessageResponse> {
  return sendGesture(recipientId, 'poke')
}

export async function sendGesture(
  recipientId: string,
  kind: 'poke' | 'wink' | 'wave'
): Promise<SendMessageResponse> {
  return apiCall('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ recipientId, kind }),
  })
}

export async function sendFriendRequest(recipientId: string): Promise<FriendRequestResponse> {
  return apiCall('/api/friends/request', {
    method: 'POST',
    body: JSON.stringify({ recipientId }),
  })
}

export async function fetchFriendRequests(signal?: AbortSignal): Promise<FriendRequestsResponse> {
  return apiCall('/api/friends/requests', {
    method: 'GET',
    signal,
  })
}

export async function decideFriendRequest(
  friendshipId: string,
  action: FriendshipDecisionAction
): Promise<FriendRequestResponse> {
  return apiCall('/api/friends/requests', {
    method: 'PATCH',
    body: JSON.stringify({ friendshipId, action }),
  })
}

export async function fetchPublicVideos(signal?: AbortSignal): Promise<VideoListResponse> {
  return apiCall('/api/videos', {
    method: 'GET',
    signal,
  })
}

export async function fetchMyVideos(signal?: AbortSignal): Promise<VideoListResponse> {
  return apiCall('/api/videos?mine=true', {
    method: 'GET',
    signal,
  })
}

export async function createVideo(data: CreateVideoInput): Promise<VideoResponse> {
  return apiCall('/api/videos', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateVideo(videoId: string, data: UpdateVideoInput): Promise<VideoResponse> {
  return apiCall(`/api/videos/${encodeURIComponent(videoId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteVideo(videoId: string): Promise<{ success: boolean }> {
  return apiCall(`/api/videos/${encodeURIComponent(videoId)}`, {
    method: 'DELETE',
  })
}

export async function incrementVideoViews(videoId: string): Promise<VideoViewResponse> {
  return apiCall(`/api/videos/${encodeURIComponent(videoId)}/view`, {
    method: 'POST',
  })
}

// Legacy wrappers kept for old non-app-router pages still present in this repo.
export async function registerUser(data: any) {
  return apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function onboardUser(data: any) {
  return onboard(data)
}

export async function loginUser(data: any) {
  if (data && (data.passcode === '9999' || data.pin === '9999')) {
    return apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ passcode: '9999' }),
    })
  }

  return apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}