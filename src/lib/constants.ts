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
  LOGIN_INVALID: 'Invalid passcode',
  AUTH_REQUIRED: 'Authentication required',
  LOGIN_SUCCESS: 'Logged in successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  EMAIL_EXISTS: 'Email already registered',
  USERNAME_EXISTS: 'This User ID is already taken',
  ACCOUNT_CREATED: 'Account created successfully',
  FIELD_REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email',
  INVALID_DATE_OF_BIRTH: 'You must be at least 19 years old',
  INVALID_USER_ID: 'User ID must be 3-20 characters and use only letters, numbers, or underscores',
  ERROR_CREATING_ACCOUNT: 'Failed to create account. Please try again.',
  ERROR_GENERAL: 'An error occurred. Please try again.',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
}

export const MIN_AGE = 19
export const MAX_AGE = 120

export const PASSCODE_LENGTH = 6
export const PERSONAL_CODE_LENGTH = 8
export const AUTH_COOKIE_NAME = 'auth-token'
export const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export const ROUTES = {
  HOME: '/',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  PROFILE: '/profile',
  SEARCH: '/search',
  CHAT: '/chat',
  GROUPS: '/groups',
  CLASSIFIEDS: '/classifieds',
}
