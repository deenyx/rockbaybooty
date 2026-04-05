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
  kinks?: string[]
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
  profile?: {
    age: number | null
    city: string | null
    state: string | null
    country: string | null
    location: string | null
    gender: string | null
    sexualOrientation: string | null
    lookingFor: string[]
    bio: string | null
    interests: string[]
    kinks: string[]
    avatarUrl: string | null
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
  returnTo?: string
  requiresCredentials?: boolean
  user: {
    id: string
    username: string
    displayName: string
    personalCode: string
  } | null
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

export interface MemberSettings {
  isPublic: boolean
  allowDirectMessages: boolean
  allowFriendRequests: boolean
  showOnlineStatus: boolean
  emailLoginAlerts: boolean
}

export interface MemberSettingsResponse {
  settings: MemberSettings
}

export interface UpdateMemberSettingsInput {
  isPublic?: boolean
  allowDirectMessages?: boolean
  allowFriendRequests?: boolean
  showOnlineStatus?: boolean
  emailLoginAlerts?: boolean
}

export interface AccountActionResponse {
  message: string
}

export interface MemberSearchFilters {
  q?: string
  location?: string
  minAge?: number
  maxAge?: number
  gender?: string
  orientation?: string
  lookingFor?: string[]
  onlineOnly?: boolean
  hasPhoto?: boolean
  lastActive?: 'today' | 'week' | 'any'
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
  friendshipStatus: FriendshipStatus
}

export interface MemberSearchResponse {
  members: MemberSearchResult[]
}

export type FriendshipStatus = 'none' | 'outgoing_pending' | 'incoming_pending' | 'friends'

export type FriendshipDecisionAction = 'accept' | 'decline' | 'cancel'

export interface PendingFriendRequest {
  id: string
  createdAt: string
  status: 'pending'
  direction: 'incoming' | 'outgoing'
  member: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export interface FriendRequestResponse {
  friendship: {
    id: string
    requesterId: string
    recipientId: string
    status: 'pending' | 'accepted' | 'declined'
    createdAt: string
  }
}

export interface FriendRequestsResponse {
  incoming: PendingFriendRequest[]
  outgoing: PendingFriendRequest[]
}

export interface VideoFeedItem {
  id: string
  userId: string
  title: string
  description: string | null
  videoUrl: string
  thumbnailUrl: string | null
  isPublic: boolean
  views: number
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export interface VideoListResponse {
  videos: VideoFeedItem[]
  isPremium?: boolean
}

export interface VideoResponse {
  video: VideoFeedItem
}

export interface VideoViewResponse {
  views: number
}

export interface CreateVideoInput {
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  isPublic?: boolean
}

export interface UpdateVideoInput {
  title?: string
  description?: string
  videoUrl?: string
  thumbnailUrl?: string
  isPublic?: boolean
}

export interface ChatRoomTokenResponse {
  token: string
  wsUrl: string
}

export interface LiveChatMessage {
  id: string
  senderId: string
  senderName: string
  text: string
  sentAt: number
}

export type MessageKind = 'text' | 'poke' | 'wink' | 'wave'

export interface DirectMessage {
  id: string
  senderId: string
  recipientId: string
  kind: MessageKind
  body: string
  readAt: string | null
  createdAt: string
}

export interface Conversation {
  partnerId: string
  partnerUsername: string
  partnerDisplayName: string
  partnerAvatarUrl: string | null
  lastMessage: DirectMessage
  unreadCount: number
}

export interface SendMessageResponse {
  message: DirectMessage
}

export interface ConversationMessagesResponse {
  messages: DirectMessage[]
  partner: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export interface ConversationsResponse {
  conversations: Conversation[]
}
