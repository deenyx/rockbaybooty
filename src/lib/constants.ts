// Application constants and configuration

export const LOOKING_FOR_OPTIONS = [
  'Dating',
  'Hookups',
  'Friends',
  'Kink exploration',
  'Chat only',
  'Long-term connection',
  'Open to anything',
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
  'Male',
  'Female',
  'Non-binary',
  'Trans man',
  'Trans woman',
  'Genderfluid',
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
  'Asexual',
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

export const MESSAGES = {
  PASSCODE_REQUIRED: 'Passcode is required',
  PASSCODE_INVALID: 'Invalid or expired passcode',
  PASSCODE_GATE_INVALID: 'Invalid or used passcode',
  PASSCODE_VALID: 'Passcode verified successfully',
  INVITE_CODE_REQUIRED: 'Access code is required',
  INVITE_CODE_INVALID: 'Invalid or used access code',
  GROUP_CLOSED: 'Registrations are currently closed',
  GROUP_FULL: 'Member limit reached. Registrations are temporarily paused.',
  LOGIN_INVALID: 'Invalid passcode',
  AUTH_REQUIRED: 'Authentication required',
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  EMAIL_EXISTS: 'An account with this email already exists',
  EMAIL_SENT: 'Check your email to continue',
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
}

export const MIN_AGE = 19
export const MAX_AGE = 120

export const PASSCODE_LENGTH = 6
export const PERSONAL_CODE_LENGTH = 8
export const AUTH_COOKIE_NAME = 'auth-token'
export const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

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
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PIN_REVEAL: '/pin-reveal',
  PROFILE: '/profile',
  SEARCH: '/search',
  CHAT: '/chat',
  GROUPS: '/groups',
  CLASSIFIEDS: '/classifieds',
  MESSAGESS: '/messagess',
}
