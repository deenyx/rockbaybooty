// Application constants and configuration

export const LOOKING_FOR_MAX_SELECTIONS = 3
export const ROLE_MAX_SELECTIONS = 3

export const LOOKING_FOR_OPTIONS = [
  'Dating',
  'Hookups',
  'Friends',
  'Kink exploration',
  'Chat only',
  'Long-term connection',
  'Open to anything',
  'A Slut',
  'A Slut Trainer',
  'FWBs',
  'Content Creators',
  'A FuckHole',
  'Discreet Play',
  'Kinky Bitch(s)',
  'A CumSock',
]

export const ROLE_OPTIONS = [
  'Dominant',
  'Submissive',
  'Switch',
  'Top',
  'Bottom',
  'Sadist',
  'Masochist',
  'Rigger',
  'Rope Bunny',
  'Daddy',
  'Mommy',
  'Little',
  'Brat',
  'Brat Tamer',
  'Owner',
  'Pet',
  'Voyeur',
  'Exhibitionist',
  'Primal',
  'Vanilla',
  'Curious',
]

export const GENDER_OPTIONS = [
  'Crossdresser',
  'Male',
  'Female',
  'Trans woman',
  'Trans man',
  'Non-binary',
  'Genderfluid',
  'Genderqueer',
  'Femboy',
  'Agender',
  'Other',
  'Prefer not to say',
]

export const PRONOUN_OPTIONS = [
  'she/her',
  'he/him',
  'they/them',
  'she/they',
  'he/they',
  'it/its',
  'any pronouns',
  'ask me',
]

export const INTENTION_OPTIONS = [
  'Exploring crossdressing in a safe space',
  'Meeting other crossdressers',
  'Finding an admirer',
  'Connecting with trans / non-binary community',
  'Kink and fetish exploration',
  'Casual hookups',
  'Dating and romance',
  'Friendship and community',
  'Just browsing',
  "I'm a way-ward wondering fuckhole",
  'I am horny AF',
]

export const ORIENTATION_OPTIONS = [
  'Straight',
  'Gay',
  'Lesbian',
  'Bisexual',
  'Pansexual',
  'Queer',
  'Homoflexible',
  'Heteroflexible',
  'Asexual',
  'Demisexual',
  'Other',
  'Prefer not to say',
]

export const INTEREST_TAG_OPTIONS = [
  'Open-minded',
  'Adventurous',
  'Dominant',
  'Submissive',
  'Switch',
  'Voyeur',
  'Exhibitionist',
  'Roleplay',
  'Sensual',
  'Aftercare-focused',
]

export const KINK_OPTIONS = [
  'BDSM',
  'Bondage',
  'Dominance & Submission',
  'Fetish',
  'Roleplay',
  'Voyeurism',
  'Exhibitionism',
  'Sensory Play',
  'Impact Play',
  'Rope Play',
  'Power Exchange',
  'Aftercare',
  'Leather',
  'Latex',
  'Cuckold',
  'Feet',
  'Public Play',
  'Switch Dynamics',
  'Edging',
  'Praise/Degradation',
]

export const SEARCH_LOCATION_OPTIONS = [
  'Harbor District',
  'Old Town',
  'Riverfront',
  'Midtown',
  'North End',
  'South Docks',
  'West Quarter',
  'East Heights',
]

export const MESSAGES = {
  PASSCODE_REQUIRED: 'Passcode is required',
  ENTRY_PIN_REQUIRED: 'Entry PIN is required',
  PASSCODE_INVALID: 'Invalid or expired passcode',
  PASSCODE_GATE_INVALID: 'Invalid or used passcode',
  PASSCODE_VALID: 'Passcode verified successfully',
  INVITE_CODE_REQUIRED: 'Access code is required',
  INVITE_CODE_INVALID: 'Invalid or used access code',
  GROUP_CLOSED: 'Registrations are currently closed',
  GROUP_FULL: 'Member limit reached. Registrations are temporarily paused.',
  LOGIN_INVALID: 'Invalid login credentials',
  LOGIN_CREDENTIALS_REQUIRED: 'Enter your user ID/email and password',
  LOGIN_PASSWORD_REQUIRED: 'Enter your password',
  LOGIN_PASSCODE_REQUIRED: 'Enter your password',
  LOGIN_PASSWORD_NOT_SET: 'This account does not have a password yet.',
  EMAIL_VERIFICATION_REQUIRED: 'Verify your email before logging in.',
  AUTH_REQUIRED: 'Authentication required',
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  ACCOUNT_DISABLED: 'Account disabled successfully',
  ACCOUNT_DELETED: 'Account deleted successfully',
  EMAIL_EXISTS: 'An account with this email already exists',
  NAME_EXISTS: 'That name is already in use',
  EMAIL_SENT: 'Check your email to continue',
  EMAIL_SERVICE_UNAVAILABLE: 'Signup is temporarily unavailable because email delivery is not configured.',
  INVALID_TOKEN: 'This link is invalid or has already been used',
  TOKEN_EXPIRED: 'This link has expired. Please sign up again.',
  PIN_MISMATCH: 'PIN does not match. Please try again.',
  NAME_MISMATCH: 'Name does not match. Please try again.',
  USERNAME_EXISTS: 'This User ID is already taken',
  ACCOUNT_CREATED: 'Account created successfully',
  FIELD_REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email',
  INVALID_AGE: 'You must be over 18 years old',
  INVALID_DATE_OF_BIRTH: 'You must be over 18 years old',
  INVALID_USER_ID: 'User ID must be 3-20 characters and use only letters, numbers, or underscores',
  ERROR_CREATING_ACCOUNT: 'Failed to create account. Please try again.',
  ERROR_GENERAL: 'An error occurred. Please try again.',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  ROOM_UNAVAILABLE: 'The live room is not available right now. Please try again later.',
  FRIEND_REQUEST_SENT: 'Friend request sent',
  FRIEND_REQUEST_ALREADY_SENT: 'Friend request already sent',
  FRIEND_REQUEST_ALREADY_FRIENDS: 'You are already friends',
  FRIEND_REQUEST_RECEIVED_PENDING: 'This member already sent you a request',
  FRIEND_REQUEST_INVALID_TARGET: 'Member not found',
  FRIEND_REQUEST_SELF: 'You cannot add yourself',
  FRIEND_REQUEST_NOT_FOUND: 'Friend request not found',
  FRIEND_REQUEST_NO_PERMISSION: 'You cannot update this friend request',
  FRIEND_REQUEST_NOT_PENDING: 'This friend request is no longer pending',
  FRIEND_REQUEST_ACCEPTED: 'Friend request accepted',
  FRIEND_REQUEST_DECLINED: 'Friend request declined',
  FRIEND_REQUEST_CANCELLED: 'Friend request cancelled',
  DIRECT_MESSAGES_DISABLED: 'This member is not accepting direct messages',
  FRIEND_REQUESTS_DISABLED: 'This member is not accepting friend requests',
  VIDEO_NOT_FOUND: 'Video not found',
  VIDEO_FORBIDDEN: 'You cannot modify this video',
  VIDEO_PREMIUM_REQUIRED: 'Only Premium members can make videos public',
  BLOCK_SUCCESS: 'User blocked',
  UNBLOCK_SUCCESS: 'User unblocked',
  REPORT_SUCCESS: 'Report submitted. Thank you for helping keep the community safe.',
  GROUP_NOT_FOUND: 'Group not found',
  GROUP_FORBIDDEN: 'You do not have permission to do that',
  GROUP_NAME_REQUIRED: 'Group name is required',
  GROUP_ALREADY_MEMBER: 'You are already a member of this group',
  GROUP_NOT_MEMBER: 'You are not a member of this group',
  GROUP_JOINED: 'Joined group',
  GROUP_LEFT: 'Left group',
  GROUP_CREATED: 'Group created',
  GROUP_POST_BODY_REQUIRED: 'Post body is required',
  GROUP_POST_CREATED: 'Post created',
  GROUP_POST_DELETED: 'Post deleted',
  GROUP_POST_NOT_FOUND: 'Post not found',
}

export const MIN_AGE = 19
export const MAX_AGE = 120

export const SOCIAL_PLATFORMS = [
  { key: 'twitterUrl' as const, label: 'Twitter / X', placeholder: 'https://x.com/yourhandle', domain: 'x.com' },
  { key: 'fetlifeUrl' as const, label: 'FetLife', placeholder: 'https://fetlife.com/users/yourhandle', domain: 'fetlife.com' },
  { key: 'onlyfansUrl' as const, label: 'OnlyFans', placeholder: 'https://onlyfans.com/yourhandle', domain: 'onlyfans.com' },
  { key: 'pornhubUrl' as const, label: 'PornHub', placeholder: 'https://www.pornhub.com/model/yourhandle', domain: 'pornhub.com' },
  { key: 'tumblrUrl' as const, label: 'Tumblr', placeholder: 'https://yourhandle.tumblr.com', domain: 'tumblr.com' },
  { key: 'instagramUrl' as const, label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', domain: 'instagram.com' },
]

export type SocialPlatformKey = typeof SOCIAL_PLATFORMS[number]['key']

export const SOCIAL_LINK_VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Everyone — including visitors' },
  { value: 'members', label: 'Members only' },
  { value: 'friends', label: 'Friends only' },
  { value: 'private', label: 'Hidden from everyone' },
] as const

export type SocialLinksVisibility = 'public' | 'members' | 'friends' | 'private'
export const NEW_MEMBER_PIN = '5555'
export const QUICK_JOIN_PIN = '0000'
export const QUICK_JOIN_QUERY_PARAM = 'quickJoin'

export const PASSCODE_LENGTH = 6
export const PERSONAL_CODE_LENGTH = 8
export const AUTH_COOKIE_NAME = 'auth-token'
export const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
export const VIDEO_PLAYBACK_TOKEN_MAX_AGE_SECONDS = 60 * 10
export const MIN_PASSWORD_LENGTH = 8
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024

const parsedMaxMembers = Number.parseInt(process.env.MAX_MEMBER_COUNT || '20', 10)
export const MAX_MEMBER_COUNT = Number.isFinite(parsedMaxMembers) && parsedMaxMembers > 0
  ? parsedMaxMembers
  : 20
export const CLOSED_GROUP_ENABLED = process.env.CLOSED_GROUP_ENABLED !== 'false'
export const REQUIRE_SIGNUP_INVITE = process.env.REQUIRE_SIGNUP_INVITE !== 'false'

export const CHAT_ROOM_NAME = 'members-lounge'
export const MESSAGING_POLL_INTERVAL_MS = 2500

export const CLASSIFIED_CATEGORIES = [
  { value: 'for-sale', label: 'For Sale' },
  { value: 'wanted', label: 'Wanted' },
  { value: 'free', label: 'Free' },
  { value: 'housing-rentals', label: 'Housing - Rentals' },
  { value: 'housing-roommates', label: 'Housing - Roommates' },
  { value: 'housing-sublets', label: 'Housing - Sublets' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'gigs', label: 'Gigs' },
  { value: 'services', label: 'Services' },
  { value: 'community-events', label: 'Community Events' },
  { value: 'classes', label: 'Classes' },
  { value: 'buying', label: 'Buying' },
  { value: 'selling', label: 'Selling' },
  { value: 'rentals', label: 'Rentals' },
  { value: 'personals', label: 'Personals' },
  { value: 'adult-escorts', label: 'Adult - Escorts' },
  { value: 'adult-massage', label: 'Adult - Massage' },
  { value: 'adult-entertainment', label: 'Adult - Entertainment' },
  { value: 'encounters', label: 'Encounters' },
  { value: 'casual', label: 'Casual' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'seeking', label: 'Seeking' },
] as const

export const GROUP_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'crossdressing', label: 'Crossdressing' },
  { value: 'kink', label: 'Kink & Fetish' },
  { value: 'bdsm', label: 'BDSM' },
  { value: 'social', label: 'Social' },
  { value: 'other', label: 'Other' },
] as const

export type GroupCategory = typeof GROUP_CATEGORIES[number]['value']

export const GROUP_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MAX_GROUP_POST_LENGTH = 2000
export const GROUPS_PAGE_SIZE = 20
export const GROUP_POSTS_PAGE_SIZE = 20

export type ClassifiedCategory = typeof CLASSIFIED_CATEGORIES[number]['value']
export const CLASSIFIED_CATEGORY_VALUES = CLASSIFIED_CATEGORIES.map((c) => c.value) as [string, ...string[]]
export const CLASSIFIED_CATEGORY_LABELS = Object.fromEntries(
  CLASSIFIED_CATEGORIES.map((category) => [category.value, category.label])
) as Record<ClassifiedCategory, string>
export const CLASSIFIED_CATEGORY_SECTIONS = [
  {
    value: 'marketplace',
    label: 'Marketplace',
    categories: ['for-sale', 'wanted', 'free', 'buying', 'selling'],
  },
  {
    value: 'housing',
    label: 'Housing',
    categories: ['housing-rentals', 'housing-roommates', 'housing-sublets', 'rentals'],
  },
  {
    value: 'work-services',
    label: 'Work & Services',
    categories: ['jobs', 'gigs', 'services', 'classes'],
  },
  {
    value: 'community',
    label: 'Community',
    categories: ['community-events', 'personals'],
  },
  {
    value: 'adult',
    label: 'Adult',
    categories: ['adult-escorts', 'adult-massage', 'adult-entertainment', 'encounters', 'casual', 'relationships', 'seeking'],
  },
] as const
export type ClassifiedCategorySection = typeof CLASSIFIED_CATEGORY_SECTIONS[number]['value']
export const CLASSIFIED_CATEGORY_SECTION_BY_VALUE = Object.fromEntries(
  CLASSIFIED_CATEGORY_SECTIONS.flatMap((section) =>
    section.categories.map((category) => [category, section.value])
  )
) as Record<ClassifiedCategory, ClassifiedCategorySection>
export const CLASSIFIEDS_EXPIRY_DAYS = 30
export const CLASSIFIEDS_MAX_PHOTOS = 4

export const ROUTES = {
  HOME: '/',
  WELCOME: '/welcome',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  LOG_IN: '/log-in',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PIN_REVEAL: '/pin-reveal',
  PROFILE: '/profile',
  PROFILE_PREVIEW: '/profile/preview',
  SETTINGS: '/settings',
  SEARCH: '/search',
  DISCOVER: '/discover',
  CHAT: '/chat',
  GROUPS: '/groups',
  GROUPS_NEW: '/groups/new',
  CLASSIFIEDS: '/classifieds',
  CLASSIFIEDS_NEW: '/classifieds/new',
  CLASSIFIEDS_SECTION: '/classifieds/section',
  MESSAGESS: '/messagess',
  FRIENDS: '/friends',
  NOTIFICATIONS: '/notifications',
  MEMBERSHIP: '/membership',
  UPGRADE: '/upgrade',
  UPGRADE_SUCCESS: '/upgrade/success',
  SAFETY: '/safety',
  SUPPORT: '/support',
  VIDEOS: '/videos',
  MY_VIDEOS: '/videos/my',
  // Community hub routes
  COMMUNITY: '/community',
  COMMUNITY_MEMBERS: '/community/members',
  COMMUNITY_EVENTS: '/community/events',
  COMMUNITY_CLASSIFIEDS: '/community/classifieds',
}

export const REPORT_REASONS = [
  'harassment',
  'explicit_content',
  'spam',
  'impersonation',
  'underage',
  'other',
] as const

export type ReportReason = typeof REPORT_REASONS[number]

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  harassment: 'Harassment or abuse',
  explicit_content: 'Unwanted explicit content',
  spam: 'Spam or fake account',
  impersonation: 'Impersonation',
  underage: 'Suspected underage user',
  other: 'Other',
}

export const MEMBER_MENU_ITEMS = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD },
  { label: 'Community', href: ROUTES.COMMUNITY },
  { label: 'Settings', href: ROUTES.SETTINGS },
  { label: 'Search', href: ROUTES.SEARCH },
  { label: 'Discover', href: ROUTES.DISCOVER },
  { label: 'Videos', href: ROUTES.VIDEOS },
  { label: 'Messages', href: ROUTES.MESSAGESS },
  { label: 'Notifications', href: ROUTES.NOTIFICATIONS },
  { label: 'Friends', href: ROUTES.FRIENDS },
  { label: 'Live Chat', href: ROUTES.CHAT },
  { label: 'Classifieds', href: ROUTES.CLASSIFIEDS },
  { label: 'Groups', href: ROUTES.GROUPS },
  { label: 'Membership', href: ROUTES.MEMBERSHIP },
  { label: 'Safety', href: ROUTES.SAFETY },
  { label: 'Support', href: ROUTES.SUPPORT },
  { label: 'Profile', href: ROUTES.PROFILE },
] as const
