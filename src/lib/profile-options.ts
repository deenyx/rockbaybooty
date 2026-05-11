import {
  GENDER_OPTIONS,
  INTENTION_OPTIONS,
  INTEREST_TAG_OPTIONS,
  KINK_OPTIONS,
  LOOKING_FOR_OPTIONS,
  ORIENTATION_OPTIONS,
  PRONOUN_OPTIONS,
  ROLE_OPTIONS,
} from '@/lib/constants'

export const PROFILE_OPTION_CATEGORIES = [
  'lookingFor',
  'intentions',
  'gender',
  'pronouns',
  'orientation',
  'interests',
  'kinks',
  'roles',
] as const

export type ProfileOptionCategory = (typeof PROFILE_OPTION_CATEGORIES)[number]

export type ProfileOptionsMap = Record<ProfileOptionCategory, string[]>

export const PROFILE_OPTION_DEFAULTS: ProfileOptionsMap = {
  lookingFor: LOOKING_FOR_OPTIONS,
  intentions: INTENTION_OPTIONS,
  gender: GENDER_OPTIONS,
  pronouns: PRONOUN_OPTIONS,
  orientation: ORIENTATION_OPTIONS,
  interests: INTEREST_TAG_OPTIONS,
  kinks: KINK_OPTIONS,
  roles: ROLE_OPTIONS,
}
