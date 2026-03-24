// Application constants and configuration

export const LOOKING_FOR_OPTIONS = [
  'Dating',
  'Hookups',
  'Friends',
  'Networking',
  'Not Sure',
]

export const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say',
]

export const MESSAGES = {
  PASSCODE_INVALID: 'Invalid or expired passcode',
  EMAIL_EXISTS: 'Email already registered',
  ACCOUNT_CREATED: 'Account created successfully',
  FIELD_REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email',
  ERROR_CREATING_ACCOUNT: 'Failed to create account. Please try again.',
  ERROR_GENERAL: 'An error occurred. Please try again.',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
}

export const MIN_AGE = 18
export const MAX_AGE = 120

export const PASSCODE_LENGTH = 6
export const PERSONAL_CODE_LENGTH = 8

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
