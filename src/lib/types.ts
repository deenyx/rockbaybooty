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
  pronouns?: string
  sexualOrientation?: string
  orientationOther?: string
  intentions?: string
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
  mode?: 'default-member' | 'member'
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
  promptNametag?: boolean
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

export interface ClassifiedListing {
  id: string
  userId: string
  title: string
  description: string
  category: string
  location: string | null
  photos: string[]
  status: string
  expiresAt: string
  createdAt: string
  poster: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export interface SocialLinks {
  twitterUrl?: string
  fetlifeUrl?: string
  onlyfansUrl?: string
  pornhubUrl?: string
  tumblrUrl?: string
  instagramUrl?: string
  socialLinksVisibility: string
}

export interface MemberProfileResponse {
  user: {
    id: string
    username: string
    displayName: string
    accountName: string
    personalCode: string
    role: 'SUPREME_ADMIN' | 'ADMIN' | 'MODEL_VERIFIED' | 'MEMBER' | 'BURNER'
    isPremium: boolean
  }
  profile: {
    city: string
    state: string
    country: string
    gender: string
    genderOther: string
    pronouns: string
    sexualOrientation: string
    orientationOther: string
    intentions: string
    lookingFor: string[]
    bio: string
    interests: string[]
    avatarUrl: string
    photoUrls: string[]
    videoUrls: string[]
    twitterUrl: string
    fetlifeUrl: string
    onlyfansUrl: string
    pornhubUrl: string
    tumblrUrl: string
    instagramUrl: string
    socialLinksVisibility: string
  }
  media: {
    policy: {
      tier: 'premium' | 'free' | 'burner'
      maxPhotos: number | null
      maxVideos: number | null
      allowVideos: boolean
      requireWatermark: boolean
    }
    counts: {
      photos: number
      videos: number
    }
  }
}

export interface ProfileOptionsResponse {
  options: {
    lookingFor: string[]
    intentions: string[]
    gender: string[]
    pronouns: string[]
    orientation: string[]
    interests: string[]
    kinks: string[]
    roles: string[]
  }
}

export interface UpdateMemberProfileInput {
  displayName: string
  city: string
  state?: string
  country?: string
  gender: string
  genderOther?: string
  pronouns?: string
  sexualOrientation: string
  orientationOther?: string
  intentions?: string
  lookingFor: string[]
  bio?: string
  interests?: string[]
  avatarUrl?: string
  photoUrls?: string[]
  videoUrls?: string[]
  twitterUrl?: string
  fetlifeUrl?: string
  onlyfansUrl?: string
  pornhubUrl?: string
  tumblrUrl?: string
  instagramUrl?: string
  socialLinksVisibility?: string
}

export interface MemberSettings {
  profileVisibility: 'public' | 'members' | 'private'
  isPublic: boolean
  allowDirectMessages: boolean
  allowFriendRequests: boolean
  showOnlineStatus: boolean
  emailLoginAlerts: boolean
}

export interface MemberSettingsResponse {
  settings: MemberSettings
}

export interface MembershipStatusResponse {
  isPremium: boolean
  isVerified: boolean
  verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected'
  memberSince: string
  totalVideos: number
  publicVideos: number
  totalViews: number
}

export interface UpgradeCheckoutResponse {
  url?: string
  message?: string
}

export interface UpgradeCompleteResponse {
  message: string
  isPremium: boolean
}

export interface IdentityVerificationResponse {
  verification: {
    id: string
    status: 'pending' | 'approved' | 'rejected'
    imageUrl: string
    createdAt: string
    reviewedAt: string | null
    reviewNotes: string | null
  }
}

export interface UpdateMemberSettingsInput {
  profileVisibility?: 'public' | 'members' | 'private'
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
  sortBy?: 'recent' | 'location_asc' | 'location_desc' | 'nearby'
  minAge?: number
  maxAge?: number
  gender?: string
  orientation?: string
  lookingFor?: string[]
  interests?: string[]
  kinks?: string[]
  onlineOnly?: boolean
  verificationStatus?: 'any' | 'verified' | 'pending' | 'rejected' | 'unverified'
  verifiedOnly?: boolean
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
  kinks: string[]
  lookingFor: string[]
  isOnline: boolean
  isVerified: boolean
  verificationStatus: 'verified' | 'pending' | 'rejected' | 'unverified'
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
  partnerLastActiveAt: string | null
  lastMessage: DirectMessage
  unreadCount: number
}

export interface SendMessageResponse {
  message: DirectMessage
}

export interface ConversationMessagesResponse {
  canMessage: boolean
  pendingRequest: {
    id: string
    direction: 'sent' | 'received'
    intro: string | null
  } | null
  messages: DirectMessage[]
  partner: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    lastActiveAt: string | null
  }
}

export interface ConversationsResponse {
  conversations: Conversation[]
}

export interface GrokReplyResponse {
  reply: string
  model: string
}

export interface DiscoverMember {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  city: string | null
  country: string | null
  lastActiveAt: string | null
  createdAt: string | null
}

export interface DiscoverResponse {
  onlineMembers: DiscoverMember[]
  newMembers: DiscoverMember[]
  trendingInterests: Array<{
    label: string
    count: number
  }>
}

export interface MembershipStatusResponse {
  isPremium: boolean
  isVerified: boolean
  memberSince: string
  totalVideos: number
  publicVideos: number
  totalViews: number
}

export interface SafetySummaryResponse {
  blocked: Array<{
    blockedId: string
    createdAt: string
    username: string
    displayName: string
    avatarUrl: string | null
  }>
  reportCounts: {
    pending: number
    reviewed: number
    dismissed: number
    actioned: number
  }
}

// Block & Report

export interface BlockActionResponse {
  message: string
}

export interface BlockedEntry {
  blockedId: string
  createdAt: string
}

export interface BlockListResponse {
  blocked: BlockedEntry[]
}

export type ReportReason =
  | 'harassment'
  | 'explicit_content'
  | 'spam'
  | 'impersonation'
  | 'underage'
  | 'other'

export interface SubmitReportInput {
  targetId: string
  reason: ReportReason
  details?: string
}

export interface SubmitReportResponse {
  message: string
  reportId: string
}

// Groups

export type GroupRole = 'member' | 'moderator' | 'owner'

export interface GroupSummary {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  coverUrl: string | null
  isPublic: boolean
  memberCount: number
  createdAt: string
  memberRole: GroupRole | null // null = not a member
}

export interface GroupDetail extends GroupSummary {
  creatorId: string
  recentPosts: GroupPostItem[]
}

export interface GroupPostItem {
  id: string
  groupId: string
  body: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export interface GroupListResponse {
  groups: GroupSummary[]
}

export interface GroupDetailResponse {
  group: GroupDetail
}

export interface GroupPostsResponse {
  posts: GroupPostItem[]
  hasMore: boolean
}

export interface CreateGroupInput {
  name: string
  description?: string
  category?: string
  isPublic?: boolean
}

export interface CreateGroupPostInput {
  body: string
}

export interface GroupActionResponse {
  message: string
}

