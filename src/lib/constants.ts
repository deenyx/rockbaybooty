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
  'Sluts',
  'A Slut Trainer',
  'A Cock Drainer',
]

export const PRONOUNS_OPTIONS = [
  'she/her',
  'he/him',
  'they/them',
  'she/they',
  'he/they',
  'it/its',
  'any pronouns',
  'ask me',
]

export const INTENTIONS_OPTIONS = [
  'Exploring crossdressing in a safe space',
  'Meeting other crossdressers',
  'Finding an admirer',
  'Connecting with trans / non-binary community',
  'Kink and fetish exploration',
  'Casual hookups',
  'Dating and romance',
  'Friendship and community',
  'Just browsing',
  'I WANT TO FUCK!',
  "I love my girlfriend but she doesn't suck cock",
]

export const ROLE_OPTIONS = [
  // Dynamics
  'Dominant',
  'Submissive',
  'Switch',
  'Master / Mistress',
  'slave',
  'Top',
  'Bottom',
  // Caregiver / Age Play
  'Daddy Dom',
  'Mommy Domme',


  'Caregiver',
  'Age Player',
  // Pet Play
  'Owner',
  'Pet',
  'Handler',
  'Puppy',
  'Kitten',
  // Sensation & Impact
  'Sadist',
  'Masochist',
  'Rigger',
  'Rope Bunny',
  'Impact Player',
  'Sensation Player',
  // Primal
  'Primal',
  'Primal Hunter',
  'Primal Prey',
  // Persona
  'Brat',
  'Brat Tamer',
  'Degrader',
  'Degradee',
  'Exhibitionist',
  'Slut',
  'Voyeur',
  // Other
  'Service-Oriented',
  'Protector',
  'Mentor',
  'Kinkster',
  'Hedonist',
  'Vanilla',
  'Curious',
  'Experimenter',
  'Bitch',
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
  LOGIN_INVALID: 'Invalid credentials',
  LOGIN_CREDENTIALS_REQUIRED: 'Enter your user ID or email and password',
  LOGIN_USER_ID_REQUIRED: 'Enter your user ID',
  LOGIN_PASSWORD_REQUIRED: 'Enter your password',
  LOGIN_DOB_REQUIRED: 'Select your date of birth',
  LOGIN_PASSCODE_REQUIRED: 'Enter your personal passcode',
  LOGIN_PASSWORD_NOT_SET: 'This account does not have a password set.',
  RESET_REQUEST_SENT: 'If the email exists, a reset link has been sent.',
  RESET_TOKEN_INVALID: 'Reset link is invalid or expired.',
  RESET_SUCCESS: 'Credentials updated. You can now log in.',
  EMAIL_VERIFICATION_REQUIRED: 'Verify your email before using this PIN.',
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
}

export const MIN_AGE = 19
export const MAX_AGE = 120
export const NEW_MEMBER_PIN = '5555'
export const QUICK_JOIN_PIN = '0000'
export const QUICK_JOIN_QUERY_PARAM = 'quickJoin'
export const BURNER_PIN = '9999'
export const PRESHARED_KEY_PIN = '3333'

export const PASSCODE_LENGTH = 6
export const PERSONAL_CODE_LENGTH = 8
export const AUTH_COOKIE_NAME = 'auth-token'
export const SESSION_MODE_COOKIE_NAME = 'session-mode'
export const SESSION_MODE_MEMBER = 'member'
export const SESSION_MODE_DEFAULT_MEMBER = 'default-member'
export const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
export const BURNER_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
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

export const ROUTES = {
  HOME: '/',
  WELCOME: '/welcome',
  ONBOARDING: '/onboarding',
  DEFAULT: '/default',
  DASHBOARD: '/dashboard',
  ME: '/me',
  ME_MESSAGES: '/me/messages',
  ME_PROFILE: '/me/profile',
  ME_SETTINGS: '/me/settings',
  ME_VIDEOS: '/me/videos',
  LOG_IN: '/log-in',
  LOGIN: '/login',
  FORGOT: '/forgot',
  RESET: '/reset',
  SIGNUP: '/signup',
  PIN_REVEAL: '/pin-reveal',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  SEARCH: '/search',
  CHAT: '/chat',
  GROUPS: '/groups',
  CLASSIFIEDS: '/classifieds',
  MESSAGES: '/messages',
  MESSAGESS: '/messagess',
  CAMERA: '/camera',
  VIDEOS: '/videos',
  MY_VIDEOS: '/videos/my',
  FRIENDS: '/friends',
  // Community hub routes
  COMMUNITY: '/community',
  COMMUNITY_MEMBERS: '/community/members',
  COMMUNITY_EVENTS: '/community/events',
  COMMUNITY_CLASSIFIEDS: '/community/classifieds',
}

export const MEMBER_MENU_ITEMS = [
  { label: 'Dashboard', href: ROUTES.ME },
  { label: 'Community', href: ROUTES.COMMUNITY },
  { label: 'Settings', href: ROUTES.ME_SETTINGS },
  { label: 'Search', href: ROUTES.SEARCH },
  { label: 'Friends', href: ROUTES.FRIENDS },
  { label: 'Camera', href: ROUTES.CAMERA },
  { label: 'Videos', href: ROUTES.ME_VIDEOS },
  { label: 'Messages', href: ROUTES.ME_MESSAGES },
  { label: 'Live Chat', href: ROUTES.CHAT },
  { label: 'Groups', href: ROUTES.GROUPS },
  { label: 'Profile', href: ROUTES.ME_PROFILE },
] as const
